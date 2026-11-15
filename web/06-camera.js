/*
 * 06-camera.js
 *
 * Die Kamera zeigt immer nur einen Ausschnitt unserer SVG-Welt.
 * Kamera-Position und Größe stehen in cameraViewport (siehe 01-state.js).
 *
 * Je kleiner der sichtbare Ausschnitt, desto größer erscheint die Welt.
 * Die eigentliche Vergrößerung erledigt der Browser über SVG viewBox.
 */

const VIEW_LABELS = {
    '-1': 'Schreibtisch',
    0: 'Globus',
    1: '11 Jahre',
    2: 'Jahr',
    3: 'Monat',
    4: 'Woche',
    5: 'Tag · Zeitzonen',
    6: 'Endlospapier'
};

/** Berechnet die Größe der aktuellen Szene in SVG-Weltkoordinaten. */
function sceneDimensions() {
    if (currentViewLevel === -1) {
        return [2800, 1640];
    }

    if (currentViewLevel === 0) {
        return [2600, 1500];
    }

    if (currentViewLevel <= 2) {
        return [YEAR_WIDTH + 500, YEAR_HEIGHT + 410];
    }

    if (currentViewLevel === 3) {
        const numberOfDays = daysInMonth(
            selectedDate.getFullYear(),
            selectedDate.getMonth()
        );
        return [170 + numberOfDays * 209, 1140];
    }

    if (currentViewLevel === 4) {
        return [2260, 1470];
    }

    if (currentViewLevel === 5) {
        const visibleMembers = teamMembers.filter(member =>
            visibleTeamMemberIds.has(member.id)
        );
        return [140 + visibleMembers.length * 389, 1800];
    }

    return [2300, 1450];
}

/** Richtet die SVG-Kamera so aus, dass die komplette Szene sichtbar ist. */
function fitCameraToScene() {
    const [sceneWidth, sceneHeight] = sceneDimensions();
    const screenAspectRatio = Math.max(
        0.2,
        svg.clientWidth / svg.clientHeight
    );

    cameraViewport.w = Math.max(
        sceneWidth + 130,
        (sceneHeight + 110) * screenAspectRatio
    );
    cameraViewport.h = cameraViewport.w / screenAspectRatio;

    if (currentViewLevel <= 0) {
        cameraViewport.x = -cameraViewport.w / 2;
        cameraViewport.y = -cameraViewport.h / 2;
    } else {
        cameraViewport.x = (sceneWidth - cameraViewport.w) / 2;
        cameraViewport.y = (sceneHeight - cameraViewport.h) / 2;
    }

    zoomMagnification = 1;
    updateSvgCamera();
}

/** Überträgt die aktuelle Kameraposition an das SVG und aktualisiert das HUD. */
function updateSvgCamera() {
    // Das Seitenverhältnis des sichtbaren Ausschnitts bleibt konstant.
    cameraViewport.h = cameraViewport.w * svg.clientHeight / svg.clientWidth;

    const viewBox = [
        cameraViewport.x,
        cameraViewport.y,
        cameraViewport.w,
        cameraViewport.h
    ].join(' ');

    svg.setAttribute('viewBox', viewBox);

    const label = VIEW_LABELS[currentViewLevel];
    const magnification = zoomMagnification.toFixed(2);
    document.querySelector('#status').textContent =
        `${label} · Feiner Zoom ${magnification}× · Mausrad / Ziehen`;

    const progressWithinLevel = Math.min(
        1,
        Math.max(0, Math.log(zoomMagnification) / Math.log(2))
    );
    const progressPercent = (
        (currentViewLevel + 1 + progressWithinLevel) / 7
    ) * 93 + 5;

    document.querySelector('#zoomfill').style.width = `${progressPercent}%`;
}

/** Zeichnet die zur Zoomstufe gehörende Welt und die Benutzerleiste. */
function renderCurrentScene() {
    world.replaceChildren();

    if (currentViewLevel === -1) {
        renderDesktop();
    } else if (currentViewLevel === 0) {
        renderGlobe();
    } else if (currentViewLevel <= 2) {
        renderYearView();
    } else if (currentViewLevel === 3) {
        renderMonthView();
    } else if (currentViewLevel === 4) {
        renderWeekView();
    } else if (currentViewLevel === 5) {
        renderDayView();
    }

    updateDateHeading();
    updateViewButtons();
    updateTeamMemberButtons();
}

