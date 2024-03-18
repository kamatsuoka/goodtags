import json
import shutil
import sqlite3
import subprocess
import time
from pathlib import Path

import click
import requests
import xmltodict

API_URL = "https://www.barbershoptags.com/api.php"
OUT_DIR = Path(__file__).resolve().parent.parent / "out"
# We name this `.otf` so that GitHub Pages will transparently gzip it for us when serving it.
# Specifically GitHub has said a few times they use a CDN to serve the content, eg:
# https://github.blog/2014-01-07-faster-more-awesome-github-pages/
# And some sources claim it's Fastly, though that's hard to verify. In any case, when the file
# name is just "*.sqlite" setting `Accept-Encoding: gzip` doesn't result in a smaller file, whereas
# with the `.otf` extension it's distinctly smaller over the wire. I picked `.otf` from this list of
# extensions that would likely work with auto-compression (though again, it's unclear if it's actually
# Fastly under the hood):
# https://docs.fastly.com/en/guides/enabling-automatic-compression#setting-up-a-compression-policy
SQL_NAME = "tags_db.sqlite.otf"
MANIFEST_NAME = "manifest.json"
PAGE_SIZE = 100
# Bump this if the format changes
SCHEMA_VERSION = 0


def fetch_xml_batches() -> list[dict]:
    print("About to start fetching batches")
    batches = []
    i = 0
    while True:
        response = requests.get(
            API_URL,
            params={
                "Sortby": "posted",
                "n": str(PAGE_SIZE),
                "start": str(i * PAGE_SIZE + 1),
            },
        )

        response.raise_for_status()
        data = xmltodict.parse(
            response.content.decode(encoding="utf-8", errors="backslashreplace")
        )
        batches.append(data)
        print(
            f"Fetched page {i} ({data['tags']['tag'][0]['id']} - {data['tags']['tag'][-1]['id']})"
        )
        if int(data["tags"]["@count"]) < PAGE_SIZE:
            break

        i += 1

    return batches


def massage_tag_row(tag: dict) -> dict:
    keys = [
        "id",
        "Title",
        "AltTitle",
        "Arranger",
        "WritKey",
        "Lyrics",
        "Collection",
        "Parts",
        "Posted",
        "SheetMusicAlt",
        "Quartet",
        "QWebsite",
    ]
    for key in keys:
        tag.setdefault(key, "")
    return tag


def parse_batches_to_tags(batches: list[dict]) -> list[dict]:
    return [massage_tag_row(t) for batch in batches for t in batch["tags"]["tag"]]


def prepare_out_dir(out_dir: Path) -> None:
    # Make sure it exists and clear out everything in here (aside from, say, the .git dir)
    out_dir.mkdir(exist_ok=True, parents=True)
    for path in out_dir.iterdir():
        if not path.name.startswith("."):
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()


PART_NAMES = [
    "AllParts",
    "Tenor",
    "Lead",
    "Bari",
    "Bass",
]


