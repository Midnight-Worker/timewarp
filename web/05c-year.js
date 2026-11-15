/*
 * 05c-calendar-scenes.js – Jahr, Monat, Woche und Tag.
 *
 * Die Kalenderansichten werden mit einfachen SVG-Rechtecken, Linien
 * und Texten gezeichnet. Alle Daten kommen aus appointments.
 *
 * Kalenderwoche und Tagesraster sind keine externen Kalender-Widgets.
 * So können wir die Darstellung später frei weiterentwickeln.
 */

// Abmessungen der großen Jahreslandkarte (SVG-Weltkoordinaten)
const YEAR_WIDTH = 5170;
const YEAR_HEIGHT = 2660;
const CALENDAR_LEFT = 205;
const CALENDAR_TOP = 185;
const DAY_COLUMN_WIDTH = 155;
const MONTH_ROW_HEIGHT = 195;

/** Zeichnet ein halbtransparentes Jahresblatt im Hintergrund. */
function renderDistantYear(year, distanceFromMainPage) {
    const distance = Math.abs(distanceFromMainPage);
    const transparency = Math.pow((6 - distance) / 6, 2) * 0.65;
    const translationX = distanceFromMainPage * 63;
    const translationY = -distance * 41;
    const scaling = 1 - distance * 0.018;

    const yearSheet = createSvgElement('g', {
        opacity: transparency,
        transform: `translate(${translationX} ${translationY}) scale(${scaling})`,
        'pointer-events': 'none'
    });

    drawSvgRectangle(
        yearSheet, 0, 0, YEAR_WIDTH, YEAR_HEIGHT,
        '#113a50', '#7bd9d2', { 'stroke-width': 10 }
    );
    drawSvgText(yearSheet, 110, 126, String(year), 95, '#bdffef', 750);

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthY = CALENDAR_TOP + monthIndex * MONTH_ROW_HEIGHT;
        const backgroundColor = monthIndex % 2 ? '#1c4a5c' : '#153b51';

        drawSvgRectangle(
            yearSheet,
            40, monthY, YEAR_WIDTH - 80, MONTH_ROW_HEIGHT - 14,
            backgroundColor
        );
        drawSvgText(
            yearSheet,
            70, monthY + 80,
            monthNames[monthIndex].toUpperCase(),
            28, '#b1ead8', 700
        );
    }
}

/** Das Hauptjahr enthält zwölf waagerechte Reihen mit allen Tagen. */
function renderYearView() {
    const year = selectedDate.getFullYear();

    if (currentViewLevel === 1) {
        for (let distance = 5; distance >= 1; distance--) {
            renderDistantYear(year - distance, -distance);
            renderDistantYear(year + distance, distance);
        }
    }

    const yearSheet = createSvgElement('g');
    drawSvgRectangle(
        yearSheet, 0, 0, YEAR_WIDTH, YEAR_HEIGHT,
        '#0d2b40', '#5091a0', {
            'stroke-width': 7,
            filter: 'url(#shadow)'
        }
    );
    drawSvgRectangle(
        yearSheet, 35, 30, YEAR_WIDTH - 70, 128, '#164458'
    );
    drawSvgText(yearSheet, 90, 118, String(year), 105, '#a9ffe0', 800);
    drawSvgText(
        yearSheet, 805, 115,
        'JANUAR — DEZEMBER · ZEITBALKEN', 35, '#bad9e1', 650
    );

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        drawYearMonthRow(yearSheet, year, monthIndex);
    }
}

function drawYearMonthRow(yearSheet, year, monthIndex) {
    const monthY = CALENDAR_TOP + monthIndex * MONTH_ROW_HEIGHT;
    const backgroundColor = monthIndex % 2 ? '#19374d' : '#163046';

    drawSvgRectangle(
        yearSheet,
        43, monthY, YEAR_WIDTH - 86, MONTH_ROW_HEIGHT - 14,
        backgroundColor, '#345e75'
    );

    drawSvgText(
        yearSheet,
        65, monthY + 53,
        monthNames[monthIndex].toUpperCase(),
        27, '#85e8ce', 700
    );

    const lastDay = daysInMonth(year, monthIndex);
    for (let day = 1; day <= lastDay; day++) {
        drawYearDayCell(yearSheet, new Date(year, monthIndex, day), monthY);
    }

    drawYearRangeBars(yearSheet, year, monthIndex, monthY);
}

