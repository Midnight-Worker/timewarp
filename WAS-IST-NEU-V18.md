# V18 – Termine als gemeinsame Entitäten

## Warum diese Änderung?

In V17 waren Kalendertermine und Zeitpapiernotizen getrennte Datenwelten.
Das führte dazu, dass ein Termin im Kalender nicht auf dem Zeitpapier erschien.

## Neue Grundregel

**Der Kalender speichert einen Termin genau einmal.** Das Zeitpapier liest
denselben Termin über die API und zeigt eine *virtuelle Karte* an.
Ihre Kennung lautet `appointment:<Termin-ID>`. Ihre Position auf dem Papier
wird separat gespeichert, ihre Termindaten aber nicht dupliziert.

- Kalendertermin anlegen → Zeitpapier öffnen → dieselbe Karte erscheint.
- Termin im Kalender bearbeiten → beim erneuten Öffnen des Papiers zeigt
  dieselbe Karte den aktuellen Titel und Zeitpunkt.
- Termin auf dem Papier bearbeiten → derselbe vorhandene Kalendereintrag
  öffnet seinen Termineditor.
- Papiernotizen aus Zeitpapier **und altem freien Papier** erscheinen im Kalender-Vorrat, solange sie
  keinem Termin zugeordnet sind.
- Notiz auf Tag/Stunde ziehen → ein Kalendertermin wird erstellt und über
  `source_entry_id` mit der ursprünglichen Notiz verknüpft.
- Beziehungen können auf dem Papier auch zu Terminkarten gezeichnet werden.

## Datenmodell

`calendar_state` bleibt die maßgebliche Terminquelle mit Versionskontrolle.
`timeline_entries` speichert die freien Papierobjekte. `timeline_links` hält
Beziehungen zwischen Papierobjekten und Terminen. `appointment_paper_positions`
speichert ausschließlich die grafischen Positionen von Terminkarten.

## Noch offen

- Das alte freie Papier (`paper.js`) liefert bereits ungeplante Texte an
  den Kalender-Vorrat. Die vollständige Anzeige von Kalenderterminen direkt
  auf der alten freien Papierfläche ist noch nicht umgesetzt.
- Beziehungen werden beim Löschen eines Kalendertermins noch nicht automatisch
  bereinigt; eine historische Referenz kann erhalten bleiben.
- Zeitpapiernotizen ohne feste Terminzuordnung haben noch eine Stunde als
  Ablageort, gelten aber als *ungeplant*, bis sie bewusst terminiert werden.
- Gleichzeitige Änderungen an Notiztext und Termintext werden noch getrennt
  verwaltet. Nur der Termintitel ist kalenderweit kanonisch.
- Neue Papierpositionen werden in SQLite gespeichert, ohne eine eigene
  Mehrbenutzer-Konfliktauflösung.

Die Module sind bewusst ausführlich und benannt, für Unterricht und Änderungen.
