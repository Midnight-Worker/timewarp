"""Midnight Organizer – lokaler Webserver mit SQLite und Medienablage.

Start:
    python main.py

Die Oberfläche läuft auf 127.0.0.1:8877 und kann mit pywebview oder
im normalen Browser angezeigt werden. Dieser Server ist ein lokaler
Lernprototyp und noch NICHT für das öffentliche Internet ausgelegt.
"""

import json
import sqlite3
import time
import uuid
import webbrowser
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import parse_qs, unquote, urlparse

PROJECT_DIRECTORY = Path(__file__).resolve().parent
WEB_DIRECTORY = PROJECT_DIRECTORY / "web"
DATA_DIRECTORY = PROJECT_DIRECTORY / "daten"
MEDIA_DIRECTORY = DATA_DIRECTORY / "medien"
DATABASE_FILE = DATA_DIRECTORY / "tagebuch.sqlite3"

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8877
MAX_UPLOAD_BYTES = 100 * 1024 * 1024

ALLOWED_PAPER_ITEM_KINDS = {
    "text", "image", "audio", "video", "file", "link", "message"
}

PAPER_ITEM_FIELDS = [
    "id", "day", "kind", "x", "y", "width", "height",
    "content", "media_id", "preview"
]

# Nur diese Oberflächendateien dürfen über HTTP heruntergeladen werden.
PUBLIC_FILES = {
    "app.css", "paper.css", "paper.js",
    "01-state.js", "02-time.js", "03-storage.js", "04-svg-utils.js",
    "05a-desktop.js", "05b-globe.js", "05c-calendar-scenes.js",
    "06-camera.js", "07-input.js", "08-start.js"
}


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


