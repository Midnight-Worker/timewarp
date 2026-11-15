/*
 * window-manager.js
 *
 * Kleine Fensterverwaltung ohne Framework:
 * 1. Ein angeklicktes Fenster nach vorne holen.
 * 2. Fenster am Titel mit der Maus verschieben.
 * 3. Schließen, minimieren und aus der Ansichtsliste wieder öffnen.
 * 4. Fensterpositionen im lokalen Browserprofil merken.
 * 5. Doppelklick auf den Titel: rechts andocken oder wieder lösen.
 *    Shift + Doppelklick dockt links an.
 *
 * WICHTIG: Diese Fenster sind keine SVG-Objekte. Beim Zoomen bleiben
 * sie an ihrer Bildschirmposition.
 */

(function initializeWindowManager() {
    'use strict';

    const STORAGE_KEY = 'midnight.window-layout.v20';
    const viewList = document.querySelector('#viewList');
    const viewListButton = document.querySelector('#toggleViewList');

    const windows = [
        {id: 'people', title: 'Personenkalender', element: document.querySelector('#peopleWindow'), x: 850, y: 105},
        {id: 'tasks', title: 'Listen und Aufgaben', element: document.querySelector('#tray'), x: 1080, y: 305},
        {id: 'inbox', title: 'Papiernotizen', element: document.querySelector('#paperAppointmentInbox'), x: 1040, y: 535},
        {id: 'notepad', title: 'Notizblock', element: document.querySelector('#notepad'), x: 30, y: 125}
    ];

    let highestLayer = 110;
    let activeWindowId = null;
    let savedLayout = {};

    try {
        savedLayout = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
        // Eine kaputte Einstellung soll niemals den Organizer blockieren.
        savedLayout = {};
    }

    function findWindow(windowId) {
        return windows.find(windowItem => windowItem.id === windowId);
    }

    function isVisible(windowItem) {
        if (windowItem.id === 'notepad') {
            return windowItem.element.style.display !== 'none';
        }
        return !windowItem.element.hidden;
    }

    function setVisible(windowItem, shouldShow) {
        if (windowItem.id === 'notepad') {
            windowItem.element.style.display = shouldShow ? 'block' : 'none';
        } else {
            windowItem.element.hidden = !shouldShow;
        }
    }

    function keepWindowOnScreen(windowItem, x, y) {
        const windowWidth = windowItem.element.offsetWidth || 300;
        const windowHeight = windowItem.element.offsetHeight || 60;

        // Mindestens die Titelleiste muss jederzeit erreichbar bleiben.
        const maximumX = Math.max(0, window.innerWidth - Math.min(windowWidth, 160));
        const maximumY = Math.max(0, window.innerHeight - Math.min(windowHeight, 45));

        return {
            x: Math.max(0, Math.min(maximumX, x)),
            y: Math.max(0, Math.min(maximumY, y))
        };
    }

    function positionWindow(windowItem, x, y) {
        const safePosition = keepWindowOnScreen(windowItem, x, y);
        windowItem.x = safePosition.x;
        windowItem.y = safePosition.y;
        windowItem.element.style.left = `${safePosition.x}px`;
        windowItem.element.style.top = `${safePosition.y}px`;
        windowItem.element.style.right = 'auto';
    }

    function saveLayout() {
        const layout = {};

        for (const windowItem of windows) {
            layout[windowItem.id] = {
                x: windowItem.x,
                y: windowItem.y,
                zIndex: windowItem.zIndex,
                open: isVisible(windowItem),
                minimized: windowItem.minimized,
                docked: windowItem.docked,
                previousPosition: windowItem.previousPosition
            };
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        } catch (error) {
            // Layout-Einstellungen sind nicht kritisch für die Datenbank.
        }
    }

    function bringToFront(windowId) {
        const windowItem = findWindow(windowId);
        if (!windowItem) {
            return;
        }

        highestLayer += 1;
        windowItem.zIndex = highestLayer;
        windowItem.element.style.zIndex = String(highestLayer);
        activeWindowId = windowId;

        for (const otherWindow of windows) {
            otherWindow.element.classList.toggle(
                'is-focused', otherWindow.id === windowId
            );
        }

        saveLayout();
    }

    function refreshViewList() {
        viewList.replaceChildren();

        for (const windowItem of windows) {
            const row = document.createElement('div');
            row.className = 'view-list-row';

            const label = document.createElement('span');
            label.textContent = windowItem.title;

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.textContent = isVisible(windowItem) ? 'Schließen' : 'Öffnen';
            toggle.addEventListener('click', () => {
                setWindowOpen(windowItem.id, !isVisible(windowItem));
            });

            row.append(label, toggle);
            viewList.appendChild(row);
        }
    }

    function setWindowOpen(windowId, shouldOpen) {
        const windowItem = findWindow(windowId);
        if (!windowItem) {
            return;
        }

        setVisible(windowItem, shouldOpen);

        if (shouldOpen) {
            // Bereits minimierte Fenster beim erneuten Öffnen entfalten.
            setWindowMinimized(windowId, false);
            positionWindow(windowItem, windowItem.x, windowItem.y);
            bringToFront(windowId);
        }

        saveLayout();
        refreshViewList();
    }

    function setWindowMinimized(windowId, shouldMinimize) {
        const windowItem = findWindow(windowId);
        if (!windowItem) {
            return;
        }

        windowItem.minimized = shouldMinimize;
        windowItem.element.classList.toggle('is-minimized', shouldMinimize);
        saveLayout();
    }

    function setWindowDocked(windowId, side) {
        const windowItem = findWindow(windowId);
        if (!windowItem) {
            return;
        }

        if (windowItem.docked === side) {
            windowItem.docked = null;
            if (windowItem.previousPosition) {
                positionWindow(windowItem,
                    windowItem.previousPosition.x,
                    windowItem.previousPosition.y);
            }
        } else {
            if (!windowItem.docked) {
                windowItem.previousPosition = {
                    x: windowItem.x,
                    y: windowItem.y
                };
            }

            windowItem.docked = side;
            const dockX = side === 'left'
                ? 8
                : window.innerWidth - windowItem.element.offsetWidth - 8;
            positionWindow(windowItem, dockX, 86);
        }

        bringToFront(windowId);
        saveLayout();
    }

    function attachDragging(windowItem, titlebar) {
        let drag = null;

        titlebar.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.target.closest('button')) {
                return;
            }

            bringToFront(windowItem.id);
            drag = {
                pointerId: event.pointerId,
                initialMouseX: event.clientX,
                initialMouseY: event.clientY,
                initialWindowX: windowItem.x,
                initialWindowY: windowItem.y
            };

            titlebar.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        titlebar.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.pointerId) {
                return;
            }

            const movedX = event.clientX - drag.initialMouseX;
            const movedY = event.clientY - drag.initialMouseY;

            if (windowItem.docked && Math.abs(movedX) + Math.abs(movedY) > 5) {
                windowItem.docked = null;
            }

            positionWindow(windowItem,
                drag.initialWindowX + movedX,
                drag.initialWindowY + movedY);
        });

        function finishDragging(event) {
            if (!drag || event.pointerId !== drag.pointerId) {
                return;
            }
            drag = null;
            saveLayout();
        }

        titlebar.addEventListener('pointerup', finishDragging);
        titlebar.addEventListener('pointercancel', finishDragging);
        titlebar.addEventListener('dblclick', event => {
            if (event.target.closest('button')) {
                return;
            }
            setWindowDocked(windowItem.id, event.shiftKey ? 'left' : 'right');
            event.preventDefault();
        });
    }

    function createControlButton(symbol, description, handler) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = symbol;
        button.title = description;
        button.setAttribute('aria-label', description);
        button.addEventListener('click', handler);
        return button;
    }

    function initializeSingleWindow(windowItem) {
        const element = windowItem.element;
        const saved = savedLayout[windowItem.id] || {};
        const titlebar = element.querySelector('.floating-titlebar, .notepad-header');
        const controls = titlebar.querySelector('.floating-controls') || document.createElement('span');

        controls.classList.add('floating-controls');
        if (!controls.isConnected) {
            titlebar.appendChild(controls);
        }

        const minimizeButton = createControlButton('−',
            'Fenster minimieren', () => {
                setWindowMinimized(windowItem.id, !windowItem.minimized);
            });

        const closeButton = createControlButton('×',
            'Fenster schließen', () => setWindowOpen(windowItem.id, false));

        controls.append(minimizeButton, closeButton);

        windowItem.minimized = Boolean(saved.minimized);
        windowItem.docked = saved.docked || null;
        windowItem.previousPosition = saved.previousPosition || null;
        windowItem.element.classList.toggle('is-minimized', windowItem.minimized);

        // Normierte Standardpositionen funktionieren auch auf kleineren Monitoren.
        const initialX = Math.min(windowItem.x, window.innerWidth - 200);
        positionWindow(windowItem, saved.x ?? initialX, saved.y ?? windowItem.y);
        windowItem.zIndex = saved.zIndex ?? ++highestLayer;
        windowItem.element.style.zIndex = String(windowItem.zIndex);
        highestLayer = Math.max(highestLayer, windowItem.zIndex);

        const defaultOpen = windowItem.id !== 'notepad';
        setVisible(windowItem, saved.open ?? defaultOpen);
        element.addEventListener('pointerdown', () => bringToFront(windowItem.id));
        attachDragging(windowItem, titlebar);
    }

    for (const windowItem of windows) {
        initializeSingleWindow(windowItem);
    }

    // Die alten Öffnen-/Schließen-Knöpfe bleiben nutzbar.
    document.querySelector('#openNotes').addEventListener('click', () => {
        setWindowOpen('notepad', true);
    });
    document.querySelector('#closeNotes').addEventListener('click', () => {
        setWindowOpen('notepad', false);
    });

    viewListButton.addEventListener('click', () => {
        viewList.hidden = !viewList.hidden;
        viewListButton.setAttribute('aria-expanded', String(!viewList.hidden));
        refreshViewList();
    });

    document.addEventListener('pointerdown', event => {
        if (!document.querySelector('#viewManager').contains(event.target)) {
            viewList.hidden = true;
            viewListButton.setAttribute('aria-expanded', 'false');
        }
    });

    window.addEventListener('resize', () => {
        for (const windowItem of windows) {
            if (windowItem.docked) {
                const dockX = windowItem.docked === 'left'
                    ? 8
                    : window.innerWidth - windowItem.element.offsetWidth - 8;
                positionWindow(windowItem, dockX, 86);
            } else {
                positionWindow(windowItem, windowItem.x, windowItem.y);
            }
        }
        saveLayout();
    });

    refreshViewList();
    window.WindowManager = {
        open: windowId => setWindowOpen(windowId, true),
        close: windowId => setWindowOpen(windowId, false),
        focus: bringToFront
    };
})();
