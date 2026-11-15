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
        'Alle Kalender · Karten direkt bearbeiten', 23, '#b0d3dd'
    );

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(monday, dayIndex);
        drawWeekDayColumn(weekSheet, date, dayIndex);
    }
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

    const dateLabel =
        `${weekdayAbbreviations[date.getDay()]} ` +
        `${date.getDate()}.${date.getMonth() + 1}.`;

    drawSvgText(dayGroup, dayColumnLeft + 18, 247, dateLabel, 28, '#f0ffff', 700);

    const visibleAppointments = appointmentsForDate(dateKey)
        .filter(appointment => visibleTeamMemberIds.has(appointment.owner))
        .slice(0, 14);

    visibleAppointments.forEach((appointment, index) => {
        const appointmentTop = 282 + index * 77;
        renderAppointmentCard(dayGroup, appointment, dayColumnLeft + 12, appointmentTop, 270, 69);
    });
}

