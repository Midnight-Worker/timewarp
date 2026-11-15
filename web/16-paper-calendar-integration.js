/*
 * Verbindung zwischen Zeitpapier und Kalender.
 *
 * Grundregel: Ein Termin existiert genau EINMAL in der Kalender-API.
 * Notizen ohne Termin können aus dem Papier-Vorrat eingeplant werden.
 * Der Kalendereintrag verweist mit source_entry_id auf die Notiz.
 */
(() => {
    'use strict';

    const drawer = document.querySelector('#paperAppointmentInbox');
    const toggleButton = document.querySelector('#togglePaperInbox');
    const content = document.querySelector('#paperInboxContent');
    const list = document.querySelector('#paperInboxItems');
    const status = document.querySelector('#paperInboxStatus');
    const transferType = 'application/x-midnight-paper-entry';

    async function loadUnplannedEntries() {
        status.textContent = 'Lade Papiernotizen …';
        try {
            const response = await fetch('/api/calendar/inbox');
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            const entries = await response.json();
            renderUnplannedEntries(entries);
            status.textContent = `${entries.length} noch nicht eingeplante Einträge`;
        } catch (error) {
            status.textContent = 'Laden fehlgeschlagen: ' + error.message;
        }
    }

    function renderUnplannedEntries(entries) {
        list.replaceChildren();

        for (const entry of entries) {
            const row = document.createElement('div');
            row.className = 'paper-inbox-entry';
            row.draggable = true;
            row.title = 'Auf den Kalender ziehen';

            const label = document.createElement('span');
            label.textContent = entry.content.slice(0, 100);
            row.appendChild(label);

            row.addEventListener('dragstart', event => {
                event.dataTransfer.setData(transferType, JSON.stringify(entry));
                event.dataTransfer.effectAllowed = 'copy';
            });

            const quickAdd = document.createElement('button');
            quickAdd.type = 'button';
            quickAdd.textContent = 'Einplanen';
            quickAdd.title = 'Am aktuell ausgewählten Kalendertag einplanen';
            quickAdd.addEventListener('click', () => {
                const startDate = new Date(selectedDate);
                startDate.setHours(12, 0, 0, 0);
                createCalendarAppointmentFromPaper(entry, startDate, 'me');
            });
            row.appendChild(quickAdd);
            list.appendChild(row);
        }
    }

    function createCalendarAppointmentFromPaper(entry, startDate, owner) {
        if (!calendarHistory.initialized || calendarHistory.conflict) {
            status.textContent = 'Kalenderserver nicht bereit. Bitte zuerst synchronisieren.';
            return;
        }

        // In der Kalender-Datenbank ist dieser Termin die maßgebliche Entität.
        // Die Notiz bleibt über die Quell-ID mit dem Termin verknüpft.
        const newAppointment = {
            id: Date.now() + Math.random(),
            at: startDate.toISOString(),
            duration: currentViewLevel === 5 ? 60 : 1440,
            owner: owner,
            title: entry.content.slice(0, 140) || 'Neue Aufgabe',
            source_entry_id: entry.id
        };

        appointments.push(newAppointment);
        saveAppointments();
        renderCurrentScene();
        selectAppointment(newAppointment);
        openAppointmentEditor(newAppointment);
        loadUnplannedEntries();
    }

    function handlePaperDrop(event) {
        const transfer = event.dataTransfer.getData(transferType);
        if (!transfer) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();

        const calendarPoint = screenToWorld(event);
        const calendarPosition = calendarPositionAt(calendarPoint);
        if (!calendarPosition) {
            status.textContent = 'Bitte auf eine freie Tages- oder Stundenfläche ziehen.';
            return;
        }

        const entry = JSON.parse(transfer);
        const appointmentStart = absoluteTimeForCalendarPosition(calendarPosition);
        createCalendarAppointmentFromPaper(
            entry, appointmentStart, calendarPosition.owner
        );
    }

    toggleButton.addEventListener('click', () => {
        content.hidden = !content.hidden;
        toggleButton.setAttribute('aria-expanded', String(!content.hidden));
        if (!content.hidden) {
            loadUnplannedEntries();
        }
    });

    // Capture-Phase: verhindert, dass der ältere Notizblock-Handler
    // versehentlich ein zweites Objekt aus demselben Drop erzeugt.
    svg.addEventListener('dragover', event => {
        if (event.dataTransfer.types.includes(transferType)) {
            event.preventDefault();
        }
    }, true);
    svg.addEventListener('drop', handlePaperDrop, true);

    window.PaperCalendarIntegration = {
        refreshInbox: loadUnplannedEntries
    };
})();
