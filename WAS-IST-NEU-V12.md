# V12 – Zeitspuren: Veränderungen zum Lernen

Diese Version ergänzt V11, ohne npm oder zusätzliche JavaScript-Frameworks.

## 1. Tagesblätter sortieren und stapeln

- `web/01-state.js`: `teamMemberOrder` beschreibt die Reihenfolge der Personen.
- `web/06-camera.js`: Personenschaltflächen per Drag-and-drop sortieren.
- `web/05f-day.js`: Mit **Stapeln / Nebeneinander** die Darstellung umschalten.
- In der Stapelansicht liegt das erste Blatt vorne. Hintere Blätter können über die Personenleiste nach vorn gezogen werden.
- Reihenfolge und Sichtbarkeit sind bislang **persönliche lokale Anzeigeeinstellungen**.

## 2. Minutengenaue Tagesbearbeitung

- `web/11-day-interaction.js` rechnet eine Mausposition in Minuten um.
- In der Tagesansicht die Karte ziehen, um den Beginn zu ändern.
- Den farbigen Griff am Kartenende ziehen, um die Dauer zu ändern.
- Ein Termin kann durch Ziehen einer anderen Person zugeordnet werden.
- Die Mindestdauer ist eine Minute.
- WICHTIG: Die Tagesdarstellung verwendet eine 24-Stunden-Referenzachse. Am Umstellungstag der Sommerzeit (23 bzw. 25 reale Stunden) fehlen noch spezielle Regeln für doppelte/ausfallende Uhrzeiten.

## 3. Zeitbalken über mehrere Tage

- `web/05c-year.js`, `05d-month.js`, `05e-week.js` zeigen sichtbare Ausschnitte mehrtägiger Termine.
- Ein langer Zeitraum wird an Monats- und Jahresgrenzen grafisch fortgesetzt.
- Farben entsprechen den Personen. Die oberste Spur gehört standardmäßig dem eigenen Benutzer.
- Die Balken sind eine neue Darstellung derselben Termine, keine zusätzlichen Datensätze.

## 4. Zentrales Speichern, Undo und Konflikte

- `calendar_database.py` verwaltet die gemeinsame Kalenderliste in SQLite.
- `http_routes.py`: `GET /api/calendar` und `PUT /api/calendar`.
- `web/10-calendar-sync.js`: Speichern, Undo/Redo, Konfliktanzeige, Hintergrundabfrage.
- Jede abgeschlossene Änderung wird automatisch gespeichert.
- `Strg+Z` und `Strg+Y` oder die Pfeilbuttons machen Änderungen rückgängig/wiederholen sie.
- Wenn ein zweiter Client mit einem alten Revisionsstand speichern will, sendet der Server HTTP **409** mit dem aktuellen Stand. Du entscheidest zwischen **Serverstand laden** und **eigene Änderungen ausdrücklich überschreiben**.
- Etwa alle 10 Sekunden fragt der Browser nach Änderungen anderer Clients.
- Das Versionsmodell ist bewusst einfach: **ein gemeinsamer Stand für alle Termine**, noch kein feldweises Zusammenführen. Bei Konflikten werden Änderungen nicht automatisch verschmolzen.
- Die lokale Browser-Sicherung bleibt als Rückfall erhalten.
- Ein alter lokaler Kalender wird nur beim ersten Start auf einen noch leeren zentralen Kalender übertragen.

## Einschränkungen

Die Anwendung lauscht weiterhin absichtlich nur auf `127.0.0.1`. Es gibt noch **keine Benutzeranmeldung, Benutzerberechtigungen oder abgesicherten externen Zugriff**. Die Demo-Personen sind keine authentifizierten Konten. Die SQLite-Kalenderdaten werden erst mit einem gemeinsamen Server für mehrere Clients gemeinsam sichtbar. Vor einer Veröffentlichung im Heimnetz oder Internet müssen Authentifizierung, Autorisierung, Sicherung und Transportverschlüsselung ergänzt werden.

Die bisherige Endlospapier-Speicherung bleibt davon getrennt.
