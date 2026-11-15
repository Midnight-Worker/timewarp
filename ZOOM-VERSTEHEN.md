# Wie unser Zoom funktioniert – Schritt für Schritt

Wir verwenden für die Kalenderwelt **SVG**. SVG ist eine Zeichenfläche mit
einem eigenen Koordinatensystem. Die `viewBox` legt fest, welchen Ausschnitt
wir betrachten. Anders als beim Skalieren eines Pixelbildes bleibt die Schrift
und Geometrie scharf.

## 1. Die vier Zahlen der Kamera

In `web/01-state.js` liegt der Zustand:

```js
let view = { x: -1300, y: -700, w: 2600, h: 1480 };
```

`x` und `y` sind die linke obere Ecke des sichtbaren Bereichs. `w` und `h`
sind Breite und Höhe des sichtbaren Ausschnitts **in Weltkoordinaten**.

```js
svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
```

Wenn `view.w` **kleiner** wird, sieht man einen kleineren Teil der Welt, also
**größer** gezoomt. Wenn `view.w` **größer** wird, sieht man mehr Welt.

## 2. Zoomfaktor mit dem Mausrad

In `web/07-input.js` benutzen wir:

```js
const factor = Math.exp(e.deltaY * 0.00125);
```

- Mausrad nach vorne: `deltaY` meist negativ -> `factor < 1` -> hineinzoomen
- Mausrad zurück: `deltaY` meist positiv -> `factor > 1` -> herauszoomen
- `Math.exp` liefert einen fließenden, immer positiven Faktor.

Die neue sichtbare Breite ist:

```js
view.w *= factor;
view.h *= factor;
```

In V7 wird die tatsächliche neue Größe außerdem mit `zoomWithin` und
Zoomstufengrenzen abgestimmt.

## 3. Warum bleibt der Mauszeiger an derselben Weltstelle?

Angenommen, unter deiner Maus liegt ein Kalendertag bei `p.x`.

Vor dem Zoom beträgt seine relative horizontale Position innerhalb des
Ausschnitts:

```text
(p.x - view.x) / view.w
```

Nach dem Zoom soll diese Zahl unverändert bleiben. Daraus folgt:

```js
view.x = p.x - (p.x - view.x) * factor;
view.y = p.y - (p.y - view.y) * factor;
```

**Mini-Beispiel:** Sichtbarer Ausschnitt startet bei `x=0`, ist `1000` breit
und die Maus zeigt auf die Weltstelle `x=250`. Wir zoomen mit `factor=0.5`.

```text
vorher:  x = 0,    Breite = 1000
nachher: x = 125,  Breite = 500
```

Der Punkt `250` liegt vorher bei 25 % der Ansicht und nachher noch immer bei
25 %. Dadurch fühlt sich die Kamera an, als würde sie unter die Maus fliegen.

## 4. Bildschirmkoordinaten zu Weltkoordinaten

Ein Mausklick hat Browser-Koordinaten (`clientX`, `clientY`). Unsere SVG-Karten
liegen aber in Weltkoordinaten. Die Umrechnung übernimmt:

```js
function point(event) {
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
}
```

`getScreenCTM()` beschreibt den Weg von SVG nach Bildschirm; `inverse()`
kehrt diesen Weg um. So weiß die Anwendung, welcher Tag unter der Maus liegt.

## 5. Zwei verschiedene Arten von Zoom

**Geometrischer Zoom:** Innerhalb einer Ansicht ändern wir `viewBox`; alles
wird physisch größer oder kleiner.

**Semantischer Zoom:** Bei einer Schwelle wechselt die Darstellung, etwa von
`Monat` zu `Woche` oder `Tag`, und mehr Informationen werden gezeichnet.
Dafür gibt es `setLevel(...)` und `draw()` in `web/06-camera.js`.

Aktuell sind das noch **sichtbare Stufenwechsel** und keine nahtlos animierten
3D-Kamerafahrten.

## 6. Deine erste Übung

Probiere in `web/07-input.js` den Faktor `0.00125` durch `0.0007` zu ersetzen.
Der Zoom wird **langsamer/feiner**. Bei `0.002` wird er deutlich schneller.

Das ist eine gute erste Änderung, weil du sofort den Unterschied merkst und
nichts am Datenmodell ändern musst.
