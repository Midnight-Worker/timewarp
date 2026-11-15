# V17 – Zeitpapier und Beziehungsbahnen

Die beiden bisherigen Papierkonzepte werden über das **Zeitpapier** zusammengeführt:

- Die **linke Zeitleiste** benennt das Datum und jede Stunde.
- Jedes Stundenblatt ist eine **frei belegbare Arbeitsfläche**.
- Karten lassen sich am Kopf auf dem Blatt verschieben; ihre Position bleibt in SQLite gespeichert.
- Jede Stunde wächst, wenn Karten weiter unten liegen oder durch lange Texte höher werden.
- Ein Punkt links auf dem Kartenkopf dient als **Verbindungsgriff**: zum Punkt einer anderen Karte ziehen.
- Im oberen Menü zwischen **Beziehung** (durchgehende Linie) und **Abhängigkeit** (gestrichelter Pfeil) wählen.
- Verbindungen werden in SQLite gespeichert, ebenso die Kartenpositionen.
- Verbindungen zwischen verschiedenen Stunden sind erlaubt; die Bahn wird angezeigt, sobald beide Endpunkte geladen sind.
- Die frühere frei positionierbare Papieransicht bleibt als **Altes Papier** erreichbar, solange ihre Daten nicht migriert sind.

## Wichtig: Grenzen

- Die Verbindungslinien sind auf dem Bildschirm sichtbar, wenn beide Karten geladen sind; sie werden nicht durch aktuell ausgelagerte Tage hindurch gerendert.
- Noch keine automatische Ordnung oder Kollisionserkennung für frei platzierte Karten.
- Die alten freien Tagebuchobjekte sind **noch nicht in die neue Zeitachse migriert**. Sie sind weiter separat erreichbar.
- Die auf der linken Seite angezeigten Stunden sind lokale Stunden (inklusive der bekannten Einschränkungen bei Sommerzeitumstellung).
- Kein Benutzer-Login / keine externe Freigabe des Servers.

## Wichtig für Lernzwecke

- `web/timeline.js`: Stundenblätter und Einträge.
- `web/timeline-board.js`: Verschieben, Kurven und Verbindungsgesten.
- `web/timeline.css`: Anordnung und frei positionierte Elemente.
- `timeline_database.py`: Positionsspalten und Beziehungstabelle.
- `timeline_routes.py`: HTTP-API für Zeitpapier und Verbindungen.
