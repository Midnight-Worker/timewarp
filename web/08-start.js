/*
 * 08-start.js
 *
 * Das Startmodul verbindet die Schaltflächen mit den Funktionen.
 * Es enthält keine komplizierte Kalender- oder Kameramathematik.
 */

function openNotepad() {
    const notepad = document.querySelector('#notepad');
    notepad.style.display = 'block';
    renderUnplannedNotes();
}

function closeNotepad() {
    document.querySelector('#notepad').style.display = 'none';
}

function addUnplannedNote() {
    addTaskFromInput();
}

function handleNoteDrop(pointerEvent) {
    pointerEvent.preventDefault();

    const draggedText = pointerEvent.dataTransfer.getData('text/plain');
    const notePrefix = 'midnight-note:';

    if (!draggedText.startsWith(notePrefix)) {
        return;
    }

    if (currentViewLevel <= 0) {
        return;
    }

    const noteId = Number(draggedText.slice(notePrefix.length));

    if (currentViewLevel === 5 && scheduleNoteAtMinute(noteId, pointerEvent)) {
        return;
    }

    const worldPoint = screenToWorld(pointerEvent);
    const calendarDate = dateAtWorldPosition(worldPoint);

    if (calendarDate) {
        scheduleUnplannedNote(noteId, calendarDate);
    }
}

// Ansichtsschaltflächen
for (const button of document.querySelectorAll('[data-level]')) {
    button.addEventListener('click', () => {
        const chosenLevel = Number(button.dataset.level);
        changeViewLevel(chosenLevel);
    });
}

// Navigationsleiste
const previousButton = document.querySelector('#prev');
const nextButton = document.querySelector('#next');
const todayButton = document.querySelector('#today');

previousButton.addEventListener('click', () => moveThroughTime(-1));
nextButton.addEventListener('click', () => moveThroughTime(1));
todayButton.addEventListener('click', () => {
    selectedDate = new Date();
    renderCurrentScene();
    fitCameraToScene();
});

// Notizblock
const openNotesButton = document.querySelector('#openNotes');
const closeNotesButton = document.querySelector('#closeNotes');
const addNotesButton = document.querySelector('#addNote');
const noteCalendarButton = document.querySelector('#noteCalendar');
const noteInput = document.querySelector('#noteInput');

openNotesButton.addEventListener('click', openNotepad);
closeNotesButton.addEventListener('click', closeNotepad);
addNotesButton.addEventListener('click', addUnplannedNote);

noteCalendarButton.addEventListener('click', () => {
    closeNotepad();
    changeViewLevel(2);
});


// Eine ungeplante Notiz kann per Drag-and-drop in einen Tag übernommen werden.
svg.addEventListener('dragover', pointerEvent => {
    if (pointerEvent.dataTransfer.types.includes('text/plain')) {
        pointerEvent.preventDefault();
    }
});
svg.addEventListener('drop', handleNoteDrop);

// Fensteränderungen verändern das Seitenverhältnis unserer Kamera.
window.addEventListener('resize', fitCameraToScene);

// Schnittstelle zum Tagebuch-Modul
window.paperAPI = {
    back: () => changeViewLevel(5),
    chooseDate: dateString => {
        const chosenDate = new Date(`${dateString}T12:00:00`);
        if (!Number.isNaN(chosenDate.getTime())) {
            selectedDate = chosenDate;
        }
    }
};

// Jetzt darf die erste Szene gezeichnet werden.
renderUnplannedNotes();
renderCurrentScene();
fitCameraToScene();
initializeSharedCalendar();
