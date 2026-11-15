/*
 * timeline-shadows.js
 * Blaugraue Spuren zeigen, an welchen Tagen Tagebuchmaterial liegt.
 * Die Markierungen sind bewusst nicht anklickbar und überdecken keine Termine.
 */
(() => {
    const entryCounts = new Map();
    let refreshTimer = null;

    async function refresh() {
        const year = selectedDate.getFullYear();
        const from = `${year - 1}-01-01`;
        const to = `${year}-12-31`;
        const response = await fetch(`/api/timeline/counts?from=${from}&to=${to}`);
        if (!response.ok) return;
        const counts = await response.json();
        entryCounts.clear();
        for (const [day, count] of Object.entries(counts)) {
            entryCounts.set(day, count);
        }
        // Kalender nur neu zeichnen, wenn die Eintragsdichte sich geändert hat.
        if (typeof renderCurrentScene === 'function') renderCurrentScene();
    }

    function drawShadow(parent, day, x, y, width, height) {
        const count = entryCounts.get(day) || 0;
        if (count === 0) return;

        const opacity = Math.min(0.35, 0.09 + count * 0.035);
        const group = createSvgElement('g', {
            'pointer-events': 'none'
        }, parent);
        drawSvgRectangle(group, x, y, width, height, '#98b4c9', 'none', {
            'fill-opacity': opacity,
            rx: 8
        });
        drawSvgText(group, x + 8, y + Math.min(height - 5, 24),
            `◧ ${count}`, 15, '#aac8d6', 600);
    }

    window.TimelineShadows = { refresh, drawShadow };
    window.addEventListener('load', () => {
        refresh().catch(error => console.warn('Zeitpapier-Schatten:', error));
    });
})();
