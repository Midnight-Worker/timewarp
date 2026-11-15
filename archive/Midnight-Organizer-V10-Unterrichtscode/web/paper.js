/*
 * paper.js – Tagebuch und freie Papierfläche
 *
 * Dieses Modul hat einen eigenen Zustand und verändert nicht die
 * globalen Variablen des Kalenders. Darum verwenden wir eine IIFE:
 * eine Funktion, die sich einmal beim Laden selbst ausführt.
 *
 * Die Papierobjekte werden über die Python-API in SQLite gespeichert.
 * Hochgeladene Mediendateien bleiben im Ordner daten/medien/.
 */

(() => {
    'use strict';

    const paperOverlay = document.querySelector('#paperOverlay');
    const paperWorld = document.querySelector('#paperWorld');
    const paperCanvas = document.querySelector('#paperCanvas');
    const statusLabel = document.querySelector('#paperMsg');
    const dateInput = document.querySelector('#paperDay');
    const filePicker = document.querySelector('#paperFiles');
    const dropIndicator = document.querySelector('#paperDrop');

    let selectedDay = '';
    let paperItems = [];
    let paperVisible = false;
    let activeDragOperation = null;
    let nestedDragCounter = 0;
    let lastFocusedTextId = null;

    // Anders als die SVG-Kamera verwendet die Papierkamera CSS-Pixel.
    let paperCamera = {
        x: 210,
        y: 180,
        scale: 1
    };

    // Einträge werden beim Tippen kurz verzögert gespeichert.
    const pendingSaveTimers = new Map();

    function createEntryIdentifier() {
        if (crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random()}`;
    }

    function getMediaUrl(mediaId) {
        return '/media/' + encodeURIComponent(mediaId);
    }

    function showStatus(message) {
        statusLabel.textContent = message;

        setTimeout(() => {
            if (statusLabel.textContent === message) {
                statusLabel.textContent = '';
            }
        }, 3500);
    }

    /** Text wird für HTML-Inhalte escaped, statt direkt interpretiert. */
    function escapeHtml(plainText) {
        const escapeCharacters = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return String(plainText).replace(/[&<>"']/g, character => {
            return escapeCharacters[character];
        });
    }

    /**
     * Entfernt unzulässige HTML-Elemente und Attribute aus Notizen.
     * Erlaubt bleiben einfache Formatierungen und lokal gespeicherte Bilder.
     */
    function sanitizeRichText(html) {
        const documentFragment = new DOMParser().parseFromString(
            '<div>' + html + '</div>',
            'text/html'
        );

        const permittedTags = new Set([
            'DIV', 'P', 'BR', 'B', 'STRONG', 'EM', 'I', 'U',
            'SPAN', 'IMG', 'UL', 'OL', 'LI'
        ]);

        function sanitizeChildren(parentElement) {
            for (const child of [...parentElement.childNodes]) {
                // HTML-Kommentare entfernen.
                if (child.nodeType === 8) {
                    child.remove();
                    continue;
                }

                if (child.nodeType !== 1) {
                    continue;
                }

                if (!permittedTags.has(child.tagName)) {
                    child.replaceWith(...child.childNodes);
                    continue;
                }

                const oldImageSource = child.getAttribute('src') || '';
                const oldImageClass = child.getAttribute('class') || '';

                // Alle HTML-Attribute erst einmal entfernen.
                for (const attribute of [...child.attributes]) {
                    child.removeAttribute(attribute.name);
                }

                if (child.tagName === 'IMG') {
                    // Bilder dürfen nur aus unserem lokalen Medienverzeichnis kommen.
                    if (!/^\/media\/[a-f0-9]{32}$/.test(oldImageSource)) {
                        child.remove();
                        continue;
                    }

                    child.setAttribute('src', oldImageSource);
                    child.setAttribute(
                        'class',
                        oldImageClass === 'float-right' ? 'float-right' : 'float-left'
                    );
                }

                sanitizeChildren(child);
            }
        }

        const textContainer = documentFragment.body.firstElementChild;
        sanitizeChildren(textContainer);
        return textContainer.innerHTML;
    }

    /** Autosave: Nach der letzten Änderung 450 ms warten. */
    function scheduleItemSave(item) {
        if (!paperVisible) {
            return;
        }

        clearTimeout(pendingSaveTimers.get(item.id));

        const saveTimer = setTimeout(async () => {
            try {
                await PaperNetwork.saveEntry(item);
                showStatus('✓ gespeichert');
            } catch (error) {
                showStatus('Speichern fehlgeschlagen: ' + error.message);
            }
        }, 450);

        pendingSaveTimers.set(item.id, saveTimer);
    }

    async function loadPaperItems() {
        paperCanvas.replaceChildren();
        paperItems = [];

        try {
            paperItems = await PaperNetwork.loadEntries(selectedDay);
            for (const item of paperItems) {
                renderPaperItem(item);
            }

            showStatus('Tagebuch geladen');
        } catch (error) {
            showStatus('Server nicht erreichbar · bitte python main.py starten');
        }
    }

    /** Erzeugt einen neuen Text-, Bild-, Video-, Audio- oder Datei-Eintrag. */
    function createPaperItem(kind, properties = {}) {
        let defaultWidth = 350;
        let defaultHeight = 170;

        if (kind === 'text') {
            defaultWidth = 420;
            defaultHeight = 260;
        } else if (kind === 'image') {
            defaultWidth = 320;
            defaultHeight = 270;
        } else if (kind === 'video') {
            defaultHeight = 265;
        }

        const item = {
            id: createEntryIdentifier(),
            day: selectedDay,
            kind: kind,
            x: 80 + paperItems.length * 22,
            y: 80 + paperItems.length * 18,
            width: defaultWidth,
            height: defaultHeight,
            content: '',
            media_id: '',
            preview: 0,
            ...properties
        };

        paperItems.push(item);
        renderPaperItem(item);
        scheduleItemSave(item);
        return item;
    }

    /** Überträgt die CSS-Kameraposition auf die gesamte Papierfläche. */
    function applyPaperCamera() {
        const translation = `translate(${paperCamera.x}px, ${paperCamera.y}px)`;
        const scaling = `scale(${paperCamera.scale})`;

        paperCanvas.style.transform = `${translation} ${scaling}`;
        paperWorld.style.backgroundPosition =
            `${paperCamera.x}px ${paperCamera.y}px`;
    }

    function openPaperDate(dateString) {
        if (!/^\d{4}-\d\d-\d\d$/.test(dateString)) {
            return;
        }

        selectedDay = dateString;
        dateInput.value = dateString;
        paperCamera = { x: 210, y: 180, scale: 1 };

        applyPaperCamera();
        loadPaperItems();
    }

    function attachTextEditing(item, editableElement) {
        function saveEditedText() {
            item.content = sanitizeRichText(editableElement.innerHTML);
            scheduleItemSave(item);
        }

        editableElement.addEventListener('input', saveEditedText);
        editableElement.addEventListener('blur', saveEditedText);
    }

    /** Erstellt die sichtbare, frei verschiebbare Karte eines Tagebucheintrags. */
    function renderPaperItem(item) {
        const itemElement = document.createElement('article');
        itemElement.className = 'paper-item';
        itemElement.dataset.id = item.id;
        itemElement.style.left = `${item.x}px`;
        itemElement.style.top = `${item.y}px`;
        itemElement.style.width = `${item.width}px`;
        itemElement.style.height = `${item.height}px`;

        const header = document.createElement('header');
        const typeLabel = document.createElement('span');
        const deleteButton = document.createElement('button');

        const typeLabels = {
            text: '✎ Tagebucheintrag',
            image: '▧ Foto',
            video: '▶ Video',
            audio: '♫ Audio',
            file: '▤ Dokument',
            link: '↗ Link',
            message: '☏ Nachricht'
        };

        typeLabel.textContent = typeLabels[item.kind] || item.kind;
        deleteButton.textContent = '×';
        deleteButton.title = 'Objekt löschen';
        deleteButton.addEventListener('click', () => deletePaperItem(item, itemElement));

        header.append(typeLabel, deleteButton);
        itemElement.appendChild(header);

        const body = document.createElement('div');
        body.className = 'paper-body';
        renderItemContent(body, item);

        itemElement.appendChild(body);
        paperCanvas.appendChild(itemElement);

        attachItemDragging(header, item, itemElement, deleteButton);
        observeItemSize(item, itemElement);
        return itemElement;
    }

    async function deletePaperItem(item, itemElement) {
        const accepted = confirm(
            'Objekt entfernen? Die hochgeladene Datei bleibt als Sicherung erhalten.'
        );
        if (!accepted) {
            return;
        }

        try {
            await PaperNetwork.deleteEntry(item.id);
        } catch (error) {
            showStatus('Löschen fehlgeschlagen: ' + error.message);
            return;
        }

        paperItems = paperItems.filter(entry => entry.id !== item.id);
        itemElement.remove();
    }

    /** Zeigt je nach Typ einen Editor, ein Bild, Audio, Video oder einen Link. */
    function renderItemContent(body, item) {
        if (item.kind === 'text' || item.kind === 'message') {
            body.contentEditable = 'true';
            body.spellcheck = true;
            body.innerHTML = sanitizeRichText(item.content || '');
            body.dataset.placeholder = 'Schreibe deine Geschichte ...';
            attachTextEditing(item, body);

            body.addEventListener('focus', () => {
                lastFocusedTextId = item.id;
            });
            return;
        }

        if (item.kind === 'image') {
            const image = document.createElement('img');
            image.className = 'preview';
            image.src = getMediaUrl(item.media_id);
            image.alt = item.content || 'Foto';
            body.style.padding = '2px';
            body.appendChild(image);
            return;
        }

        if (item.kind === 'audio') {
            const title = document.createElement('div');
            title.textContent = item.content;

            const audioPlayer = document.createElement('audio');
            audioPlayer.controls = true;
            audioPlayer.preload = 'none';
            audioPlayer.src = getMediaUrl(item.media_id);

            body.append(title, audioPlayer);
            return;
        }

        if (item.kind === 'video') {
            createVideoPlayer(body, item);
            return;
        }

        if (item.kind === 'file' || item.kind === 'link') {
            const link = document.createElement('a');
            link.textContent = item.content || 'Datei';
            link.href = item.kind === 'file'
                ? getMediaUrl(item.media_id)
                : item.content;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            if (item.kind === 'file') {
                link.download = item.content;
            }
            body.append('📎 ', link);
        }
    }

    function createVideoPlayer(body, item) {
        const previewLabel = document.createElement('label');
        previewLabel.style.fontSize = '12px';

        const previewCheckbox = document.createElement('input');
        previewCheckbox.type = 'checkbox';
        previewCheckbox.checked = Boolean(item.preview);

        previewLabel.append(
            previewCheckbox,
            document.createTextNode(' GIF-Vorschau (stumm, Schleife)')
        );

        const videoPlayer = document.createElement('video');
        videoPlayer.controls = true;
        videoPlayer.preload = 'metadata';
        videoPlayer.playsInline = true;
        videoPlayer.src = getMediaUrl(item.media_id);
        videoPlayer.muted = previewCheckbox.checked;
        videoPlayer.loop = previewCheckbox.checked;
        videoPlayer.autoplay = previewCheckbox.checked;

        previewCheckbox.addEventListener('change', () => {
            const previewEnabled = previewCheckbox.checked;
            item.preview = previewEnabled ? 1 : 0;

            videoPlayer.muted = previewEnabled;
            videoPlayer.loop = previewEnabled;

            if (previewEnabled) {
                videoPlayer.play().catch(() => {
                    showStatus('Autoplay vom Browser blockiert');
                });
            } else {
                videoPlayer.pause();
            }

            scheduleItemSave(item);
        });

        body.append(previewLabel, videoPlayer);
        if (item.preview) {
            videoPlayer.play().catch(() => {});
        }
    }

    function attachItemDragging(header, item, element, deleteButton) {
        header.addEventListener('pointerdown', pointerEvent => {
            if (pointerEvent.button !== 0 || pointerEvent.target === deleteButton) {
                return;
            }

            activeDragOperation = {
                type: 'item',
                id: item.id,
                startPointerX: pointerEvent.clientX,
                startPointerY: pointerEvent.clientY,
                startItemX: item.x,
                startItemY: item.y
            };

            header.setPointerCapture(pointerEvent.pointerId);
            pointerEvent.preventDefault();
        });

        header.addEventListener('pointermove', pointerEvent => {
            if (!activeDragOperation || activeDragOperation.type !== 'item' || activeDragOperation.id !== item.id) {
                return;
            }

            const movementX = pointerEvent.clientX - activeDragOperation.startPointerX;
            const movementY = pointerEvent.clientY - activeDragOperation.startPointerY;

            item.x = activeDragOperation.startItemX + movementX / paperCamera.scale;
            item.y = activeDragOperation.startItemY + movementY / paperCamera.scale;

            element.style.left = `${item.x}px`;
            element.style.top = `${item.y}px`;
        });

        header.addEventListener('pointerup', () => {
            if (activeDragOperation && activeDragOperation.id === item.id) {
                activeDragOperation = null;
                scheduleItemSave(item);
            }
        });
    }

    function observeItemSize(item, element) {
        const resizeObserver = new ResizeObserver(() => {
            if (!element.isConnected) {
                return;
            }

            const width = element.offsetWidth;
            const height = element.offsetHeight;

            if (width !== item.width || height !== item.height) {
                item.width = width;
                item.height = height;
                scheduleItemSave(item);
            }
        });

        resizeObserver.observe(element);
    }

    /** Bildschirmposition in Papierkoordinaten umrechnen. */
    function screenToPaper(pointerEvent) {
        const bounds = paperWorld.getBoundingClientRect();

        return {
            x: (pointerEvent.clientX - bounds.left - paperCamera.x) /
                paperCamera.scale,
            y: (pointerEvent.clientY - bounds.top - paperCamera.y) /
                paperCamera.scale
        };
    }

    function handlePaperPointerDown(pointerEvent) {
        if (pointerEvent.button !== 0) {
            return;
        }
        if (pointerEvent.target.closest('.paper-item')) {
            return;
        }
        if (pointerEvent.target.closest('#paperToolbar')) {
            return;
        }

        activeDragOperation = {
            type: 'camera',
            startPointerX: pointerEvent.clientX,
            startPointerY: pointerEvent.clientY,
            startCameraX: paperCamera.x,
            startCameraY: paperCamera.y
        };

        paperWorld.setPointerCapture(pointerEvent.pointerId);
        paperWorld.classList.add('panning');
    }

    function handlePaperPointerMove(pointerEvent) {
        if (!activeDragOperation || activeDragOperation.type !== 'camera') {
            return;
        }

        paperCamera.x = activeDragOperation.startCameraX +
            pointerEvent.clientX - activeDragOperation.startPointerX;
        paperCamera.y = activeDragOperation.startCameraY +
            pointerEvent.clientY - activeDragOperation.startPointerY;

        applyPaperCamera();
    }

    function handlePaperPointerUp() {
        if (activeDragOperation && activeDragOperation.type === 'camera') {
            activeDragOperation = null;
        }
        paperWorld.classList.remove('panning');
    }

    /** Zoomen um den Mauszeiger – gleiche Idee wie beim SVG-Kalender. */
    function handlePaperZoom(wheelEvent) {
        wheelEvent.preventDefault();

        const previousZoom = paperCamera.scale;
        const wheelSensitivity = 0.001;
        const zoomFactor = Math.exp(-wheelEvent.deltaY * wheelSensitivity);
        const desiredZoom = previousZoom * zoomFactor;
        const minimumZoom = 0.35;
        const maximumZoom = 3.5;
        const newZoom = Math.min(maximumZoom, Math.max(minimumZoom, desiredZoom));
        const relativeZoomChange = newZoom / previousZoom;

        // Der Mauszeiger bleibt auf demselben Punkt des Papiers.
        paperCamera.x = wheelEvent.clientX -
            (wheelEvent.clientX - paperCamera.x) * relativeZoomChange;
        paperCamera.y = wheelEvent.clientY -
            (wheelEvent.clientY - paperCamera.y) * relativeZoomChange;
        paperCamera.scale = newZoom;

        applyPaperCamera();
    }

    /** Lade eine Datei zum Python-Server und lege eine Karte auf dem Papier ab. */
    async function uploadFile(file, position) {
        try {
            showStatus('Lade ' + file.name + ' hoch ...');

            const uploadedMedia = await PaperNetwork.uploadMedia(file);
            let itemKind = 'file';

            if (file.type.startsWith('image/')) {
                itemKind = 'image';
            } else if (file.type.startsWith('video/')) {
                itemKind = 'video';
            } else if (file.type.startsWith('audio/')) {
                itemKind = 'audio';
            }

            createPaperItem(itemKind, {
                x: position.x,
                y: position.y,
                content: file.name,
                media_id: uploadedMedia.id
            });

            showStatus('✓ ' + file.name + ' abgelegt');
        } catch (error) {
            showStatus('Import fehlgeschlagen: ' + error.message);
        }
    }

    async function importFilesAtPosition(files, initialPosition) {
        let position = { ...initialPosition };

        for (const file of files) {
            await uploadFile(file, position);
            position = {
                x: position.x + 32,
                y: position.y + 32
            };
        }
    }

    async function handlePaperDrop(dragEvent) {
        dragEvent.preventDefault();
        nestedDragCounter = 0;
        dropIndicator.classList.remove('visible');

        if (dragEvent.dataTransfer.files.length) {
            await importFilesAtPosition(
                [...dragEvent.dataTransfer.files],
                screenToPaper(dragEvent)
            );
            return;
        }

        const droppedText = dragEvent.dataTransfer.getData('text/plain');
        if (droppedText) {
            const itemKind = /^https?:\/\//.test(droppedText) ? 'link' : 'message';
            createPaperItem(itemKind, {
                ...screenToPaper(dragEvent),
                content: escapeHtml(droppedText)
            });
        }
    }

    function importNotesFromDesktop() {
        let storedNotes = [];
        try {
            storedNotes = JSON.parse(
                localStorage.getItem('midnight.notes.v5') || '[]'
            );
        } catch (error) {
            console.warn('Notizblock konnte nicht gelesen werden:', error);
        }

        if (storedNotes.length === 0) {
            showStatus('Der Notizblock ist noch leer');
            return;
        }

        const content = storedNotes
            .map(note => '<div>☐ ' + escapeHtml(note.text) + '</div>')
            .join('');

        createPaperItem('text', {
            content: content,
            width: 440,
            height: 280
        });

        showStatus(`${storedNotes.length} Notizen als Tagebucheintrag übernommen`);
    }

    /** Fügt ein Bild in einen bestehenden Textblock ein (mit Textumfluss). */
    function addFloatingImageToText() {
        const textCard = paperCanvas.querySelector(
            `.paper-item[data-id="${lastFocusedTextId}"]`
        );
        const textItem = paperItems.find(item => item.id === lastFocusedTextId);

        if (!textCard || !textItem || !['text', 'message'].includes(textItem.kind)) {
            showStatus('Zuerst in eine Textnotiz klicken');
            return;
        }

        const editableBody = textCard.querySelector('[contenteditable]');
        const imagePicker = document.createElement('input');
        imagePicker.type = 'file';
        imagePicker.accept = 'image/*';

        imagePicker.addEventListener('change', async () => {
            const imageFile = imagePicker.files[0];
            if (!imageFile) {
                return;
            }

            try {
                const uploadedMedia = await PaperNetwork.uploadMedia(imageFile);
                const image = document.createElement('img');
                image.src = getMediaUrl(uploadedMedia.id);
                image.className = 'float-left';
                image.alt = imageFile.name;

                editableBody.prepend(image);
                textItem.content = sanitizeRichText(editableBody.innerHTML);
                scheduleItemSave(textItem);
            } catch (error) {
                showStatus(error.message);
            }
        });

        imagePicker.click();
    }

    function movePaperDate(numberOfDays) {
        const newDate = new Date(selectedDay + 'T12:00:00');
        newDate.setDate(newDate.getDate() + numberOfDays);

        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const day = String(newDate.getDate()).padStart(2, '0');
        const nextDateString = `${year}-${month}-${day}`;

        if (window.paperAPI) {
            window.paperAPI.chooseDate(nextDateString);
        }
        openPaperDate(nextDateString);
    }

    // --- Ereignisse registrieren ------------------------------------------

    paperWorld.addEventListener('pointerdown', handlePaperPointerDown);
    paperWorld.addEventListener('pointermove', handlePaperPointerMove);
    paperWorld.addEventListener('pointerup', handlePaperPointerUp);
    paperWorld.addEventListener('wheel', handlePaperZoom, { passive: false });

    paperOverlay.addEventListener('dragenter', dragEvent => {
        dragEvent.preventDefault();
        nestedDragCounter++;
        dropIndicator.classList.add('visible');
    });

    paperOverlay.addEventListener('dragover', dragEvent => {
        dragEvent.preventDefault();
    });

    paperOverlay.addEventListener('dragleave', () => {
        nestedDragCounter--;
        if (nestedDragCounter <= 0) {
            nestedDragCounter = 0;
            dropIndicator.classList.remove('visible');
        }
    });

    paperOverlay.addEventListener('drop', handlePaperDrop);

    document.querySelector('#paperAddText').addEventListener('click', () => {
        createPaperItem('text', {
            content: '<div>Mein Tagebuch – hier hineinschreiben …</div>'
        });
    });

    document.querySelector('#paperAddMsg').addEventListener('click', () => {
        const message = prompt('WhatsApp-Nachricht oder Text einfügen:');
        if (message) {
            createPaperItem('message', { content: escapeHtml(message) });
        }
    });

    document.querySelector('#paperImportNotes').addEventListener(
        'click', importNotesFromDesktop
    );

    document.querySelector('#paperAddLink').addEventListener('click', () => {
        const address = prompt('Webadresse (https://...)');
        if (address && /^https?:\/\//i.test(address)) {
            createPaperItem('link', { content: address });
        }
    });

    document.querySelector('#paperAddFiles').addEventListener('click', () => {
        filePicker.click();
    });

    filePicker.addEventListener('change', async () => {
        await importFilesAtPosition([...filePicker.files], {
            x: 100 + Math.random() * 90,
            y: 100 + Math.random() * 90
        });
        filePicker.value = '';
    });

    document.querySelector('#paperFloatImg').addEventListener(
        'click', addFloatingImageToText
    );

    dateInput.addEventListener('change', () => {
        if (window.paperAPI) {
            window.paperAPI.chooseDate(dateInput.value);
        }
        openPaperDate(dateInput.value);
    });

    document.querySelector('#paperPrev').addEventListener('click', () => {
        movePaperDate(-1);
    });

    document.querySelector('#paperNext').addEventListener('click', () => {
        movePaperDate(1);
    });

    // Dies ist der einzige öffentliche Einstiegspunkt für den Kalender.
    window.Paper = {
        activate(shouldOpen, dateString) {
            paperVisible = shouldOpen;
            paperOverlay.classList.toggle('active', shouldOpen);
            document.body.classList.toggle('paper-mode', shouldOpen);

            if (shouldOpen && dateString !== selectedDay) {
                openPaperDate(dateString);
            }
        }
    };
})();
