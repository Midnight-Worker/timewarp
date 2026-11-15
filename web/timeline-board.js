/*
 * timeline-board.js – Frei verschiebbare Tagebuchkarten und Beziehungsbahnen.
 *
 * Eine Karte gehört weiterhin zu einer konkreten Stunde.
 * Ihre Position innerhalb dieses Stundenblattes ist unabhängig vom Zeitpunkt.
 *
 * Datenhaltung: timeline_database.py speichert die Positionen und Verbindungen.
 * Darstellung: timeline.css und dieses Modul.
 */
(() => {
    'use strict';

    const timelineScroller = document.querySelector('#timelineScroller');
    const lineOverlay = document.querySelector('#timelineLinkOverlay');
    const relationSelector = document.querySelector('#timelineRelationType');
    const manageLinksButton = document.querySelector('#timelineManageLinks');
    const toolbarStatus = document.querySelector('#timelineStatus');

    let links = [];
    let connectionDrag = null;
    let cardDrag = null;
    let currentSaveFunction = null;
    let layoutRefreshScheduled = false;

    function report(message) {
        toolbarStatus.textContent = message;
    }

    function createSvgElement(tagName, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        for (const [name, value] of Object.entries(attributes)) {
            element.setAttribute(name, value);
        }
        return element;
    }

    function getCard(identifier) {
        return [...timelineScroller.querySelectorAll('.timeline-entry')]
            .find(card => card.dataset.entryId === identifier);
    }

    function getEntryLayer(card) {
        return card.closest('.timeline-entries');
    }

    function updateHourHeight(entryLayer) {
        if (!entryLayer) {
            return;
        }

        let contentBottom = 0;
        for (const card of entryLayer.querySelectorAll('.timeline-entry')) {
            const cardTop = Number.parseFloat(card.style.top) || 0;
            const cardBottom = cardTop + card.offsetHeight;
            contentBottom = Math.max(contentBottom, cardBottom);
        }

        // Platz unter dem letzten Objekt bewahren.
        entryLayer.style.minHeight = `${Math.max(350, contentBottom + 100)}px`;
    }

    function refreshLayout() {
        if (layoutRefreshScheduled) {
            return;
        }
        layoutRefreshScheduled = true;

        requestAnimationFrame(() => {
            layoutRefreshScheduled = false;
            for (const layer of timelineScroller.querySelectorAll('.timeline-entries')) {
                updateHourHeight(layer);
            }
            refreshLinks();
        });
    }

    function positionCard(card, entry, saveWhenFinished = false) {
        card.style.left = `${entry.paper_x}px`;
        card.style.top = `${entry.paper_y}px`;
        if (saveWhenFinished && currentSaveFunction) {
            currentSaveFunction(entry);
        }
        refreshLayout();
    }

    function beginCardDrag(pointerEvent, card, entry, saveEntry) {
        if (pointerEvent.button !== 0) {
            return;
        }
        if (pointerEvent.target.closest('button, input, textarea, a, label')) {
            return;
        }

        pointerEvent.preventDefault();
        cardDrag = {
            card,
            entry,
            saveEntry,
            startingPointerX: pointerEvent.clientX,
            startingPointerY: pointerEvent.clientY,
            startingCardX: entry.paper_x,
            startingCardY: entry.paper_y,
        };
        card.classList.add('moving');
    }

    function updateCardDrag(pointerEvent) {
        if (!cardDrag) {
            return;
        }

        const horizontalMovement = pointerEvent.clientX - cardDrag.startingPointerX;
        const verticalMovement = pointerEvent.clientY - cardDrag.startingPointerY;

        const entryLayer = getEntryLayer(cardDrag.card);
        const maxLeft = Math.max(0, entryLayer.clientWidth - cardDrag.card.offsetWidth);

        cardDrag.entry.paper_x = Math.max(
            0,
            Math.min(maxLeft, cardDrag.startingCardX + horizontalMovement)
        );
        cardDrag.entry.paper_y = Math.max(0, cardDrag.startingCardY + verticalMovement);

        positionCard(cardDrag.card, cardDrag.entry);
    }

    function finishCardDrag() {
        if (!cardDrag) {
            return;
        }
        cardDrag.card.classList.remove('moving');
        cardDrag.saveEntry(cardDrag.entry);
        cardDrag = null;
    }

    function mountEntry(card, entry, saveEntry) {
        // Alte V16-Einträge ohne Koordinaten werden nebeneinander bzw. untereinander
        // angeordnet. Erst ein Verschieben schreibt Koordinaten in die Datenbank.
        const layer = getEntryLayer(card);
        const index = [...layer.children].indexOf(card);
        entry.paper_x = entry.paper_x == null ? 20 + (index % 2) * 35 : entry.paper_x;
        entry.paper_y = entry.paper_y == null ? 75 + index * 240 : entry.paper_y;
        currentSaveFunction = saveEntry;

        const header = card.querySelector('.timeline-entry-header');
        header.classList.add('timeline-drag-handle');
        header.title = 'Hier ziehen, um diese Karte auf dem Papier zu bewegen';
        header.addEventListener('pointerdown', event => {
            beginCardDrag(event, card, entry, saveEntry);
        });

        const connectionHandle = document.createElement('button');
        connectionHandle.type = 'button';
        connectionHandle.className = 'timeline-connection-handle';
        connectionHandle.textContent = '●';
        connectionHandle.title = 'Von hier eine Beziehungsbahn zu einer anderen Karte ziehen';
        header.prepend(connectionHandle);

        connectionHandle.addEventListener('pointerdown', event => {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            connectionDrag = {
                sourceId: entry.id,
                endX: event.clientX,
                endY: event.clientY,
            };
            refreshLinks();
        });

        const sizeObserver = new ResizeObserver(refreshLayout);
        sizeObserver.observe(card);
        positionCard(card, entry);
    }

    function lineEndpoint(card, side) {
        const rectangle = card.getBoundingClientRect();
        const overlayRectangle = lineOverlay.getBoundingClientRect();
        return {
            x: rectangle.left - overlayRectangle.left + (side === 'right' ? rectangle.width : 0),
            y: rectangle.top - overlayRectangle.top + rectangle.height / 2,
        };
    }

    function createCurve(start, end) {
        const bend = Math.max(70, Math.abs(end.x - start.x) * 0.45);
        return `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ` +
            `${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
    }

    function drawConnection(start, end, type, identifier = null) {
        const isDependency = type === 'abhaengigkeit';
        const path = createSvgElement('path', {
            d: createCurve(start, end),
            fill: 'none',
            stroke: isDependency ? '#c07641' : '#468ca6',
            'stroke-width': 3,
            'stroke-linecap': 'round',
            'stroke-dasharray': isDependency ? '8 5' : 'none',
            'marker-end': isDependency ? 'url(#timelineArrow)' : 'none',
        });

        if (identifier) {
            path.classList.add('timeline-link-path');
            path.setAttribute('data-link-id', identifier);
            path.addEventListener('click', () => removeConnection(identifier));
        }
        lineOverlay.appendChild(path);
    }

    function refreshLinks() {
        if (!document.querySelector('#timelineOverlay').classList.contains('active')) {
            return;
        }

        lineOverlay.replaceChildren();
        const overlayRectangle = lineOverlay.getBoundingClientRect();
        const width = overlayRectangle.width;
        const height = overlayRectangle.height;
        lineOverlay.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const definitions = createSvgElement('defs', {});
        const arrow = createSvgElement('marker', {
            id: 'timelineArrow', markerWidth: 9, markerHeight: 9,
            refX: 7, refY: 4, orient: 'auto', markerUnits: 'userSpaceOnUse',
        });
        arrow.appendChild(createSvgElement('path', {
            d: 'M 0 0 L 8 4 L 0 8 z', fill: '#c07641',
        }));
        definitions.appendChild(arrow);
        lineOverlay.appendChild(definitions);

        for (const relation of links) {
            const sourceCard = getCard(relation.source_id);
            const targetCard = getCard(relation.target_id);
            if (!sourceCard || !targetCard) {
                continue;
            }
            const source = lineEndpoint(sourceCard, 'right');
            const target = lineEndpoint(targetCard, 'left');
            drawConnection(source, target, relation.relation_type, relation.id);
        }

        if (connectionDrag) {
            const sourceCard = getCard(connectionDrag.sourceId);
            if (sourceCard) {
                const source = lineEndpoint(sourceCard, 'right');
                const destination = {
                    x: connectionDrag.endX - overlayRectangle.left,
                    y: connectionDrag.endY - overlayRectangle.top,
                };
                drawConnection(source, destination, relationSelector.value);
            }
        }
    }

    async function loadLinks() {
        try {
            const response = await fetch('/api/timeline-links');
            if (!response.ok) {
                throw new Error(`Serverantwort: ${response.status}`);
            }
            links = await response.json();
            refreshLinks();
        } catch (error) {
            report('Verbindungen konnten nicht geladen werden: ' + error.message);
        }
    }

    async function saveConnection(sourceId, targetId) {
        try {
            const response = await fetch('/api/timeline-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_id: sourceId,
                    target_id: targetId,
                    relation_type: relationSelector.value,
                }),
            });
            if (!response.ok) {
                throw new Error(`Serverantwort: ${response.status}`);
            }
            await loadLinks();
            report('Verbindung gespeichert');
        } catch (error) {
            report('Verbindung nicht gespeichert: ' + error.message);
        }
    }

    async function removeConnection(identifier) {
        if (!window.confirm('Diese Beziehungsbahn löschen?')) {
            return;
        }
        const response = await fetch(`/api/timeline-links/${encodeURIComponent(identifier)}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            await loadLinks();
        } else {
            report('Verbindung konnte nicht gelöscht werden');
        }
    }

    async function entryDeleted(identifier) {
        links = links.filter(relation =>
            relation.source_id !== identifier && relation.target_id !== identifier
        );
        refreshLayout();
    }

    function hideLinks() {
        lineOverlay.replaceChildren();
        connectionDrag = null;
    }

    window.addEventListener('pointermove', event => {
        if (cardDrag) {
            updateCardDrag(event);
        }
        if (connectionDrag) {
            connectionDrag.endX = event.clientX;
            connectionDrag.endY = event.clientY;
            refreshLinks();
        }
    });

    window.addEventListener('pointerup', event => {
        if (cardDrag) {
            finishCardDrag();
        }
        if (!connectionDrag) {
            return;
        }

        const target = document.elementFromPoint(event.clientX, event.clientY);
        const destinationCard = target?.closest('.timeline-entry');
        const sourceId = connectionDrag.sourceId;
        connectionDrag = null;
        refreshLinks();

        if (destinationCard && destinationCard.dataset.entryId !== sourceId) {
            saveConnection(sourceId, destinationCard.dataset.entryId);
        }
    });

    timelineScroller.addEventListener('scroll', refreshLinks, { passive: true });
    window.addEventListener('resize', refreshLayout);
    manageLinksButton.addEventListener('click', async () => {
        if (links.length === 0) {
            report('Noch keine Verbindungen angelegt');
            return;
        }

        const overview = links.map((relation, index) => {
            const start = relation.source_id.slice(0, 8);
            const end = relation.target_id.slice(0, 8);
            return `${index + 1}: ${start} → ${end} (${relation.relation_type})`;
        }).join('\n');

        const selection = window.prompt(
            'Verbindungen (Nummer zum Löschen eingeben, Abbrechen zum Schließen):\n' + overview
        );
        if (selection === null) {
            return;
        }

        const chosenIndex = Number(selection) - 1;
        if (Number.isInteger(chosenIndex) && links[chosenIndex]) {
            await removeConnection(links[chosenIndex].id);
        }
    });

    window.TimelineBoard = {
        mountEntry,
        refreshLayout,
        refreshLinks,
        loadLinks,
        hideLinks,
        entryDeleted,
    };
})();
