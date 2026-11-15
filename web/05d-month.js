/* Monatsansicht und Wochenauswahl */

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
    drawMonthRangeBars(monthSheet, year, monthIndex, numberOfDays);
}

function drawMonthDayColumn(monthSheet, date) {
    const dayOfMonth = date.getDate();
    const dateKey = formatLocalDate(date);
    const dayColumnLeft = 150 + (dayOfMonth - 1) * 209;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    const dayGroup = createSvgElement('g', {
        'data-date': dateKey,
        style: 'cursor:pointer'
    }, monthSheet);

    drawSvgRectangle(
        dayGroup, dayColumnLeft, 191, 198, 840,
        isWeekend ? '#19384b' : '#1c4357',
        '#43687d', { 'stroke-width': 2 }
    );

    drawSvgText(
        dayGroup, dayColumnLeft + 13, 238,
        `${weekdayAbbreviations[date.getDay()]} ${dayOfMonth}`,
        27, '#e8f8ff', 650
    );

    const visibleAppointments = appointmentsForDate(dateKey).slice(0, 9);
    visibleAppointments.forEach((appointment, index) => {
        const cardY = 270 + index * 76;
        renderAppointmentCard(dayGroup, appointment, dayColumnLeft + 8, cardY, 182, 69);
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


/** Monatsbalken: sichtbaren Abschnitt eines mehrtägigen Termins zeichnen. */
function drawMonthRangeBars(parent, year, monthIndex, daysInCurrentMonth) {
    const firstDayKey = formatLocalDate(new Date(year, monthIndex, 1));
    const afterMonthKey = formatLocalDate(new Date(year, monthIndex + 1, 1));

    for (const appointment of appointments) {
        const start = appointmentUtcDate(appointment);
        const end = new Date(start.getTime() + appointment.duration * 60000);
        const startKey = dateStringInTimeZone(start, homeTimeZone);
        const endKey = dateStringInTimeZone(new Date(end.getTime() - 1), homeTimeZone);

        if (endKey < firstDayKey || startKey >= afterMonthKey) {
            continue;
        }

        const startDay = startKey < firstDayKey ? 1 : Number(startKey.slice(8));
        const endDay = endKey >= afterMonthKey
            ? daysInCurrentMonth
            : Number(endKey.slice(8));
        const ownerIndex = teamMemberOrder.indexOf(appointment.owner);
        const left = 150 + (startDay - 1) * 209 + 9;
        const width = (endDay - startDay + 1) * 209 - 18;
        const top = 918 + ownerIndex * 17;
        const group = createSvgElement('g', {'data-card': appointment.id}, parent);
        drawSvgRectangle(group, left, top, width, 12, findTeamMember(appointment.owner).color);
    }
}
