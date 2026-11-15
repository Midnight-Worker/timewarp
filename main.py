"""Startprogramm für den Midnight Organizer.

Die Weboberfläche läuft auf dem lokalen Python-Server.
Mit pywebview erscheint sie in einem eigenen Desktopfenster.
Ohne pywebview wird der normale Browser verwendet.
"""

import time
import webbrowser
from http.server import ThreadingHTTPServer
from threading import Thread

from configuration import DATA_DIRECTORY, SERVER_HOST, SERVER_PORT
from http_routes import OrganizerRequestHandler
from paper_database import prepare_storage
from calendar_database import create_calendar_tables


def open_application_window(application_url):
    """Öffnet die Oberfläche in pywebview oder im normalen Browser."""
    try:
        import webview
    except ImportError:
        print("pywebview fehlt: Anwendung im Browser öffnen.")
        webbrowser.open(application_url)
        wait_until_keyboard_interrupt()
        return

    webview.create_window(
        "Midnight Organizer – Unterrichtsversion",
        application_url,
        fullscreen=True,
        background_color="#071320",
    )
    webview.start()


def wait_until_keyboard_interrupt():
    """Hält den Server offen, solange der Browser verwendet wird."""
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Midnight Organizer wird beendet.")


def start_application():
    """Richtet die Speicherung ein und startet die Anwendung."""
    prepare_storage()
    create_calendar_tables()

    server_address = (SERVER_HOST, SERVER_PORT)
    http_server = ThreadingHTTPServer(
        server_address,
        OrganizerRequestHandler,
    )

    server_thread = Thread(
        target=http_server.serve_forever,
        daemon=True,
    )
    server_thread.start()

    application_url = f"http://{SERVER_HOST}:{SERVER_PORT}"
    print(f"Midnight Organizer: {application_url}")
    print(f"Speicherort: {DATA_DIRECTORY}")

    try:
        open_application_window(application_url)
    finally:
        http_server.shutdown()
        http_server.server_close()


if __name__ == "__main__":
    start_application()
