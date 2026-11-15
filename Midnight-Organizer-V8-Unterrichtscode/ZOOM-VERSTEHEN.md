# Lerneinheit: Wie unsere Zoom-Kamera funktioniert

Wir benutzen **SVG**. Du kannst dir SVG wie eine riesige Karte mit einem
eigenen Koordinatensystem vorstellen. Unsere Kamera bestimmt, welchen Teil
dieser Karte wir gerade sehen.

Die zwei wichtigsten Dateien dafür sind:

- `web/06-camera.js` – Größe und Position des sichtbaren Ausschnitts
- `web/07-input.js` – Mausrad, Mausposition und Zoomfaktor

## 1. Eine Kamera mit vier Zahlen

In `01-state.js` findest du:

```javascript
let cameraViewport = {
    x: -1300,
    y: -700,
    w: 2600,
    h: 1480
};
```

`x` und `y` sind die linke obere Ecke. `w` (width) und `h` (height) sind
Breite und Höhe des sichtbaren Ausschnitts.

In `updateSvgCamera()` werden diese Zahlen als `viewBox` gesetzt:

```javascript
const viewBox = [
    cameraViewport.x,
    cameraViewport.y,
    cameraViewport.w,
    cameraViewport.h
].join(' ');

svg.setAttribute('viewBox', viewBox);
```

Eine kleinere `w`-Breite bedeutet: Wir sehen einen kleineren Teil der
Welt. Die Gegenstände darin wirken größer. So funktioniert unser
**geometrischer Zoom**.

## 2. Der Zoomfaktor

Das Mausrad liefert `deltaY`. Ein negatives `deltaY` bedeutet meist,
dass wir hineinzoomen. In `handleCalendarWheel()` steht:

```javascript
const zoomFactor = Math.exp(limitedWheelDelta * 0.00125);
```

`Math.exp()` erzeugt einen kontinuierlichen und stets positiven Faktor.
Zum Beispiel:

- `zoomFactor = 0.5`: Sichtbare Breite halbiert sich – 2-fache Vergrößerung.
- `zoomFactor = 1.0`: Keine Veränderung.
- `zoomFactor = 2.0`: Sichtbare Breite verdoppelt sich – herauszoomen.

Die Breite wird später so verändert:

```javascript
cameraViewport.w *= zoomFactor;
```

## 3. Warum bleibt der Mauszeiger über demselben Tag?

Wenn du einfach nur `cameraViewport.w` veränderst, wird meist relativ
zum linken Rand gezoomt. Wir wollen aber **genau an die Stelle unter
dem Mauszeiger** zoomen.

Die horizontale Position eines Weltpunkts in der Kamera ist:

```text
relativePosition = (worldPoint.x - cameraViewport.x) / cameraViewport.w
```

Nach dem Zoomen soll diese relative Position gleich bleiben. Deshalb
verwenden wir:

```javascript
cameraViewport.x = worldPoint.x - (
    worldPoint.x - cameraViewport.x
) * zoomFactor;
```

Dasselbe geschieht mit `y`.

### Beispiel mit echten Zahlen

Am Anfang:

```text
Linker Rand:            0
Sichtbare Breite:    1000
Weltpunkt der Maus:   250
```

Wir zoomen mit `zoomFactor = 0.5`.

Die neue Kameraposition ist:

```text
newX = 250 - (250 - 0) * 0.5
newX = 125
```

Und die neue sichtbare Breite lautet `500`. Der Mauspunkt liegt vor und
nach dem Zoom bei 25 Prozent der sichtbaren Fläche!

## 4. Wie findet JavaScript den Weltpunkt der Maus?

Die Maus liefert Pixelpositionen auf dem Bildschirm. Der Kalender
arbeitet aber mit SVG-Weltkoordinaten. Das übernimmt:

```javascript
function screenToWorld(pointerEvent) {
    const screenPoint = svg.createSVGPoint();
    screenPoint.x = pointerEvent.clientX;
    screenPoint.y = pointerEvent.clientY;

    const inverseMatrix = svg.getScreenCTM().inverse();
    return screenPoint.matrixTransform(inverseMatrix);
}
```

`getScreenCTM()` ist eine Transformationsmatrix von SVG zu
Bildschirmkoordinaten. Durch `.inverse()` drehen wir diese Umrechnung um.

Die Formel musst du nicht auswendig lernen – wichtig ist zunächst,
**warum** wir eine Koordinatenumrechnung brauchen.

## 5. Geometrischer Zoom und semantischer Zoom

Innerhalb einer Stufe zoomen wir rein geometrisch. Wird eine bestimmte
Schwelle erreicht, wechselt die Anwendungsdarstellung:

```text
Schreibtisch → Globus → Jahresdeck → Jahr → Monat → Woche → Tag → Papier
```

Das ist der **semantische Zoom**. Der Benutzer bekommt mehr Details,
und es werden andere Objekte gezeichnet. In den Dateien heißen die
Funktionen dafür `changeViewLevel()` und `renderCurrentScene()`.

Wichtig: Diese Übergänge sind noch keine vollständigen 3D-Kameraflüge.

## 6. Das Papier hat eine eigene Kamera

Das Endlospapier ist **keine SVG-Ansicht**, sondern eine HTML-Fläche.
Es wird mit CSS-Transformationen verschoben und vergrößert:

```javascript
paperCanvas.style.transform =
    `translate(${paperCamera.x}px, ${paperCamera.y}px) ` +
    `scale(${paperCamera.scale})`;
```

Der mathematische Gedanke ist derselbe. Nur die Darstellungstechnik ist
anders. Vergleiche `handlePaperWheel()` mit `handleCalendarWheel()`.

## 7. Kleine Übungen

**Übung A:** Ändere in `07-input.js` den Faktor `0.00125` auf `0.0007`.
Bewege anschließend das Mausrad: Der Zoom wird langsamer.

**Übung B:** In `06-camera.js` werden die Zoomstufen mit Namen versehen.
Ändere dort `11 Jahre` in `Jahresdeck`.

**Übung C:** In `05a-desktop.js` findest du `drawDesktopNewspaper()`.
Ändere den Schriftzug der Zeitung und die Hintergrundfarbe.

**Übung D:** Ändere bei `drawDesktopNotepad()` die Anzahl der sichtbaren
Notizen von sieben auf fünf.

Damit lernst du nicht nur die Zoom-Mathematik, sondern auch, wie die
Verantwortlichkeiten unserer Dateien zusammenhängen.
