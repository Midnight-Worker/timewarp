/*
 * Die Endlospapier-Welt zeigt drei Arten echter Datenobjekte:
 *  - Papierobjekte aus paper_items (werden von paper.js gezeichnet),
 *  - zeitlich markierte Notizen aus timeline_entries,
 *  - Kalendertermine aus calendar_state.
 *
 * Es gibt KEINE zweite Termin-Kopie. Die Verbindungen und die Positionen
 * der fremden Karten werden separat in SQLite gespeichert.
 *
 * Bedienung: Den runden Anschluss einer Karte auf eine andere Karte ziehen.
 */
const FreePaperGraph = (() => {
    'use strict';

    const paperCanvas = document.querySelector('#paperCanvas');
    const relationType = document.querySelector('#freePaperRelationType');
    const status = document.querySelector('#paperMsg');

    let selectedDay = '';
    let allConnections = [];
    let graphLayer = null;
    let lineDrag = null;
    let nodeDrag = null;
    let loadGeneration = 0;

    function notify(message) {
        status.textContent = message;
    }

    function createElement(tagName, className, textContent = '') {
        const element = document.createElement(tagName);
        element.className = className;
        element.textContent = textContent;
        return element;
    }

    function findNode(nodeId) {
        return [...paperCanvas.querySelectorAll('[data-node-id]')]
            .find(element => element.dataset.nodeId === nodeId);
    }

    async function requestJson(address, options = {}) {
        const response = await fetch(address, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        return data;
    }

    function jsonOptions(value) {
        return {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
        };
    }

    function makeConnectionPoint(card) {
        const header = card.querySelector('header');
        if (!header || header.querySelector('.graph-socket')) {
            return;
        }

        const socket = createElement('button', 'graph-socket');
        socket.type = 'button';
        socket.title = 'Verbindung zu einem anderen Objekt ziehen';
        socket.setAttribute('aria-label', 'Verbindung zeichnen');
        header.prepend(socket);

        socket.addEventListener('pointerdown', event => {
            if (event.button !== 0) {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            lineDrag = {
                sourceId: card.dataset.nodeId,
                pointerX: event.clientX,
                pointerY: event.clientY
            };
            socket.setPointerCapture(event.pointerId);
            refreshConnections();
        });

        socket.addEventListener('pointermove', event => {
            if (!lineDrag) {
                return;
            }
            lineDrag.pointerX = event.clientX;
            lineDrag.pointerY = event.clientY;
            refreshConnections();
        });

        socket.addEventListener('pointerup', async event => {
            if (!lineDrag) {
                return;
            }
            const sourceId = lineDrag.sourceId;
            const elementUnderPointer = document.elementFromPoint(
                event.clientX, event.clientY
            );
            const targetCard = elementUnderPointer?.closest('[data-node-id]');
            lineDrag = null;
            refreshConnections();
            if (!targetCard || targetCard.dataset.nodeId === sourceId) {
                return;
            }
            try {
                await requestJson('/api/free-graph/connection', jsonOptions({
                    day: selectedDay,
                    source_id: sourceId,
                    target_id: targetCard.dataset.nodeId,
                    relation_type: relationType.value
                }));
                await reloadConnections();
                notify('Beziehung gespeichert');
            } catch (error) {
                notify('Verbindung fehlgeschlagen: ' + error.message);
            }
        });
    }

    function decorateExistingItem(card, item) {
        card.dataset.nodeId = 'paper:' + item.id;
        makeConnectionPoint(card);
        refreshConnections();
    }

    function paperPositionFromScreen(screenX, screenY) {
        const canvasBounds = paperCanvas.getBoundingClientRect();
        const scaling = Number(
            new DOMMatrix(getComputedStyle(paperCanvas).transform).a
        ) || 1;
        return {
            x: (screenX - canvasBounds.left) / scaling,
            y: (screenY - canvasBounds.top) / scaling
        };
    }

    function beginNodeDrag(event, card, node) {
        if (event.button !== 0 || event.target.closest('button')) {
            return;
        }
        const originalX = Number.parseFloat(card.style.left) || 0;
        const originalY = Number.parseFloat(card.style.top) || 0;
        nodeDrag = {
            node,
            card,
            startX: event.clientX,
            startY: event.clientY,
            originalX,
            originalY
        };
        card.querySelector('header').setPointerCapture(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
    }

    function updateNodeDrag(event) {
        if (!nodeDrag) {
            return;
        }
        const transform = new DOMMatrix(
            getComputedStyle(paperCanvas).transform
        );
        const scaling = transform.a || 1;
        const movementX = (event.clientX - nodeDrag.startX) / scaling;
        const movementY = (event.clientY - nodeDrag.startY) / scaling;
        nodeDrag.card.style.left = `${nodeDrag.originalX + movementX}px`;
        nodeDrag.card.style.top = `${nodeDrag.originalY + movementY}px`;
        refreshConnections();
    }

    async function finishNodeDrag() {
        if (!nodeDrag) {
            return;
        }
        const moving = nodeDrag;
        nodeDrag = null;
        try {
            await requestJson('/api/free-graph/position', jsonOptions({
                day: selectedDay,
                node_id: moving.node.node_id,
                x: Number.parseFloat(moving.card.style.left),
                y: Number.parseFloat(moving.card.style.top)
            }));
        } catch (error) {
            notify('Position nicht gespeichert: ' + error.message);
        }
    }

    function renderNodeContent(card, node) {
        const body = createElement('div', 'paper-body');
        const title = node.title || 'Ohne Titel';

        if (node.kind === 'image' && node.media_id) {
            const image = createElement('img', 'preview');
            image.src = '/media/' + encodeURIComponent(node.media_id);
            image.alt = title;
            body.appendChild(image);
        } else if (node.kind === 'audio' && node.media_id) {
            const player = createElement('audio', '');
            player.controls = true;
            player.preload = 'none';
            player.src = '/media/' + encodeURIComponent(node.media_id);
            body.appendChild(player);
        } else if (node.kind === 'video' && node.media_id) {
            const player = createElement('video', '');
            player.controls = true;
            player.preload = 'metadata';
            player.src = '/media/' + encodeURIComponent(node.media_id);
            body.appendChild(player);
        } else if (node.kind === 'file' && node.media_id) {
            const download = createElement('a', '', '📎 ' + title);
            download.href = '/media/' + encodeURIComponent(node.media_id);
            download.download = title;
            body.appendChild(download);
        } else if (node.kind === 'link' && /^https?:\/\//.test(title)) {
            const link = createElement('a', '', title);
            link.href = title;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            body.appendChild(link);
        } else if (node.kind === 'appointment') {
            body.appendChild(createElement('p', '', title));
            body.appendChild(createElement(
                'small', '', 'Zugeordnet: ' + (node.owner || 'Ich')
            ));
            const edit = createElement('button', '', '✎ Termin bearbeiten');
            edit.type = 'button';
            edit.addEventListener('click', () => {
                const matchingAppointment = appointments.find(
                    item => String(item.id) === String(node.appointment_id)
                );
                if (matchingAppointment) {
                    openAppointmentEditor(matchingAppointment);
                } else {
                    notify('Termin bitte im Kalender neu laden');
                }
            });
            body.appendChild(edit);
        } else {
            body.appendChild(createElement('p', '', title));
        }

        card.appendChild(body);
    }

    function createGraphCard(node, cardIndex) {
        const card = createElement('article', 'paper-item free-graph-card');
        if (node.kind === 'appointment') {
            card.classList.add('graph-appointment');
        }
        card.dataset.nodeId = node.node_id;
        card.style.left = `${node.position?.x ?? 520 + (cardIndex % 3) * 350}px`;
        card.style.top = `${node.position?.y ?? 130 + Math.floor(cardIndex / 3) * 210}px`;
        const header = createElement('header', '');
        const timeDescription = node.local_time.slice(11, 16);
        const kindDescription = node.kind === 'appointment'
            ? 'Kalendertermin'
            : 'Zeitpapier';
        const label = createElement(
            'span', '', `${timeDescription} · ${kindDescription}`
        );
        header.appendChild(label);
        card.appendChild(header);
        renderNodeContent(card, node);
        paperCanvas.appendChild(card);
        makeConnectionPoint(card);
        header.addEventListener('pointerdown', event => {
            beginNodeDrag(event, card, node);
        });
        header.addEventListener('pointermove', updateNodeDrag);
        header.addEventListener('pointerup', finishNodeDrag);
        return card;
    }

    function getCardCenter(card) {
        return {
            x: card.offsetLeft + card.offsetWidth / 2,
            y: card.offsetTop + card.offsetHeight / 2
        };
    }

    function drawLine(sourcePoint, targetPoint, relationType, isTemporary) {
        if (!graphLayer) {
            return;
        }
        const line = document.createElementNS(
            'http://www.w3.org/2000/svg', 'path'
        );
        const horizontalBend = Math.max(70, Math.abs(targetPoint.x - sourcePoint.x) / 2);
        const pathData = [
            `M ${sourcePoint.x} ${sourcePoint.y}`,
            `C ${sourcePoint.x + horizontalBend} ${sourcePoint.y}`,
            `${targetPoint.x - horizontalBend} ${targetPoint.y}`,
            `${targetPoint.x} ${targetPoint.y}`
        ].join(' ');
        line.setAttribute('d', pathData);
        line.setAttribute('class', relationType);
        line.setAttribute('stroke', isTemporary ? '#e1b04b' : '');
        graphLayer.appendChild(line);
    }

    function refreshConnections() {
        if (!graphLayer) {
            return;
        }
        graphLayer.replaceChildren();
        for (const connection of allConnections) {
            const source = findNode(connection.source_id);
            const target = findNode(connection.target_id);
            if (source && target) {
                drawLine(
                    getCardCenter(source),
                    getCardCenter(target),
                    connection.relation_type,
                    false
                );
            }
        }
        if (lineDrag) {
            const source = findNode(lineDrag.sourceId);
            if (source) {
                const target = paperPositionFromScreen(
                    lineDrag.pointerX, lineDrag.pointerY
                );
                drawLine(getCardCenter(source), target, 'dependency', true);
            }
        }
    }

    async function reloadConnections() {
        const response = await requestJson(
            `/api/free-graph?day=${encodeURIComponent(selectedDay)}`
        );
        allConnections = response.connections;
        refreshConnections();
    }

    async function openDay(day, canvas) {
        selectedDay = day;
        loadGeneration += 1;
        const currentGeneration = loadGeneration;
        graphLayer = document.createElementNS(
            'http://www.w3.org/2000/svg', 'svg'
        );
        graphLayer.setAttribute('class', 'graph-lines');
        graphLayer.setAttribute('aria-hidden', 'true');
        canvas.prepend(graphLayer);

        try {
            const response = await requestJson(
                `/api/free-graph?day=${encodeURIComponent(day)}`
            );
            if (currentGeneration !== loadGeneration) {
                return;
            }
            allConnections = response.connections;
            response.nodes.forEach(createGraphCard);
            refreshConnections();
        } catch (error) {
            notify('Graph konnte nicht geladen werden: ' + error.message);
        }
    }

    // Das alte Zeitpapier behält seine chronologische Sortierung.
    // Verbinden passiert ab V19 auf der freien Papierwelt.
    document.querySelector('#paperConnect').addEventListener('click', () => {
        notify('Runden Anschluss ● ziehen und auf einer zweiten Karte loslassen');
    });

    document.querySelector('#freePaperManageLinks').addEventListener('click', async () => {
        const list = allConnections.map((connection, index) => {
            return `${index + 1}. ${connection.relation_type}: ${connection.source_id} → ${connection.target_id}`;
        });
        if (!list.length) {
            notify('Noch keine Verbindungen vorhanden');
            return;
        }
        const choice = prompt('Verbindung zum Löschen auswählen:\n' + list.join('\n'));
        const selectedConnection = allConnections[Number(choice) - 1];
        if (!selectedConnection) {
            return;
        }
        await requestJson(
            '/api/free-graph/connection/' + encodeURIComponent(selectedConnection.id),
            { method: 'DELETE' }
        );
        await reloadConnections();
    });

    return { openDay, decorateExistingItem, refreshConnections };
})();

// Expose the graph editor to the existing paper and timeline modules.
window.FreePaperGraph = FreePaperGraph;