def generate_sql_db(tags: list[dict], out_dir: Path) -> None:
    sql_path = out_dir / SQL_NAME
    sql_path.unlink(missing_ok=True)
    db = sqlite3.connect(sql_path)

    db.execute(
        """
        CREATE TABLE schema (version int NOT NULL);
        """
    )
    db.execute(
        """
        CREATE TABLE tags (
            id int NOT NULL,
            title text,
            alt_title text,
            arranger text,
            key text,
            lyrics text,
            collection text,
            downloaded int,
            parts int,
            posted text,
            sheet_music_alt text,
            quartet text,
            quartet_url text,
            PRIMARY KEY (id)
        );
        """
    )
    db.execute(
        # The versions we use don't support fts5 yet
        # CREATE VIRTUAL TABLE tags_fts USING fts5(id, title, alt_title, arranger, lyrics, content=tags, content_rowid=id);
        """
        CREATE VIRTUAL TABLE tags_fts USING fts4(id, title, alt_title, arranger, lyrics, content=tags);
        """
    )
    db.execute(
        """
        CREATE TABLE videos (
            tag_id int NOT NULL,
            code text NOT NULL,
            sung_by text,
            FOREIGN KEY (tag_id) REFERENCES tags(id)
        );
        """
    )
    db.execute(
        """
        CREATE TABLE tracks (
            tag_id int NOT NULL,
            part text NOT NULL,
            file_type text NOT NULL,
            url text NOT NULL,
            FOREIGN KEY (tag_id) REFERENCES tags(id)
        );
        """
    )
    db.commit()

    db.execute(
        """
        INSERT INTO schema (version) VALUES (?)
        """,
        (SCHEMA_VERSION,),
    )
    db.executemany(
        """
        INSERT INTO tags (
            id,
            title,
            alt_title,
            arranger,
            key,
            lyrics,
            collection,
            downloaded,
            parts,
            posted,
            sheet_music_alt,
            quartet,
            quartet_url
        )
        VALUES (
            :id,
            :Title,
            :AltTitle,
            :Arranger,
            :WritKey,
            :Lyrics,
            :Collection,
            :Downloaded,
            :Parts,
            :Posted,
            :SheetMusicAlt,
            :Quartet,
            :QWebsite
        );
        """,
        tags,
    )
    db.executemany(
        """
        INSERT INTO tags_fts (
            rowid,
            id,
            title,
            alt_title,
            arranger,
            lyrics
        )
        VALUES (
            :id,
            :id,
            :Title,
            :AltTitle,
            :Arranger,
            :Lyrics
        );
        """,
        tags,
    )

    def ensure_list(val):
        if isinstance(val, list):
            return val
        else:
            return [val]

    db.executemany(
        """
        INSERT INTO videos (
            tag_id,
            code,
            sung_by
        ) VALUES (
            :tag_id,
            :Code,
            :SungBy
        )
        """,
        [
            {"tag_id": tag["id"], **video}
            for tag in tags
            for video in ensure_list(tag["videos"].get("video", []))
            if video.get("Code") is not None
        ],
    )
    db.executemany(
        """
        INSERT INTO tracks (
            tag_id,
            part,
            file_type,
            url
        ) VALUES (
            :tag_id,
            :part,
            :file_type,
            :url
        )
        """,
        [
            {
                "tag_id": tag["id"],
                "part": part,
                "file_type": part_data["@type"],
                "url": part_data["#text"],
            }
            for tag in tags
            for part in PART_NAMES
            if (part_data := tag.get(part)) is not None
        ],
    )
    db.commit()

    print("Done creating DB")
    db.close()


def generate_manifest(out_dir: Path) -> None:
    (out_dir / MANIFEST_NAME).write_text(
        json.dumps({"generated_at_epoch_seconds": int(time.time())})
    )


def deploy_to_gh_pages(out_dir: Path) -> None:
    # Not initializing a new repo, relying on repo created by the checkout action (and its credentials)
    subprocess.run(["git", "add", "-A"], cwd=out_dir, check=True)
    subprocess.run(
        [
            "git",
            *("-c", "user.name=Automated fetcher"),
            *("-c", "user.email=<>"),
            "commit",
            *("-m", "Automatically update database"),
        ],
        cwd=out_dir,
        check=True,
    )
    subprocess.run(["git", "remote", "-v"], cwd=out_dir, check=True)
    subprocess.run(
        # Relying on existing `origin` set by the checkout action
        ["git", "push", "origin", "HEAD:gh-pages"],
        cwd=out_dir,
        check=True,
    )


# Note - If we need them, we can add options for whether to deploy, where to store output
@click.command()
def main() -> None:
    """
    Job to fetch an up-to-date copy of the tags database, in batches of 100 rows, and write the result to a SQL
    database that goodtags can use to perform search offline. When deploying, that database will then be pushed
    to a special branch so that it can be deployed to GitHub pages where the app can pull it down.

    We use GitHub Pages both to take advantage of their auto-compression (see the comment on `SQL_NAME`) and
    because it puts the content behind a CDN, which should increase robustness and decrease latency.

    This script makes a few assumptions that it's being run by the `generate_offline_search_database.yml` workflow,
    such as assuming that the `out/` directory is already setup correctly as a git repo with an `origin` pointing at
    the remote.
    """
    batches = fetch_xml_batches()
    tags = parse_batches_to_tags(batches)

    prepare_out_dir(OUT_DIR)
    generate_sql_db(tags, OUT_DIR)
    generate_manifest(OUT_DIR)
    deploy_to_gh_pages(OUT_DIR)


if __name__ == "__main__":
    main()
