/*
 * 07-input.js – Maus, Tastatur und Drag-and-drop
 *
 * Hier steht ausschließlich, wie die Benutzerin oder der Benutzer
 * mit der Kalenderwelt interagiert. Die grafischen Ansichten werden
 * in 05-scenes.js gezeichnet, die Kamera in 06-camera.js gesteuert.
 */

function moveThroughTime(direction) {
    const nextDate = new Date(selectedDate);

    if (currentViewLevel <= 0) {
        selectedYearNumber += direction;
        selectedDate = new Date(
            selectedYearNumber,
            selectedDate.getMonth(),
            selectedDate.getDate()
        );
        renderCurrentScene();
        return;
    }

    if (currentViewLevel <= 2) {
        nextDate.setFullYear(nextDate.getFullYear() + direction);
    } else if (currentViewLevel === 3) {
        nextDate.setMonth(nextDate.getMonth() + direction);
    } else if (currentViewLevel === 4) {
        nextDate.setDate(nextDate.getDate() + direction * 7);
    } else {
        nextDate.setDate(nextDate.getDate() + direction);
    }

    selectedDate = nextDate;
    renderCurrentScene();
    fitCameraToScene();
}

/** Speichert eine geänderte Kartenüberschrift beim Verlassen des Feldes. */
function saveAppointmentTitle() {
    if (!editedAppointment) {
        return;
    }

    editedAppointment.title = input.value.trim() || 'Ohne Titel';
    editedAppointment = null;
    input.style.display = 'none';

    saveAppointments();
    renderCurrentScene();
}

function editAppointmentTitle(appointment, pointerEvent) {
    editedAppointment = appointment;
    input.value = appointment.title;

    const left = Math.max(12, Math.min(innerWidth - 290, pointerEvent.clientX));
    const top = Math.max(12, Math.min(innerHeight - 65, pointerEvent.clientY));

    input.style.left = `${left}px`;
    input.style.top = `${top}px`;
    input.style.display = 'block';
    input.focus();
    input.select();
}

/**
 * Mausrad-Zoom: Der Punkt unter dem Mauszeiger soll an seiner Stelle bleiben.
 * Dafür verschieben wir die Kamera-Grenzen zusammen mit der Vergrößerung.
 */
function handleCalendarWheel(pointerEvent) {
    pointerEvent.preventDefault();
    saveAppointmentTitle();

    const worldPoint = screenToWorld(pointerEvent);
    const limitedWheelDelta = Math.max(
        -100,
        Math.min(100, pointerEvent.deltaY)
    );
    const zoomFactor = Math.exp(limitedWheelDelta * 0.00125);
    const nextMagnification = zoomMagnification / zoomFactor;

    if (nextMagnification > 2.4 && currentViewLevel < 6) {
        const nextDate = dateAtWorldPosition(worldPoint) || selectedDate;
        changeViewLevel(currentViewLevel + 1, nextDate);
        return;
    }

    if (nextMagnification < 0.42 && currentViewLevel > -1) {
        changeViewLevel(currentViewLevel - 1);
        return;
    }

    cameraViewport.x = worldPoint.x - (
        worldPoint.x - cameraViewport.x
    ) * zoomFactor;

    cameraViewport.y = worldPoint.y - (
        worldPoint.y - cameraViewport.y
    ) * zoomFactor;

    cameraViewport.w *= zoomFactor;
    zoomMagnification = nextMagnification;
    updateSvgCamera();
}

function handlePointerDown(pointerEvent) {
    if (pointerEvent.button !== 0) {
        return;
    }

    saveAppointmentTitle();
    const worldPoint = screenToWorld(pointerEvent);

    const selectedAppointment = appointmentAtPointer(pointerEvent);
    const resizeHandle = pointerEvent.target.closest('[data-resize]');

    if (selectedAppointment) {
        selectAppointment(selectedAppointment);
    }

    const isDecorativeObject = pointerEvent.target.closest(
        '[data-desk], [data-year]'
    );
    const startingTimeDrawing = !selectedAppointment && !isDecorativeObject &&
        beginTimeRectangle(worldPoint);

    const visibleMembers = orderedVisibleTeamMembers();
    const appointmentMemberIndex = selectedAppointment
        ? visibleMembers.findIndex(member => member.id === selectedAppointment.owner)
        : -1;
    const firstMinute = appointmentMemberIndex >= 0
        ? getDayMinuteAtPosition(worldPoint, appointmentMemberIndex)
        : 0;
    const appointmentStartMinute = selectedAppointment
        ? Math.round((new Date(selectedAppointment.at).getTime() -
            absoluteTimeAtDayMinute(0).getTime()) / 60000)
        : 0;

    dragSession = {
        pointerId: pointerEvent.pointerId,
        drawingTime: startingTimeDrawing,
        dragMode: resizeHandle ? 'resize' : 'move',
        originalAppointment: selectedAppointment ? {
            at: selectedAppointment.at,
            owner: selectedAppointment.owner,
            duration: selectedAppointment.duration,
            grabOffsetMinutes: firstMinute - appointmentStartMinute
        } : null,
        start: worldPoint,
        last: worldPoint,
        appointment: selectedAppointment,
        interactiveObject: pointerEvent.target.closest('[data-desk],[data-year]'),
        moved: false
    };

    svg.setPointerCapture(pointerEvent.pointerId);
    svg.classList.add('moving');
}

