/*
 * 02-time.js – alles rund um Datum und Zeitzonen.
 *
 * Wichtig: Ein weltweit gemeinsamer Termin wird als UTC-Zeitpunkt
 * gespeichert. Bei der Anzeige wird er in die Zeitzone eines Menschen
 * umgerechnet. Hier verwenden wir die Browser-API Intl.DateTimeFormat.
 */

/** Gibt Jahr, Monat, Tag, Stunde und Minute für eine Zeitzone zurück. */
function getTimeZoneParts(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(date);
    const result = {};

    for (const part of parts) {
        if (part.type !== 'literal') {
            result[part.type] = Number(part.value);
        }
    }

    return result;
}

/**
 * Rechnet eine lokale Uhrzeit in einen UTC-Zeitpunkt um.
 * Die iterative Näherung wurde aus dem bisherigen Prototypen übernommen.
 * Achtung: Mehrdeutige/ausfallende Uhrzeiten bei Sommerzeitwechseln müssen
 * für eine produktive Anwendung später ausdrücklich behandelt werden.
 */
function convertLocalTimeToUtc(year, month, day, hour, minute, timeZone) {
    const requestedTimestamp = Date.UTC(year, month - 1, day, hour, minute);
    let estimatedTimestamp = requestedTimestamp;

    for (let attempt = 0; attempt < 4; attempt++) {
        const displayedTime = getTimeZoneParts(
            new Date(estimatedTimestamp),
            timeZone
        );

        const displayedTimestamp = Date.UTC(
            displayedTime.year,
            displayedTime.month - 1,
            displayedTime.day,
            displayedTime.hour,
            displayedTime.minute
        );

        const difference = requestedTimestamp - displayedTimestamp;
        estimatedTimestamp += difference;
    }

    return new Date(estimatedTimestamp).toISOString();
}

function dateStringInTimeZone(date, timeZone) {
    const localTime = getTimeZoneParts(date, timeZone);
    const month = String(localTime.month).padStart(2, '0');
    const day = String(localTime.day).padStart(2, '0');
    return `${localTime.year}-${month}-${day}`;
}

function appointmentUtcDate(appointment) {
    return new Date(appointment.at);
}
