/*
 * 05b-globe.js – Der Zeitplanet
 *
 * Wir zeichnen eine schematische Erde. Die farbigen Kontinente und
 * Jahresblätter sind SVG-Elemente, keine echte dreidimensionale Weltkarte.
 * Die Jahresblätter können über das Attribut data-year ausgewählt werden.
 */

const CONTINENT_PATHS = [
    'M -250 -225 L -156 -273 -95 -245 -52 -180 -79 -120 -35 -78 -99 -19 -153 -26 -204 -94 -282 -135 Z',
    'M -132 4 L -79 38 -43 113 -80 218 -134 266 -159 191 -204 108 Z',
    'M 40 -250 L 170 -275 285 -215 255 -130 168 -99 144 -28 88 -52 28 -124 Z',
    'M 25 -62 L 112 -52 148 48 93 163 33 199 -10 117 Z',
    'M 219 178 L 290 196 317 240 259 275 201 244 Z'
];

function renderGlobe() {
    const globeScene = createSvgElement('g');

    // Zwei große Kreise ergeben die leuchtende Atmosphäre.
    createSvgElement('circle', {
        cx: 0, cy: 0, r: 540,
        fill: '#0b5971', 'fill-opacity': 0.09,
        stroke: '#248b9c', 'stroke-opacity': 0.4,
        'stroke-width': 2
    }, globeScene);

    createSvgElement('circle', {
        cx: 0, cy: 0, r: 435,
        fill: 'none',
        stroke: '#9ce9d2',
        'stroke-opacity': 0.28,
        'stroke-width': 2,
        'stroke-dasharray': '12 15'
    }, globeScene);

    drawEarth(globeScene);
    drawOrbitingYearCards(globeScene);
}

function drawEarth(globeScene) {
    const tiltedEarth = createSvgElement('g', {
        transform: 'rotate(-13)'
    }, globeScene);

    createSvgElement('circle', {
        cx: 0, cy: 0, r: 350,
        fill: 'url(#ocean)',
        stroke: '#92d8e4',
        'stroke-width': 4,
        filter: 'url(#shadow)'
    }, tiltedEarth);

    // Der Ausschnitt verhindert, dass Kontinente über die Erdkugel ragen.
    const earthSurface = createSvgElement('g', {
        'clip-path': 'url(#earthClip)'
    }, tiltedEarth);

    createSvgElement('circle', {
        r: 350,
        fill: 'url(#light)'
    }, earthSurface);

    drawEarthCoordinateGrid(earthSurface);
    drawSchematicContinents(earthSurface);
    drawSeasonColors(earthSurface);

    drawSvgText(
        globeScene, 0, 3,
        String(selectedDate.getFullYear()), 85,
        '#f4ffff', 800,
        { 'text-anchor': 'middle' }
    );

    drawSvgText(
        globeScene, 0, 49,
        'ZEITPLANET', 26,
        '#b3f0e2', 650,
        { 'text-anchor': 'middle' }
    );

    const northernSummer = isNorthernSummer();
    const northSeason = northernSummer ? 'SOMMER' : 'WINTER';
    const southSeason = northernSummer ? 'WINTER' : 'SOMMER';

    drawSvgText(
        globeScene, 0, 595,
        `NORD · ${northSeason}     /     SÜD · ${southSeason}`,
        20, '#91bdcf', 600,
        { 'text-anchor': 'middle' }
    );
}

function drawEarthCoordinateGrid(earthSurface) {
    for (let gridLine = -4; gridLine <= 4; gridLine++) {
        const radiusFactor = Math.cos(gridLine * Math.PI / 12);

        createSvgElement('ellipse', {
            cx: 0, cy: 0,
            rx: 350 * radiusFactor,
            ry: 350,
            fill: 'none',
            stroke: '#a3e3e8',
            'stroke-opacity': 0.2,
            'stroke-width': 1
        }, earthSurface);

        createSvgElement('ellipse', {
            cx: 0, cy: 0,
            rx: 350,
            ry: 350 * radiusFactor,
            fill: 'none',
            stroke: '#b3f5ef',
            'stroke-opacity': 0.17,
            'stroke-width': 1
        }, earthSurface);
    }
}

function drawSchematicContinents(earthSurface) {
    for (const continentPath of CONTINENT_PATHS) {
        createSvgElement('path', {
            d: continentPath,
            fill: '#5dbca1',
            'fill-opacity': 0.7,
            stroke: '#b2edc5',
            'stroke-opacity': 0.32,
            'stroke-width': 3
        }, earthSurface);
    }
}

function isNorthernSummer() {
    const monthIndex = selectedDate.getMonth();
    return monthIndex >= 3 && monthIndex <= 8;
}

function drawSeasonColors(earthSurface) {
    const northernSummer = isNorthernSummer();

    const northTint = northernSummer ? 'url(#northTint)' : 'url(#southTint)';
    const southTint = northernSummer ? 'url(#southTint)' : 'url(#northTint)';

    drawSvgRectangle(earthSurface, -360, -350, 720, 350, northTint);
    drawSvgRectangle(earthSurface, -360, 0, 720, 350, southTint);
}

function drawOrbitingYearCards(globeScene) {
    const selectedYear = selectedDate.getFullYear();

    // Fünf Jahresblätter zurück und fünf nach vorne.
    for (let yearOffset = -5; yearOffset <= 5; yearOffset++) {
        const year = selectedYear + yearOffset;
        const angle = -Math.PI / 2 + yearOffset * 0.37;
        const depth = 1 - Math.abs(yearOffset) * 0.115;

        const centerX = Math.cos(angle) * 950;
        const centerY = Math.sin(angle) * 495 + 120;
        const rotation = yearOffset * 6;

        const yearCard = createSvgElement('g', {
            transform: `translate(${centerX} ${centerY}) rotate(${rotation})`,
            'data-year': year,
            style: 'cursor:pointer',
            opacity: Math.max(0.09, depth)
        }, globeScene);

        const isSelectedYear = year === selectedYearNumber;
        const fillColor = isSelectedYear ? '#236d69' : '#163e50';
        const borderColor = isSelectedYear ? '#e7ffd0' : '#78d5c6';
        const borderWidth = isSelectedYear ? 9 : 3;

        drawSvgRectangle(
            yearCard, -118, -85, 236, 170,
            fillColor, borderColor,
            { 'stroke-width': borderWidth, filter: 'url(#shadow)' }
        );

        drawSvgText(yearCard, -91, -34, String(year), 39, '#d8fff5', 800);

        for (let line = 0; line < 6; line++) {
            const labelTop = -12 + line * 13;
            const lineColor = line % 2 ? '#2a5c70' : '#447e89';
            drawSvgRectangle(yearCard, -91, labelTop, 178, 6, lineColor);
        }
    }
}
