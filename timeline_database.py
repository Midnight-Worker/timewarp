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
                paper_x REAL,
                paper_y REAL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Bestehende V16-Datenbanken behalten ihre bisherigen Einträge.
        existing_columns = {
            row["name"] for row in database.execute("PRAGMA table_info(timeline_entries)")
        }
        for column_name in ("paper_x", "paper_y"):
            if column_name not in existing_columns:
                database.execute(
                    f"ALTER TABLE timeline_entries ADD COLUMN {column_name} REAL"
                )

        database.execute("""
            CREATE TABLE IF NOT EXISTS timeline_links (
                id TEXT PRIMARY KEY,
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                relation_type TEXT NOT NULL,
                CHECK(source_id <> target_id),
                UNIQUE(source_id, target_id, relation_type)
            )
        """)

        database.execute("""
            CREATE INDEX IF NOT EXISTS timeline_by_time
            ON timeline_entries (local_time)
        """)


def get_entries(first_day, last_day):
    with connect() as database:
        rows = database.execute("""
            SELECT id, local_time, kind, content, media_id, preview, paper_x, paper_y
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

    def parse_coordinate(field_name):
        value = entry.get(field_name)
        if value is None:
            return None
        coordinate = float(value)
        if not -100000 <= coordinate <= 100000:
            raise ValueError(f"Ungültige Papierkoordinate: {field_name}")
        return coordinate

    paper_x = parse_coordinate("paper_x")
    paper_y = parse_coordinate("paper_y")

    with connect() as database:
        database.execute("""
            INSERT INTO timeline_entries
                (id, local_time, kind, content, media_id, preview, paper_x, paper_y)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                local_time = excluded.local_time,
                kind = excluded.kind,
                content = excluded.content,
                media_id = excluded.media_id,
                preview = excluded.preview,
                paper_x = excluded.paper_x,
                paper_y = excluded.paper_y,
                updated_at = CURRENT_TIMESTAMP
        """, (entry_id, local_time, kind, content, media_id, preview, paper_x, paper_y))

    return entry_id


def delete_entry(entry_id):
    with connect() as database:
        database.execute("DELETE FROM timeline_entries WHERE id = ?", (entry_id,))
        database.execute(
            "DELETE FROM timeline_links WHERE source_id = ? OR target_id = ?",
            (entry_id, entry_id),
        )


def get_links():
    """Liefert alle gerichteten Beziehungen des Zeitpapiers."""
    with connect() as database:
        rows = database.execute("""
            SELECT id, source_id, target_id, relation_type
            FROM timeline_links ORDER BY rowid
        """).fetchall()
        return [dict(row) for row in rows]


def create_link(source_id, target_id, relation_type):
    """Speichert eine Verbindung zwischen zwei vorhandenen Einträgen."""
    if source_id == target_id:
        raise ValueError("Ein Eintrag kann nicht mit sich selbst verbunden werden")
    if relation_type not in ("beziehung", "abhaengigkeit"):
        raise ValueError("Unbekannte Beziehungsart")

    with connect() as database:
        known_ids = {
            row["id"] for row in database.execute(
                "SELECT id FROM timeline_entries WHERE id IN (?, ?)",
                (source_id, target_id),
            )
        }
        # Kalenderobjekte besitzen ebenfalls dauerhafte IDs. Auf dem Papier
        # heißen sie appointment:<id>, bleiben aber dieselben Termine.
        from calendar_database import read_calendar
        appointment_ids = {
            "appointment:" + str(item["id"])
            for item in read_calendar()["appointments"]
        }
        known_ids.update({source_id, target_id} & appointment_ids)
        if known_ids != {source_id, target_id}:
            raise ValueError("Mindestens einer der Einträge fehlt")

        identifier = uuid4().hex
        try:
            database.execute("""
                INSERT INTO timeline_links (id, source_id, target_id, relation_type)
                VALUES (?, ?, ?, ?)
            """, (identifier, source_id, target_id, relation_type))
        except sqlite3.IntegrityError as error:
            raise ValueError("Diese Verbindung existiert bereits") from error
        return identifier


def delete_link(identifier):
    with connect() as database:
        database.execute("DELETE FROM timeline_links WHERE id = ?", (identifier,))
