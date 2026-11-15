"""Zeitgebundene Tagebucheinträge – unabhängig von der Kalenderdarstellung.

Eine Stunde ist kein eigener Datensatz: Jeder Eintrag bekommt einen Zeitpunkt.
Die Oberfläche darf jede Stunde so hoch darstellen, wie ihr Inhalt erfordert.
"""

import sqlite3
from datetime import datetime
from uuid import uuid4

from configuration import DATABASE_FILE

ALLOWED_KINDS = {"text", "image", "audio", "video", "file", "link", "message"}


def connect():
    connection = sqlite3.connect(DATABASE_FILE, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    return connection


def create_timeline_table():
    with connect() as database:
        database.execute("""
            CREATE TABLE IF NOT EXISTS timeline_entries (
                id TEXT PRIMARY KEY,
                local_time TEXT NOT NULL,
                kind TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                media_id TEXT NOT NULL DEFAULT '',
                preview INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        database.execute("""
            CREATE INDEX IF NOT EXISTS timeline_by_time
            ON timeline_entries (local_time)
        """)


def get_entries(first_day, last_day):
    with connect() as database:
        rows = database.execute("""
            SELECT id, local_time, kind, content, media_id, preview
            FROM timeline_entries
            WHERE substr(local_time, 1, 10) BETWEEN ? AND ?
            ORDER BY local_time, rowid
        """, (first_day, last_day)).fetchall()
        return [dict(row) for row in rows]


def get_day_counts(first_day, last_day):
    with connect() as database:
        rows = database.execute("""
            SELECT substr(local_time, 1, 10) AS day, COUNT(*) AS amount
            FROM timeline_entries
            WHERE substr(local_time, 1, 10) BETWEEN ? AND ?
            GROUP BY substr(local_time, 1, 10)
        """, (first_day, last_day)).fetchall()
        return {row["day"]: row["amount"] for row in rows}


def save_entry(entry):
    kind = str(entry.get("kind", "text"))
    if kind not in ALLOWED_KINDS:
        raise ValueError("Unbekannter Eintragstyp")

    local_time = str(entry.get("local_time", ""))
    parsed_time = datetime.fromisoformat(local_time)
    if parsed_time.tzinfo is not None or len(local_time) != 16:
        raise ValueError("Zeit muss YYYY-MM-DDTHH:MM entsprechen")

    entry_id = str(entry.get("id") or uuid4().hex)
    if len(entry_id) > 64 or not entry_id:
        raise ValueError("Ungültige Kennung")

    content = str(entry.get("content", ""))
    if len(content) > 100_000:
        raise ValueError("Text ist zu lang")

    media_id = str(entry.get("media_id", ""))
    if len(media_id) > 80:
        raise ValueError("Medienkennung ist zu lang")

    preview = int(bool(entry.get("preview", False)))

    with connect() as database:
        database.execute("""
            INSERT INTO timeline_entries
                (id, local_time, kind, content, media_id, preview)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                local_time = excluded.local_time,
                kind = excluded.kind,
                content = excluded.content,
                media_id = excluded.media_id,
                preview = excluded.preview,
                updated_at = CURRENT_TIMESTAMP
        """, (entry_id, local_time, kind, content, media_id, preview))

    return entry_id


def delete_entry(entry_id):
    with connect() as database:
        database.execute("DELETE FROM timeline_entries WHERE id = ?", (entry_id,))
