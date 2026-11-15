"""Zentrale Konfiguration des lokalen Midnight Organizers.

Hier können Port, Speicherorte und Upload-Grenzen geändert werden.
"""

from pathlib import Path

PROJECT_DIRECTORY = Path(__file__).resolve().parent
WEB_DIRECTORY = PROJECT_DIRECTORY / "web"
DATA_DIRECTORY = PROJECT_DIRECTORY / "daten"
MEDIA_DIRECTORY = DATA_DIRECTORY / "medien"
DATABASE_FILE = DATA_DIRECTORY / "tagebuch.sqlite3"

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8877
MAX_UPLOAD_BYTES = 100 * 1024 * 1024

# Nur diese Oberflächendateien dürfen über HTTP heruntergeladen werden.
PUBLIC_FILES = {
    "free-paper-graph.js", "timeline.css", "timeline.js", "timeline-board.js", "timeline-shadows.js",
    "app.css", "paper.css", "paper.js", "paper-network.js", "paper-relations.js",
    "website-editor.js", "09-minute-planning.js",
    "01-state.js", "02-time.js", "03-storage.js", "04-svg-utils.js",
    "05a-desktop.js", "05b-globe.js",
    "05c-year.js", "05d-month.js", "05e-week.js", "05f-day.js",
    "06-camera.js", "07-input.js", "08-start.js",
    "10-calendar-sync.js", "11-day-interaction.js",
    "12-appointment-editor.js", "13-notepad.js",
    "14-appointment-selection.js", "15-time-drawing.js",
    "16-paper-calendar-integration.js"
}


