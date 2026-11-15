"""SQLite-Datenbank des multimedialen Tagebuchs.

Der Kalender im Browser verwendet derzeit noch localStorage.
Dieses Modul ist nur für die Tagebuchobjekte und Mediendaten zuständig.
"""

import sqlite3

from configuration import DATABASE_FILE, MEDIA_DIRECTORY

ALLOWED_PAPER_ITEM_KINDS = {
    "text",
    "image",
    "audio",
    "video",
    "file",
    "link",
    "message",
}

PAPER_ITEM_FIELDS = [
    "id",
    "day",
    "kind",
    "x",
    "y",
    "width",
    "height",
    "content",
    "media_id",
    "preview",
]


def connect_to_database():
    """Öffnet eine SQLite-Verbindung und erstellt bei Bedarf die Tabellen."""
    connection = sqlite3.connect(DATABASE_FILE, timeout=15)
    connection.execute("PRAGMA journal_mode=WAL")

    connection.execute(
        """CREATE TABLE IF NOT EXISTS paper_items (
            id TEXT PRIMARY KEY,
            day TEXT NOT NULL,
            kind TEXT NOT NULL,
            x REAL NOT NULL,
            y REAL NOT NULL,
            width REAL NOT NULL,
            height REAL NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            media_id TEXT NOT NULL DEFAULT '',
            preview INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )"""
    )

    connection.execute(
        """CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            mimetype TEXT NOT NULL,
            size INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    return connection


def prepare_storage():
    """Erstellt Datenordner und Datenbank beim Programmstart."""
    MEDIA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    with connect_to_database():
        pass


