/*
 * 01-state.js – zentraler Anwendungszustand.
 *
 * Die Dateien werden in index.html bewusst in einer festen Reihenfolge
 * geladen. Dadurch brauchen wir für dieses Lernprojekt noch keinen Bundler.
 */

'use strict';

const svg = document.querySelector('#space');
const world = document.querySelector('#world');
const input = document.querySelector('#editor');
const svgNamespace = 'http://www.w3.org/2000/svg';

const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const weekdayAbbreviations = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const teamMembers = [
    { id: 'me', name: 'Ich', zone: 'Europe/Berlin', place: 'Berlin', color: '#75f0d2' },
    { id: 'alex', name: 'Alex', zone: 'Australia/Sydney', place: 'Sydney', color: '#ffba6e' },
    { id: 'sam', name: 'Sam', zone: 'America/New_York', place: 'New York', color: '#91b9ff' },
    { id: 'kim', name: 'Kim', zone: 'Asia/Tokyo', place: 'Tokio', color: '#dc9afa' },
    { id: 'jo', name: 'Jo', zone: 'Europe/London', place: 'London', color: '#f492a3' }
];

const homeTimeZone = teamMembers[0].zone;
const currentDate = new Date();
const currentYear = currentDate.getFullYear();

// Ansicht: -1 = Schreibtisch, 0 = Globus, 1 = Jahresdeck, ... 6 = Papier.
let currentViewLevel = -1;
let selectedDate = new Date();
let selectedYearNumber = currentYear;
let selectedWeekIndex = 0;

// SVG-Weltkoordinaten: linke obere Ecke (x, y) und Größe (w, h).
let cameraViewport = {
    x: -1300,
    y: -700,
    w: 2600,
    h: 1480
};
let zoomMagnification = 1;

// Eingabestatus
let dragSession = null;
let ignoreNextClick = false;
let editedAppointment = null;
let selectedAppointmentId = null;
let weekDrawingSession = null;

// Gemeinsame Kalenderdaten der lokalen Demonstration
let visibleTeamMemberIds = new Set(teamMembers.map(member => member.id));

// Diese Reihenfolge gilt für den räumlichen Tagesstapel.
let teamMemberOrder = teamMembers.map(member => member.id);
let dayStackMode = false;

function dayLaneGeometry(columnIndex) {
    if (dayStackMode) {
        return {
            left: 75 + columnIndex * 55,
            top: 196 + columnIndex * 34
        };
    }
    return {
        left: 75 + columnIndex * 389,
        top: 196 + columnIndex * 25
    };
}


function orderedVisibleTeamMembers() {
    return teamMemberOrder
        .map(memberId => teamMembers.find(member => member.id === memberId))
        .filter(member => member && visibleTeamMemberIds.has(member.id));
}

function moveTeamMember(memberId, beforeMemberId) {
    const originalIndex = teamMemberOrder.indexOf(memberId);
    if (originalIndex < 0 || memberId === beforeMemberId) {
        return;
    }
    teamMemberOrder.splice(originalIndex, 1);
    const targetIndex = beforeMemberId
        ? teamMemberOrder.indexOf(beforeMemberId)
        : teamMemberOrder.length;
    teamMemberOrder.splice(targetIndex, 0, memberId);
    localStorage.setItem('midnight.teamOrder.v12', JSON.stringify(teamMemberOrder));
    renderCurrentScene();
}

try {
    const savedOrder = JSON.parse(localStorage.getItem('midnight.teamOrder.v12'));
    if (Array.isArray(savedOrder) &&
        savedOrder.length === teamMembers.length &&
        teamMembers.every(member => savedOrder.includes(member.id))) {
        teamMemberOrder = savedOrder;
    }
} catch (error) {
    console.warn('Die Reihenfolge der Personen konnte nicht geladen werden:', error);
}
let appointments = [];
let unplannedNotes = [];

try {
    const storedNotes = localStorage.getItem('midnight.notes.v5');
    unplannedNotes = storedNotes ? JSON.parse(storedNotes) : [];
} catch (error) {
    console.warn('Gespeicherte Notizen konnten nicht gelesen werden:', error);
}

/** Wandelt ein lokales Datum in YYYY-MM-DD um. */
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(date, numberOfDays) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + numberOfDays
    );
}

function startOfWeek(date) {
    // JavaScript: Sonntag = 0, Montag = 1. Unsere Woche startet montags.
    const daysSinceMonday = (date.getDay() + 6) % 7;
    return addDays(date, -daysSinceMonday);
}

function daysInMonth(year, monthIndex) {
    // Tag 0 des Folgemonats ist der letzte Tag des aktuellen Monats.
    return new Date(year, monthIndex + 1, 0).getDate();
}
