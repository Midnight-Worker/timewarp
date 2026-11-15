/*
 * 09-minute-planning.js
 *
 * Eine Notiz wird an einer präzisen Uhrzeit abgelegt.
 * Die Y-Achse der Tagesansicht ist eine gemeinsame Berliner Referenzzeit.
 * Dadurch können wir denselben Moment in Australien und Berlin anzeigen.
 */

const DAY_VIEW_FIRST_HOUR_Y = 296;
const DAY_VIEW_HOUR_HEIGHT = 53.7;
const MINUTES_IN_HOUR = 60;

function getMinutePlanningTarget(pointerEvent) {
    if (currentViewLevel !== 5) {
        return null;
    }

    const point = screenToWorld(pointerEvent);
    const visibleMembers = orderedVisibleTeamMembers();

    // Die Spaltenbreite entspricht der Berechnung in 05f-day.js.
    const columnIndex = getDayColumnIndex(point);
    const member = columnIndex === null ? null : visibleMembers[columnIndex];

    if (!member) {
        return null;
    }

    const columnPosition = dayLaneGeometry(columnIndex);
    const firstHourY = columnPosition.top + 100;
    const minuteOffset = Math.round(
        (point.y - firstHourY) * MINUTES_IN_HOUR / DAY_VIEW_HOUR_HEIGHT
    );

    if (minuteOffset < 0 || minuteOffset >= 24 * MINUTES_IN_HOUR) {
        return null;
    }

    const referenceHour = Math.floor(minuteOffset / MINUTES_IN_HOUR);
    const referenceMinute = minuteOffset % MINUTES_IN_HOUR;

    // Die Tageslinien aller Personen verwenden dieselbe absolute Zeitachse.
    const universalStart = convertLocalTimeToUtc(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate(),
        referenceHour,
        referenceMinute,
        homeTimeZone
    );

    return {
        member: member,
        utcStart: universalStart,
        hour: referenceHour,
        minute: referenceMinute
    };
}

/** Übernimmt eine Notiz, ohne den absoluten Zeitpunkt zu verändern. */
function scheduleNoteAtMinute(noteId, pointerEvent) {
    const planningTarget = getMinutePlanningTarget(pointerEvent);

    if (!planningTarget) {
        return false;
    }

    const note = unplannedNotes.find(entry => entry.id === noteId);

    if (!note) {
        return false;
    }

    appointments.push({
        id: Date.now() + Math.random(),
        at: planningTarget.utcStart,
        owner: planningTarget.member.id,
        title: note.text,
        duration: 60
    });

    unplannedNotes = unplannedNotes.filter(entry => entry.id !== noteId);
    saveAppointments();
    saveUnplannedNotes();
    renderCurrentScene();
    document.querySelector('#notepad').style.display = 'none';
    return true;
}
