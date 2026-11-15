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
}

function drawYearDayCell(yearSheet, date, monthY) {
    const dayOfMonth = date.getDate();
    const x = CALENDAR_LEFT + (dayOfMonth - 1) * DAY_COLUMN_WIDTH;
    const dateKey = formatLocalDate(date);
    const isToday = dateKey === formatLocalDate(currentDate);

    const dayGroup = createSvgElement('g', {
        'data-date': dateKey,
        style: 'cursor:pointer'
    }, yearSheet);

    drawSvgRectangle(
        dayGroup,
        x, monthY + 10,
        DAY_COLUMN_WIDTH - 6, MONTH_ROW_HEIGHT - 32,
        isToday ? '#27565a' : '#1d3d53',
        '#37576a'
    );

    drawSvgText(
        dayGroup,
        x + 11, monthY + 37,
        String(dayOfMonth).padStart(2, '0'),
        23, '#e4f3fa', 700
    );
    drawSvgText(
        dayGroup,
        x + DAY_COLUMN_WIDTH - 15, monthY + 37,
        weekdayAbbreviations[date.getDay()],
        13, '#9abccd', 500,
        { 'text-anchor': 'end' }
    );

    drawYearAppointmentIndicators(dayGroup, dateKey, x, monthY);
}

/** Jede Person erhält im Jahreskalender einen eigenen farbigen Zeitbalken. */
function drawYearAppointmentIndicators(dayGroup, dateKey, x, monthY) {
    const appointmentsForDay = appointmentsForDate(dateKey);
    const appointmentsPerOwner = {};

    for (const appointment of appointmentsForDay) {
        const ownerId = appointment.owner;
        appointmentsPerOwner[ownerId] =
            (appointmentsPerOwner[ownerId] || 0) + 1;
    }

    teamMembers.forEach((member, memberIndex) => {
        const numberOfAppointments = appointmentsPerOwner[member.id] || 0;
        if (numberOfAppointments === 0) {
            return;
        }

        const barY = monthY + 61 + memberIndex * 17;
        const barWidth = Math.min(
            DAY_COLUMN_WIDTH - 18,
            20 + numberOfAppointments * 28
        );

        drawSvgRectangle(dayGroup, x + 8, barY, barWidth, 10, member.color);
    });
}

/** Liefert die Montage aller Wochen, die den aktuellen Monat berühren. */
function weeksInSelectedMonth() {
    const year = selectedDate.getFullYear();
    const monthIndex = selectedDate.getMonth();
    const weekStartDates = [];

    for (let day = 1; day <= daysInMonth(year, monthIndex); day++) {
        const date = new Date(year, monthIndex, day);
        const monday = startOfWeek(date);
        const mondayString = formatLocalDate(monday);

        const alreadyPresent = weekStartDates.some(existingMonday => {
            return formatLocalDate(existingMonday) === mondayString;
        });

        if (!alreadyPresent) {
            weekStartDates.push(monday);
        }
    }

    return weekStartDates;
}

/** Ein Monat ist eine waagerechte Reihe mit einzeln anklickbaren Tagen. */
function renderMonthView() {
    const year = selectedDate.getFullYear();
    const monthIndex = selectedDate.getMonth();
    const numberOfDays = daysInMonth(year, monthIndex);
    const width = 170 + numberOfDays * 209;
    const monthSheet = createSvgElement('g');

    drawSvgRectangle(
        monthSheet, 0, 0, width, 1100,
        '#102c41', '#68a9b2', {
            'stroke-width': 6,
            filter: 'url(#shadow)'
        }
    );
    drawSvgText(
        monthSheet, 67, 95,
        `${monthNames[monthIndex]} ${year}`,
        70, '#afffe4', 800
    );
    drawSvgText(
        monthSheet, 69, 148,
        '← → Nebelrahmen verschieben · Enter öffnet die Woche',
        23, '#abc9d5'
    );

    for (let day = 1; day <= numberOfDays; day++) {
        drawMonthDayColumn(monthSheet, new Date(year, monthIndex, day));
    }

    drawSelectedWeekOutline(monthSheet, year, monthIndex, numberOfDays);
}

function drawMonthDayColumn(monthSheet, date) {
    const dayOfMonth = date.getDate();
    const dateKey = formatLocalDate(date);
    const x = 150 + (dayOfMonth - 1) * 209;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    const dayGroup = createSvgElement('g', {
        'data-date': dateKey,
        style: 'cursor:pointer'
    }, monthSheet);

    drawSvgRectangle(
        dayGroup, x, 191, 198, 840,
        isWeekend ? '#19384b' : '#1c4357',
        '#43687d', { 'stroke-width': 2 }
    );

    drawSvgText(
        dayGroup, x + 13, 238,
        `${weekdayAbbreviations[date.getDay()]} ${dayOfMonth}`,
        27, '#e8f8ff', 650
    );

    const visibleAppointments = appointmentsForDate(dateKey).slice(0, 9);
    visibleAppointments.forEach((appointment, index) => {
        const cardY = 270 + index * 76;
        renderAppointmentCard(dayGroup, appointment, x + 8, cardY, 182, 69);
    });
}

