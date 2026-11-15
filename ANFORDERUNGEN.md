# Midnight Organizer – fortlaufende Anforderungen

Stand: 14.11.2026 · V5-Prototyp

## Leitbild

Ein intuitiver, spielerischer, räumlicher Team-Kalender. Kein klassisches Trello-Kanban, sondern eine große zoomfähige Kalenderwelt mit direkter Bearbeitung. Gleichberechtigte Nutzer, flache Datenstruktur, möglichst keine Speichern- oder Bestätigungsdialoge. Tastatur und Maus sind gleichberechtigte Wege.

## Schreibtisch und Ideen sammeln

- [x] Äußerste Ansicht als stilisierter SVG-Schreibtisch
- [x] Sichtbarer Notizblock und Stift
- [x] Notizen im Notizblock anlegen und lokal speichern
- [x] Notiz in Jahr/Monat/Woche auf einen Tag ziehen und als Karte einplanen
- [x] Einplanen per Schaltfläche ins fokussierte Datum
- [x] Zeitung als anklickbares Objekt (bisher nur Platzhalter)
- [ ] Schreibtisch als echtes grafisches 2,5D-/3D-Set mit Animation und Schatten
- [ ] Notizen minutengenau durch Ziehen in Tages-/Stundenansicht positionieren
- [ ] Website-Präsenz über Zeitung öffnen und bearbeiten
- [ ] Notizen frei auf Papier legen, verschieben, verbinden und gruppieren

## Welt, Kalender und Zoom

- [x] SVG-Welt in pywebview, Verschieben und feines Mausrad-Zoomen
- [x] Zoomstufen: Schreibtisch → Globus → Jahresdeck → Jahr → Monat → Woche → Tag
- [x] Schematischer Globus mit Jahreskarten und jahreszeitlichen Farbtönen
- [x] Jahre per Maus auswählen und per Pfeiltasten durchblättern, Enter öffnet Jahr
- [x] 12 waagerechte Monatszeilen à 28/29/30/31 Tage
- [x] 5 verblassende Jahres-Seiten davor und 5 danach (Demodarstellung)
- [x] Datumsnavigation weit über angezeigte Jahre hinaus
- [x] Wochenauswahl per transparentem Rahmen und Pfeiltasten
- [ ] Stufenloses ineinander übergehendes Zooming ohne harte Perspektivsprünge
- [ ] Animierte Kamerafahrten, echte Tiefenwirkung, 3D-Kartenstapel
- [ ] Dynamisches Laden von serverseitigen Ereignissen mit Level of Detail und Caching
- [ ] Reisezeit- und Meetingplanung über Länder hinweg

## Termine, Aufgaben und Personen

- [x] Farbig getrennte Demo-Personen: Berlin, Sydney, New York, Tokio, London
- [x] UTC-Zeitpunkte, IANA-Zeitzonen und lokale Uhrzeitspalten in Tagesansicht (Demo)
- [x] Nacht- und Arbeitszeitbereiche farblich hervorgehoben (Demo)
- [x] Demo-Karten lassen sich inline umbenennen und lokal speichern
- [x] Eigene Person und weitere Personen ein-/ausblenden
- [ ] Personenkalender als frei sortierbare und räumlich stapelbare Tagesblätter
- [ ] Präzise Stunden- und Minutenbearbeitung, Termine mit Ziehgriffen für Dauer
- [ ] Einträge mit von–bis-Balken über Tage/Monate/Jahre
- [ ] Autosave über zentrale API, Undo/Redo, Datenkonflikte transparent lösen
- [ ] Nutzer einladen, Gruppen und Rollen, echte Mehrbenutzer-Synchronisierung
- [ ] Private/gemeinsame Sichtbarkeit, Rechte und Änderungsverlauf

## Papierwelt und Medien (nächste große Ausbaustufe)

- [ ] Bei maximaler Annäherung an eine Stunde wird eine endlose Papierarbeitsfläche sichtbar
- [ ] Kontinuierliche Zeitkoordinaten über Stunden- und Tagesgrenzen hinweg
- [ ] Medienobjekte: Freitext, Karten, Fotos, Links, Audiodateien, Checklisten
- [ ] Drag-and-drop und Autosave auf dieser Fläche
- [ ] Audio (z.B. manuell exportierte WhatsApp-Sprachnachrichten) importieren und abspielen
- [ ] Messenger-Anbindungen später separat planen, mit Berechtigungen/Datenschutz

## Technische Basis

- [x] Vanilla JavaScript + SVG + Python/pywebview, lokal ohne Buildprozess
- [ ] Python FastAPI + SQLite mit Backups
- [ ] WebSockets für geteilte Live-Ansichten
- [ ] Datenspeicherung unabhängig von der Darstellung/Kamera
- [ ] CLI/TUI und spätere Ionic/Capacitor-App auf derselben API
- [ ] Testfälle für DST-Übergänge und internationale Datumsgrenzen

## Priorisierte nächste Schritte

1. Echtes Datums-/Zeitmodell für Aufgaben und stufenübergreifendes Platzieren.
2. Kamerafahrt zwischen Schreibtisch, Globus und Jahresdeck mit sanften Übergängen.
3. Python-Backend mit SQLite statt browsergebundenem localStorage.
4. Endlospapier und Medienablage.
5. Gleichzeitige Benutzung mit individuellen Zeitzonen und Undo/Redo.

