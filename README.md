# Midnight Organizer V5 – Der Schreibtisch

Ein experimenteller, lokaler SVG-Kalender für pywebview mit einer Schreibtisch-Startansicht, Notizblock, Zeitplanet, Jahresdeck und Kalenderansichten. Ohne npm oder Buildprozess.

## Start

```bash
pip install pywebview
python main.py
```

Alternativ `index.html` direkt in Chrome/Chromium öffnen. Es wird noch **kein Server** gestartet.

## Neu in V5

- Neue äußerste Zoomstufe **Schreibtisch**: Planet, ein anklickbarer Notizzettel, Stift und Zeitung.
- **Notizblock**: Freitext schreiben, Enter zum Anlegen, dauerhaft im lokalen Browserprofil gespeichert (localStorage).
- **Notizen einplanen**: Im Notizblock `Heute` klicken (gewähltes Kalenderdatum) oder den Notiztext in Jahr-, Monats- oder Wochenansicht auf einen Tag ziehen. Beim Planen wird die Notiz aus der Sammlung entfernt.
- **Globus**: Jahreskarten anklicken; ausgewähltes Jahr hervorgehoben. Pfeiltasten links/rechts wählen Jahre, Enter öffnet Jahresdeck.
- **Zeitung**: Interaktive Attrappe, später Verbindung zur Website-Verwaltung.

## Bedienung

| Aktion | Bedienung |
|---|---|
| Ansicht wählen | Buttons oben (Schreibtisch, Globus, Jahresdeck usw.) |
| Zoomen | Mausrad über der Kalenderwelt, in kleinen Schritten |
| Kamerablick verschieben | Leere Fläche ziehen |
| Auf den Globus | Planet auf dem Schreibtisch anklicken |
| Jahr wechseln | Globus: `←` / `→` oder Jahreskarte anklicken |
| Jahr öffnen | Globus: `Enter` (oder Jahr anklicken) |
| Notiz öffnen | Schreibtisch: Papier anklicken oder Button oben rechts |
| Notiz erfassen | Im Notizblock tippen, `Enter` oder `+ Notiz hinzufügen` |
| Notiz einplanen | Auf Kalendertag ziehen (Jahr / Monat / Woche), oder `Heute` klicken |
| Karte bearbeiten | Karte anklicken, Text ändern, außerhalb klicken |
| Ansicht zurück | `Esc` |
| Jahr/Monat/Woche/Tag vor/zurück | `Bild ↓` / `Bild ↑` bzw. Pfeiltasten |

## Einschränkungen

**Dies ist ein Bedienprototyp, kein gemeinsamer Produktivkalender.** Die Notizen und Termine liegen nur in `localStorage` dieses Browserprofils. Andere PCs teilen diese Daten nicht. Es gibt noch keine Anmeldung, Synchronisierung, Backups, echte Website-Bearbeitung oder freie Multimedia-Papierwelt. Planen aus der Sammlung erzeugt zunächst einen 60-Minuten-Termin um 10 Uhr Berliner Zeit. Die Zeit- und Zeitzonenansichten aus V4 sind weiterhin als Demo vorhanden. Keine Animationen oder WebGL-3D.

Wenn du das lokale Browserprofil löschst, gehen die Demo-Änderungen verloren. Vor produktiver Benutzung entwickeln wir FastAPI/SQLite mit Datensicherung.
