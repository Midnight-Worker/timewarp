# Midnight Organizer V19 – Gemeinsames Graphpapier

## Wofür ist welche Ansicht da?

- **Kalender**: Zeitpunkt und Dauer von Terminen. Zeitpapiernotizen erscheinen als
  dezente violette Gedankenblasen, nicht als vollständige Textkarten.
- **Zeitpapier**: Chronologischer Stundenablauf. Hier stehen Zeitpunkt,
  Inhalte und Medien; Verbindungen werden dort nicht mehr gezeichnet.
- **Freies Endlospapier**: Hier liegen die echten Kalendertermine,
  Zeitpapiernotizen, Bilder und sonstigen Dateien als frei verschiebbare
  Knoten. Runde Anschlüsse erlauben Beziehungen und Abhängigkeiten.

## Bedienung

1. Im Kalender nah an einen Tag zoomen → Zeitpapier.
2. **Freies Endlospapier** wählen → freie Fläche mit Knoten.
3. Karten am Kopf verschieben, Bildkarten sind direkt sichtbar.
4. Runde Anschlussfläche ● an einer Karte auf eine andere ziehen.
5. Vorher zwischen **Beziehung** und **Abhängigkeit** auswählen.
6. **Linien entfernen** verwaltet bestehende Verbindungen.
7. Dateien wie `.docx`, `.xlsx`, `.dxf`, `.pdf`, Bilder und Audio auf
   das freie Endlospapier ziehen. Die Datei wird als Kopie in
   `daten/medien` gespeichert. Unbekannte Dateiformate erscheinen
   als anklickbarer Download, nicht als Vorschau.

## Daten und Grenzen

- Ein Termin liegt weiterhin nur in `calendar_state` (SQLite).
- Zeitpapiernotizen liegen in `timeline_entries` (SQLite).
- Freie Datei- und Bildkarten liegen in `paper_items` (SQLite).
- Verbindungen/Graphpositionen liegen in `graph_connections` und
  `graph_positions` (SQLite).
- Es gibt weiterhin eine alte, separate Gruppierungsfunktion für reine
  Papierobjekte. Die neuen Beziehungen werden zentral gespeichert.
- V19 stellt den Graphen **pro gewähltem Datum** dar. Linien über
  verschiedene, noch nicht gemeinsam geladene Tagesflächen sind ein
  späterer Ausbauschritt.
- Die Darstellung von Zeitpapiernotizen im Kalender verwendet vorerst
  eine Gedankenblase mit Anzahl, keine Einzelüberschrift.
- Nicht alle Dokumente lassen sich inline anzeigen; die Originaldateien
  bleiben als herunterladbare Kopien verfügbar.

## Neue Dateien

- `graph_database.py`: SQLite-Positionen und Kanten.
- `graph_routes.py`: HTTP-API für Knoten und Beziehungen.
- `web/free-paper-graph.js`: Zeichen- und Drag-and-drop-Logik.
- `web/timeline-shadows.js`: Gedankenblasen im Kalender.

**Code-Stil:** vier Leerzeichen, kleine Funktionen, sprechende Namen.
