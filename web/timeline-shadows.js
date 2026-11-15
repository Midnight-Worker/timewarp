/*
 * Zeitpapier-Spuren im Kalender.
 * Notizen bekommen eine sanfte, violette Gedankenblase statt eines
 * vollständigen Textblocks. Die Einträge selbst bleiben im Tagebuch.
 */
(() => {
    'use strict';

    const entryCounts = new Map();

    async function refresh() {
        const selectedYear = selectedDate.getFullYear();
        const firstDay = `${selectedYear - 1}-01-01`;
        const lastDay = `${selectedYear + 1}-12-31`;

        const response = await fetch(
            `/api/timeline/counts?from=${firstDay}&to=${lastDay}`
        );
        if (!response.ok) {
            return;
        }

        const counts = await response.json();
        entryCounts.clear();

        for (const [day, amount] of Object.entries(counts)) {
            entryCounts.set(day, amount);
        }
        renderCurrentScene();
    }

    function drawShadow(parent, day, x, y, width, height) {
        const numberOfNotes = entryCounts.get(day) || 0;
        if (!numberOfNotes) {
            return;
        }

        const bubbleWidth = Math.min(width * 0.7, 115);
        const bubbleHeight = Math.min(height * 0.5, 43);
        const bubbleX = x + Math.max(5, width - bubbleWidth - 9);
        const bubbleY = y + Math.max(5, height - bubbleHeight - 8);
        const bubble = createSvgElement('g', {
            'pointer-events': 'none',
            opacity: 0.55
        }, parent);

        // Die Silhouette ist bewusst keine normale Termin-Karte.
        const bubbleShape = createSvgElement('path', {
            d: [
                `M ${bubbleX + 12} ${bubbleY}`,
                `H ${bubbleX + bubbleWidth - 12}`,
                `Q ${bubbleX + bubbleWidth} ${bubbleY} ${bubbleX + bubbleWidth} ${bubbleY + 12}`,
                `V ${bubbleY + bubbleHeight - 14}`,
                `Q ${bubbleX + bubbleWidth} ${bubbleY + bubbleHeight} ${bubbleX + bubbleWidth - 14} ${bubbleY + bubbleHeight}`,
                `H ${bubbleX + 24}`,
                `L ${bubbleX + 8} ${bubbleY + bubbleHeight + 5}`,
                `L ${bubbleX + 12} ${bubbleY + bubbleHeight - 4}`,
                `Q ${bubbleX} ${bubbleY + bubbleHeight - 8} ${bubbleX} ${bubbleY + bubbleHeight - 18}`,
                `V ${bubbleY + 12}`,
                `Q ${bubbleX} ${bubbleY} ${bubbleX + 12} ${bubbleY}`,
                'Z'
            ].join(' '),
            fill: '#b2a5d2',
            stroke: '#d9c4f3',
            'stroke-width': 1.4
        }, bubble);

        const label = `☁ ${numberOfNotes}`;
        drawSvgText(
            bubble, bubbleX + 9, bubbleY + Math.max(17, bubbleHeight * 0.65),
            label, 14, '#403c68', 650
        );
    }

    window.TimelineShadows = { refresh, drawShadow };
    window.addEventListener('load', () => {
        refresh().catch(error => console.warn('Papiermarkierung:', error));
    });
})();
