"""Termine zentral in SQLite speichern, mit Versionsprüfung gegen Konflikte."""

import json
import sqlite3
from configuration import DATABASE_FILE


def create_calendar_tables():
    with sqlite3.connect(DATABASE_FILE) as database:
        database.execute("""CREATE TABLE IF NOT EXISTS calendar_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            revision INTEGER NOT NULL,
            appointments_json TEXT NOT NULL
        )""")
        database.execute("""INSERT OR IGNORE INTO calendar_state
            (id, revision, appointments_json) VALUES (1, 0, '[]')""")


def read_calendar():
    with sqlite3.connect(DATABASE_FILE) as database:
        row = database.execute(
            "SELECT revision, appointments_json FROM calendar_state WHERE id = 1"
        ).fetchone()
    return {"revision": row[0], "appointments": json.loads(row[1])}


def replace_calendar(expected_revision, appointments):
    """Atomar ersetzen oder den neuen Stand als Konflikt zurückmelden.

    BEGIN IMMEDIATE verhindert, dass zwei gleichzeitige Requests denselben
    Versionsstand unabhängig voneinander überschreiben.
    """
    with sqlite3.connect(DATABASE_FILE, timeout=15) as database:
        database.execute("BEGIN IMMEDIATE")
        row = database.execute(
            "SELECT revision, appointments_json FROM calendar_state WHERE id = 1"
        ).fetchone()
        current_revision, serialized_appointments = row
        if current_revision != expected_revision:
            return False, {
                "revision": current_revision,
                "appointments": json.loads(serialized_appointments),
            }

        new_revision = current_revision + 1
        database.execute(
            """UPDATE calendar_state SET revision = ?, appointments_json = ?
               WHERE id = 1""",
            (new_revision, json.dumps(appointments, ensure_ascii=False)),
        )
        return True, {"revision": new_revision, "appointments": appointments}
