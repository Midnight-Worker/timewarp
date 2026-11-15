/* Wochenansicht und Aufgaben */

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
        'Leere Fläche ziehen: Zeitraum · Karte anklicken: auswählen · E / Entf', 23, '#b0d3dd'
    );

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(monday, dayIndex);
        drawWeekDayColumn(weekSheet, date, dayIndex);
    }
    drawWeekRangeBars(weekSheet, monday);
}

function drawWeekDayColumn(weekSheet, date, dayIndex) {
    const dateKey = formatLocalDate(date);
    const dayColumnLeft = 65 + dayIndex * 313;
    const dayGroup = createSvgElement('g', {
        'data-date': dateKey,
        style: 'cursor:pointer'
    }, weekSheet);

    drawSvgRectangle(
        dayGroup, dayColumnLeft, 196, 296, 1190,
        dayIndex % 2 ? '#18394d' : '#194257',
        '#41687b', { 'stroke-width': 2 }
    );

    if (window.TimelineShadows) {
        window.TimelineShadows.drawShadow(
            dayGroup, dateKey, dayColumnLeft + 5, 260, 286, 1100
        );
    }

    const dateLabel =
        `${weekdayAbbreviations[date.getDay()]} ` +
        `${date.getDate()}.${date.getMonth() + 1}.`;

    drawSvgText(dayGroup, dayColumnLeft + 18, 247, dateLabel, 28, '#f0ffff', 700);

    const visibleAppointments = appointmentsForDate(dateKey)
        .filter(appointment => visibleTeamMemberIds.has(appointment.owner))
        .filter(appointment => appointment.duration < 24 * 60)
        .slice(0, 14);

    visibleAppointments.forEach((appointment, index) => {
        const appointmentTop = 282 + index * 77;
        renderAppointmentCard(dayGroup, appointment, dayColumnLeft + 12, appointmentTop, 270, 69);
    });
}


/**
 * Mehrtägige Zeitbalken stehen im oberen Bereich der Wochenansicht.
 * Sie zeigen auch Termine, die vor der Woche begonnen haben oder danach enden.
 */
function drawWeekRangeBars(parent, monday) {
    const weekStart = formatLocalDate(monday);
    const weekEnd = formatLocalDate(addDays(monday, 6));
    let visibleBarIndex = 0;

    for (const appointment of appointments) {
        if (!visibleTeamMemberIds.has(appointment.owner)) {
            continue;
        }

        const start = appointmentUtcDate(appointment);
        const end = new Date(start.getTime() + appointment.duration * 60000);
        const startKey = dateStringInTimeZone(start, homeTimeZone);
        const endKey = dateStringInTimeZone(new Date(end.getTime() - 1), homeTimeZone);

        if (endKey <= startKey || endKey < weekStart || startKey > weekEnd) {
            continue;
        }

        const visibleStart = startKey < weekStart ? weekStart : startKey;
        const visibleEnd = endKey > weekEnd ? weekEnd : endKey;
        const firstDay = Math.round((new Date(visibleStart + 'T12:00:00') -
            new Date(weekStart + 'T12:00:00')) / 86400000);
        const lastDay = Math.round((new Date(visibleEnd + 'T12:00:00') -
            new Date(weekStart + 'T12:00:00')) / 86400000);

        const barLeft = 65 + firstDay * 313 + 8;
        const barWidth = (lastDay - firstDay + 1) * 313 - 16;
        const barTop = 310 + (visibleBarIndex % 9) * 63;
        const member = findTeamMember(appointment.owner);
        const group = createSvgElement('g', {
            'data-card': appointment.id,
            style: 'cursor:pointer'
        }, parent);

        drawSvgRectangle(group, barLeft, barTop, barWidth, 49, member.color,
            member.color, {'fill-opacity': 0.28, 'stroke-width': 2});

        const leftContinuation = startKey < weekStart ? '◀ ' : '';
        const rightContinuation = endKey > weekEnd ? ' ▶' : '';
        const availableCharacters = Math.max(5, Math.floor(barWidth / 13));
        const title = `${leftContinuation}${appointment.title}${rightContinuation}`;

        drawSvgText(group, barLeft + 12, barTop + 31,
            title.slice(0, availableCharacters), 18, '#ffffff', 700);

        visibleBarIndex += 1;
    }
}
