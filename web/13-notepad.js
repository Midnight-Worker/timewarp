/*
 * 13-notepad.js – Trello-artiger Ideen- und Aufgabenblock.
 *
 * Kleine Funktionen statt großer Event-Handler:
 * - Jeder Eintrag wird direkt bearbeitet.
 * - Enter speichert die Zeile und erzeugt die nächste.
 * - Einträge werden per Drag-and-drop sortiert.
 * - Die ausklappbare Leiste stellt dieselben Einträge im Kalender bereit.
 */

const taskTray = document.querySelector('#taskTrayList');
const taskTrayToggle = document.querySelector('#toggleTaskTray');
const notepadInput = document.querySelector('#noteInput');

function createTask(text, insertionIndex = 0) {
    const task = {
        id: Date.now() + Math.random(),
        text: text,
        done: false
    };

    unplannedNotes.splice(insertionIndex, 0, task);
    saveUnplannedNotes();
    return task;
}

function addTaskFromInput() {
    const text = notepadInput.value.trim();
    if (!text) {
        return;
    }

    createTask(text);
    notepadInput.value = '';
    notepadInput.focus();
}

function updateTaskText(taskId, text) {
    const task = unplannedNotes.find(entry => entry.id === taskId);
    if (!task) {
        return;
    }

    task.text = text.trim() || 'Ohne Titel';
    saveUnplannedNotes();
}

function addNextTaskAfter(taskId) {
    const taskPosition = unplannedNotes.findIndex(task => task.id === taskId);
    const newTask = createTask('', taskPosition + 1);

    const editor = document.querySelector(`[data-task-input="${newTask.id}"]`);
    if (editor) {
        editor.focus();
    }
}

function removeTask(taskId) {
    unplannedNotes = unplannedNotes.filter(task => task.id !== taskId);
    saveUnplannedNotes();
}

function toggleTaskDone(taskId, isDone) {
    const task = unplannedNotes.find(entry => entry.id === taskId);
    if (!task) {
        return;
    }
    task.done = isDone;
    saveUnplannedNotes();
}

function reorderTask(draggedTaskId, targetTaskId) {
    if (draggedTaskId === targetTaskId) {
        return;
    }

    const sourceIndex = unplannedNotes.findIndex(task => task.id === draggedTaskId);
    const targetIndex = unplannedNotes.findIndex(task => task.id === targetTaskId);
    if (sourceIndex < 0 || targetIndex < 0) {
        return;
    }

    const [movedTask] = unplannedNotes.splice(sourceIndex, 1);
    const insertionIndex = unplannedNotes.findIndex(task => task.id === targetTaskId);
    unplannedNotes.splice(insertionIndex, 0, movedTask);
    saveUnplannedNotes();
}

function attachTaskDrag(handle, taskId) {
    handle.draggable = true;
    handle.addEventListener('dragstart', event => {
        event.dataTransfer.setData('text/plain', `midnight-note:${taskId}`);
        event.dataTransfer.setData('application/x-midnight-task', String(taskId));
        event.dataTransfer.effectAllowed = 'move';
    });
}

function createTaskRow(task) {
    const row = document.createElement('li');
    row.className = 'task-row';
    row.dataset.taskId = task.id;

    const dragHandle = document.createElement('span');
    dragHandle.className = 'task-drag-handle';
    dragHandle.textContent = '⠿';
    dragHandle.title = 'Ziehen: Reihenfolge ändern oder in Kalender einplanen';
    attachTaskDrag(dragHandle, task.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(task.done);
    checkbox.title = 'Aufgabe erledigt';
    checkbox.addEventListener('change', () => toggleTaskDone(task.id, checkbox.checked));

    const editor = document.createElement('input');
    editor.type = 'text';
    editor.className = 'task-text-input';
    editor.value = task.text;
    editor.dataset.taskInput = task.id;
    editor.placeholder = 'Aufgabe eingeben';
    editor.classList.toggle('completed', Boolean(task.done));
    editor.addEventListener('change', () => updateTaskText(task.id, editor.value));
    editor.addEventListener('blur', () => updateTaskText(task.id, editor.value));
    editor.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            updateTaskText(task.id, editor.value);
            addNextTaskAfter(task.id);
        }
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = '×';
    deleteButton.title = 'Eintrag löschen';
    deleteButton.addEventListener('click', () => removeTask(task.id));

    row.addEventListener('dragover', event => event.preventDefault());
    row.addEventListener('drop', event => {
        event.preventDefault();
        event.stopPropagation();
        const draggedId = Number(event.dataTransfer.getData('application/x-midnight-task'));
        if (Number.isFinite(draggedId)) {
            reorderTask(draggedId, task.id);
        }
    });

    row.append(dragHandle, checkbox, editor, deleteButton);
    return row;
}

function renderNotepadRows() {
    const list = document.querySelector('#noteList');
    list.replaceChildren();

    for (const task of unplannedNotes) {
        list.appendChild(createTaskRow(task));
    }
}

function renderTaskTray() {
    taskTray.replaceChildren();
    const openTasks = unplannedNotes.filter(task => !task.done && task.text.trim());

    for (const task of openTasks) {
        const taskItem = document.createElement('div');
        taskItem.className = 'tray-task';

        const dragHandle = document.createElement('span');
        dragHandle.textContent = '⠿';
        dragHandle.className = 'task-drag-handle';
        attachTaskDrag(dragHandle, task.id);

        const title = document.createElement('span');
        title.textContent = task.text;
        title.title = 'Auf einen Tag oder eine Stunde ziehen';
        attachTaskDrag(title, task.id);

        const planButton = document.createElement('button');
        planButton.textContent = 'Heute';
        planButton.title = 'Auf gewähltem Datum um 10 Uhr einplanen';
        planButton.addEventListener('click', () => scheduleUnplannedNote(task.id, selectedDate));

        taskItem.append(dragHandle, title, planButton);
        taskTray.appendChild(taskItem);
    }

    if (!openTasks.length) {
        const message = document.createElement('p');
        message.textContent = 'Noch keine offenen Aufgaben.';
        taskTray.appendChild(message);
    }
}

taskTrayToggle.addEventListener('click', () => {
    taskTray.hidden = !taskTray.hidden;
    taskTrayToggle.textContent = taskTray.hidden
        ? '▾ Aufgaben ausklappen'
        : '▴ Aufgaben einklappen';
});

notepadInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTaskFromInput();
    }
});

// Die Startdatei ist schon geladen: jetzt alle vorhandenen Einträge anzeigen.
renderUnplannedNotes();
