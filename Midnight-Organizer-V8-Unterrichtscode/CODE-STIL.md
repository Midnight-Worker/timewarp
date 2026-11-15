# Unsere Regeln für gut lesbaren Unterrichtscode

1. **Vier Leerzeichen pro Ebene** – keine zufälligen Einrückungen.
2. **Sprechende Namen** – `selectedDate` statt `d`, `worldPoint` statt `p`.
3. **Eine Aufgabe pro Funktion** – Zeichnen, Speichern und Eingaben trennen.
4. **Frühzeitig `return` verwenden** – keine tief verschachtelten Fallunterscheidungen.
5. **Lieber Zwischenschritte** – `numberOfDays` erklären statt alles in einen Ausdruck zu pressen.
6. **Kommentare erklären das Warum** – nicht jedes sichtbare Detail nochmals beschriften.
7. **Keine stillen neuen Abhängigkeiten** – ohne ausdrückliche Entscheidung keine Build-Tools.
8. **Eine Änderung = ein nachvollziehbarer Unterschied** – nicht ständig das Gesamtprojekt neu schreiben.
9. **Bestehende Speicherformate bewusst erhalten** – Migrationen sind eine eigene Aufgabe.
10. **Erst testen, dann verteilen** – Syntax, Ansichten, Speichervorgänge und Grenzen dokumentieren.

## Ein Beispiel

Schwer verständlich:

```javascript
const f = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
```

Für den Unterricht leichter:

```javascript
function nextDay(date) {
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const nextDayNumber = date.getDate() + 1;

    return new Date(year, monthIndex, nextDayNumber);
}
```

Nicht jede Kurzform ist schlecht. Aber wenn eine Funktion Lernstoff
versteckt, ist der verständliche Weg der bessere.
