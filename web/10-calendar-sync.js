/*
 * 10-calendar-sync.js: Zentraler Autosave, Versionskonflikte, Undo/Redo.
 *
 * Keine Bibliothek und kein verstecktes Framework. Die Regeln sind:
 * - Jede abgeschlossene Änderung erzeugt einen Undo-Schritt.
 * - Es kann immer nur ein Schreib-Request gleichzeitig laufen.
 * - Bei einer Versionsabweichung muss der Mensch entscheiden.
 */
const calendarHistory = {
    undo: [],
    redo: [],
    lastCommitted: '',
    serverRevision: 0,
    saving: false,
    saveAgain: false,
    conflict: null,
    initialized: false
};

function cloneAppointments(list) {
    return JSON.parse(JSON.stringify(list));
}

function showCalendarSaveStatus(message) {
    document.querySelector('#calendarSaveStatus').textContent = message;
}

function rememberCalendarChange() {
    const newSnapshot = JSON.stringify(appointments);
    if (newSnapshot === calendarHistory.lastCommitted) {
        return;
    }

    if (calendarHistory.lastCommitted) {
        calendarHistory.undo.push(JSON.parse(calendarHistory.lastCommitted));
        if (calendarHistory.undo.length > 60) {
            calendarHistory.undo.shift();
        }
    }

    calendarHistory.redo = [];
    calendarHistory.lastCommitted = newSnapshot;
    saveCalendarToServer();
}

function undoCalendarChange() {
    if (!calendarHistory.undo.length) {
        return;
    }
    calendarHistory.redo.push(cloneAppointments(appointments));
    appointments = calendarHistory.undo.pop();
    calendarHistory.lastCommitted = JSON.stringify(appointments);
    renderCurrentScene();
    saveCalendarToServer();
}

function redoCalendarChange() {
    if (!calendarHistory.redo.length) {
        return;
    }
    calendarHistory.undo.push(cloneAppointments(appointments));
    appointments = calendarHistory.redo.pop();
    calendarHistory.lastCommitted = JSON.stringify(appointments);
    renderCurrentScene();
    saveCalendarToServer();
}

async function initializeSharedCalendar() {
    try {
        const response = await fetch('/api/calendar');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const serverCalendar = await response.json();
        calendarHistory.serverRevision = serverCalendar.revision;

        // Datenmigration: Nur wenn der Server noch vollkommen leer ist.
        const localLegacyData = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
        if (serverCalendar.revision === 0 && localLegacyData) {
            appointments = JSON.parse(localLegacyData);
            calendarHistory.lastCommitted = JSON.stringify(appointments);
            calendarHistory.initialized = true;
            renderCurrentScene();
            await saveCalendarToServer();
        } else if (serverCalendar.revision === 0) {
            // Die bereits sichtbaren Demo-Termine einmalig speichern.
            calendarHistory.lastCommitted = JSON.stringify(appointments);
            calendarHistory.initialized = true;
            await saveCalendarToServer();
        } else {
            appointments = serverCalendar.appointments;
            calendarHistory.lastCommitted = JSON.stringify(appointments);
            calendarHistory.initialized = true;
            renderCurrentScene();
        }
        showCalendarSaveStatus('Zentral gespeichert · Version ' + calendarHistory.serverRevision);
    } catch (error) {
        console.error('Kalenderserver nicht erreichbar:', error);
        showCalendarSaveStatus('Offline – Änderungen nur lokal gesichert');
        calendarHistory.lastCommitted = JSON.stringify(appointments);
        calendarHistory.initialized = true;
    }
}

async function saveCalendarToServer() {
    if (!calendarHistory.initialized || calendarHistory.conflict) {
        return;
    }
    if (calendarHistory.saving) {
        calendarHistory.saveAgain = true;
        return;
    }

    calendarHistory.saving = true;
    const snapshotToSend = cloneAppointments(appointments);
    showCalendarSaveStatus('Speichere …');

    try {
        const response = await fetch('/api/calendar', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                revision: calendarHistory.serverRevision,
                appointments: snapshotToSend
            })
        });
        const payload = await response.json();

        if (response.status === 409) {
            calendarHistory.conflict = payload;
            document.querySelector('#calendarConflict').hidden = false;
            showCalendarSaveStatus('Konflikt – Entscheidung erforderlich');
            return;
        }
        if (!response.ok) {
            throw new Error(payload.error || `HTTP ${response.status}`);
        }

        calendarHistory.serverRevision = payload.revision;
        showCalendarSaveStatus('Gespeichert · Version ' + payload.revision);
    } catch (error) {
        showCalendarSaveStatus('Speichern fehlgeschlagen – lokal gesichert');
        console.error(error);
    } finally {
        calendarHistory.saving = false;
        const needsAnotherSave = calendarHistory.saveAgain ||
            JSON.stringify(snapshotToSend) !== JSON.stringify(appointments);
        calendarHistory.saveAgain = false;
        if (needsAnotherSave && !calendarHistory.conflict) {
            await saveCalendarToServer();
        }
    }
}

function resolveCalendarConflict(useLocalChanges) {
    const remoteCalendar = calendarHistory.conflict;
    if (!remoteCalendar) {
        return;
    }
    calendarHistory.serverRevision = remoteCalendar.revision;
    calendarHistory.conflict = null;
    document.querySelector('#calendarConflict').hidden = true;

    if (!useLocalChanges) {
        appointments = remoteCalendar.appointments;
        calendarHistory.undo = [];
        calendarHistory.redo = [];
        calendarHistory.lastCommitted = JSON.stringify(appointments);
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, calendarHistory.lastCommitted);
        renderCurrentScene();
        showCalendarSaveStatus('Serverstand übernommen');
        return;
    }
    // Explizites Überschreiben der Serverversion; niemals automatisch.
    saveCalendarToServer();
}

document.querySelector('#undoCalendar').addEventListener('click', undoCalendarChange);
document.querySelector('#redoCalendar').addEventListener('click', redoCalendarChange);
document.querySelector('#useServer').addEventListener('click', () => {
    resolveCalendarConflict(false);
});
document.querySelector('#keepLocal').addEventListener('click', () => {
    resolveCalendarConflict(true);
});


/** Andere Clients sehen neue Terminänderungen ohne manuelles Neuladen. */
async function refreshCalendarFromServer() {
    if (!calendarHistory.initialized ||
        calendarHistory.saving || calendarHistory.conflict) {
        return;
    }
    try {
        const response = await fetch('/api/calendar');
        if (!response.ok) {
            return;
        }
        const latest = await response.json();
        if (latest.revision === calendarHistory.serverRevision) {
            return;
        }
        if (JSON.stringify(appointments) !== calendarHistory.lastCommitted) {
            calendarHistory.conflict = latest;
            document.querySelector('#calendarConflict').hidden = false;
            return;
        }
        calendarHistory.serverRevision = latest.revision;
        appointments = latest.appointments;
        calendarHistory.lastCommitted = JSON.stringify(appointments);
        calendarHistory.undo = [];
        calendarHistory.redo = [];
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, calendarHistory.lastCommitted);
        renderCurrentScene();
        showCalendarSaveStatus('Aktualisiert · Version ' + latest.revision);
    } catch (error) {
        showCalendarSaveStatus('Verbindung unterbrochen – lokaler Stand vorhanden');
    }
}

window.setInterval(refreshCalendarFromServer, 10000);
