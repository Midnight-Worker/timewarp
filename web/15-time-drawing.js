/*
 * 15-week-drawing.js – Zeiträume aufziehen (alle Kalenderansichten)
 *
 * Wie in einem Zeichenprogramm:
 *   1. Auf einer freien Kalenderzelle die Maustaste drücken.
 *   2. Mit gedrückter Maustaste über Tage oder Minuten ziehen.
 *   3. Beim Loslassen entsteht EIN Termin für den gesamten Zeitraum.
 *
 * Die Daten werden als UTC-Beginn und Dauer in Minuten gespeichert.
 * Die sichtbaren Zeitraster werden nur zur Auswahl verwendet.
 */

let timeDrawingSession = null;

/** Prüft, ob die Weltposition wirklich im beschreibbaren Kalender liegt. */
function calendarPositionAt(worldPosition) {
    const x = worldPosition.x;
    const y = worldPosition.y;

    if (currentViewLevel === 1 || currentViewLevel === 2) {
        const monthIndex = Math.floor((y - CALENDAR_TOP) / MONTH_ROW_HEIGHT);
        const dayIndex = Math.floor((x - CALENDAR_LEFT) / DAY_COLUMN_WIDTH);

        if (monthIndex < 0 || monthIndex >= 12) return null;
        if (dayIndex < 0 || dayIndex >= daysInMonth(selectedDate.getFullYear(), monthIndex)) return null;

        return {
            date: new Date(selectedDate.getFullYear(), monthIndex, dayIndex + 1),
            minute: 0,
            owner: 'me'
        };
    }

    if (currentViewLevel === 3) {
        const dayIndex = Math.floor((x - 150) / 209);
        const numberOfDays = daysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());

        if (dayIndex < 0 || dayIndex >= numberOfDays || y < 191 || y > 1030) return null;

        return {
            date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayIndex + 1),
            minute: 0,
            owner: 'me'
        };
    }

    if (currentViewLevel === 4) {
        const dayIndex = Math.floor((x - 65) / 313);

        if (dayIndex < 0 || dayIndex >= 7 || y < 196 || y > 1386) return null;

        return {
            date: addDays(startOfWeek(selectedDate), dayIndex),
            minute: 0,
            owner: 'me'
        };
    }

    if (currentViewLevel === 5) {
        const columnIndex = getDayColumnIndex(worldPosition);
        if (columnIndex === null) return null;

        const lane = dayLaneGeometry(columnIndex);
        const minutes = getDayMinuteAtPosition(worldPosition, columnIndex);
        const insideLane = y >= lane.top + 100 && y <= lane.top + 100 + 24 * 53.7;

        if (!insideLane) return null;

        // Bei größerem Zoom immer präziser auswählen.
        const minuteStep = zoomMagnification > 1.7 ? 1 : zoomMagnification > 0.9 ? 5 : 15;
        const roundedMinute = Math.round(minutes / minuteStep) * minuteStep;

        return {
            date: new Date(selectedDate),
            minute: roundedMinute,
            owner: orderedVisibleTeamMembers()[columnIndex].id
        };
    }

    return null;
}

function absoluteTimeForCalendarPosition(position) {
    const midnight = convertLocalTimeToUtc(
        position.date.getFullYear(),
        position.date.getMonth() + 1,
        position.date.getDate(),
        0,
        0,
        homeTimeZone
    );

    // Die Minuten werden zu einem absoluten Zeitpunkt addiert.
    return new Date(new Date(midnight).getTime() + position.minute * 60000);
}

function beginTimeRectangle(worldPosition) {
    const startingPosition = calendarPositionAt(worldPosition);
    if (!startingPosition) return false;

    timeDrawingSession = {
        firstPosition: startingPosition,
        lastPosition: startingPosition,
        startWorld: worldPosition,
        endWorld: worldPosition,
        previewElement: null
    };
    return true;
}

function updateTimeRectangle(worldPosition) {
    if (!timeDrawingSession) return;

    const endingPosition = calendarPositionAt(worldPosition);
    if (endingPosition) {
        timeDrawingSession.lastPosition = endingPosition;
        timeDrawingSession.endWorld = worldPosition;
    }
    drawTimeRectanglePreview();
}

function drawTimeRectanglePreview() {
    const selection = timeDrawingSession;
    if (!selection) return;

    if (selection.previewElement) selection.previewElement.remove();

    const x = Math.min(selection.startWorld.x, selection.endWorld.x);
    const y = Math.min(selection.startWorld.y, selection.endWorld.y);
    const width = Math.max(18, Math.abs(selection.endWorld.x - selection.startWorld.x));
    const height = Math.max(18, Math.abs(selection.endWorld.y - selection.startWorld.y));

    selection.previewElement = createSvgElement('rect', {
        x: x,
        y: y,
        width: width,
        height: height,
        rx: 8,
        fill: '#77efc9',
        'fill-opacity': 0.22,
        stroke: '#c4ffe8',
        'stroke-width': 4,
        'stroke-dasharray': '12 8',
        'pointer-events': 'none'
    }, world);
}

function finishTimeRectangle(wasDragged) {
    const selection = timeDrawingSession;
    timeDrawingSession = null;

    if (!selection) return false;
    if (selection.previewElement) selection.previewElement.remove();
    if (!wasDragged) return false;

    const firstTime = absoluteTimeForCalendarPosition(selection.firstPosition);
    const lastTime = absoluteTimeForCalendarPosition(selection.lastPosition);
    const startTime = new Date(Math.min(firstTime.getTime(), lastTime.getTime()));
    let endTime;

    if (currentViewLevel === 5) {
        // Im Tagesraster sind beide Endpunkte Minutenpositionen.
        const minuteStep = zoomMagnification > 1.7 ? 1 : zoomMagnification > 0.9 ? 5 : 15;
        endTime = new Date(Math.max(firstTime.getTime(), lastTime.getTime()) + minuteStep * 60000);
    } else {
        // In Jahr, Monat und Woche sind die Zellen komplette Kalendertage.
        const laterDate = firstTime > lastTime
            ? selection.firstPosition.date
            : selection.lastPosition.date;
        const dayAfterLast = addDays(laterDate, 1);
        endTime = absoluteTimeForCalendarPosition({date: dayAfterLast, minute: 0});
    }

    const newAppointment = {
        id: Date.now() + Math.random(),
        title: 'Neuer Zeitraum',
        at: startTime.toISOString(),
        duration: Math.max(1, Math.round((endTime - startTime) / 60000)),
        owner: selection.firstPosition.owner
    };

    appointments.push(newAppointment);
    saveAppointments();
    renderCurrentScene();
    selectAppointment(newAppointment);
    openAppointmentEditor(newAppointment);
    return true;
}

/** Doppelklick auf freie Kalenderfläche: einen einzelnen Termin erstellen. */
function createAppointmentOnEmptyCalendar(worldPosition) {
    const position = calendarPositionAt(worldPosition);
    if (!position) return false;

    const appointmentStart = absoluteTimeForCalendarPosition(position);
    const duration = currentViewLevel === 5 ? 60 : 24 * 60;

    const appointment = {
        id: Date.now() + Math.random(),
        title: 'Neuer Termin',
        at: appointmentStart.toISOString(),
        duration: duration,
        owner: position.owner
    };

    appointments.push(appointment);
    saveAppointments();
    renderCurrentScene();
    selectAppointment(appointment);
    openAppointmentEditor(appointment);
    return true;
}
