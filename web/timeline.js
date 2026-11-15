/*
 * timeline.js – Ein zeitlich fortlaufendes Tagebuchpapier.
 *
 * Daten und Darstellung sind absichtlich getrennt:
 *   - Der Server speichert den Zeitpunkt eines Eintrags.
 *   - Jede Stunde ist ein flexibles HTML-Element mit Mindesthöhe.
 *   - Lange Inhalte machen das Stundenblatt höher.
 *   - Browser-Layout verschiebt alle späteren Stunden automatisch nach unten.
 *
 * Es gibt keine festen y-Koordinaten für Texte – genau das ist der Trick!
 */
(() => {
    'use strict';

    const overlay = document.querySelector('#timelineOverlay');
    const scroller = document.querySelector('#timelineScroller');
    const datePicker = document.querySelector('#timelineDate');
    const status = document.querySelector('#timelineStatus');
    const mediaPicker = document.querySelector('#timelineFiles');

    const loadedDays = new Set();
    const saveTimers = new Map();
    let firstLoadedDay = null;
    let lastLoadedDay = null;
    let active = false;
    let loading = false;
    let selectedUploadHour = null;

    function shiftDate(dateString, days) {
        const date = new Date(dateString + 'T12:00:00');
        date.setDate(date.getDate() + days);
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function setStatus(message) {
        status.textContent = message;
    }

    async function requestJson(address, options = {}) {
        const response = await fetch(address, options);
        if (!response.ok) {
            throw new Error(`Serverantwort: ${response.status}`);
        }
        return response.json();
    }

    async function saveEntry(entry) {
        await requestJson('/api/timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        setStatus('✓ gespeichert');
        if (window.TimelineShadows) {
            window.TimelineShadows.refresh();
        }
    }

    function scheduleSave(entry) {
        clearTimeout(saveTimers.get(entry.id));
        setStatus('Speichert …');
        const timer = setTimeout(async () => {
            try {
                await saveEntry(entry);
            } catch (error) {
                setStatus('Speichern fehlgeschlagen: ' + error.message);
            }
        }, 500);
        saveTimers.set(entry.id, timer);
    }

    function createHourlyPage(dateString, hour) {
        const hourText = String(hour).padStart(2, '0');
        const hourKey = `${dateString}T${hourText}`;
        const section = document.createElement('section');
        section.className = 'timeline-hour';
        section.dataset.hour = hourKey;

        const label = document.createElement('aside');
        label.className = 'timeline-time-label';
        label.textContent = `${hourText}:00`;
        const hint = document.createElement('small');
        hint.textContent = 'bis ' + hourText + ':59';
        label.appendChild(hint);

        const page = document.createElement('div');
        page.className = 'timeline-page';

        const heading = document.createElement('div');
        heading.className = 'timeline-page-heading';
        heading.textContent = `${dateString} · ${hourText}:00`;
        page.appendChild(heading);

        const addButton = document.createElement('button');
        addButton.className = 'timeline-add-entry';
        addButton.textContent = '+ Notiz für diese Stunde';
        addButton.addEventListener('click', () => createEntry(hourKey));
        page.appendChild(addButton);

        const entries = document.createElement('div');
        entries.className = 'timeline-entries';
        page.appendChild(entries);

        page.addEventListener('dragover', event => {
            if (event.dataTransfer.files.length) {
                event.preventDefault();
                page.classList.add('drag-over');
            }
        });
        page.addEventListener('dragleave', () => page.classList.remove('drag-over'));
        page.addEventListener('drop', async event => {
            event.preventDefault();
            page.classList.remove('drag-over');
            await importFiles([...event.dataTransfer.files], hourKey);
        });

        section.append(label, page);
        return section;
    }

    function createDay(dateString) {
        const daySection = document.createElement('div');
        daySection.className = 'timeline-day';
        daySection.dataset.day = dateString;

        const title = document.createElement('div');
        title.className = 'timeline-date-heading';
        const date = new Date(dateString + 'T12:00:00');
        title.textContent = date.toLocaleDateString('de-DE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        daySection.appendChild(title);

        for (let hour = 0; hour < 24; hour++) {
            daySection.appendChild(createHourlyPage(dateString, hour));
        }
        return daySection;
    }

    function getHourContainer(timestamp) {
        const hourKey = timestamp.slice(0, 13);
        const hourElement = [...scroller.querySelectorAll('.timeline-hour')]
            .find(element => element.dataset.hour === hourKey);
        return hourElement?.querySelector('.timeline-entries');
    }

    function createEntryElement(entry) {
        const card = document.createElement('article');
        card.className = 'timeline-entry';
        card.dataset.entryId = entry.id;

        const header = document.createElement('div');
        header.className = 'timeline-entry-header';

        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.step = 60;
        timeInput.value = entry.local_time.slice(11, 16);
        timeInput.title = 'Uhrzeit ändern – auch in eine andere Stunde';
        timeInput.addEventListener('change', () => {
            const date = entry.local_time.slice(0, 10);
            entry.local_time = `${date}T${timeInput.value}`;
            scheduleSave(entry);
            const newHourContainer = getHourContainer(entry.local_time);
            if (newHourContainer) {
                newHourContainer.appendChild(card);
            }
        });

        const category = document.createElement('span');
        category.textContent = entry.kind === 'text' ? 'Tagebuch' : entry.kind;

        const removeButton = document.createElement('button');
        removeButton.className = 'timeline-delete';
        removeButton.textContent = '× Entfernen';
        removeButton.addEventListener('click', async () => {
            if (!confirm('Diesen Tagebucheintrag löschen?')) return;
            try {
                await requestJson('/api/timeline/' + encodeURIComponent(entry.id), {
                    method: 'DELETE'
                });
                clearTimeout(saveTimers.get(entry.id));
                card.remove();
                setStatus('Eintrag gelöscht');
                window.TimelineShadows?.refresh();
            } catch (error) {
                setStatus(error.message);
            }
        });

        header.append(timeInput, category, removeButton);
        card.appendChild(header);

        if (entry.kind === 'text' || entry.kind === 'message') {
            const editor = document.createElement('textarea');
            editor.placeholder = 'Hier beginnt deine Geschichte …';
            editor.value = entry.content;
            editor.addEventListener('input', () => {
                entry.content = editor.value;
                scheduleSave(entry);
            });
            function growEditorWithContent() {
                editor.style.height = 'auto';
                editor.style.height = `${Math.max(150, editor.scrollHeight + 8)}px`;
            }
            editor.addEventListener('input', growEditorWithContent);
            card.appendChild(editor);
            requestAnimationFrame(growEditorWithContent);
        } else if (entry.kind === 'image') {
            const image = document.createElement('img');
            image.className = 'timeline-media';
            image.src = '/media/' + encodeURIComponent(entry.media_id);
            image.alt = entry.content;
            card.appendChild(image);
        } else if (entry.kind === 'audio') {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = '/media/' + encodeURIComponent(entry.media_id);
            card.appendChild(audio);
        } else if (entry.kind === 'video') {
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = Boolean(entry.preview);
            const label = document.createElement('label');
            label.append(toggle, ' Vorschau in Schleife (stumm)');
            const video = document.createElement('video');
            video.controls = true;
            video.src = '/media/' + encodeURIComponent(entry.media_id);
            video.style.width = '100%';
            const updatePlayback = () => {
                video.muted = toggle.checked;
                video.loop = toggle.checked;
                if (toggle.checked) video.play().catch(() => {});
                else video.pause();
            };
            toggle.addEventListener('change', () => {
                entry.preview = toggle.checked ? 1 : 0;
                updatePlayback();
                scheduleSave(entry);
            });
            updatePlayback();
            card.append(label, video);
        } else {
            const link = document.createElement('a');
            link.href = entry.media_id
                ? '/media/' + encodeURIComponent(entry.media_id)
                : entry.content;
            link.textContent = entry.content || 'Datei öffnen';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            card.appendChild(link);
        }
        return card;
    }

    function renderEntry(entry) {
        const container = getHourContainer(entry.local_time);
        if (container) container.appendChild(createEntryElement(entry));
    }

    function createIdentifier() {
        return crypto.randomUUID ? crypto.randomUUID() :
            `${Date.now()}-${Math.random()}`;
    }

    function createEntry(hourKey) {
        const entry = {
            id: createIdentifier(),
            local_time: hourKey + ':00',
            kind: 'text',
            content: '',
            media_id: '',
            preview: 0
        };
        renderEntry(entry);
        scheduleSave(entry);
        const container = getHourContainer(entry.local_time);
        container?.lastElementChild?.querySelector('textarea')?.focus();
    }

    async function importFiles(files, hourKey) {
        for (const file of files) {
            if (!file) continue;
            try {
                setStatus('Importiere ' + file.name + ' …');
                const media = await PaperNetwork.uploadMedia(file);
                let kind = 'file';
                if (file.type.startsWith('image/')) kind = 'image';
                if (file.type.startsWith('audio/')) kind = 'audio';
                if (file.type.startsWith('video/')) kind = 'video';
                const entry = {
                    id: createIdentifier(),
                    local_time: hourKey + ':00',
                    kind,
                    content: file.name,
                    media_id: media.id,
                    preview: 0
                };
                await saveEntry(entry);
                renderEntry(entry);
            } catch (error) {
                setStatus('Upload fehlgeschlagen: ' + error.message);
            }
        }
    }

    async function loadDay(dateString, prepend = false) {
        if (loadedDays.has(dateString) || loading) return;
        loading = true;
        try {
            const entries = await requestJson(
                `/api/timeline?from=${dateString}&to=${dateString}`
            );
            const dayElement = createDay(dateString);
            if (prepend) scroller.prepend(dayElement);
            else scroller.appendChild(dayElement);
            loadedDays.add(dateString);
            if (!firstLoadedDay || dateString < firstLoadedDay) firstLoadedDay = dateString;
            if (!lastLoadedDay || dateString > lastLoadedDay) lastLoadedDay = dateString;
            for (const entry of entries) renderEntry(entry);
        } catch (error) {
            setStatus('Laden fehlgeschlagen: ' + error.message);
        } finally {
            loading = false;
        }
    }

    async function extendTimeline() {
        if (!active || loading) return;
        if (scroller.scrollTop < 800 && firstLoadedDay) {
            const previousHeight = scroller.scrollHeight;
            await loadDay(shiftDate(firstLoadedDay, -1), true);
            scroller.scrollTop += scroller.scrollHeight - previousHeight;
        } else if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 1000) {
            await loadDay(shiftDate(lastLoadedDay, 1));
        }
    }

    async function open(dateString) {
        active = true;
        overlay.classList.add('active');
        scroller.replaceChildren();
        loadedDays.clear();
        firstLoadedDay = null;
        lastLoadedDay = null;
        datePicker.value = dateString;
        await loadDay(shiftDate(dateString, -1));
        await loadDay(dateString);
        await loadDay(shiftDate(dateString, 1));
        const selectedDay = scroller.querySelector(
            `.timeline-day[data-day="${dateString}"]`
        );
        if (selectedDay) scroller.scrollTop = selectedDay.offsetTop - scroller.offsetTop;
        setStatus('Zeitpapier bereit');
    }

    function close() {
        active = false;
        overlay.classList.remove('active');
    }

    scroller.addEventListener('scroll', () => {
        extendTimeline();
    }, { passive: true });

    document.querySelector('#timelineBack').addEventListener('click', () => {
        close();
        window.paperAPI?.back();
    });
    document.querySelector('#timelineFreePaper').addEventListener('click', close);
    document.querySelector('#paperOpenTimeline').addEventListener('click', () => {
        open(document.querySelector('#paperDay').value);
    });
    datePicker.addEventListener('change', () => open(datePicker.value));
    document.querySelector('#timelineAddFile').addEventListener('click', () => {
        const visibleHour = [...scroller.querySelectorAll('.timeline-hour')].find(
            element => element.getBoundingClientRect().bottom > 130
        );
        selectedUploadHour = visibleHour?.dataset.hour || datePicker.value + 'T12';
        mediaPicker.click();
    });
    mediaPicker.addEventListener('change', async () => {
        await importFiles([...mediaPicker.files], selectedUploadHour);
        mediaPicker.value = '';
    });

    window.Timeline = { open, close, isActive: () => active };
})();
