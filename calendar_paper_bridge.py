"""Gemeinsame Sicht auf Kalendertermine und Zeitpapier.

Wichtig: Termine werden NICHT in die Zeitpapier-Datenbank kopiert.
Stattdessen stellt diese Datei aus den zentralen Kalenderterminen virtuelle
Papierkarten her. Beide Ansichten verwenden somit dieselbe Termin-ID.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from calendar_database import read_calendar
from timeline_database import get_entries
from appointment_positions import read_positions

HOME_TIME_ZONE = ZoneInfo("Europe/Berlin")


def appointment_paper_id(appointment):
    return "appointment:" + str(appointment["id"])


def appointment_start_local(appointment):
    start_utc = datetime.fromisoformat(appointment["at"].replace("Z", "+00:00"))
    return start_utc.astimezone(HOME_TIME_ZONE)


def appointments_in_range(first_day, last_day):
    """Liefert Termine, die den Zeitbereich überschneiden, als Papierkarten."""
    first_instant = datetime.fromisoformat(first_day + "T00:00").replace(tzinfo=HOME_TIME_ZONE)
    after_last = datetime.fromisoformat(last_day + "T00:00").replace(tzinfo=HOME_TIME_ZONE) + timedelta(days=1)
    paper_cards = []
    saved_positions = read_positions()
    source_notes = {entry["id"]: entry for entry in get_entries(first_day, last_day)}

    for appointment in read_calendar()["appointments"]:
        try:
            local_start = appointment_start_local(appointment)
            duration = float(appointment["duration"])
            end_instant = local_start + timedelta(minutes=duration)
        except (KeyError, TypeError, ValueError, OverflowError):
            continue

        if end_instant <= first_instant or local_start >= after_last:
            continue

        # Startet ein Termin vor dem geladenen Tag, wird er am ersten
        # sichtbaren Tagesanfang zusätzlich dargestellt.
        display_start = max(local_start, first_instant)
        position = saved_positions.get(str(appointment["id"]), {})
        paper_cards.append({
            "id": appointment_paper_id(appointment),
            "appointment_id": appointment["id"],
            "kind": "appointment",
            "local_time": display_start.strftime("%Y-%m-%dT%H:%M"),
            "content": appointment.get("title", "Termin"),
            "owner": appointment.get("owner", "me"),
            "duration": duration,
            "media_id": "",
            "preview": 0,
            "paper_x": position.get("paper_x"),
            "paper_y": position.get("paper_y"),
            "source_entry_id": appointment.get("source_entry_id"),
            "source_content": source_notes.get(str(appointment.get("source_entry_id")), {}).get("content", ""),
        })
    return paper_cards


def get_combined_paper_entries(first_day, last_day):
    appointments = read_calendar()["appointments"]
    linked_entry_ids = {
        str(appointment["source_entry_id"])
        for appointment in appointments if appointment.get("source_entry_id")
    }
    notes = [entry for entry in get_entries(first_day, last_day)
             if str(entry["id"]) not in linked_entry_ids]
    combined = notes + appointments_in_range(first_day, last_day)
    return sorted(combined, key=lambda entry: entry["local_time"])


def get_unplanned_paper_entries():
    """Noch nicht terminierte Texte aus dem Zeitpapier für den Kalender-Vorrat."""
    appointments = read_calendar()["appointments"]
    used_ids = {str(item.get("source_entry_id")) for item in appointments}
    from timeline_database import connect
    with connect() as database:
        rows = database.execute("""
            SELECT id, local_time, kind, content
            FROM timeline_entries
            WHERE kind IN ('text', 'message') AND trim(content) != ''
            ORDER BY local_time, rowid
            LIMIT 500
        """).fetchall()
    pending_notes = [dict(row) for row in rows if row["id"] not in used_ids]

    # Auch das ältere frei positionierbare Endlospapier darf nicht
    # vom Kalender abgeschnitten bleiben. Hierfür gibt es eigene Quell-IDs.
    from paper_database import connect_to_database
    with connect_to_database() as database:
        free_paper_rows = database.execute("""
            SELECT id, day, kind, content
            FROM paper_items
            WHERE kind IN ('text', 'message') AND trim(content) != ''
            ORDER BY day, rowid
            LIMIT 500
        """).fetchall()

    for entry_id, day, kind, content in free_paper_rows:
        source_identifier = "free:" + entry_id
        if source_identifier in used_ids:
            continue
        pending_notes.append({
            "id": source_identifier,
            "local_time": day + "T12:00",
            "kind": kind,
            "content": content,
        })

    return pending_notes
