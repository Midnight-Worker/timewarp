# Teststand V19

Erfolgreich geprüft:

- Python-Syntax (compileall)
- JavaScript-Syntax für sämtliche Webmodule (node --check)
- SQLite-Unit-Test für Zeitpapiernotiz + Kalendertermin + gemeinsame Graphbeziehung
- API-Test für Graphknoten, Positionen und Verbindungen (lokaler Python-HTTP-Server)
- Browser-JavaScript-Rendertest mit simulierten API-Antworten:
  zwei Knoten, eine Abhängigkeitslinie, keine JavaScript-Laufzeitfehler

Noch nicht vollständig geprüft:

- Echte pywebview-Desktop-Gesten mit Drag-and-drop (der Testbrowser blockiert den lokalen HTTP-Zugriff)
- Sämtliche Mediendateitypen, insbesondere exotische Formate wie DXF
- Echtes End-to-End-Ziehen von Verbindungspunkten im Desktopfenster

Die vorhandenen V18-Datentabellen bleiben erhalten. Neue Tabellen werden ergänzend angelegt.

**Hinweis:** Der Python-Server ist weiterhin eine lokale Anwendung ohne Benutzeranmeldung. Nicht ungeschützt ins Internet stellen.
