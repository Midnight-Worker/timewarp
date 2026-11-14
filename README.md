# Midnight Organizer V6 — Endlospapier

Der bisherige Schreibtisch, Zeitplanet und Kalender bleiben enthalten. **Neu:** die äußerste Detailstufe als verschiebbare Tagebuch-Papierfläche.

## Installation und Start

Python 3.10+ erforderlich. Optional für eigenes Desktopfenster:

```bash
pip install pywebview
python main.py
```

Ohne pywebview reicht **`python main.py`**. Dann wird nach Möglichkeit der Browser geöffnet. Sonst die angezeigte Adresse aufrufen: **http://127.0.0.1:8877**.

**Wichtig:** `index.html` nicht direkt als `file://` öffnen. Die neue Medienablage und SQLite laufen über den kleinen Python-Webserver.

## Bedienung

1. Mit `Tag` zur Tagesansicht und mit dem Mausrad weiter hineinzoomen. Oder oben direkt **Endlospapier** anklicken.
2. Auf **✎ Text** klicken und eine Tagebuchnotiz schreiben. Das Feld speichert automatisch.
3. Dateien aus dem Explorer auf das Papier ziehen oder **+ Fotos / Dateien** verwenden. Unterstützt Bilder, Audiodateien, Videos, DOCX, XLSX, PDFs und andere Dateien bis zu 100 MB je Datei.
4. Einträge an der **Titelleiste ziehen**, an der unteren rechten Ecke in der **Größe ändern**. Auf der leeren Fläche ziehen = Kamera verschieben; Mausrad = Papier-Zoom.
5. **☏ Nachricht**: Text einer exportierten/kopierten WhatsApp-Nachricht einfügen. Sprachaufnahmen als Audio-Datei importieren, z.B. .opus oder .ogg (Wiedergabe abhängig vom Browser-Codec).
6. Pro Video **GIF-Vorschau** an- oder ausschalten: bei Aktivierung stumm und in Endlosschleife, ansonsten normales Videoplayer-Verhalten.
7. **Bild in Text:** Zuerst in eine Textnotiz klicken, dann die Schaltfläche wählen und ein Foto laden. Das Foto wird links im Text platziert und der Text umfließt es.
8. Über die Datumsauswahl und Tag-Pfeile kannst du vergangene Erlebnisse dokumentieren oder zukünftige Tage vorbereiten.
9. **✎ Notizblock übernehmen** kopiert alle noch nicht verplanten Notizblock-Stichpunkte aus V5 in einen neuen Tagebucheintrag.

## Wo die Daten liegen

Automatisch neben `main.py` erzeugt:

- `daten/tagebuch.sqlite3`: Tagebuchobjekte, Positionen, Datumszuordnung und Dateimetadaten
- `daten/medien/`: importierte Dateien

**Beide sichern!** V5-Kalenderkarten und Schreibtisch-Notizen sind vorerst weiterhin browsergebunden (`localStorage`), während V6-Tagebucheinträge in SQLite gespeichert werden. Auch beim Browserwechsel sind sie damit vorhanden, solange derselbe lokale Python-Server benutzt wird.

## Grenzen von V6

- Noch **kein** echter Server für mehrere Nutzer; keine Anmeldung und keine Rechteverwaltung. Server nur auf `127.0.0.1`, nicht ins Internet stellen.
- Die Papierfläche ist endlos navigierbar, aber **je Datum eine eigene Fläche**; nahtlose stundenübergreifende Zeitkoordinaten stehen noch aus.
- Word/Excel/PDFs werden gespeichert und als Dateien geöffnet/heruntergeladen, **nicht im Papier bearbeitet**.
- WhatsApp-Nachrichten werden manuell per Kopieren/Einfügen oder als exportierte Dateien übernommen. Kein Zugriff auf WhatsApp-Konten oder automatische Synchronisierung.
- Browser/pywebview müssen den jeweiligen Audio-/Video-Codec unterstützen.
- Vorschau-Schleife kann vom Browser-Autoplay-Schutz blockiert werden.
- Autosave, Datei-Upload und Löschen sind im Prototyp implementiert; produktiv fehlen Versionierung, Undo und Backup-Automatik.
