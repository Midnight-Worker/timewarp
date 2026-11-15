/*
 * website-editor.js – Redaktion der späteren Website-Präsenz.
 *
 * Absichtlich eine lokale Entwurfsfassung: Es gibt keinen FTP-Upload,
 * keine Veröffentlichung und keinen Schreibzugriff auf midnight-worker.de.
 * Titel, Einleitung und Inhalt werden beim Tippen lokal gespeichert.
 */

const WebsiteEditor = (() => {
    const STORAGE_KEY = 'midnight.website.draft.v1';
    const editor = document.querySelector('#websiteEditor');
    const titleInput = document.querySelector('#websiteTitle');
    const introductionInput = document.querySelector('#websiteIntroduction');
    const contentInput = document.querySelector('#websiteContent');
    const preview = document.querySelector('#websitePreview');
    const status = document.querySelector('#websiteSaveStatus');

    function readDraft() {
        try {
            const savedDraft = localStorage.getItem(STORAGE_KEY);
            return savedDraft ? JSON.parse(savedDraft) : null;
        } catch (error) {
            console.warn('Website-Entwurf konnte nicht gelesen werden:', error);
            return null;
        }
    }

    function currentDraft() {
        return {
            title: titleInput.value,
            introduction: introductionInput.value,
            content: contentInput.value
        };
    }

    function showPreview(draft) {
        preview.replaceChildren();

        const heading = document.createElement('h2');
        heading.textContent = draft.title;

        const introduction = document.createElement('p');
        introduction.className = 'website-lead';
        introduction.textContent = draft.introduction;

        const content = document.createElement('p');
        content.style.whiteSpace = 'pre-wrap';
        content.textContent = draft.content;

        preview.append(heading, introduction, content);
    }

    function saveDraft() {
        const draft = currentDraft();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        showPreview(draft);
        status.textContent = '✓ Entwurf lokal gespeichert';
    }

    function open() {
        const draft = readDraft() || {
            title: 'MIDNIGHT WORKER',
            introduction: 'Willkommen in meiner Werkstatt.',
            content: 'Hier entstehen Projekte, Ideen und kleine Abenteuer.'
        };

        titleInput.value = draft.title;
        introductionInput.value = draft.introduction;
        contentInput.value = draft.content;
        showPreview(draft);
        editor.hidden = false;
        titleInput.focus();
    }

    function close() {
        saveDraft();
        editor.hidden = true;
    }

    function escapeHtml(text) {
        const temporaryElement = document.createElement('div');
        temporaryElement.textContent = text;
        return temporaryElement.innerHTML;
    }

    function exportHtml() {
        const draft = currentDraft();
        const page = `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>${escapeHtml(draft.title)}</title></head>
<body><h1>${escapeHtml(draft.title)}</h1>
<p>${escapeHtml(draft.introduction)}</p>
<article style="white-space:pre-wrap">${escapeHtml(draft.content)}</article>
</body></html>`;

        const file = new Blob([page], { type: 'text/html;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(file);
        const downloadLink = document.createElement('a');

        downloadLink.href = downloadUrl;
        downloadLink.download = 'midnight-website-entwurf.html';
        downloadLink.click();
        URL.revokeObjectURL(downloadUrl);
    }

    [titleInput, introductionInput, contentInput].forEach(field => {
        field.addEventListener('input', saveDraft);
        field.addEventListener('blur', saveDraft);
    });

    document.querySelector('#websiteClose').addEventListener('click', close);
    document.querySelector('#websiteExport').addEventListener('click', exportHtml);

    return { open, close };
})();