function drawSelectedWeekOutline(monthSheet, year, monthIndex, numberOfDays) {
    const weeks = weeksInSelectedMonth();
    selectedWeekIndex = Math.max(0, Math.min(selectedWeekIndex, weeks.length - 1));

    const firstMonday = weeks[selectedWeekIndex];
    const firstMonthDay = new Date(year, monthIndex, 1);
    const daysFromMonthStart = (firstMonday - firstMonthDay) / 86400000;
    const firstDay = Math.max(1, daysFromMonthStart + 1);

    const offsetAtMonthStart = (firstMonthDay.getDay() + 6) % 7;
    const extraDays = firstDay === 1 ? offsetAtMonthStart : 0;
    const lastDay = Math.min(numberOfDays, firstDay + 6 + extraDays);

    const left = 150 + (firstDay - 1) * 209;
    const width = Math.max(209, (lastDay - firstDay + 1) * 209);

    drawSvgRectangle(
        monthSheet, left, 179, width, 863,
        '#b1ffdf', '#a9ffe8', {
            'fill-opacity': 0.075,
            'stroke-width': 7,
            'stroke-dasharray': '16 13',
            'pointer-events': 'none'
        }
    );

    drawSvgText(
        monthSheet, left + 20, 1081,
        'AUSGEWÄHLTE WOCHE  ↵', 20, '#a4f9df', 700
    );
}

/** Sieben Kalendertage nebeneinander mit verschiebbaren Terminkarten. */
function renderWeekView() {
    const monday = startOfWeek(selectedDate);
    const weekSheet = createSvgElement('g');

    drawSvgRectangle(
        weekSheet, 0, 0, 2260, 1470,
        '#112f42', '#649fa9', {
            'stroke-width': 6,
            filter: 'url(#shadow)'
        }
    );

    drawSvgText(
        weekSheet, 65, 96,
        `Woche · ${monday.toLocaleDateString('de-DE')}`,
        68, '#a5ffe0', 800
    );
    drawSvgText(
        weekSheet, 69, 145,
        'Alle Kalender · Karten direkt bearbeiten', 23, '#b0d3dd'
    );

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(monday, dayIndex);
        drawWeekDayColumn(weekSheet, date, dayIndex);
    }
}

function drawWeekDayColumn(weekSheet, date, dayIndex) {
    const dateKey = formatLocalDate(date);
    const x = 65 + dayIndex * 313;
    const dayGroup = createSvgElement('g', {
        'data-date': dateKey,
        style: 'cursor:pointer'
    }, weekSheet);

    drawSvgRectangle(
        dayGroup, x, 196, 296, 1190,
        dayIndex % 2 ? '#18394d' : '#194257',
        '#41687b', { 'stroke-width': 2 }
    );

    const dateLabel =
        `${weekdayAbbreviations[date.getDay()]} ` +
        `${date.getDate()}.${date.getMonth() + 1}.`;

    drawSvgText(dayGroup, x + 18, 247, dateLabel, 28, '#f0ffff', 700);

    const visibleAppointments = appointmentsForDate(dateKey)
        .filter(appointment => visibleTeamMemberIds.has(appointment.owner))
        .slice(0, 14);

    visibleAppointments.forEach((appointment, index) => {
        const y = 282 + index * 77;
        renderAppointmentCard(dayGroup, appointment, x + 12, y, 270, 69);
    });
}

/**
 * Tagesansicht: Alle Spalten zeigen denselben absoluten Zeitpunkt.
 * Nur die aufgedruckte lokale Uhrzeit unterscheidet sich pro Person.
 */
function renderDayView() {
    const visibleMembers = teamMembers.filter(member =>
        visibleTeamMemberIds.has(member.id)
    );

    const daySheetWidth = 140 + visibleMembers.length * 389;
    const daySheetHeight = 1800;
    const daySheet = createSvgElement('g');

    drawSvgRectangle(
        daySheet, 0, 0, daySheetWidth, daySheetHeight,
        '#102b40', '#5da1ac', {
            'stroke-width': 6,
            filter: 'url(#shadow)'
        }
    );

    drawSvgText(
        daySheet, 70, 100,
        selectedDate.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }),
        65, '#adffe2', 800
    );

    drawSvgText(
        daySheet, 70, 146,
        'Gleicher Zeitpunkt · verschiedene lokale Uhrzeiten / Datumswechsel',
        22, '#bbd6e3'
    );

    visibleMembers.forEach((member, index) => {
        drawTeamMemberDayLane(daySheet, member, index);
    });

    drawSvgText(
        daySheet, 75, daySheetHeight - 50,
        'DUNKEL = NACHT  ·  GRÜNSCHATTEN = ARBEITSZEIT 09–17 UHR (LOKAL)',
        18, '#a6cfcd', 600
    );
}