function drawYearDayCell(yearSheet, date, monthY) {
    const dayOfMonth = date.getDate();
    const dayColumnLeft = CALENDAR_LEFT + (dayOfMonth - 1) * DAY_COLUMN_WIDTH;
    const dateKey = formatLocalDate(date);
    const isToday = dateKey === formatLocalDate(currentDate);

    const dayGroup = createSvgElement('g', {
        'data-date': dateKey,
        style: 'cursor:pointer'
    }, yearSheet);

    drawSvgRectangle(
        dayGroup,
        dayColumnLeft, monthY + 10,
        DAY_COLUMN_WIDTH - 6, MONTH_ROW_HEIGHT - 32,
        isToday ? '#27565a' : '#1d3d53',
        '#37576a'
    );

    if (window.TimelineShadows) {
        window.TimelineShadows.drawShadow(
            dayGroup, dateKey,
            dayColumnLeft + 2, monthY + 45, DAY_COLUMN_WIDTH - 10, 104
        );
    }

    drawSvgText(
        dayGroup,
        dayColumnLeft + 11, monthY + 37,
        String(dayOfMonth).padStart(2, '0'),
        23, '#e4f3fa', 700
    );
    drawSvgText(
        dayGroup,
        dayColumnLeft + DAY_COLUMN_WIDTH - 15, monthY + 37,
        weekdayAbbreviations[date.getDay()],
        13, '#9abccd', 500,
        { 'text-anchor': 'end' }
    );

    // Durchgehende Zeiträume werden nach der Tagesreihe gezeichnet.
}

/**
 * Zeichnet von–bis-Balken über mehrere Tage desselben Monats.
 * Über Monats- und Jahresgrenzen wird der Balken am Rand fortgesetzt.
 * Eigene Termine stehen in der obersten farbigen Zeile.
 */
function drawYearRangeBars(yearSheet, year, monthIndex, monthY) {
    const firstDay = new Date(year, monthIndex, 1);
    const firstNextMonth = new Date(year, monthIndex + 1, 1);
    const monthStartKey = formatLocalDate(firstDay);
    const nextMonthKey = formatLocalDate(firstNextMonth);
    const numberOfDays = daysInMonth(year, monthIndex);

    for (const appointment of appointments) {
        const start = appointmentUtcDate(appointment);
        const end = new Date(start.getTime() + appointment.duration * 60000);
        const firstOccupiedDay = dateStringInTimeZone(start, homeTimeZone);
        const lastOccupiedDay = dateStringInTimeZone(
            new Date(end.getTime() - 1), homeTimeZone
        );

        if (lastOccupiedDay < monthStartKey || firstOccupiedDay >= nextMonthKey) {
            continue;
        }

        const firstVisibleDay = firstOccupiedDay < monthStartKey
            ? 1
            : Number(firstOccupiedDay.slice(8));
        const lastVisibleDay = lastOccupiedDay >= nextMonthKey
            ? numberOfDays
            : Number(lastOccupiedDay.slice(8));
        const memberIndex = teamMemberOrder.indexOf(appointment.owner);
        const member = findTeamMember(appointment.owner);
        const left = CALENDAR_LEFT + (firstVisibleDay - 1) * DAY_COLUMN_WIDTH + 7;
        const width = (lastVisibleDay - firstVisibleDay + 1) * DAY_COLUMN_WIDTH - 13;
        const top = monthY + 64 + memberIndex * 16;

        const rangeGroup = createSvgElement('g', {
            'data-card': appointment.id,
            style: 'cursor:grab'
        }, yearSheet);
        drawSvgRectangle(rangeGroup, left, top, width, 12, member.color);

        if (width > 150) {
            drawSvgText(
                rangeGroup, left + 9, top - 3,
                appointment.title.slice(0, 28),
                13, member.color, 600,
                { 'pointer-events': 'none' }
            );
        }
    }
}
