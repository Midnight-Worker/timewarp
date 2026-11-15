"""Kleine HTTP-Helfer für das fortlaufende Zeitpapier.

Der vorhandene OrganizerRequestHandler sendet die Antworten; die Datenbank-
Operationen liegen ausschließlich in timeline_database.py.
"""

from datetime import date
from urllib.parse import parse_qs, urlparse

from timeline_database import delete_entry, get_day_counts, get_entries, save_entry


def validate_day(text):
    date.fromisoformat(text)
    return text


def handle_timeline_get(handler, request_url):
    parameters = parse_qs(request_url.query)
    try:
        first_day = validate_day(parameters.get("from", [""])[0])
        last_day = validate_day(parameters.get("to", [""])[0])
        if first_day > last_day:
            raise ValueError("Der Anfang liegt nach dem Ende")
        days_in_range = (date.fromisoformat(last_day) - date.fromisoformat(first_day)).days
        if days_in_range > 370:
            raise ValueError("Bitte höchstens 371 Tage auf einmal laden")
    except ValueError as error:
        handler.send_http_response(400, {"error": str(error)})
        return

    if request_url.path == "/api/timeline/counts":
        result = get_day_counts(first_day, last_day)
    else:
        result = get_entries(first_day, last_day)
    handler.send_http_response(200, result)


def handle_timeline_post(handler):
    try:
        data = handler.read_json_request()
        identifier = save_entry(data)
        handler.send_http_response(200, {"ok": True, "id": identifier})
    except (TypeError, ValueError, KeyError) as error:
        handler.send_http_response(400, {"error": str(error)})


def handle_timeline_delete(handler, requested_path):
    entry_id = requested_path.removeprefix("/api/timeline/")
    if not entry_id or len(entry_id) > 64 or "/" in entry_id:
        handler.send_http_response(400, {"error": "Ungültige Kennung"})
        return
    delete_entry(entry_id)
    handler.send_http_response(200, {"ok": True})
