# Midnight Organizer V13 – Termine und Aufgabenlisten

## Termine

- Karte anklicken: Termindialog mit Titel, Beginn, Ende und Person.
- Änderungen werden beim Verlassen der Felder gespeichert.
- Im Dialog „Termin löschen“ verwenden. Danach ist Strg+Z möglich.
- In der Tagesansicht über den oberen/unteren Rand ziehen: Start kann in den vorherigen oder nächsten Tag fallen. Ein langer Termin wird an Tagesgrenzen in allen betroffenen Ansichten dargestellt.
- In der Wochen- oder Monatsansicht auf einen anderen Tag ziehen, um das Datum zu wechseln.

## Listen

- Auf dem Schreibtisch den Notizblock öffnen; oder rechts oben „Listen“.
- Enter in einer Zeile speichert den Text und öffnet die nächste Zeile.
- Anfasser ⠿ einer Zeile auf einen anderen Eintrag ziehen, um zu sortieren.
- Häkchen setzen, bearbeiten oder mit × löschen.
- Die ausklappbare Aufgabenleiste bleibt im Kalender sichtbar. Dort Aufgaben auf den Tag ziehen.
- In der Tagesansicht die Aufgabe auf die Uhrzeit einer Person ziehen.
- Beim erfolgreichen Einplanen verschwindet die Aufgabe aus dem Notizblock und wird zum Kalendertermin.

## Daten und Grenzen

- Kalender: SQLite und Versionskonflikte über /api/calendar.
- Notizblock: weiterhin localStorage – **noch keine gemeinsame Team-Synchronisierung**.
- Während eines langen Mauszuges über die Tagesgrenze kann der Start in den Nachbartag wechseln. Ein automatischer Kamerawechsel zum anderen Tag ist noch nicht umgesetzt.
- Der Termineditor verwendet die lokale Zeitzone des ausgewählten Benutzers. Besondere Sommerzeit-Doppelstunden sind weiterhin ein offener Punkt.

## Lernmodule

- `web/12-appointment-editor.js`: Datum/Uhrzeit bearbeiten, löschen.
- `web/13-notepad.js`: Eingaben, Sortieren, Abhaken, Ziehen.
- `web/11-day-interaction.js`: Mauskordinaten in Minuten umrechnen.