function updateDateHeading() {
    const year = selectedDate.getFullYear();
    let heading;

    if (currentViewLevel === -1) {
        heading = 'Schreibtisch · Ideen sammeln';
    } else if (currentViewLevel === 0) {
        heading = `Globus · ${year}`;
    } else if (currentViewLevel === 1) {
        heading = `${year - 5} – ${year + 5}`;
    } else if (currentViewLevel === 2) {
        heading = String(year);
    } else if (currentViewLevel === 3) {
        heading = `${monthNames[selectedDate.getMonth()]} ${year}`;
    } else if (currentViewLevel === 4) {
        heading = `Woche · ${startOfWeek(selectedDate).toLocaleDateString('de-DE')}`;
    } else {
        heading = selectedDate.toLocaleDateString('de-DE');
    }

    document.querySelector('#range').textContent = heading;
}

function updateViewButtons() {
    document.querySelectorAll('[data-level]').forEach(button => {
        const buttonLevel = Number(button.dataset.level);
        button.classList.toggle('active', buttonLevel === currentViewLevel);
    });
}

function updateTeamMemberButtons() {
    const container = document.querySelector('#people');
    container.replaceChildren();

    for (const member of teamMembers) {
        const isVisible = visibleTeamMemberIds.has(member.id);
        const button = document.createElement('button');

        button.className = 'person';
        button.style.borderColor = member.color;
        button.style.opacity = isVisible ? '1' : '0.38';

        const marker = isVisible ? '●' : '○';
        const location = currentViewLevel === 5 ? ` · ${member.place}` : '';
        button.innerText = `${marker} ${member.name}${location}`;
        button.title = member.zone;

        button.addEventListener('click', () => {
            // Die eigene Tagesebene bleibt immer sichtbar.
            if (member.id === 'me') {
                return;
            }

            if (visibleTeamMemberIds.has(member.id)) {
                visibleTeamMemberIds.delete(member.id);
            } else {
                visibleTeamMemberIds.add(member.id);
            }

            renderCurrentScene();
            if (currentViewLevel === 5) {
                fitCameraToScene();
            }
        });

        container.appendChild(button);
    }
}

/** Wechselt zwischen Schreibtisch, Globus, Jahr, Monat, Woche, Tag und Papier. */
function changeViewLevel(nextLevel, newDate = null) {
    saveAppointmentTitle();
    currentViewLevel = Math.max(-1, Math.min(6, nextLevel));

    if (newDate) {
        selectedDate = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate()
        );
    }

    if (currentViewLevel === 3) {
        selectedWeekIndex = 0;
    }

    renderCurrentScene();
    fitCameraToScene();
    svg.style.display = currentViewLevel === 6 ? 'none' : 'block';

    if (window.Paper) {
        window.Paper.activate(
            currentViewLevel === 6,
            formatLocalDate(selectedDate)
        );
    }
}

/** Übersetzt Bildschirm-Pixel in die Koordinaten unserer SVG-Welt. */
function screenToWorld(pointerEvent) {
    const screenPoint = svg.createSVGPoint();
    screenPoint.x = pointerEvent.clientX;
    screenPoint.y = pointerEvent.clientY;

    const inverseMatrix = svg.getScreenCTM().inverse();
    return screenPoint.matrixTransform(inverseMatrix);
}

/** Bestimmt aus der Weltposition das betroffene Kalenderdatum. */
function dateAtWorldPosition(worldPoint) {
    if (currentViewLevel >= 1 && currentViewLevel <= 2) {
        const monthIndex = Math.floor((worldPoint.y - CALENDAR_TOP) / MONTH_ROW_HEIGHT);
        const dayOfMonth = Math.floor((worldPoint.x - CALENDAR_LEFT) / DAY_COLUMN_WIDTH) + 1;
        const validMonth = monthIndex >= 0 && monthIndex < 12;
        const validDay = validMonth && dayOfMonth >= 1 &&
            dayOfMonth <= daysInMonth(selectedDate.getFullYear(), monthIndex);

        if (validDay) {
            return new Date(selectedDate.getFullYear(), monthIndex, dayOfMonth);
        }
        return null;
    }

    if (currentViewLevel === 3) {
        const dayOfMonth = Math.floor((worldPoint.x - 150) / 209) + 1;
        const lastDay = daysInMonth(
            selectedDate.getFullYear(),
            selectedDate.getMonth()
        );

        if (dayOfMonth >= 1 && dayOfMonth <= lastDay) {
            return new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                dayOfMonth
            );
        }
        return null;
    }

    if (currentViewLevel === 4) {
        const dayIndex = Math.floor((worldPoint.x - 65) / 313);
        if (dayIndex >= 0 && dayIndex < 7) {
            return addDays(startOfWeek(selectedDate), dayIndex);
        }
        return null;
    }

    return selectedDate;
}

/** Liefert die angeklickte Terminkarte oder null. */
function appointmentAtPointer(pointerEvent) {
    const cardElement = pointerEvent.target.closest('[data-card]');
    if (!cardElement) {
        return null;
    }

    return appointments.find(appointment =>
        String(appointment.id) === cardElement.dataset.card
    ) || null;
}
