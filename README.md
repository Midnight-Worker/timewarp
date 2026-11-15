# Midnight Organizer V7 – Lesbare Ausgabe (Refactoring von V6)

Diese Version trennt den Quellcode von **V6** in thematische Dateien. Ziel: Du kannst
Kamera, Kalender oder Papierwelt getrennt finden und bearbeiten. **Keine neue Funktion.**

## Start

```bash
python main.py
```

Optional für ein eigenes Desktopfenster:

```bash
pip install pywebview
python main.py
```

Auch ohne pywebview öffnet sich die Anwendung im Browser unter
`http://127.0.0.1:8877`. Bitte **nicht** `index.html` per `file://` öffnen.

## Wo finde ich was?

| Datei | Zweck |
|---|---|
| `main.py` | HTTP-Server, API, SQLite, Speicherung der importierten Dateien |
| `web/index.html` | SVG-Bühne, Schaltflächen und Papier-HTML |
| `web/app.css` | Schreibtisch/Kalender-Stil |
| `web/01-state.js` | Gemeinsamer Zustand, Personen, Ansichten |
| `web/02-time.js` | Zeitzonenfunktionen |
| `web/03-storage.js` | Kalenderkarten, Notizen, Speichern im Browser |
| `web/04-svg-utils.js` | Kleine SVG-Zeichenhelfer |
| `web/05-scenes.js` | Schreibtisch, Globus, Jahr, Monat, Woche, Tag |
| `web/06-camera.js` | Kamera, Zoomstufen, Ansichtswechsel, SVG-Koordinaten |
| `web/07-input.js` | Mausrad, Maus, Klicks, Drag-and-drop |
| `web/08-start.js` | Buttons, Tastatur, Notizblock, Start |
| `web/paper.js` | Tagebuch, Dateiuploads, Bild-, Audio- und Videokarten |
| `web/paper.css` | Tagebuch-Gestaltung |

Die Kalenderdateien werden absichtlich als **klassische JavaScript-Skripte in
fester Reihenfolge** geladen. Ihre Variablen/Funktionen sind untereinander
sichtbar. So brauchen wir **weder npm noch Bundler**. Als nächster Schritt
können wir die Schnittstellen zwischen diesen Modulen ausdrücklich definieren.

### Daten

- `daten/tagebuch.sqlite3`: SQLite-Datenbank der Tagebuchkarten
- `daten/medien/`: hochgeladene Originaldateien
- Browser-`localStorage`: Kalendertermine und Schreibtischnotizen (wie in V6)

**Vor dem Wechsel** bitte die V6-Dateien und den Datenordner sichern. V7 nutzt
die bestehenden Speicherformate, migriert aber noch nicht alle Daten in SQLite.

### Sicherheit und Grenzen

Ein lokaler Prototyp, kein öffentlich erreichbarer Teamserver. Keine
Benutzerkonten, kein Undo, keine automatische WhatsApp-Anbindung und noch kein
nahtloses Tag-übergreifendes Papier.

## So testest du eine Änderung

1. In `web/06-camera.js` eine Funktion suchen (z. B. `fit`).
2. Nur dort etwas verändern und speichern.
3. Browser mit `Strg + F5` neu laden.
4. Bei Problemen Entwicklerwerkzeuge/F12 öffnen und Konsole ansehen.

Siehe **ZOOM-VERSTEHEN.md** für eine ausführlichere Erklärung.
