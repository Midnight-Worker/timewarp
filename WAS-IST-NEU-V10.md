# V10 – Behutsam vereinfachen

Diese Version baut auf **V9** auf, ohne die Kalenderdaten zu ändern.

## 1. main.py

Die drei Schritte sind klar getrennt:

1. `start_application()` bereitet Daten und lokalen Server vor.
2. `open_application_window()` öffnet pywebview (oder den Browser).
3. `wait_until_keyboard_interrupt()` hält die Browserfassung offen.

Für die Unterrichtsstunde kann man diese Funktionen nacheinander lesen.

## 2. paper-network.js (neu)

Alle HTTP-Anfragen des Tagebuchs liegen nun hier. So kann man am Netzwerkcode lernen,
ohne gleichzeitig die Darstellung der Papierobjekte verstehen zu müssen.

- `loadEntries(dateString)` – Einträge eines Tages laden
- `saveEntry(entry)` – Eintrag speichern
- `deleteEntry(entryId)` – Eintrag löschen
- `uploadMedia(file)` – Datei hochladen
- `checkResponse(response)` – Fehler auswerten

`paper.js` kümmert sich darum, **was** angezeigt und verändert wird;
`paper-network.js` darum, **wie** es gespeichert wird.

## 3. Lesbarere Namen

Beispiele: `activeDragOperation`, `nestedDragCounter`,
`createEntryIdentifier()`, `renderItemContent()`, `handlePaperZoom()`.

In `handlePaperZoom()` heißen die Rechenschritte jetzt `previousZoom`,
`wheelSensitivity`, `desiredZoom`, `newZoom` und `relativeZoomChange`.

## Grenzen

Die Tagebuchdatei ist weiterhin relativ groß. Eine spätere saubere Aufteilung
in Rendern, Editieren und Eingaben ist sinnvoll. Dafür müssen wir gemeinsame
Zustände sorgfältig trennen; das machen wir lieber in einer gesonderten,
getesteten Iteration statt hastig.

**Kein npm und keine zusätzliche JavaScript-Abhängigkeit.**