## V6: Endlospapier / persönliches Tagebuch (14.11.2026)

- [x] Neue letzte Zoomstufe nach dem Tag: Endlospapier
- [x] Frei bewegbare und zoombare Papierfläche mit Raster
- [x] Einträge werden einem Kalenderdatum zugeordnet; Vor-/Zurückblättern tageweise
- [x] Freitext und importierte Messenger-Textnachrichten als frei positionierbare Objekte
- [x] Dateiablage für Fotos, Audio (z.B. exportierte WhatsApp-Sprachnachrichten), Videos, Word/Excel, PDFs und andere Dateien
- [x] Drag-and-drop vom Desktop und Import über Dateiauswahl
- [x] Bild- und andere Objektkarten per Ecke skalierbar, per Titel verschiebbar
- [x] Audiodateien abspielen, Videos manuell abspielen; GIF-artige stumme Schleife pro Video ein-/ausschalten
- [x] Hyperlinks ablegen und öffnen
- [x] Optional Foto in Rich-Text-Notiz einsetzen und Text darum fließen lassen (links gefloatet)
- [x] Ältere Notizblock-Stichpunkte in das Tagebuch übernehmen (Kopie, Ursprung bleibt erhalten)
- [x] Dateimetadaten, Objekte, Positionen und Texte per lokalem HTTP-API und SQLite speichern, Medien im Dateisystem
- [ ] Bildumfluss per frei definierbarem Polygon und exakt steuerbare Bilder im Text
- [ ] Durchgehende raumzeitliche Papierkoordinaten ohne Tageswechsel (V6 nutzt datumsbezogene Seiten)
- [ ] Geschichten mit Aufgaben/Kalenderkarten fest verknüpfen und zeitlich minutengenau einordnen
- [ ] Automatischer Import von WhatsApp-Chats/Sprachnachrichten via autorisierter Schnittstelle
- [ ] Vollwertige Vorschau/Bearbeitung für Office-Dateien
- [ ] Nutzer-/Rechteverwaltung und gemeinsame Synchronisierung
- [ ] Medien-Thumbnails, Suche, Rückgängig, Backups und Mehrgeräte-Datenaustausch

**Sicherheitsstand:** V6 ist ein lokaler Einzelnutzer-Prototyp; der Python-Server bindet ausschließlich an 127.0.0.1. Kein öffentlicher Betrieb ohne Authentifizierung, Autorisierung und zusätzliche Absicherung.


## V11-Zwischenstand

- [x] Schreibtisch mit 2,5D-Licht, SVG-Schatten, einfachen Animationen (echtes 3D noch offen)
- [x] Notizen durch Ziehen in der Tagesansicht minutengenau einplanen (Prototyp)
- [x] Zeitung öffnet einen lokal gespeicherten Website-Entwurf mit Export (Veröffentlichung offen)
- [x] Papierkarten verbinden und gruppiert verschieben (Beziehungen derzeit nur lokal gespeichert)
- [ ] Echte 3D-Engine und nahtlose Kamerafahrten
- [ ] Synchronisierung von Website-Entwürfen und Papierbeziehungen über den Server


## V12 – Zeitspuren (November 2026)

- [x] Personenblätter in Tagesansicht umsortieren, parallel oder räumlich überlagert anzeigen (lokal)
- [x] Tageskarten minutengenau verschieben und Dauer über Ziehgriff verändern (24-Stunden-Referenztag)
- [x] Farbcodierte von–bis-Balken für mehrtägige Termine in Woche, Monat und Jahr
- [x] Kalenderstand über zentrale lokale SQLite-API speichern, mit Undo/Redo und 409-Konfliktentscheidung
- [ ] Echte Nutzerkonten, Rechte, sichere entfernte Verbindung
- [ ] Feldweises Zusammenführen statt globaler Revisionskonflikte
- [ ] Vollständige Sommerzeit-Kantenfälle und Aufenthalts-/Reisezeitzonen
- [ ] Echte grafische Regressionstests aller Mausaktionen in pywebview


## V13 – Karten und Listen

- [x] Termine mit Titel, Beginn, Ende, Person bearbeiten und löschen
- [x] Termine in Tagesansicht über Tagesgrenzen ziehen (ohne automatisches Umblättern)
- [x] Trello-artige Liste: Enter für nächsten Eintrag, Autosave, Sortierung, Abhaken, Löschen
- [x] Ausklappbare Liste für Drag-and-drop in Kalender
- [ ] Notizliste ebenfalls zentral über API synchronisieren
- [ ] Beim Ziehen automatisch in angrenzende Tage scrollen


## V16 – Fortlaufendes Zeitpapier

- [x] Stunde als mindestens bildschirmhohe Papierseite mit großer linker Zeitleiste
- [x] Automatischer Textüberlauf, weitere Stunden verschieben sich nach unten
- [x] Scroll-Nachladen angrenzender Tage
- [x] Medien und Texte mit Minuten-Zeitstempel in eigener SQLite-Tabelle
- [x] Dezente Tagebuch-Schatten in Wochen- und Tagesansicht
- [ ] Ältere frei positionierte Papierobjekte in gemeinsame Zeitkoordinaten überführen
- [ ] UTC + Zeitzonen für Sommerzeit-Sonderfälle
- [ ] Texte, Bilder und Medien auf dem neuen Zeitpapier frei positionieren
- [ ] TUI und Ionic/Capacitor als weitere API-Clients
