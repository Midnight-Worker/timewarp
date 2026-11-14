# Midnight Organizer · Zeitplanet V4

## Start

```bash
pip install pywebview
python main.py
```

Oder `index.html` im Browser öffnen. Das Projekt benötigt keine JS-Pakete und lädt keine CDNs.

## Bedienung

- **Globus**: Jahresblätter schweben schematisch um die Erde; per Klick auf Jahreskarte öffnen
- **Mausrad**: langsameres, stufenloses Zoomen um den Zeiger, nach größeren Schritten Übergang zur nächsten Ansicht
- **Leere Fläche ziehen**: Kamera bewegen
- **Ansichtsschalter**: Globus, Jahresdeck, Jahr, Monat, Woche, Tag
- **← / →**: Im Monat die Woche auswählen, sonst den Zeitraum wechseln
- **Enter**: markierte Woche öffnen
- **Bild ↑ / Bild ↓**: vorheriger / nächster Zeitraum
- **Esc**: eine Ansicht zurück
- **Personen-Schaltflächen**: Benutzeransichten ein-/ausblenden (eigene Ebene bleibt)
- **Karte klicken**: Titel direkt bearbeiten, mit Blur automatisch speichern
- **Doppelklick in Tagesansicht**: neue Karte erzeugen

## Was V4 demonstriert

- Jahresdeck mit 5 Jahren davor und danach, neu erzeugt bei Navigation
- Schematischer Globus, Nord-/Südhalbkugel mit jahreszeitlichen Farbtönen
- Farbliche Benutzer-Zeitspuren auf Jahresblättern
- Wochenrahmen und Kartendarstellung
- Einblendbare Benutzer-Spalten im Tag; Berlins Zeitraster dient als gemeinsamer absoluter Referenzrahmen
- Echte Zeitzonenkonvertierung über `Intl.DateTimeFormat` und IANA-Zonen (Europa/Berlin, Australia/Sydney, America/New_York, Asia/Tokyo, Europe/London)
- Nächte und Arbeitszeiten 09–17 Uhr werden in jeder Benutzerzone verschieden schattiert
- Karten werden mit UTC-Zeitstempeln gespeichert (lokal im jeweiligen Browserprofil)

## Bewusste Grenzen

- SVG-Globus ist ein stilisiertes Diagramm, keine exakte Karte mit Zeitzonen-Grenzen.
- Jahreszeiten folgen einer groben Monatsregel, keine meteorologische Echtzeitdarstellung.
- Der Prototyp ist **kein** Multiuser-Backend: Personen sind Demo-Nutzer, Karten liegen nur in `localStorage`.
- Kein Team-Login, Server, Remote-Sync oder Undo.
- Es gibt im Tagesraster noch keine Drag-and-drop-Uhrzeitbearbeitung, keinen Minutensnap, keine DST-Fold-/Gap-Auswahl und keinen abgestimmten Meetingfinder.
- Die Tagesansicht verwendet **eine gemeinsame Berliner Zeitachse**. Andere Spalten zeigen für dieselben absoluten Zeitpunkte lokale Uhrzeiten an. So stimmen die horizontalen Zeiten real überein.

Siehe `ANFORDERUNGEN.md` für Konzept, offene Fragen und Roadmap.
