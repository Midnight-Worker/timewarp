# V11 – Die Zeitwerkstatt

## Neue Funktionen

1. **Schreibtisch:** mehr Licht, Schatten, leichte Animation und Hover-Hinweise. Technisch bewusst **2,5D-SVG**, keine echte 3D-Engine.
2. **Minutengenaues Einplanen:** Eine Notiz aus dem Notizblock kann auf die Tagesansicht gezogen werden. Die Y-Position wird in Minuten umgerechnet; die Person wird aus der Spalte bestimmt. Die Spalten teilen sich eine gemeinsame absolute Zeitachse. Für Zeitumstellungen gelten noch die Grenzen des bisherigen Zeitzonenmodells.
3. **Zeitungs-Redaktion:** Zeitung anklicken → Titel, Einleitung und Text bearbeiten → automatische lokale Speicherung → HTML-Entwurf herunterladen. **Nicht** automatisch auf der echten Website veröffentlichen.
4. **Papier verbinden & gruppieren:** Strg+Klick auf zwei Kartentitel, dann **Verbinden**. Für Gruppen zwei oder mehr Karten auswählen und **Gruppieren**. Beim Ziehen eines Gruppenmitglieds bewegen sich alle mit. **Gruppe lösen** trennt die ausgewählten Karten.

## Speicherorte

- Kalendereinträge, Notizen, Website-Entwurf und **Papierbeziehungen**: Browser-`localStorage`.
- Tagebuchobjekte und deren Positionen: SQLite.
- Medien: `daten/medien/`.

**Wichtig:** Die Gruppen- und Verbindungslinien sind derzeit nur im jeweiligen Browserprofil gespeichert. Für echte Mehrbenutzer-Synchronisation müssen diese Beziehungen später ebenfalls in die Serverdatenbank.

## Architektur / Codequalität

- Jede neue Funktion hat eine eigene Datei.
- 4 Leerzeichen, explizite Variablennamen, keine neuen Abhängigkeiten.
- Die bestehende SQLite-Datei wird nicht verändert.
- `main.py` und die bestehenden APIs bleiben erhalten.