function drawTeamMemberDayLane(daySheet, member, columnIndex) {
    const x = 75 + columnIndex * 389;
    const y = 196 + columnIndex * 25;

    const lane = createSvgElement('g', {
        'data-user': member.id,
        style: 'cursor:pointer'
    }, daySheet);

    drawSvgRectangle(
        lane, x, y, 370, 1465,
        '#15364b', member.color, {
            'stroke-width': columnIndex === 0 ? 5 : 2,
            filter: 'url(#shadow)'
        }
    );

    drawSvgRectangle(
        lane, x, y, 370, 77,
        member.color, 'none', { 'fill-opacity': 0.24 }
    );

    const memberLabel = (columnIndex === 0 ? '★ ' : '') + member.name;
    drawSvgText(lane, x + 15, y + 34, memberLabel, 27, '#f5ffff', 750);
    drawSvgText(
        lane, x + 15, y + 59,
        `${member.place} · ${member.zone}`,
        15, '#c7dce4', 500
    );

    for (let hour = 0; hour < 24; hour++) {
        drawHourRow(lane, member, hour, x, y);
    }

    drawAppointmentsInDayLane(lane, member, x, y);
}

function drawHourRow(lane, member, referenceHour, x, y) {
    const hourY = y + 100 + referenceHour * 53.7;

    // Der Referenzzeitpunkt wird in der Berliner Zeitzone gebildet.
    const utcString = convertLocalTimeToUtc(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate(),
        referenceHour,
        0,
        homeTimeZone
    );

    const absoluteTime = new Date(utcString);
    const localTime = getTimeZoneParts(absoluteTime, member.zone);
    const localDay = dateStringInTimeZone(absoluteTime, member.zone);
    const referenceDay = formatLocalDate(selectedDate);

    createSvgElement('line', {
        x1: x + 10,
        y1: hourY,
        x2: x + 359,
        y2: hourY,
        stroke: '#698a98',
        'stroke-opacity': 0.3
    }, lane);

    const hourLabel = `${String(localTime.hour).padStart(2, '0')}:00`;
    drawSvgText(lane, x + 12, hourY + 20, hourLabel, 15, '#d0ecf3', 600);

    if (referenceHour % 4 === 0 || localDay !== referenceDay) {
        const dateLabel = localDay === referenceDay
            ? ''
            : localDay.slice(5).replace('-', '.');

        drawSvgText(lane, x + 93, hourY + 19, dateLabel, 11, '#8cbacb');
    }

    // Dunkel zwischen 22 und 7 Uhr, dezenter Grünschimmer bei Arbeitszeit.
    if (localTime.hour >= 22 || localTime.hour < 7) {
        drawSvgRectangle(
            lane, x + 82, hourY, 275, 53.5,
            '#040e23', 'none', {
                'fill-opacity': 0.4,
                'pointer-events': 'none'
            }
        );
    }

    if (localTime.hour >= 9 && localTime.hour < 17) {
        drawSvgRectangle(
            lane, x + 82, hourY, 275, 53.5,
            '#4ce0a4', 'none', {
                'fill-opacity': 0.055,
                'pointer-events': 'none'
            }
        );
    }
}

function drawAppointmentsInDayLane(lane, member, x, y) {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();

    const startOfDay = new Date(
        convertLocalTimeToUtc(year, month, day, 0, 0, homeTimeZone)
    );
    const endOfDay = new Date(
        convertLocalTimeToUtc(year, month, day + 1, 0, 0, homeTimeZone)
    );

    for (const appointment of appointments) {
        if (appointment.owner !== member.id) {
            continue;
        }

        const appointmentStart = appointmentUtcDate(appointment);
        const appointmentEnd = new Date(
            appointmentStart.getTime() + appointment.duration * 60000
        );

        // Termine ohne zeitliche Überschneidung mit dem Tag überspringen.
        if (appointmentEnd <= startOfDay || appointmentStart >= endOfDay) {
            continue;
        }

        const visibleStart = new Date(Math.max(appointmentStart, startOfDay));
        const visibleEnd = new Date(Math.min(appointmentEnd, endOfDay));
        const minutesFromMidnight = (visibleStart - startOfDay) / 60000;
        const visibleDurationMinutes = (visibleEnd - visibleStart) / 60000;

        const cardY = y + 100 + (minutesFromMidnight / 60) * 53.7;
        const cardHeight = Math.max(32, (visibleDurationMinutes / 60) * 53.7);

        renderAppointmentCard(
            lane, appointment, x + 113, cardY, 244, cardHeight
        );
    }
}
