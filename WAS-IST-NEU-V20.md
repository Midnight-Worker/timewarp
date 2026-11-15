# V20 – Fensterverwaltung

Die bisherigen festen Overlays verdeckten sich häufig gegenseitig.

- `Personenkalender`, `Listen und Aufgaben` und `Papiernotizen` sind frei verschiebbar.
- Auch der `Notizblock` ist über die Ansichtsliste erreichbar.
- Klick auf ein Fenster: nach vorne (`z-index`).
- Titelleiste ziehen: freie Bildschirmposition.
- `−` minimieren, `×` schließen, `▦ Ansichten` erneut öffnen.
- Doppelklick Titel: rechts andocken / lösen. Shift+Doppelklick: links andocken.
- Einstellungen werden im **lokalen Browserprofil** gespeichert; nicht serverseitig.
- Kalenderzoom, Datenbank, Graph und Zeitpapier bleiben unverändert.

## Unterrichtscode

`web/window-manager.js`: Suche zuerst `bringToFront`, `positionWindow`,
`attachDragging`, `saveLayout`. Diese Funktionen zeigen Fenstermanagement
mit einfachen DOM-Ereignissen und CSS.

## Teststand

Syntaxprüfung und lokaler HTTP-Test der neuen Dateien. Browserinteraktionen
werden separat überprüft; pywebview Windows wurde nicht direkt getestet.
