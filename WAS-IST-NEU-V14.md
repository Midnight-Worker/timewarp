# V14 – Termine auswählen, bearbeiten und zeichnen

## Tasten und Maus

- **Klick** auf einen Termin: auswählen (gelber Rahmen).
- **E**: ausgewählten Termin bearbeiten.
- **Entf** oder **X**: ausgewählten Termin löschen (Strg+Z: rückgängig).
- **Doppelklick** auf einen bestehenden Termin: Editor öffnen.
- **Doppelklick** auf freie Fläche: bisheriges Verhalten beibehalten.
- **Woche:** Auf leerem Tagesfeld drücken und über mehrere Tagesfelder ziehen: neuer ganztägiger Zeitraum; danach öffnet sich der Editor.
- **Tag:** Ein fortgesetzter Termin ragt links bzw. rechts über den Kartenrand und bekommt einen Hinweis.

## Quellcode

- `07-input.js`: unterscheidet Karte, freie Fläche und Tastaturbefehle.
- `14-appointment-selection.js`: Auswahl, Bearbeiten und Löschen.
- `15-week-drawing.js`: Rechteck-Vorschau und Zeitraum mit echtem Anfang/Ende.
- `05e-week.js`: mehrtägige Balken mit Fortsetzungsmarkierung.
- `05f-day.js`: Karten mit Randhinweisen für Vortag und Folgetag.

## Stand

Der Wochen-Rechteckmodus erzeugt ganztägige Termine; Feinzeiten lassen sich anschließend im Editor ändern. Bei Sommerzeitwechseln wird die Dauer aus tatsächlichen UTC-Zeitpunkten berechnet. Die SVG-Vorschau und das native pywebview-Verhalten müssen praktisch getestet werden. Bestehende Daten unbedingt sichern.
