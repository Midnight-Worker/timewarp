# TUI und Android – der gemeinsame Weg

Unsere wichtigste Architekturregel: **Die Oberfläche enthält keine Geschäftslogik.**
Die Termin- und Tagebuchdaten kommen aus dem Python-Server.

```text
                Python-Server (API)
               /         |        \
       Browser /       TUI/CLI     Android
        pywebview       Textual    Ionic + Capacitor
```

## 1. TUI zuerst, klein und nützlich

- Ein neues Verzeichnis `clients/tui/` genügt.
- `Textual` ist für eine interaktive Terminaloberfläche geeignet.
- Für einfache Befehle reicht sogar Pythons `argparse` ohne externe Bibliothek.
- Die TUI nutzt dieselben `/api/calendar`- und `/api/timeline`-Routen.
- Zunächst: Heute, Woche, Termine, Aufgabenliste, Tagebuch-Einträge.
- Kein SVG oder Drag-and-drop in der TUI nötig: Tastatursteuerung gehört hier hin.

## 2. Android mit Ionic und Capacitor

- Ionic stellt die mobilen Oberflächen bereit; JavaScript ruft die gleiche API auf.
- Capacitor verpackt das Webfrontend für Android und bietet Gerätefunktionen.
- Ein grob auf eine Desktop-Webview zugeschnittenes Interface ist nicht
  automatisch eine gute mobile Oberfläche. Daher eigene Handy-Navigation,
  aber ein gemeinsames Datenmodell.
- Später: Kamera, Dateiauswahl, Sprachnachrichten, Push-Benachrichtigungen.

## 3. Vor einem Zugriff aus anderen Geräten

Der jetzige Server ist absichtlich nur an `127.0.0.1` gebunden und hat keine
Benutzeranmeldung. **Nicht einfach den Port ins Internet öffnen.**

Für Team-Betrieb brauchen wir zuerst Benutzerkonten, HTTPS, Sitzungen,
Autorisierung pro Objekt, Backup und klare Konfliktregeln. Ein privates VPN
kann danach beim sicheren Erreichen des Servers helfen.

## 4. Datenmodell vervollständigen

In V16 verwenden Termine, alte freie Papierobjekte und das neue Zeitpapier
noch unterschiedliche Tabellen. Künftig brauchen wir eine gemeinsame
Zuordnung zu Benutzern, Projekten und einem absoluten Zeitpunkt (UTC),
plus originale Zeitzone und Darstellungszeit.

Der neue Zeitpapier-Prototyp verwendet vorerst lokale Datums-/Zeitangaben.
Bei einer doppelten Stunde während der Winterzeitumstellung ist das nicht
eindeutig. Das muss vor internationalen Teamkalendern korrigiert werden.