function handlePointerMove(pointerEvent) {
    if (!dragSession || pointerEvent.pointerId !== dragSession.pointerId) {
        return;
    }

    const worldPoint = screenToWorld(pointerEvent);
    const movementX = worldPoint.x - dragSession.last.x;
    const movementY = worldPoint.y - dragSession.last.y;

    const distanceFromStart = Math.hypot(
        worldPoint.x - dragSession.start.x,
        worldPoint.y - dragSession.start.y
    );

    if (distanceFromStart > 12) {
        dragSession.moved = true;
    }

    if (dragSession.drawingTime) {
        updateTimeRectangle(worldPoint);
    } else if (dragSession.interactiveObject) {
        // Bei einem anklickbaren Gegenstand keine Kamerabewegung auslösen.
    } else if (dragSession.appointment && dragSession.moved) {
        if (currentViewLevel === 5) {
            updateDayAppointmentDuringDrag(
                dragSession.appointment,
                worldPoint,
                dragSession.dragMode,
                dragSession.originalAppointment
            );
        } else {
            moveAppointmentToWorldPosition(dragSession.appointment, worldPoint);
        }
    } else {
        cameraViewport.x -= movementX;
        cameraViewport.y -= movementY;
        updateSvgCamera();
    }

    dragSession.last = worldPoint;
}

function moveAppointmentToWorldPosition(appointment, worldPoint) {
    if (currentViewLevel < 2 || currentViewLevel > 4) {
        return;
    }

    const newDate = dateAtWorldPosition(worldPoint);
    if (!newDate) {
        return;
    }

    const oldDate = dateStringInTimeZone(
        appointmentUtcDate(appointment),
        homeTimeZone
    );

    if (formatLocalDate(newDate) === oldDate) {
        return;
    }

    const previousLocalTime = getTimeZoneParts(
        appointmentUtcDate(appointment),
        homeTimeZone
    );

    appointment.at = convertLocalTimeToUtc(
        newDate.getFullYear(),
        newDate.getMonth() + 1,
        newDate.getDate(),
        previousLocalTime.hour,
        previousLocalTime.minute,
        homeTimeZone
    );

    renderCurrentScene();
}

function finishPointerDrag(pointerEvent) {
    if (!dragSession || pointerEvent.pointerId !== dragSession.pointerId) {
        return;
    }

    const wasDrawingTime = dragSession.drawingTime;
    const wasDragged = dragSession.moved;
    ignoreNextClick = wasDragged;

    if (wasDrawingTime) {
        finishTimeRectangle(wasDragged);
    }

    if (dragSession.appointment && dragSession.moved) {
        saveAppointments();
    }

    dragSession = null;
    svg.classList.remove('moving');
}

function handleCalendarClick(pointerEvent) {
    if (ignoreNextClick) {
        ignoreNextClick = false;
        return;
    }

    const appointment = appointmentAtPointer(pointerEvent);
    if (appointment) {
        selectAppointment(appointment);
        return;
    }

    selectAppointment(null);

    const desktopObject = pointerEvent.target.closest('[data-desk]');
    if (desktopObject) {
        handleDesktopClick(desktopObject.dataset.desk);
        return;
    }

    const yearElement = pointerEvent.target.closest('[data-year]');
    if (yearElement) {
        const year = Number(yearElement.dataset.year);
        selectedYearNumber = year;
        selectedDate = new Date(
            year,
            selectedDate.getMonth(),
            selectedDate.getDate()
        );
        changeViewLevel(1);
        return;
    }

    const userElement = pointerEvent.target.closest('[data-user]');
    if (userElement && currentViewLevel === 5 && dayStackMode) {
        moveTeamMember(userElement.dataset.user, teamMemberOrder[0]);
        return;
    }

    if (userElement && userElement.dataset.user !== 'me') {
        const userId = userElement.dataset.user;
        if (visibleTeamMemberIds.has(userId)) {
            visibleTeamMemberIds.delete(userId);
        } else {
            visibleTeamMemberIds.add(userId);
        }
        renderCurrentScene();
        if (currentViewLevel === 5) {
            fitCameraToScene();
        }
    }
}

function handleDesktopClick(objectName) {
    if (objectName === 'notes') {
        document.querySelector('#notepad').style.display = 'block';
    } else if (objectName === 'planet') {
        changeViewLevel(0);
    } else if (objectName === 'news') {
        WebsiteEditor.open();
    }
}

