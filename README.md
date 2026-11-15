**Neu in V19:** Bitte zuerst `WAS-IST-NEU-V19.md` lesen.

Abhängigkeiten unter Windows: `python -m pip install pywebview tzdata`.

# Midnight Organizer V12 – Zeitspuren

Eine spielerische Kalenderwelt mit lesbarem Python/JavaScript/SVG-Code.

## Installation und Start

```bash
pip install pywebview
python main.py
```

Ohne pywebview wird die App im Standardbrowser geöffnet. Lokale Adresse: `http://127.0.0.1:8877`.

## Tagesansicht ausprobieren

1. Oben **Tag** wählen.
2. In der Personenleiste **Stapeln** anklicken oder die Blätter nebeneinander anzeigen.
3. Personenbuttons mit der Maus verschieben, um die Reihenfolge zu verändern.
4. Eine Terminkarte ziehen: Start auf der Minutenskala verändern.
5. Den schmalen unteren Griff der Karte ziehen: Dauer verändern.
6. `Strg+Z` und `Strg+Y` ausprobieren.
7. In Jahr / Monat / Woche mehrtägige **von–bis-Balken** betrachten.

## Zentrale Speicherung

`daten/tagebuch.sqlite3` enthält nun sowohl Tagebuchobjekte als auch den
zentralen Kalenderstand. Kein separater Datenbankserver nötig.

Die Meldung unten zeigt, ob Änderungen gespeichert wurden. Bei gleichzeitigem
Ändern unterschiedlicher Browser wird ein **Versionskonflikt** angezeigt.
Die Benutzerin oder der Benutzer entscheidet, welcher gesamte Stand gilt.

## Wichtige Sicherheitsgrenze

Dies ist ein **lokaler Prototyp**, kein öffentlich erreichbarer Mehrbenutzerserver.
Keine Logins, keine Rechteprüfung, keine HTTPS-Konfiguration. Bitte den Port nicht
ins Internet freigeben. Die vorhandenen fünf Demo-Personen sind bislang nur
Kalenderspuren, keine echten Benutzerkonten.

## Unterricht und Lesbarkeit

- Python: `main.py`, `configuration.py`, `http_routes.py`, `calendar_database.py`, `paper_database.py`
- JavaScript: `web/01-state.js` bis `web/11-day-interaction.js`, jeweils mit einer klaren Aufgabe
- `WAS-IST-NEU-V12.md` erläutert die neuen Module.
- `ZOOM-VERSTEHEN.md`, `CODE-STIL.md`, `PYTHON-VERSTEHEN.md` sind erhalten.

Keine npm-Installation. Keine Build-Pipeline. Lesbare Funktionen und vier Leerzeichen.

## Datenübernahme aus V11

Vor dem Austausch den V11-Ordner, insbesondere `daten/`, sichern. Kopiere bei Bedarf
den bisherigen Ordner `daten/` nach V12. Die Datenbank erhält zusätzliche Tabellen,
vorhandene Tagebucheinträge bleiben unverändert. Für Termine gibt es eine einmalige
Übernahme vom lokalen Browser-Speicher, sofern noch keine zentrale Kalenderrevision
besteht und derselbe Browser verwendet wird.


## V13 – Kalender bearbeiten und Listen führen

Siehe `WAS-IST-NEU-V13.md`. Start unverändert mit `python main.py`.


## V14: Bearbeitung und Wochen-Rechteck
Siehe `WAS-IST-NEU-V14.md`. Einmal klicken: wählen; E: bearbeiten; Entf/X: löschen; Doppelklick auf Karte: bearbeiten. In der Woche aus freiem Feld einen Termin über mehrere Tage aufziehen.

## V15: Zeichnen in jeder Kalenderansicht

Siehe `WAS-IST-NEU-V15.md`. Doppelklick auf leere Kalenderzelle: neuer Termin. Ziehen auf freier Kalenderfläche: Zeitintervall.


## V16: Fortlaufendes Zeitpapier

Beim Hineinzoomen über die Tagesansicht hinaus öffnet sich jetzt das **Zeitpapier**.
Jede Stunde bekommt mindestens 80 % der Fensterhöhe und eine breite Papierseite.
Text darf beliebig wachsen: Der Browser rückt spätere Stunden automatisch nach
unten. Scrollen lädt die vorherigen bzw. folgenden Tage nach.

- **+ Notiz für diese Stunde** erzeugt einen Textblock mit Zeitstempel.
- **Uhrzeit am Block** lässt sich minutengenau ändern (innerhalb geladener Tage).
- **Drag-and-drop auf ein Stundenblatt** importiert Bild, Audio, Video und Dateien.
- **＋ Datei / Foto / Audio** öffnet den Dateidialog für die sichtbare Stunde.
- **Freie Papierablage** wechselt zum älteren frei positionierbaren Tagebuch.
- **← Kalender** kehrt zur Tagesansicht zurück.

Die neuen Einträge werden in SQLite in `timeline_entries` gespeichert; die ältere
Tagebuchsammlung in `paper_items` bleibt **unangetastet**. Bestehende freie
Tagebucheinträge werden noch nicht automatisch auf Stunden verteilt.

In Woche und Tag erscheinen blaugraue Schatten als Hinweis auf neue
Zeitpapier-Einträge. Zurzeit ist das **keine Synchronisierung** zwischen
Terminen und Tagebuch – nur eine visuelle Verbindung.

Zeitzonenhinweis: Das Zeitpapier verwendet in V16 eine lokale Datum/Uhrzeit-
Schreibweise ohne UTC-Offset. In den Übergangsstunden bei Sommerzeitwechsel
ist der Zeitpunkt damit nicht eindeutig. Für den späteren Team-Betrieb
benötigen wir UTC-Zeitstempel plus zugehörige IANA-Zeitzone.

**Noch kein freies Skalieren im Zeitpapier.** Die bisherige freie
Papierablage unterstützt weiterhin Karten mit Größenänderung.


## V17: Zeitpapier mit freien Positionen und Beziehungen

Siehe `WAS-IST-NEU-V17.md`. Bestehende SQLite-Datenbanken werden beim Start um
Positionsfelder und eine Tabelle für Beziehungsbahnen ergänzt. Vor dem ersten
Start bitte den bisherigen `daten/`-Ordner sichern.


## V18 – Kalender und Zeitpapier

Kalendertermine werden auf dem fortlaufenden Zeitpapier als dieselben Entitäten
dargestellt. Im Kalender gibt es rechts den ausklappbaren Vorrat
**Papiernotizen einplanen**. Ziehe eine Notiz auf einen Tag oder eine Uhrzeit.

Details: `WAS-IST-NEU-V18.md`.
