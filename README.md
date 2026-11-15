# Midnight Organizer V9 – Unterrichtsfassung

Diese Version ist eine **Code-Überarbeitung** des bestehenden Midnight Organizers,
keine neue Produktversion mit zusätzlichen Features. Das Ziel ist nicht der kürzeste,
sondern der **verständlichste Quellcode**: saubere Einrückung, aussagekräftige Namen,
kleine Funktionen und nachvollziehbare Kommentare.

## 1. Starten

Mit Python 3:

```bash
python main.py
```

Für ein eigenes Desktopfenster kann zusätzlich pywebview installiert werden:

```bash
pip install pywebview
python main.py
```

Ohne pywebview öffnet sich die Anwendung im Browser unter
`http://127.0.0.1:8877`. Bitte nicht die `index.html` direkt öffnen:
Die Tagebuchdaten und Medien werden über die lokalen Python-HTTP-Routen geladen.

## 2. Was steht wo?

| Datei | Aufgabe |
|---|---|
| `main.py` | Übersichtlicher Programmstart und Desktopfenster |
| `configuration.py` | Port, Pfade, Dateigrößen und öffentliche Web-Dateien |
| `paper_database.py` | Tabellen, Speicherordner und SQLite-Verbindung |
| `http_routes.py` | HTTP-Anfragen, Uploads, Medien und Tagebuch-API |
| `web/index.html` | Grundgerüst der Benutzeroberfläche und SVG-Bühne |
| `web/app.css` | Gestaltung des Schreibtischs, Globus und Kalenders |
| `web/paper.css` | Gestaltung des multimedialen Tagebuchpapiers |
| `web/01-state.js` | Teammitglieder, Datum, Zoomstufe, Kamerazustand |
| `web/02-time.js` | Zeitzonenumrechnung |
| `web/03-storage.js` | Termine und Schreibtischnotizen im `localStorage` |
| `web/04-svg-utils.js` | Wiederverwendbare SVG-Zeichenfunktionen |
| `web/05a-desktop.js` | Schreibtisch, Notizblock, Stift, Zeitung |
| `web/05b-globe.js` | Erde, Jahreszeitenfarbe, umlaufende Jahresblätter |
| `web/05c-year.js` | Jahresansichten, Jahresstreifen und farbige Terminindikatoren |
| `web/05d-month.js` | Monatsansicht und Auswahl einer Kalenderwoche |
| `web/05e-week.js` | Siebentägige Wochenansicht mit Terminkarten |
| `web/05f-day.js` | Tagesansicht, Benutzer-Spalten und Zeitzonen |
| `web/06-camera.js` | SVG-viewBox, Zoomstufen, Kamera und Ansichtswechsel |
| `web/07-input.js` | Maus, Tastatur, Karten verschieben, Zoomen |
| `web/08-start.js` | Schaltflächen, Start und Notizblock-Ereignisse |
| `web/paper.js` | Tagebucheinträge, Editor, Medien und Papierkamera |

Die JavaScript-Dateien sind bewusst **klassische Skripte in fester
Reihenfolge**. Kein npm, kein Bundler, kein JavaScript-Framework.
Dadurch teilen sie sich noch globale Variablen. Für dieses Lernprojekt ist
das nachvollziehbar, langfristig wäre eine klar definierte Modulschnittstelle
besser.

## 3. Wohin mit meinen bisherigen Daten?

Diese V9 benutzt weiterhin dieselben Speicherformate wie V6/V7:

- `localStorage` mit den Schlüsseln `midnight.timeplanet.v4` und
  `midnight.notes.v5` für Kalenderkarten und Schreibtischnotizen
- `daten/tagebuch.sqlite3` für die Tagebuchobjekte
- `daten/medien/` für importierte Bilder, Videos, Word- und andere Dateien

**Wichtig:** `localStorage` hängt unter anderem an der URL und am verwendeten
Browserprofil. Die Daten im Browser unter einer anderen Portnummer oder im
pywebview-Profil können sich unterscheiden. Diese V8 ist noch keine
Mehrbenutzer-Synchronisierung.

Vor einem Versionswechsel deshalb bitte Datenordner, altes Projekt und
gegebenenfalls den bisherigen Browserprofilspeicher sichern.

## 4. In welcher Reihenfolge sollte ich den Code lesen?

1. `01-state.js` – Welche Daten hat unsere Anwendung?
2. `04-svg-utils.js` – Wie zeichnet man einen Text oder ein Rechteck in SVG?
3. `05a-desktop.js` – Aus mehreren SVG-Formen entsteht ein Schreibtisch.
4. `06-camera.js` – Welchen Ausschnitt der Welt sehen wir?
5. `07-input.js` – Wie verändert das Mausrad die Kamera?
6. `05c-year.js` bis `05f-day.js` – Wie erzeugen wir 365 Tage und ihre Termine?
7. `03-storage.js` – Wie werden Änderungen gespeichert?
8. `paper.js` und `main.py` – Wie arbeiten Weboberfläche und Python zusammen?

Die zugehörige Lektion steht in **`ZOOM-VERSTEHEN.md`**.

## 5. Was ist noch nicht fertig?

Dies ist weiterhin ein **lokaler Prototyp**. Es fehlen unter anderem eine
Mehrbenutzerdatenbank, Rechteverwaltung, Konfliktlösung, Undo, echte
3D-Kamerafahrten, ein durchgehendes zeitübergreifendes Endlospapier und
automatische WhatsApp-Integration. Die Globusgrafik ist schematisch.

Die Funktion `convertLocalTimeToUtc()` verwendet eine einfache iterative
Umrechnung. Bei doppelt vorkommenden oder ungültigen Uhrzeiten während der
Sommerzeitumstellung braucht die spätere Anwendung eine explizite Regel.

## 6. Teststatus dieser V9

- Python-Quellcode wurde mit `compileall` geprüft.
- Sämtliche JavaScript-Dateien bestehen `node --check`.
- Der lokale HTTP-Server wurde gestartet; HTML und JavaScript wurden
  erfolgreich geladen.
- Die Tagebuch-API wurde mit Abruf, Anlegen und Löschen eines
  Testeintrags geprüft.
- Ein vollständiger Browser-Regressionstest konnte in der Testumgebung
  **nicht** ausgeführt werden: Chromium blockiert dort den Seitenaufruf.
  Daher sind insbesondere die neu getrennten Kalenderdateien noch
  praktisch im Browser und im pywebview-Fenster zu überprüfen.

## 7. Was ist in V9 neu?

Die bisher 368 Zeilen lange `main.py` wurde in vier Python-Dateien
getrennt. Python-Methodennamen in der HTTP-Schnittstelle beschreiben
jetzt direkt, was sie tun. Aus kurzen Ausdrücken wurden teilweise
benannte Zwischenschritte. Die vier Kalenderansichten wurden in eigene Dateien getrennt.
Einige lokale Zeichenkoordinaten heißen nun beispielsweise
`dayColumnLeft`, `laneLeft` oder `laneTop`. Gemeinsame Funktionsaufrufe
und Speicherschlüssel bleiben unverändert.

**Wichtig:** Ein kurzer Variablenname in einer mathematischen Formel
ist nicht zwingend schlecht. Einsteiger sollen aber erkennen können,
was er bedeutet. Siehe `CODE-STIL.md`.

Dies ist ein Refactoring, keine neue Funktionsversion.
