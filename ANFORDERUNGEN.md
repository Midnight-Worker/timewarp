# Midnight Organizer – Anforderungskatalog

Stand: 14. November 2026 · Prototyp V4

## Leitidee

Ein geteilter, räumlich erfahrbarer Kalender, der eher wie eine Spielwelt als wie Verwaltungssoftware wirkt. Direkte Manipulation statt Dialogwüsten. Alle Benutzer sind gleichberechtigt.

## Zeitlandschaft und Navigation

- [x] SVG als skalierbare interaktive Arbeitsfläche in pywebview
- [x] Frei verschiebbarer Kamerablick (Pan)
- [x] Feiner stufenloser Mausradzoom zum Mauszeiger
- [x] Feste semantische Stufen: Globus → Jahresdeck → Jahr → Monat → Woche → Tag
- [x] Jeder Monat als horizontaler Tagestreifen mit 28–31 Tagen
- [x] Zwölf Monatsstreifen bilden eine Jahres-Seite
- [x] Fünf verblassende Jahresblätter davor und danach
- [x] Blättern in beliebige vergangene und zukünftige Jahre
- [x] Auswählbare Woche per Nebelrahmen und Pfeiltasten
- [ ] Weiche animierte Kamerafahrten zwischen Ebenen, statt hartem Umschalten
- [ ] Zoomstufen ohne Kamerasprung und mit persistentem geometrischen Fokus
- [ ] Kontinuierliches Streaming/Caching von Jahres- und Kartendaten
- [ ] Echte 2,5D-/3D-Kartenstapel mit räumlicher Tiefe und Animationen
- [ ] Jahresdeck um animierten 3D-Globus mit Zeitzonenbändern

## Globus, Jahreszeiten und Weltzeit

- [x] Globus als äußerste Zoomstufe (schematische SVG-Illustration)
- [x] Jahreskarten in einer umlaufenden Anordnung um den Globus
- [x] Nord-/Südhalbkugel grob mit Sommer-/Wintertönung
- [x] IANA-Zeitzonen pro Benutzer
- [x] UTC-basierte Termindaten; lokale Uhrzeit pro Benutzer angezeigt
- [x] Markierung lokaler Nächte und üblicher Arbeitszeiten im Tagesvergleich
- [x] Optional ein-/ausblendbare Personenspalten
- [ ] Korrekte geographische Land-/Zeitzonenkarte mit genauerem Sonnenstand
- [ ] DST-Sonderfälle beim Erzeugen/Ändern von Terminen (fehlende/doppelte Lokalstunden)
- [ ] Hilfestellung zu überlappenden Arbeitszeiten / Meetingvorschläge
- [ ] Reisezeiten mit Ausgangs- und Zielzeitzone und lokaler Ankunftszeit
- [ ] Vergleich verschiedener lokaler Kalendertage an den Datumsgrenzen

## Kalenderinhalte

- [x] Persönliche, farblich getrennte Einträge
- [x] Titel durch Klick direkt editierbar; beim Blur speichern
- [x] Jahresübersicht mit farbigen Belegungsbalken nach Benutzer
- [ ] Exakte mehrtägige von–bis-Balken auch bei Jahreszoom
- [ ] Minutenraster und präzise Termine-Dauer durch Ziehen ändern
- [ ] Karten per Drag-and-drop zwischen Zeiten, Tagen und Personen verschieben
- [ ] Aufgaben ohne Datum im Vorratsbereich
- [ ] Checklisten, Beschreibungen, Kommentare, Dateien, Zuständigkeiten
- [ ] Undo/Redo für jede Änderung
- [ ] Zoomabhängige Widgets/Checklisten/Datenfelder

## Zusammenarbeit / Clients

- [ ] Benutzerkonten und Gruppen, zunächst gleichberechtigt
- [ ] Gemeinsame und private Kalender / Aufgaben
- [ ] Python FastAPI Server mit SQLite, WebSockets und Echtzeit-Sync
- [ ] Synchronisierung mehrerer Rechner, später Offline-Konfliktbehandlung
- [ ] TUI/CLI zusätzlich zur SVG-Webansicht
- [ ] pywebview Desktop, Browser, später Ionic/Capacitor Android
- [ ] Sicherer Fernzugriff, Rechteverwaltung, Audit-Trail, Backups

## Technischer Richtungsentscheid

SVG + Vanilla JavaScript für Darstellung/Interaktion, Python + pywebview als Desktop-Container. Anschließend FastAPI + SQLite als unabhängige Daten-/Sync-Schicht. Kein unnötiger Build-Prozess.

## Prioritäten als nächstes

1. Tagesansicht: minutengenaues Verschieben und Größe ändern, Zeitzonen-Mehrbenutzeransicht stabilisieren.
2. Animierte Kamera über alle sechs Zoomstufen, kein harter Wechsel.
3. Server-Datenmodell mit UTC-Zeit, IANA-Zeitzonen und Ereignisversionen (Konfliktprüfung).
4. Meeting-Finder für gemeinsame humane Uhrzeiten.
