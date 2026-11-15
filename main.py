"""Startpunkt für den Midnight Organizer.

Starten:
    python main.py

Der lokale HTTP-Server liefert die Weboberfläche und die Tagebuchdaten.
Mit installiertem pywebview öffnet sich ein Desktopfenster; andernfalls
wird der normale Webbrowser gestartet.
"""

import time
import webbrowser
from http.server import ThreadingHTTPServer
from threading import Thread

from configuration import DATA_DIRECTORY, SERVER_HOST, SERVER_PORT
from http_routes import OrganizerRequestHandler
from paper_database import prepare_storage


def start_application():
    """Startet den lokalen HTTP-Server und öffnet das Fenster oder Browser."""
    prepare_storage()
    server_address = (SERVER_HOST, SERVER_PORT)
    http_server = ThreadingHTTPServer(
        server_address,
        OrganizerRequestHandler,
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