class OrganizerRequestHandler(BaseHTTPRequestHandler):
    """HTTP-Routen für Oberfläche, Kalenderpapier und Medien."""

    def send_response_body(
        self,
        status_code,
        data,
        content_type="application/json; charset=utf-8",
        extra_headers=None,
    ):
        """Sendet JSON oder rohe Dateibytes mit einheitlichen HTTP-Headern."""
        if not isinstance(data, bytes):
            data = json.dumps(data, ensure_ascii=False).encode("utf-8")

        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")

        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)

        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def read_json_body(self, maximum_bytes=2_000_000):
        """Liest einen begrenzten JSON-Request aus dem HTTP-Body."""
        content_length = int(self.headers.get("Content-Length") or 0)
        if not 0 < content_length <= maximum_bytes:
            raise ValueError("Ungültige JSON-Größe")

        raw_data = self.rfile.read(content_length)
        return json.loads(raw_data)

    def do_GET(self):
        request_url = urlparse(self.path)
        requested_path = request_url.path

        if requested_path in ("/", "/index.html"):
            page = WEB_DIRECTORY / "index.html"
            self.send_response_body(
                200, page.read_bytes(), "text/html; charset=utf-8"
            )
            return

        file_name = requested_path.lstrip("/")
        if file_name in PUBLIC_FILES and requested_path == "/" + file_name:
            self.serve_static_file(file_name)
            return

        if requested_path == "/api/items":
            self.list_paper_items(request_url.query)
            return

        if requested_path.startswith("/media/"):
            media_id = requested_path.removeprefix("/media/")
            self.serve_media_file(media_id)
            return

        self.send_response_body(404, {"error": "Unbekannter Pfad"})

    def serve_static_file(self, file_name):
        """Gibt HTML/CSS/JavaScript aus dem festen Web-Verzeichnis zurück."""
        content_type = (
            "text/css; charset=utf-8"
            if file_name.endswith(".css")
            else "text/javascript; charset=utf-8"
        )
        data = (WEB_DIRECTORY / file_name).read_bytes()
        self.send_response_body(200, data, content_type)

    def list_paper_items(self, query_string):
        parameters = parse_qs(query_string)
        selected_day = parameters.get("day", [""])[0]

        try:
            date.fromisoformat(selected_day)
        except ValueError:
            self.send_response_body(400, {"error": "Ungültiges Datum"})
            return

        with connect_to_database() as database:
            rows = database.execute(
                """SELECT id, day, kind, x, y, width, height,
                          content, media_id, preview
                   FROM paper_items
                   WHERE day = ?
                   ORDER BY rowid""",
                (selected_day,),
            ).fetchall()

        paper_items = [dict(zip(PAPER_ITEM_FIELDS, row)) for row in rows]
        self.send_response_body(200, paper_items)

    def serve_media_file(self, media_id):
        """Liefert ausschließlich bekannte Medien-IDs aus der Datenbank."""
        if not media_id.isascii() or not media_id.isalnum():
            self.send_response_body(404, {"error": "Nicht gefunden"})
            return

        with connect_to_database() as database:
            metadata = database.execute(
                "SELECT filename, mimetype FROM media WHERE id = ?",
                (media_id,),
            ).fetchone()

        media_file = MEDIA_DIRECTORY / media_id
        if metadata is None or not media_file.is_file():
            self.send_response_body(404, {"error": "Datei fehlt"})
            return

        original_file_name, content_type = metadata
        inline_allowed = content_type.startswith((
            "image/png", "image/jpeg", "image/gif", "image/webp",
            "audio/", "video/"
        ))
        disposition = "inline" if inline_allowed else "attachment"

        # Der Name wird in einem Header verwendet: Steuerzeichen entfernen.
        safe_name = original_file_name.replace('"', "").replace("\\", "_")
        safe_name = safe_name.encode("ascii", "ignore").decode() or "datei"

        self.send_response_body(
            200,
            media_file.read_bytes(),
            content_type,
            {"Content-Disposition": f'{disposition}; filename="{safe_name}"'},
        )

    def do_POST(self):
        requested_path = urlparse(self.path).path
        if requested_path == "/api/upload":
            self.upload_media()
        elif requested_path == "/api/items":
            self.save_paper_item()
        else:
            self.send_response_body(404, {"error": "Unbekannter Pfad"})

    def upload_media(self):
        """Speichert eine hochgeladene Datei unter einer zufälligen Medien-ID."""
        content_length = int(self.headers.get("Content-Length") or 0)
        if not 0 < content_length <= MAX_UPLOAD_BYTES:
            self.send_response_body(
                413, {"error": "Datei zu groß (maximal 100 MB)"}
            )
            return

        query_string = urlparse(self.path).query
        provided_name = parse_qs(query_string).get("name", ["datei"])[0]
        provided_name = unquote(provided_name).replace("\\", "/")
        original_name = Path(provided_name).name[:160] or "datei"

        content_type = self.headers.get(
            "Content-Type", "application/octet-stream"
        ).split(";")[0].strip().lower()

        media_id = uuid.uuid4().hex
        content = self.rfile.read(content_length)
        (MEDIA_DIRECTORY / media_id).write_bytes(content)

        with connect_to_database() as database:
            database.execute(
                "INSERT INTO media (id, filename, mimetype, size) VALUES (?, ?, ?, ?)",
                (media_id, original_name, content_type, content_length),
            )

        self.send_response_body(201, {
            "id": media_id,
            "filename": original_name,
            "mime": content_type,
            "size": content_length,
            "url": "/media/" + media_id,
        })

    def save_paper_item(self):
        """Erstellt einen Eintrag oder überschreibt seinen letzten Stand."""
        try:
            item = self.read_json_body()
            item_kind = str(item.get("kind", "text"))
            if item_kind not in ALLOWED_PAPER_ITEM_KINDS:
                raise ValueError("Unbekannter Elementtyp")

            selected_day = str(item["day"])
            date.fromisoformat(selected_day)

            item_id = str(item.get("id") or uuid.uuid4().hex)[:64]
            values = (
                item_id,
                selected_day,
                item_kind,
                float(item.get("x", 50)),
                float(item.get("y", 70)),
                float(item.get("width", 300)),
                float(item.get("height", 180)),
                str(item.get("content", ""))[:100_000],
                str(item.get("media_id", ""))[:80],
                int(bool(item.get("preview", 0))),
            )

            with connect_to_database() as database:
                database.execute(
                    """INSERT INTO paper_items
                       (id, day, kind, x, y, width, height, content, media_id, preview)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                       ON CONFLICT(id) DO UPDATE SET
                           day = excluded.day,
                           kind = excluded.kind,
                           x = excluded.x,
                           y = excluded.y,
                           width = excluded.width,
                           height = excluded.height,
                           content = excluded.content,
                           media_id = excluded.media_id,
                           preview = excluded.preview,
                           updated_at = CURRENT_TIMESTAMP""",
                    values,
                )

            self.send_response_body(200, {"ok": True, "id": item_id})

        except (ValueError, KeyError, TypeError) as error:
            self.send_response_body(400, {"error": str(error)})

    def do_DELETE(self):
        requested_path = urlparse(self.path).path
        if not requested_path.startswith("/api/items/"):
            self.send_response_body(404, {"error": "Unbekannter Pfad"})
            return

        item_id = requested_path.removeprefix("/api/items/")
        with connect_to_database() as database:
            database.execute("DELETE FROM paper_items WHERE id = ?", (item_id,))

        self.send_response_body(200, {"ok": True})


def start_application():
    """Startet den lokalen HTTP-Server und öffnet das Fenster oder Browser."""
    prepare_storage()
    http_server = ThreadingHTTPServer(
        (SERVER_HOST, SERVER_PORT), OrganizerRequestHandler
    )

    server_thread = Thread(target=http_server.serve_forever, daemon=True)
    server_thread.start()

    application_url = f"http://{SERVER_HOST}:{SERVER_PORT}"
    print(f"Midnight Organizer: {application_url}")
    print(f"Speicherort: {DATA_DIRECTORY}")

    try:
        try:
            import webview
        except ImportError:
            print("pywebview fehlt: Anwendung im Browser öffnen.")
            webbrowser.open(application_url)
            try:
                while True:
                    time.sleep(3600)
            except KeyboardInterrupt:
                pass
        else:
            webview.create_window(
                "Midnight Organizer – Unterrichtsversion",
                application_url,
                fullscreen=True,
                background_color="#071320",
            )
            webview.start()
    finally:
        http_server.shutdown()


if __name__ == "__main__":
    start_application()
