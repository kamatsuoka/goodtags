import json
import shutil
import sqlite3
import subprocess
import time
from pathlib import Path
from typing import Any, TypeVar, Sequence, Mapping

import click
import requests
import xmltodict

API_URL = "https://www.barbershoptags.com/api.php"
OUT_DIR = Path(__file__).resolve().parent.parent / "out"
# We name this `.otf` so that GitHub Pages will transparently gzip it for us when serving it.
# Specifically GitHub has said a few times they use a CDN to serve the content, eg:
# https://github.blog/2014-01-07-faster-more-awesome-github-pages/
# and if the presence of the x-fastly-request-id response header is any guide, it's Fastly.
# In any case, when the file name is just "*.sqlite" setting `Accept-Encoding: gzip` doesn't
# result in a smaller file, whereas with the `.otf` extension it's distinctly smaller over the wire.
# I picked `.otf` from this list of extensions that would likely work with auto-compression:
# https://docs.fastly.com/en/guides/enabling-automatic-compression#setting-up-a-compression-policy
SQL_NAME_TEMPLATE = "tags_db_v{}.sqlite.otf"
MANIFEST_NAME = "manifest.json"
PAGE_SIZE = 100
# Bump this if the format changes. Should match the `VALID_SCHEMA_VERSION` in `src/constants/sql.ts`
LATEST_SCHEMA_VERSION = 1
# Use this if we need to generate more than one DB schema simultaneously
# PREVIOUS_SCHEMA_VERSION = 0


def fetch_xml_batches() -> Sequence[Mapping[str, Any]]:
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
        # Give the server some breathing room
        time.sleep(1)

    return batches


ROW_DEFAULTS = {
    key: ""
    for key in (
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
    )
}


def parse_batches_to_tags(
    batches: Sequence[Mapping[str, Any]]
) -> Sequence[Mapping[str, Any]]:
    return [ROW_DEFAULTS | t for batch in batches for t in batch["tags"]["tag"]]


def prepare_out_dir(out_dir: Path) -> None:
    # Make sure the directory is ready for our files. We assume it already exists and is a valid git repo (see the
    # docstring in `main` for more details on why), but we want to clear out all other existing files that may have
    # been in previous commits on the `gh-pages` branch so we know that we're only going to be including the files we
    # generate during this run of the script.
    out_git_dir = out_dir / ".git"
    assert out_git_dir.is_dir(), (
        f"Expected the out dir {out_dir} to already be set up as a git repo with correct authentication and an `origin`"
        " remote pointing at the correct repo."
    )
    out_dir.mkdir(exist_ok=True, parents=True)
    for path in out_dir.iterdir():
        if path != out_git_dir:
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


def generate_sql_db(tags: Sequence[Mapping[str, Any]], out_dir: Path) -> str:
    sql_name = SQL_NAME_TEMPLATE.format(LATEST_SCHEMA_VERSION)
    sql_path = out_dir / sql_name
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
        # CREATE VIRTUAL TABLE tags_fts USING fts5(title, alt_title, arranger, lyrics, content=tags, content_rowid=id);
        """
        CREATE VIRTUAL TABLE tags_fts USING fts4(title, alt_title, arranger, lyrics, content=tags);
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
        (LATEST_SCHEMA_VERSION,),
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
            title,
            alt_title,
            arranger,
            lyrics
        )
        VALUES (
            :id,
            :Title,
            :AltTitle,
            :Arranger,
            :Lyrics
        );
        """,
        tags,
    )

    T = TypeVar("T")

    def ensure_list(val: T | list[T]) -> list[T]:
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

    return sql_name


def generate_manifest(out_dir: Path, db_name_by_version: dict[int, str]) -> None:
    # This format should match the `DbManifest` interface in `src/constants/sql.ts`
    (out_dir / MANIFEST_NAME).write_text(
        json.dumps(
            {
                "generated_at_epoch_seconds": int(time.time()),
                "db_name_by_version": db_name_by_version,
            }
        )
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
    the remote. In particular this was done because the `checkout` step for the `out/` dir in the workflow sets up auth,
    so we're relying on the `.git` directory it creates to be able to push our changes.
    """
    batches = fetch_xml_batches()
    tags = parse_batches_to_tags(batches)

    prepare_out_dir(OUT_DIR)
    current_sql_name = generate_sql_db(tags, OUT_DIR)
    generate_manifest(OUT_DIR, {LATEST_SCHEMA_VERSION: current_sql_name})
    deploy_to_gh_pages(OUT_DIR)


if __name__ == "__main__":
    main()
