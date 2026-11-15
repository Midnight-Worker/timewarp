# Python-Server verstehen – Lernpfad

## 1. `main.py`

Diese Datei startet das Programm. Hier werden zuerst die Datenordner
angelegt, dann wird ein lokaler HTTP-Server gestartet. Danach öffnet
sich pywebview oder der normale Browser.

Suche die Funktion `start_application()`. Das ist dein Einstiegspunkt.

## 2. `configuration.py`

Hier kannst du den Port ändern:

```python
SERVER_PORT = 8877
```

Außerdem sind hier die Speicherordner und die Liste der erlaubten
Webdateien definiert. Bei neuen JavaScript-Dateien musst du sie dort
ergänzen, damit der Server sie ausliefern darf.

## 3. `paper_database.py`

Diese Datei öffnet SQLite und legt zwei Tabellen an:

- `paper_items`: Texte, Medienpositionen und Papierobjekte.
- `media`: Metadaten zu hochgeladenen Dateien.

Die Dateien selbst liegen unter `daten/medien/`.

## 4. `http_routes.py`

Die Klasse `OrganizerRequestHandler` beantwortet Browseranfragen:

- `do_GET()` für Seite, Skripte, Tagebuchdaten und Medien.
- `do_POST()` für neue Papierobjekte und Medien-Uploads.
- `do_DELETE()` für das Löschen von Papierobjekten.

Dahinter stehen sprechende Helfer wie `get_paper_items_for_day()`,
`receive_media_upload()` und `save_or_update_paper_item()`.

## Miniübung

Ändere in `configuration.py` den Port von `8877` auf `8890`.
Starte `python main.py` erneut. Warum funktioniert der Aufruf
unter `http://127.0.0.1:8890` jetzt, unter der alten Adresse aber nicht?

## Sicherheit

Der Server bindet absichtlich nur an `127.0.0.1`. Er ist ein lokaler
Prototyp ohne Benutzeranmeldung. Bitte nicht unverändert ins öffentliche
Internet stellen.
