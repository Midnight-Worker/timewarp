/* Tagesansicht mit Benutzer-Zeitzonen */

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
    const laneLeft = 75 + columnIndex * 389;
    const laneTop = 196 + columnIndex * 25;

    const lane = createSvgElement('g', {
        'data-user': member.id,
        style: 'cursor:pointer'
    }, daySheet);

    drawSvgRectangle(
        lane, laneLeft, laneTop, 370, 1465,
        '#15364b', member.color, {
            'stroke-width': columnIndex === 0 ? 5 : 2,
            filter: 'url(#shadow)'
        }
    );

    drawSvgRectangle(
        lane, laneLeft, laneTop, 370, 77,
        member.color, 'none', { 'fill-opacity': 0.24 }
    );

    const memberLabel = (columnIndex === 0 ? '★ ' : '') + member.name;
    drawSvgText(lane, laneLeft + 15, laneTop + 34, memberLabel, 27, '#f5ffff', 750);
    drawSvgText(
        lane, laneLeft + 15, laneTop + 59,
        `${member.place} · ${member.zone}`,
        15, '#c7dce4', 500
    );

    for (let hour = 0; hour < 24; hour++) {
        drawHourRow(lane, member, hour, laneLeft, laneTop);
    }

    drawAppointmentsInDayLane(lane, member, laneLeft, laneTop);
}

function drawHourRow(lane, member, referenceHour, laneLeft, laneTop) {
    const hourY = laneTop + 100 + referenceHour * 53.7;

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
        x1: laneLeft + 10,
        y1: hourY,
        x2: laneLeft + 359,
        y2: hourY,
        stroke: '#698a98',
        'stroke-opacity': 0.3
    }, lane);

    const hourLabel = `${String(localTime.hour).padStart(2, '0')}:00`;
    drawSvgText(lane, laneLeft + 12, hourY + 20, hourLabel, 15, '#d0ecf3', 600);

    if (referenceHour % 4 === 0 || localDay !== referenceDay) {
        const dateLabel = localDay === referenceDay
            ? ''
            : localDay.slice(5).replace('-', '.');

        drawSvgText(lane, laneLeft + 93, hourY + 19, dateLabel, 11, '#8cbacb');
    }

    // Dunkel zwischen 22 und 7 Uhr, dezenter Grünschimmer bei Arbeitszeit.
    if (localTime.hour >= 22 || localTime.hour < 7) {
        drawSvgRectangle(
            lane, laneLeft + 82, hourY, 275, 53.5,
            '#040e23', 'none', {
                'fill-opacity': 0.4,
                'pointer-events': 'none'
            }
        );
    }

    if (localTime.hour >= 9 && localTime.hour < 17) {
        drawSvgRectangle(
            lane, laneLeft + 82, hourY, 275, 53.5,
            '#4ce0a4', 'none', {
                'fill-opacity': 0.055,
                'pointer-events': 'none'
            }
        );
    }
}

function drawAppointmentsInDayLane(lane, member, laneLeft, laneTop) {
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

        const cardY = laneTop + 100 + (minutesFromMidnight / 60) * 53.7;
        const cardHeight = Math.max(32, (visibleDurationMinutes / 60) * 53.7);

        renderAppointmentCard(
            lane, appointment, laneLeft + 113, cardY, 244, cardHeight
        );
    }
}
