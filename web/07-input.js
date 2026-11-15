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

    dragSession = {
        pointerId: pointerEvent.pointerId,
        start: worldPoint,
        last: worldPoint,
        appointment: appointmentAtPointer(pointerEvent),
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

    if (dragSession.interactiveObject) {
        // Bei einem anklickbaren Gegenstand keine Kamerabewegung auslösen.
    } else if (dragSession.appointment && dragSession.moved) {
        moveAppointmentToWorldPosition(dragSession.appointment, worldPoint);
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

    ignoreNextClick = dragSession.moved;
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
        editAppointmentTitle(appointment, pointerEvent);
        return;
    }

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
        alert('Zeitung: Hier kommt später der Website-Editor hin.');
    }
}

function handleCalendarDoubleClick(pointerEvent) {
    if (appointmentAtPointer(pointerEvent)) {
        return;
    }

    const worldPoint = screenToWorld(pointerEvent);
    const clickedDate = dateAtWorldPosition(worldPoint);

    if (currentViewLevel <= 2) {
        changeViewLevel(currentViewLevel + 1, clickedDate);
        return;
    }

    if (currentViewLevel === 3) {
        changeViewLevel(4, clickedDate);
        return;
    }

    if (currentViewLevel === 4) {
        changeViewLevel(5, clickedDate);
        return;
    }

    createAppointmentAtPointer(pointerEvent, worldPoint);
}

function createAppointmentAtPointer(pointerEvent, worldPoint) {
    const userElement = pointerEvent.target.closest('[data-user]');
    const ownerId = userElement ? userElement.dataset.user : 'me';

    const visibleMembers = teamMembers.filter(member =>
        visibleTeamMemberIds.has(member.id)
    );
    const memberColumnIndex = visibleMembers.findIndex(member =>
        member.id === ownerId
    );

    // In der Tagesansicht entsprechen 53.7 SVG-Einheiten etwa einer Stunde.
    const hour = Math.max(
        0,
        Math.min(23, Math.round((worldPoint.y - 296 -
            (ownerId === 'me' ? 0 : 25)) / 53.7))
    );

    const newAppointment = {
        id: Date.now() + Math.random(),
        at: convertLocalTimeToUtc(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            selectedDate.getDate(),
            hour,
            0,
            homeTimeZone
        ),
        owner: ownerId,
        title: 'Neue Aufgabe',
        duration: 60
    };

    appointments.push(newAppointment);
    saveAppointments();
    renderCurrentScene();
    editAppointmentTitle(newAppointment, pointerEvent);
}

function handleGlobalKeyboard(keyboardEvent) {
    if (document.activeElement === input) {
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
