/*
 * 05a-desktop.js
 *
 * Äußerste Zoomstufe: Ein Schreibtisch aus SVG-Formen.
 * Der Notizblock, die Zeitung und die Erde sind Gruppen mit data-desk.
 * Beim Klicken entscheidet 07-input.js, was geöffnet wird.
 */

function renderDesktop() {
    const desktop = createSvgElement('g');

    // Holzplatte und leichte Maserung
    drawSvgRectangle(
        desktop, -1400, -820, 2800, 1640,
        '#382a28', '#7a6150', { 'stroke-width': 20 }
    );

    for (let row = 0; row < 23; row++) {
        const lineY = -800 + row * 72;
        createSvgElement('line', {
            x1: -1390,
            y1: lineY,
            x2: 1390,
            y2: lineY,
            stroke: '#96705a',
            'stroke-opacity': 0.12,
            'stroke-width': 3
        }, desktop);
    }

    drawDesktopPlanet(desktop);
    drawDesktopNotepad(desktop);
    drawDesktopPen(desktop);
    drawDesktopNewspaper(desktop);

    drawSvgText(
        desktop, -1100, 660,
        'SCHREIBTISCH · GEDANKEN SAMMELN · ZEIT REISEN',
        29, '#d9c7aa', 700
    );
}

function drawDesktopPlanet(desktop) {
    drawSvgRectangle(
        desktop, -850, -540, 1180, 890,
        '#164157', '#83a9ad', {
            'stroke-width': 7,
            filter: 'url(#shadow)'
        }
    );

    drawSvgText(desktop, -762, -450, 'MIDNIGHT · ZEITWELT', 55, '#b8ffee', 800);
    drawSvgText(
        desktop, -762, -395,
        'Ein Jahr wählen und in die Zeit eintauchen',
        25, '#b9dce5'
    );

    const miniaturePlanet = createSvgElement('g', {
        transform: 'translate(-250 -30) scale(.38)',
        style: 'cursor:pointer',
        'data-desk': 'planet'
    }, desktop);

    createSvgElement('circle', {
        cx: 0,
        cy: 0,
        r: 360,
        fill: 'url(#ocean)',
        stroke: '#8af1db',
        'stroke-width': 9
    }, miniaturePlanet);

    for (let meridian = -2; meridian <= 2; meridian++) {
        createSvgElement('ellipse', {
            cx: 0,
            cy: 0,
            rx: Math.abs(350 * Math.cos(meridian * 0.42)),
            ry: 349,
            fill: 'none',
            stroke: '#aef7f0',
            'stroke-opacity': 0.32,
            'stroke-width': 3
        }, miniaturePlanet);
    }

    drawSvgText(
        miniaturePlanet, 0, 13, '◎', 220, '#d3fff3', 500,
        { 'text-anchor': 'middle' }
    );

    drawSvgText(
        desktop, -735, 245, `◀  ${selectedYearNumber}  ▶`,
        53, '#d5fff1', 700, {
            'data-desk': 'planet',
            style: 'cursor:pointer'
        }
    );

    drawSvgText(
        desktop, -735, 293,
        'Globus anklicken → Jahre auswählen', 21, '#a8c9d7'
    );
}

function drawDesktopNotepad(desktop) {
    const notepad = createSvgElement('g', {
        'data-desk': 'notes',
        style: 'cursor:pointer',
        transform: 'rotate(-4 660 -220)'
    }, desktop);

    drawSvgRectangle(
        notepad, 435, -625, 710, 780,
        '#f9ecca', '#dfbf8a', {
            'stroke-width': 6,
            filter: 'url(#shadow)'
        }
    );

    for (let line = 0; line < 13; line++) {
        const lineY = -470 + line * 45;
        createSvgElement('line', {
            x1: 485,
            y1: lineY,
            x2: 1090,
            y2: lineY,
            stroke: '#8daabc',
            'stroke-opacity': 0.42,
            'stroke-width': 2
        }, notepad);
    }

    drawSvgText(notepad, 505, -535, 'NOTIZBLOCK', 46, '#3d5660', 700);

    // Auf dem Papier nur die ersten sieben Stichpunkte als Vorschau zeigen.
    const previewNotes = unplannedNotes.slice(0, 7);
    previewNotes.forEach((note, index) => {
        const noteY = -443 + index * 45;
        drawSvgText(
            notepad, 505, noteY, '• ' + note.text.slice(0, 29),
            26, '#435360', 500
        );
    });

    drawSvgText(
        notepad, 535, 108,
        '✎ Anklicken zum Schreiben', 22, '#46736c'
    );
}

function drawDesktopPen(desktop) {
    const pen = createSvgElement('g', {
        transform: 'rotate(-36 1230 -370)',
        'pointer-events': 'none'
    }, desktop);

    drawSvgRectangle(
        pen, 1209, -625, 23, 470,
        '#c2b2a0', '#f5dbb2', { 'stroke-width': 4 }
    );

    createSvgElement('path', {
        d: 'M1209 -155 L1232 -155 L1220 -112 Z',
        fill: '#a3a8ac'
    }, pen);
}

function drawDesktopNewspaper(desktop) {
    const newspaper = createSvgElement('g', {
        'data-desk': 'news',
        style: 'cursor:pointer',
        transform: 'rotate(7 560 540)'
    }, desktop);

    drawSvgRectangle(
        newspaper, 345, 370, 970, 370,
        '#ded6c3', '#9d9b91', {
            'stroke-width': 5,
            filter: 'url(#shadow)'
        }
    );

    drawSvgText(
        newspaper, 395, 448,
        'MIDNIGHT WORKER', 69, '#253743', 850
    );

    createSvgElement('line', {
        x1: 395,
        y1: 468,
        x2: 1255,
        y2: 468,
        stroke: '#253743',
        'stroke-width': 4
    }, newspaper);

    drawSvgText(
        newspaper, 405, 534,
        'DIE WERKSTATT-ZEITUNG', 37, '#354451', 650
    );
    drawSvgText(
        newspaper, 405, 583,
        'Website · Projekte · Veröffentlichungen', 23, '#5b6266'
    );

    for (let line = 0; line < 5; line++) {
        drawSvgRectangle(
            newspaper, 410, 607 + line * 20,
            800 - line * 60, 6, '#a9a596'
        );
    }
}
