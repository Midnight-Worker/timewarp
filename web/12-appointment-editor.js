/*
 * 12-appointment-editor.js
 *
 * Eine einzige Stelle für Terminbearbeitung und Löschen.
 * Zeitstempel werden in UTC gespeichert; das Formular zeigt die
 * lokale Uhrzeit des jeweiligen Benutzerkalenders.
 */

let appointmentBeingEdited = null;
let appointmentEditorIsUpdating = false;

const appointmentDialog = document.querySelector('#appointmentDialog');
const appointmentTitleField = document.querySelector('#appointmentTitle');
const appointmentStartField = document.querySelector('#appointmentStart');
const appointmentEndField = document.querySelector('#appointmentEnd');
const appointmentOwnerField = document.querySelector('#appointmentOwner');
const appointmentEditorStatus = document.querySelector('#appointmentEditorStatus');

function formatCalendarDateTime(date, timeZone) {
    const parts = getTimeZoneParts(date, timeZone);
    const dateString = dateStringInTimeZone(date, timeZone);
    const hour = String(parts.hour).padStart(2, '0');
    const minute = String(parts.minute).padStart(2, '0');

    return `${dateString}T${hour}:${minute}`;
}

function parseCalendarDateTime(value, timeZone) {
    const [datePart, timePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    return convertLocalTimeToUtc(
        year, month, day, hour, minute, timeZone
    );
}

function openAppointmentEditor(appointment) {
    appointmentBeingEdited = appointment;
    appointmentEditorIsUpdating = true;
    appointmentDialog.hidden = false;

    appointmentTitleField.value = appointment.title;
    appointmentOwnerField.replaceChildren();

    for (const member of teamMembers) {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.name} – ${member.place}`;
        appointmentOwnerField.appendChild(option);
    }

    appointmentOwnerField.value = appointment.owner;
    fillAppointmentTimeFields();
    appointmentEditorStatus.textContent = 'Änderungen werden automatisch gespeichert.';
    appointmentEditorIsUpdating = false;
    appointmentTitleField.focus();
}

function fillAppointmentTimeFields() {
    const member = findTeamMember(appointmentOwnerField.value);
    const timeZone = member ? member.zone : homeTimeZone;
    const startTime = new Date(appointmentBeingEdited.at);
    const endTime = new Date(startTime.getTime() + appointmentBeingEdited.duration * 60000);

    appointmentStartField.value = formatCalendarDateTime(startTime, timeZone);
    appointmentEndField.value = formatCalendarDateTime(endTime, timeZone);
}

function saveEditedAppointment() {
    if (!appointmentBeingEdited || appointmentEditorIsUpdating) {
        return;
    }

    const member = findTeamMember(appointmentOwnerField.value);
    const timeZone = member ? member.zone : homeTimeZone;

    try {
        const startValue = parseCalendarDateTime(appointmentStartField.value, timeZone);
        const endValue = parseCalendarDateTime(appointmentEndField.value, timeZone);
        const startTime = new Date(startValue).getTime();
        const endTime = new Date(endValue).getTime();

        if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
            appointmentEditorStatus.textContent = 'Das Ende muss nach dem Beginn liegen.';
            return;
        }

        appointmentBeingEdited.title = appointmentTitleField.value.trim() || 'Ohne Titel';
        appointmentBeingEdited.owner = appointmentOwnerField.value;
        appointmentBeingEdited.at = new Date(startTime).toISOString();
        appointmentBeingEdited.duration = Math.round((endTime - startTime) / 60000);

        saveAppointments();
        renderCurrentScene();
        appointmentEditorStatus.textContent = 'Änderung gespeichert.';
    } catch (error) {
        appointmentEditorStatus.textContent = 'Zeitangabe konnte nicht gelesen werden.';
        console.error(error);
    }
}

function closeAppointmentEditor() {
    saveEditedAppointment();
    appointmentBeingEdited = null;
    appointmentDialog.hidden = true;
}

function deleteEditedAppointment() {
    if (!appointmentBeingEdited) {
        return;
    }

    const deletedAppointmentId = appointmentBeingEdited.id;
    appointments = appointments.filter(appointment => appointment.id !== deletedAppointmentId);
    appointmentBeingEdited = null;
    selectedAppointmentId = null;
    appointmentDialog.hidden = true;

    saveAppointments();
    renderCurrentScene();
}

for (const field of [appointmentTitleField, appointmentStartField, appointmentEndField]) {
    field.addEventListener('change', saveEditedAppointment);
    field.addEventListener('blur', saveEditedAppointment);
}

appointmentOwnerField.addEventListener('change', () => {
    if (!appointmentBeingEdited) {
        return;
    }
    // Wechsel des Kalenders erhält den absoluten UTC-Zeitpunkt.
    appointmentBeingEdited.owner = appointmentOwnerField.value;
    fillAppointmentTimeFields();
    saveAppointments();
    renderCurrentScene();
});

document.querySelector('#appointmentClose').addEventListener('click', closeAppointmentEditor);
document.querySelector('#appointmentDone').addEventListener('click', closeAppointmentEditor);
document.querySelector('#appointmentDelete').addEventListener('click', deleteEditedAppointment);
