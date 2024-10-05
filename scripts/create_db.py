#!/usr/bin/env python3.12
from pathlib import Path
import sys
import fetch_search_database as fsd
# test script for generating sqlite3 database

if __name__ == "__main__":
    out_dir = Path(sys.argv[1])
    max_batches = int(sys.argv[2]) if len(sys.argv) > 2 else None
    batches = fsd.fetch_xml_batches(max_batches)
    tags = [fsd.normalize(t) for t in fsd.parse_batches_to_tags(batches)]
    fsd.generate_sql_db(tags, out_dir)
