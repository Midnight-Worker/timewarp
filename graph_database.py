"""Knotenpositionen und Beziehungen des FREIEN Endlospapiers.

Die Einträge selbst leben weiterhin in ihren jeweiligen Tabellen.
Eine Position oder Verbindung ist nur eine zusätzliche Information.
"""

import math
import sqlite3
from uuid import uuid4

from configuration import DATABASE_FILE


def connect_graph_database():
    connection = sqlite3.connect(DATABASE_FILE, timeout=15)
    connection.row_factory = sqlite3.Row
    return connection


def create_graph_tables():
    with connect_graph_database() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS graph_positions (
                node_id TEXT NOT NULL,
                day TEXT NOT NULL,
                x REAL NOT NULL,
                y REAL NOT NULL,
                PRIMARY KEY (node_id, day)
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS graph_connections (
                id TEXT PRIMARY KEY,
                day TEXT NOT NULL,
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                relation_type TEXT NOT NULL,
                UNIQUE (day, source_id, target_id, relation_type)
            )
        """)


def read_positions(day):
    with connect_graph_database() as connection:
        rows = connection.execute(
            "SELECT node_id, x, y FROM graph_positions WHERE day = ?", (day,)
        ).fetchall()
    return {row['node_id']: {'x': row['x'], 'y': row['y']} for row in rows}


def save_position(day, node_id, x, y):
    x = float(x)
    y = float(y)
    if not math.isfinite(x) or not math.isfinite(y):
        raise ValueError('Ungültige Position')
    if abs(x) > 1_000_000 or abs(y) > 1_000_000:
        raise ValueError('Position außerhalb der Papierwelt')
    with connect_graph_database() as connection:
        connection.execute("""
            INSERT INTO graph_positions (node_id, day, x, y)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(node_id, day) DO UPDATE SET
                x = excluded.x,
                y = excluded.y
        """, (node_id, day, x, y))


def read_connections(day):
    with connect_graph_database() as connection:
        rows = connection.execute("""
            SELECT id, source_id, target_id, relation_type
            FROM graph_connections WHERE day = ?
        """, (day,)).fetchall()
    return [dict(row) for row in rows]


def add_connection(day, source_id, target_id, relation_type):
    if source_id == target_id:
        raise ValueError('Ein Knoten kann nicht mit sich selbst verbunden werden')
    if relation_type not in {'relation', 'dependency'}:
        raise ValueError('Unbekannter Verbindungstyp')
    connection_id = uuid4().hex
    with connect_graph_database() as connection:
        connection.execute("""
            INSERT OR IGNORE INTO graph_connections
                (id, day, source_id, target_id, relation_type)
            VALUES (?, ?, ?, ?, ?)
        """, (connection_id, day, source_id, target_id, relation_type))
    return connection_id


def delete_connection(connection_id):
    with connect_graph_database() as connection:
        connection.execute(
            'DELETE FROM graph_connections WHERE id = ?', (connection_id,)
        )
