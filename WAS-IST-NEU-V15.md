# V15 – Termine in jeder Zoomstufe zeichnen

## Bedienung

- **Doppelklick auf eine freie Kalenderzelle:** Einen Termin anlegen und den Editor öffnen. Gilt für Jahresdeck/Jahr, Monat, Woche und Tag.
- **Linke Maustaste auf einer freien Kalenderfläche gedrückt halten und ziehen:** Einen Zeitraum aufziehen. Nach dem Loslassen wird ein einziger Termin mit Anfang und Ende erzeugt.
- **Jahr / Monatsansicht / Wochenansicht:** Auswahl wird auf ganze Kalendertage gerundet. Auch über Monatsgrenzen hinweg ist das Aufziehen innerhalb eines Jahres möglich.
- **Tag:** Die senkrechte Ziehstrecke bestimmt die Minuten. Bei stärkerem Zoom beträgt die Rasterung 1 Minute, sonst 5 oder 15 Minuten.
- **Doppelklick auf eine bestehende Karte:** Editor öffnen, ohne einen neuen Termin zu erstellen.
- **Einfacher Klick:** Karte auswählen; **E:** bearbeiten; **Entf/X:** löschen.
- **Karten ziehen:** Bestehende Termine verschieben. **Auf leerem Hintergrund außerhalb der Kalenderzellen ziehen:** Kamera verschieben.

## Grenzen

Das Ziehen zwischen verschiedenen *angezeigten* Wochen oder Jahren mit automatischem Umblättern ist noch nicht integriert. Das geht über den Editor. Eine Jahres- oder Monatsansicht mit weiterem Zoom zeigt aktuell weiterhin Tageszellen (kein eigenes Stundenraster). Die erste Minute-Rasterung richtet sich nach der Tages-Zoomstufe. Bei Kalenderwochen und Monaten ist die Vorschau ein einfacher Begrenzungsrahmen, auch wenn die Auswahl mehrere Zeilen berührt.

## Unterrichtscode

`web/15-time-drawing.js` enthält die Zeitintervall-Berechnung; `web/07-input.js` ruft die gemeinsamen Funktionen auf. Die Datei wurde für besser verständliche Namen in `15-time-drawing.js` umbenannt.
