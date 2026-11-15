"""HTTP-Schnittstelle für die Oberfläche und das Tagebuch.

Die Klasse enthält nur Anfragen und Antworten. Datenbank und
Programmeinstieg stehen in eigenen Modulen.
"""

import json
import uuid
from datetime import date
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from configuration import (
    MAX_UPLOAD_BYTES,
    MEDIA_DIRECTORY,
    PUBLIC_FILES,
    WEB_DIRECTORY,
)
from calendar_database import read_calendar, replace_calendar
from calendar_paper_bridge import get_unplanned_paper_entries
from appointment_positions import save_position
from paper_database import (
    ALLOWED_PAPER_ITEM_KINDS,
    PAPER_ITEM_FIELDS,
    connect_to_database,
)


from graph_routes import handle_graph_get, handle_graph_post, handle_graph_delete

from timeline_routes import (
    handle_timeline_get,
    handle_timeline_post,
    handle_timeline_delete,
    handle_links_get,
    handle_links_post,
    handle_links_delete,
)


class OrganizerRequestHandler(BaseHTTPRequestHandler):
    """HTTP-Routen für Oberfläche, Kalenderpapier und Medien."""

    def send_http_response(
        self,
        status_code,
        data,
        content_type="application/json; charset=utf-8",
        extra_headers=None,
    ):
        """Sendet JSON oder rohe Dateibytes mit einheitlichen HTTP-Headern."""
        if not isinstance(data, bytes):
            json_text = json.dumps(data, ensure_ascii=False)
            data = json_text.encode("utf-8")

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

    def read_json_request(self, maximum_bytes=2_000_000):
        """Liest einen begrenzten JSON-Request aus dem HTTP-Body."""
        content_length = int(self.headers.get("Content-Length") or 0)
        if content_length <= 0 or content_length > maximum_bytes:
            raise ValueError("Ungültige JSON-Größe")

        raw_data = self.rfile.read(content_length)
        request_data = json.loads(raw_data)
        return request_data

    def do_GET(self):
        request_url = urlparse(self.path)
        requested_path = request_url.path

        if requested_path in ("/", "/index.html"):
            page = WEB_DIRECTORY / "index.html"
            self.send_http_response(
                200, page.read_bytes(), "text/html; charset=utf-8"
            )
            return

        file_name = requested_path.lstrip("/")
        if file_name in PUBLIC_FILES and requested_path == "/" + file_name:
            self.send_web_asset(file_name)
            return

        if requested_path == "/api/free-graph":
            handle_graph_get(self, request_url)
            return

        if requested_path == "/api/timeline-links":
            handle_links_get(self)
            return

        if requested_path in ("/api/timeline", "/api/timeline/counts"):
            handle_timeline_get(self, request_url)
            return

        if requested_path == "/api/calendar/inbox":
            self.send_http_response(200, get_unplanned_paper_entries())
            return

        if requested_path == "/api/calendar":
            self.send_http_response(200, read_calendar())
            return

        if requested_path == "/api/items":
            self.get_paper_items_for_day(request_url.query)
            return

        if requested_path.startswith("/media/"):
            media_id = requested_path.removeprefix("/media/")
            self.send_saved_media(media_id)
            return

        self.send_http_response(404, {"error": "Unbekannter Pfad"})

    def send_web_asset(self, file_name):
        """Gibt HTML/CSS/JavaScript aus dem festen Web-Verzeichnis zurück."""
        content_type = (
            "text/css; charset=utf-8"
            if file_name.endswith(".css")
            else "text/javascript; charset=utf-8"
        )
        data = (WEB_DIRECTORY / file_name).read_bytes()
        self.send_http_response(200, data, content_type)

    def get_paper_items_for_day(self, query_string):
        parameters = parse_qs(query_string)
        selected_day = parameters.get("day", [""])[0]

        try:
            date.fromisoformat(selected_day)
        except ValueError:
            self.send_http_response(400, {"error": "Ungültiges Datum"})
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

        paper_items = []
        for database_row in rows:
            paper_item = dict(zip(PAPER_ITEM_FIELDS, database_row))
            paper_items.append(paper_item)
        self.send_http_response(200, paper_items)

    def send_saved_media(self, media_id):
        """Liefert ausschließlich bekannte Medien-IDs aus der Datenbank."""
        if not media_id.isascii() or not media_id.isalnum():
            self.send_http_response(404, {"error": "Nicht gefunden"})
            return

        with connect_to_database() as database:
            metadata = database.execute(
                "SELECT filename, mimetype FROM media WHERE id = ?",
                (media_id,),
            ).fetchone()

        media_file = MEDIA_DIRECTORY / media_id
        if metadata is None or not media_file.is_file():
            self.send_http_response(404, {"error": "Datei fehlt"})
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

        self.send_http_response(
            200,
            media_file.read_bytes(),
            content_type,
            {"Content-Disposition": f'{disposition}; filename="{safe_name}"'},
        )

    def do_POST(self):
        requested_path = urlparse(self.path).path
        if requested_path.startswith("/api/free-graph/"):
            handle_graph_post(self, requested_path)
        elif requested_path == "/api/timeline-links":
            handle_links_post(self)
        elif requested_path == "/api/appointment-paper-position":
            try:
                data = self.read_json_request()
                known_ids = {
                    str(item["id"]) for item in read_calendar()["appointments"]
                }
                appointment_id = str(data["appointment_id"])
                if appointment_id not in known_ids:
                    raise ValueError("Termin nicht vorhanden")
                save_position(appointment_id, data["paper_x"], data["paper_y"])
                self.send_http_response(200, {"ok": True})
            except (KeyError, ValueError, TypeError) as error:
                self.send_http_response(400, {"error": str(error)})
        elif requested_path == "/api/timeline":
            handle_timeline_post(self)
        elif requested_path == "/api/upload":
            self.receive_media_upload()
        elif requested_path == "/api/items":
            self.save_or_update_paper_item()
        else:
            self.send_http_response(404, {"error": "Unbekannter Pfad"})

    def do_PUT(self):
        if urlparse(self.path).path != "/api/calendar":
            self.send_http_response(404, {"error": "Unbekannter Pfad"})
            return

        try:
            payload = self.read_json_request()
            expected_revision = payload["revision"]
            appointments = payload["appointments"]
            if type(expected_revision) is not int or expected_revision < 0:
                raise ValueError("Ungültige Revisionsnummer")
            if not isinstance(appointments, list) or len(appointments) > 20000:
                raise ValueError("Ungültige Terminliste")
            for appointment in appointments:
                if not isinstance(appointment, dict):
                    raise ValueError("Ungültiger Termin")
                if not all(field in appointment for field in ("id", "at", "owner", "title", "duration")):
                    raise ValueError("Fehlende Terminangaben")
                if not isinstance(appointment["title"], str) or len(appointment["title"]) > 140:
                    raise ValueError("Ungültiger Titel")
                if not isinstance(appointment["duration"], (int, float)) or not 1 <= appointment["duration"] <= 525600:
                    raise ValueError("Ungültige Dauer")

            saved, calendar = replace_calendar(expected_revision, appointments)
            self.send_http_response(200 if saved else 409, calendar)
        except (KeyError, ValueError, TypeError) as error:
            self.send_http_response(400, {"error": str(error)})

    def receive_media_upload(self):
        """Speichert eine hochgeladene Datei unter einer zufälligen Medien-ID."""
        content_length = int(self.headers.get("Content-Length") or 0)
        if content_length <= 0 or content_length > MAX_UPLOAD_BYTES:
            self.send_http_response(
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

        self.send_http_response(201, {
            "id": media_id,
            "filename": original_name,
            "mime": content_type,
            "size": content_length,
            "url": "/media/" + media_id,
        })

    def save_or_update_paper_item(self):
        """Erstellt einen Eintrag oder überschreibt seinen letzten Stand."""
        try:
            item = self.read_json_request()
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

            self.send_http_response(200, {"ok": True, "id": item_id})

        except (ValueError, KeyError, TypeError) as error:
            self.send_http_response(400, {"error": str(error)})

    def do_DELETE(self):
        requested_path = urlparse(self.path).path
        if requested_path.startswith("/api/free-graph/connection/"):
            handle_graph_delete(self, requested_path)
            return
        if requested_path.startswith("/api/timeline-links/"):
            handle_links_delete(self, requested_path)
            return
        if requested_path.startswith("/api/timeline/"):
            handle_timeline_delete(self, requested_path)
            return

        if not requested_path.startswith("/api/items/"):
            self.send_http_response(404, {"error": "Unbekannter Pfad"})
            return

        item_id = requested_path.removeprefix("/api/items/")
        with connect_to_database() as database:
            database.execute(
                "DELETE FROM paper_items WHERE id = ?",
                (item_id,),
            )

        self.send_http_response(200, {"ok": True})


