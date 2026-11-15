"""Positionen der Kalenderobjekte auf dem Zeitpapier in SQLite."""
import sqlite3
from configuration import DATABASE_FILE


def create_position_table():
    with sqlite3.connect(DATABASE_FILE) as database:
        database.execute("""
            CREATE TABLE IF NOT EXISTS appointment_paper_positions (
                appointment_id TEXT PRIMARY KEY,
                paper_x REAL NOT NULL,
                paper_y REAL NOT NULL
            )
        """)


def read_positions():
    with sqlite3.connect(DATABASE_FILE) as database:
        rows = database.execute(
            "SELECT appointment_id, paper_x, paper_y FROM appointment_paper_positions"
        ).fetchall()
    return {key: {"paper_x": x, "paper_y": y} for key, x, y in rows}


def save_position(appointment_id, paper_x, paper_y):
    if len(appointment_id) > 100:
        raise ValueError("Ungültige Kennung")
    x, y = float(paper_x), float(paper_y)
    if not (-100000 <= x <= 100000 and -100000 <= y <= 100000):
        raise ValueError("Position außerhalb der Papierfläche")
    with sqlite3.connect(DATABASE_FILE) as database:
        database.execute("""
            INSERT INTO appointment_paper_positions VALUES (?, ?, ?)
            ON CONFLICT(appointment_id) DO UPDATE SET
                paper_x = excluded.paper_x, paper_y = excluded.paper_y
        """, (appointment_id, x, y))