function handleCalendarDoubleClick(pointerEvent) {
    // Ein Doppelklick auf eine Karte ist NIE ein Befehl zum Neuanlegen.
    // elementFromPoint bewahrt das echte Ziel bei SVG-Pointer-Capture.
    const elementUnderMouse = document.elementFromPoint(
        pointerEvent.clientX,
        pointerEvent.clientY
    );
    const card = elementUnderMouse && elementUnderMouse.closest('[data-card]');
    const existingAppointment = card
        ? appointments.find(item => String(item.id) === card.dataset.card)
        : appointmentAtPointer(pointerEvent);

    if (existingAppointment) {
        selectAppointment(existingAppointment);
        openAppointmentEditor(existingAppointment);
        return;
    }

    const worldPosition = screenToWorld(pointerEvent);

    // In jeder Kalenderansicht auf einem leeren Tages- oder Zeitfeld
    // einen neuen Termin anlegen. Auf Titeln bleibt Doppelklick Navigation.
    if (currentViewLevel >= 1 && currentViewLevel <= 5 &&
        createAppointmentOnEmptyCalendar(worldPosition)) {
        return;
    }

    // Außerhalb der eigentlichen Kalenderflächen hineinzoomen.
    if (currentViewLevel >= -1 && currentViewLevel < 5) {
        const chosenDate = dateAtWorldPosition(worldPosition);
        changeViewLevel(currentViewLevel + 1, chosenDate);
    }
}

function handleGlobalKeyboard(keyboardEvent) {
    const focusedElement = document.activeElement;
    const typingInForm = focusedElement && (
        focusedElement.tagName === 'INPUT' ||
        focusedElement.tagName === 'TEXTAREA' ||
        focusedElement.isContentEditable
    );

    if (typingInForm) {
        return;
    }

    const activeDialog = !appointmentDialog.hidden;
    if (activeDialog) {
        if (keyboardEvent.key === 'Escape') {
            closeAppointmentEditor();
        }
        return;
    }

    if (!keyboardEvent.ctrlKey && !keyboardEvent.metaKey && !keyboardEvent.altKey) {
        const keyForEditing = keyboardEvent.key.toLowerCase();

        if (keyForEditing === 'e' && selectedAppointment()) {
            keyboardEvent.preventDefault();
            editSelectedAppointment();
            return;
        }

        if ((keyboardEvent.key === 'Delete' || keyForEditing === 'x') &&
            selectedAppointment()) {
            keyboardEvent.preventDefault();
            deleteSelectedAppointment();
            return;
        }
    }

    if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) &&
        keyboardEvent.key.toLowerCase() === 'z') {
        keyboardEvent.preventDefault();
        if (keyboardEvent.shiftKey) {
            redoCalendarChange();
        } else {
            undoCalendarChange();
        }
        return;
    }

    if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) &&
        keyboardEvent.key.toLowerCase() === 'y') {
        keyboardEvent.preventDefault();
        redoCalendarChange();
        return;
    }

    const key = keyboardEvent.key;

    if (key === 'Escape') {
        changeViewLevel(currentViewLevel - 1);
        return;
    }

    if (key === 'PageUp' || key === 'PageDown') {
        keyboardEvent.preventDefault();
        moveThroughTime(key === 'PageUp' ? -1 : 1);
        return;
    }

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
        keyboardEvent.preventDefault();
        const direction = key === 'ArrowLeft' ? -1 : 1;

        if (currentViewLevel <= 0) {
            selectedYearNumber += direction;
            selectedDate = new Date(
                selectedYearNumber,
                selectedDate.getMonth(),
                selectedDate.getDate()
            );
            renderCurrentScene();
        } else if (currentViewLevel === 3) {
            selectedWeekIndex = Math.max(
                0,
                Math.min(
                    weeksInSelectedMonth().length - 1,
                    selectedWeekIndex + direction
                )
            );
            renderCurrentScene();
        } else {
            moveThroughTime(direction);
        }
        return;
    }

    if (key === 'Enter' && currentViewLevel === 0) {
        changeViewLevel(1);
        return;
    }

    if (key === 'Enter' && currentViewLevel === 3) {
        changeViewLevel(4, weeksInSelectedMonth()[selectedWeekIndex]);
        return;
    }

    if (key === '+' || key === '=') {
        changeViewLevel(currentViewLevel + 1);
    } else if (key === '-') {
        changeViewLevel(currentViewLevel - 1);
    }
}

// Alle DOM-Ereignisse werden am Ende der Datei registriert.
svg.addEventListener('wheel', handleCalendarWheel, { passive: false });
svg.addEventListener('pointerdown', handlePointerDown);
svg.addEventListener('pointermove', handlePointerMove);
svg.addEventListener('pointerup', finishPointerDrag);
svg.addEventListener('pointercancel', finishPointerDrag);
svg.addEventListener('click', handleCalendarClick);
svg.addEventListener('dblclick', handleCalendarDoubleClick);

input.addEventListener('blur', saveAppointmentTitle);
input.addEventListener('keydown', keyboardEvent => {
    if (keyboardEvent.key === 'Enter') {
        input.blur();
    } else if (keyboardEvent.key === 'Escape') {
        editedAppointment = null;
        input.style.display = 'none';
        renderCurrentScene();
    }
});

window.addEventListener('keydown', handleGlobalKeyboard);
