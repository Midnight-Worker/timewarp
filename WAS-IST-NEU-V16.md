# Midnight Organizer V16 – Fortlaufendes Zeitpapier

## Wie das Papier funktioniert

Jede Stunde ist ein HTML-Abschnitt (`.timeline-hour`) mit `min-height: 80vh`.
`min-height` bedeutet Mindesthöhe, nicht feste Höhe. Ein langer Text lässt
den Abschnitt wachsen. Alle späteren Stunden werden dadurch automatisch nach
unten geschoben, ohne dass wir ihre Positionen ausrechnen müssen.

## Dateien

- `timeline_database.py` – SQLite-Tabelle und Datenzugriff
- `timeline_routes.py` – HTTP-Aufrufe für das Zeitpapier
- `web/timeline.js` – Laden, Scrollen, Bearbeiten, Importieren
- `web/timeline.css` – Zeitachse und Stundenblätter
- `web/timeline-shadows.js` – dezente Eintrags-Schatten im Kalender

## Unterricht: ausprobieren

1. In `timeline.css` `min-height: 80vh` auf `100vh` ändern.
2. Einen sehr langen Text schreiben und beobachten, wie spätere Stunden
   nach unten rutschen.
3. In `timeline.js` die Funktion `createHourlyPage` suchen.
4. `loadDay` ansehen: Es wird jeweils ein weiterer Tag angehängt.

## Was noch fehlt

- Bestehende alte Tagebucheinträge mit frei positionierten Karten erscheinen
  nicht automatisch auf der neuen zeitlichen Fläche.
- Keine globale Suche, keine Benutzerrechte, kein kollaboratives Bearbeiten.
- Im Zeitpapier noch keine frei verschiebbaren Textblöcke oder Größenänderung.
- Noch keine automatische zeitliche Umrechnung bei Sommerzeitwechsel.
- Noch keine echte TUI oder Android-App.
