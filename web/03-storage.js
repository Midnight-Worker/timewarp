/*
 * 03-storage.js – Kalenderkarten und ungeplante Notizen speichern.
 *
 * Die Kalendereinträge liegen in dieser Demoversion im localStorage.
 * Das Endlospapier verwendet dagegen die SQLite-API aus main.py.
 *
 * Wir behalten die bisherigen localStorage-Schlüssel bei. Dadurch
 * funktionieren die Daten aus der vorherigen Version weiterhin.
 */

const APPOINTMENTS_STORAGE_KEY = 'midnight.timeplanet.v4';
const NOTES_STORAGE_KEY = 'midnight.notes.v5';

function loadAppointments() {
    try {
        const storedData = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
        const parsedData = storedData ? JSON.parse(storedData) : null;

        if (Array.isArray(parsedData)) {
            return parsedData;
        }
    } catch (error) {
        console.warn('Termine konnten nicht geladen werden:', error);
    }

    // Beispieltermine für eine neue, noch leere Installation.
    const year = currentYear;
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    return [
        {
            id: 1,
            at: convertLocalTimeToUtc(year, month, day, 9, 0, 'Europe/Berlin'),
            owner: 'me',
            title: 'Projekt planen',
            duration: 60
        },
        {
            id: 2,
            at: convertLocalTimeToUtc(year, month, day, 10, 0, 'Australia/Sydney'),
            owner: 'alex',
            title: 'Sydney-Standup',
            duration: 45
        },
        {
            id: 3,
            at: convertLocalTimeToUtc(year, month, day, 15, 0, 'America/New_York'),
            owner: 'sam',
            title: 'Design besprechen',
            duration: 60
        },
        {
            id: 4,
            at: convertLocalTimeToUtc(year, month, day, 11, 0, 'Asia/Tokyo'),
            owner: 'kim',
            title: 'Material prüfen',
            duration: 60
        },
        {
            id: 5,
            at: convertLocalTimeToUtc(year, month, day + 1, 14, 0, 'Europe/Berlin'),
            owner: 'jo',
            title: 'Abstimmung',
            duration: 45
        }
    ];
}

function saveAppointments() {
    const serializedAppointments = JSON.stringify(appointments);
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, serializedAppointments);
    if (typeof rememberCalendarChange === "function") {
        rememberCalendarChange();
    }
}

function saveUnplannedNotes() {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(unplannedNotes));
    renderUnplannedNotes();
}

/** Aktualisiert alle Ansichten der Aufgabenliste. */
function renderUnplannedNotes() {
    if (typeof renderNotepadRows === 'function') {
        renderNotepadRows();
    }
    if (typeof renderTaskTray === 'function') {
        renderTaskTray();
    }

    document.querySelector('#noteCount').textContent =
        unplannedNotes.filter(note => !note.done).length;

    if (currentViewLevel === -1 && typeof renderCurrentScene === 'function') {
        renderCurrentScene();
    }
}

/**
 * Plant eine Notiz mit frei wählbarer Startuhrzeit.
 * Minuten werden absichtlich nicht auf Viertelstunden gerundet.
 */
function scheduleUnplannedNote(
    noteId,
    plannedDate,
    ownerId = 'me',
    startHour = 10,
    startMinute = 0
) {
    const note = unplannedNotes.find(entry => entry.id === noteId);

    if (!note || note.done) {
        return;
    }

    const calendarDate = plannedDate || selectedDate;
    const owner = teamMembers.find(member => member.id === ownerId);
    const ownerTimeZone = owner ? owner.zone : homeTimeZone;

    const appointmentStart = convertLocalTimeToUtc(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + 1,
        calendarDate.getDate(),
        startHour,
        startMinute,
        ownerTimeZone
    );

    appointments.push({
        id: Date.now() + Math.random(),
        at: appointmentStart,
        owner: ownerId,
        title: note.text,
        duration: 60
    });

    unplannedNotes = unplannedNotes.filter(entry => entry.id !== noteId);
    saveAppointments();
    saveUnplannedNotes();
    renderCurrentScene();
    document.querySelector('#notepad').style.display = 'none';
}

// Die Zeitzonenfunktionen sind vorher geladen (siehe index.html).
appointments = loadAppointments();
