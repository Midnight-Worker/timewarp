/*
 * paper-network.js – Kommunikation mit dem lokalen Python-Server.
 *
 * Hier befinden sich alle HTTP-Anfragen des Tagebucheditors.
 * Der Rest des Editors muss weder URLs noch HTTP-Methoden kennen.
 *
 * Rückgabewerte sind gewöhnliche JavaScript-Objekte.
 */

const PaperNetwork = {
    async loadEntries(dateString) {
        const encodedDate = encodeURIComponent(dateString);
        const response = await fetch(`/api/items?day=${encodedDate}`);
        await this.checkResponse(response);
        return response.json();
    },

    async saveEntry(entry) {
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        });

        await this.checkResponse(response);
    },

    async deleteEntry(entryId) {
        const encodedId = encodeURIComponent(entryId);
        const response = await fetch(`/api/items/${encodedId}`, {
            method: 'DELETE'
        });

        await this.checkResponse(response);
    },

    async uploadMedia(file) {
        const encodedName = encodeURIComponent(file.name);
        const response = await fetch(`/api/upload?name=${encodedName}`, {
            method: 'POST',
            headers: {
                'Content-Type': file.type || 'application/octet-stream'
            },
            body: file
        });

        await this.checkResponse(response);
        return response.json();
    },

    async checkResponse(response) {
        if (response.ok) {
            return;
        }

        let message = `HTTP-Fehler ${response.status}`;

        try {
            const errorDetails = await response.json();
            message = errorDetails.error || message;
        } catch (error) {
            // Nicht jede Serverantwort enthält JSON.
        }

        throw new Error(message);
    }
};
