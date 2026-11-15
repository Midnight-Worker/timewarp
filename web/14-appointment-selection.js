/*
 * Auswahl eines bestehenden Termins.
 *
 * Ein einzelner Klick wählt nur aus.
 * E oder Doppelklick öffnet den Editor.
 * Entf oder X löscht die Auswahl.
 */

function selectedAppointment() {
    return appointments.find(appointment => {
        return String(appointment.id) === String(selectedAppointmentId);
    }) || null;
}

function selectAppointment(appointment) {
    selectedAppointmentId = appointment ? appointment.id : null;
    highlightSelectedAppointment();
}

function highlightSelectedAppointment() {
    const allCards = document.querySelectorAll('[data-card]');

    for (const card of allCards) {
        const isSelected = String(card.dataset.card) === String(selectedAppointmentId);
        card.classList.toggle('selected-appointment', isSelected);
    }
}

function editSelectedAppointment() {
    const appointment = selectedAppointment();

    if (appointment) {
        openAppointmentEditor(appointment);
    }
}

function deleteSelectedAppointment() {
    const appointment = selectedAppointment();

    if (!appointment) {
        return;
    }

    // Kein Dialog erforderlich; Strg+Z erlaubt sofortiges Rückgängigmachen.
    appointments = appointments.filter(item => item.id !== appointment.id);
    selectedAppointmentId = null;
    saveAppointments();
    renderCurrentScene();
}
