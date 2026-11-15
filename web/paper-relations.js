/*
 * paper-relations.js – einfache Gruppen und Verbindungen auf dem Papier.
 *
 * Dieses Modul kennt die HTTP-API nicht. Es hält nur die Beziehungen
 * zwischen Papierobjekten fest. Die Positionen der Objekte werden weiterhin
 * von paper.js in SQLite gespeichert.
 *
 * Zum Unterricht: Auswahl mit Strg+Klick auf die Kartenüberschrift.
 * Beziehungen werden vorerst pro Datum im lokalen Browser gespeichert.
 */

const PaperRelations = (() => {
    const STORAGE_PREFIX = 'midnight.paper.relations.';
    let selectedDay = '';
    let selectedItemIds = new Set();
    let connections = [];
    let groups = {};
    let canvas = null;
    let connectionLayer = null;

    function storageKey() {
        return STORAGE_PREFIX + selectedDay;
    }

    function saveRelations() {
        const content = { connections: connections, groups: groups };
        localStorage.setItem(storageKey(), JSON.stringify(content));
    }

    function openDay(dateString, paperCanvas) {
        selectedDay = dateString;
        canvas = paperCanvas;
        selectedItemIds.clear();

        try {
            const saved = JSON.parse(localStorage.getItem(storageKey()) || '{}');
            connections = Array.isArray(saved.connections) ? saved.connections : [];
            groups = saved.groups || {};
        } catch (error) {
            connections = [];
            groups = {};
        }

        connectionLayer = document.createElementNS(
            'http://www.w3.org/2000/svg', 'svg'
        );
        connectionLayer.setAttribute('class', 'paper-connection-layer');
        connectionLayer.setAttribute('aria-hidden', 'true');
        canvas.prepend(connectionLayer);
        drawConnections();
    }

    function toggleSelected(itemId, element) {
        if (selectedItemIds.has(itemId)) {
            selectedItemIds.delete(itemId);
            element.classList.remove('relation-selected');
        } else {
            selectedItemIds.add(itemId);
            element.classList.add('relation-selected');
        }
    }

    function selectedPair() {
        if (selectedItemIds.size !== 2) {
            alert('Bitte genau zwei Karten mit Strg+Klick auswählen.');
            return null;
        }
        return [...selectedItemIds];
    }

    function connectSelected() {
        const pair = selectedPair();
        if (!pair) {
            return;
        }

        const existingConnection = connections.some(connection =>
            connection.includes(pair[0]) && connection.includes(pair[1])
        );

        if (!existingConnection) {
            connections.push(pair);
            saveRelations();
        }
        drawConnections();
    }

    function groupSelected() {
        if (selectedItemIds.size < 2) {
            alert('Mindestens zwei Karten mit Strg+Klick auswählen.');
            return;
        }

        const groupIdentifier = 'gruppe-' + Date.now();
        for (const itemId of selectedItemIds) {
            groups[itemId] = groupIdentifier;
        }
        saveRelations();
        refreshGroupOutlines();
    }

    function ungroupSelected() {
        for (const itemId of selectedItemIds) {
            delete groups[itemId];
        }
        saveRelations();
        refreshGroupOutlines();
    }

    function membersInSameGroup(itemId) {
        const groupId = groups[itemId];
        if (!groupId) {
            return [itemId];
        }
        return Object.keys(groups).filter(id => groups[id] === groupId);
    }

    function refreshGroupOutlines() {
        if (!canvas) {
            return;
        }
        for (const item of canvas.querySelectorAll('.paper-item')) {
            item.classList.toggle('paper-grouped', Boolean(groups[item.dataset.id]));
        }
    }

    function drawConnections() {
        if (!connectionLayer || !canvas) {
            return;
        }
        connectionLayer.replaceChildren();

        for (const pair of connections) {
            const first = canvas.querySelector(`[data-id="${CSS.escape(pair[0])}"]`);
            const second = canvas.querySelector(`[data-id="${CSS.escape(pair[1])}"]`);

            if (!first || !second) {
                continue;
            }

            const firstX = first.offsetLeft + first.offsetWidth / 2;
            const firstY = first.offsetTop + first.offsetHeight / 2;
            const secondX = second.offsetLeft + second.offsetWidth / 2;
            const secondY = second.offsetTop + second.offsetHeight / 2;

            const line = document.createElementNS(
                'http://www.w3.org/2000/svg', 'line'
            );
            line.setAttribute('x1', firstX);
            line.setAttribute('y1', firstY);
            line.setAttribute('x2', secondX);
            line.setAttribute('y2', secondY);
            line.setAttribute('stroke', '#0c9996');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '10 6');
            connectionLayer.appendChild(line);
        }
    }

    function removeItem(itemId) {
        delete groups[itemId];
        selectedItemIds.delete(itemId);
        connections = connections.filter(pair => !pair.includes(itemId));
        saveRelations();
        drawConnections();
    }

    // V19: Verbindungen liegen jetzt zentral im Graphen.
    // Der alte lokale Verbindungs-Button wird nicht mehr registriert.

    document.querySelector('#paperGroup').addEventListener('click', groupSelected);
    document.querySelector('#paperUngroup').addEventListener('click', ungroupSelected);

    return {
        openDay,
        toggleSelected,
        membersInSameGroup,
        drawConnections,
        refreshGroupOutlines,
        removeItem
    };
})();
