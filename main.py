"""Midnight Organizer V6 – lokaler Webserver, SQLite und Medienablage.
Start: python main.py  (pywebview optional)
"""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
from threading import Thread
import time
import json
import mimetypes
import sqlite3
import uuid
import webbrowser

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'daten'
MEDIA = DATA / 'medien'
DATA.mkdir(exist_ok=True)
MEDIA.mkdir(exist_ok=True)
DB = DATA / 'tagebuch.sqlite3'
MAX_UPLOAD = 100 * 1024 * 1024
HOST, PORT = '127.0.0.1', 8877


def connect():
    con = sqlite3.connect(DB, timeout=15)
    con.execute('PRAGMA journal_mode=WAL')
    con.execute('''CREATE TABLE IF NOT EXISTS paper_items (
        id TEXT PRIMARY KEY, day TEXT NOT NULL, kind TEXT NOT NULL,
        x REAL NOT NULL, y REAL NOT NULL, width REAL NOT NULL,
        height REAL NOT NULL, content TEXT NOT NULL DEFAULT '',
        media_id TEXT NOT NULL DEFAULT '', preview INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    con.execute('''CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY, filename TEXT NOT NULL, mimetype TEXT NOT NULL,
        size INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    return con

with connect() as db:
    pass


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print('%s %s' % (self.address_string(), fmt % args))

    def send(self, code, data, mime='application/json; charset=utf-8', extra=None):
        if not isinstance(data, bytes):
            data = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-store')
        if extra:
            for k, v in extra.items(): self.send_header(k, v)
        self.end_headers()
        try: self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError): pass

    def json_body(self, limit=2_000_000):
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > limit: raise ValueError('Ungültige Größe')
        return json.loads(self.rfile.read(n))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ('/paper.css', '/paper.js'):
            name = parsed.path.lstrip('/')
            mime = 'text/css; charset=utf-8' if name.endswith('.css') else 'text/javascript; charset=utf-8'
            return self.send(200, (ROOT / name).read_bytes(), mime)
        if parsed.path in ('/', '/index.html'):
            return self.send(200, (ROOT / 'index.html').read_bytes(), 'text/html; charset=utf-8')
        if parsed.path == '/api/items':
            day = parse_qs(parsed.query).get('day', [''])[0]
            if len(day) != 10: return self.send(400, {'error': 'Datum fehlt'})
            with connect() as db:
                rows = db.execute('SELECT id,day,kind,x,y,width,height,content,media_id,preview FROM paper_items WHERE day=? ORDER BY rowid', (day,)).fetchall()
            keys = ['id','day','kind','x','y','width','height','content','media_id','preview']
            return self.send(200, [dict(zip(keys,row)) for row in rows])
        if parsed.path.startswith('/media/'):
            mid = parsed.path.split('/')[-1]
            if not mid.isalnum(): return self.send(404, {'error':'Nicht gefunden'})
            with connect() as db: meta=db.execute('SELECT filename,mimetype FROM media WHERE id=?', (mid,)).fetchone()
            file = MEDIA / mid
            if not meta or not file.is_file(): return self.send(404, {'error':'Datei fehlt'})
            # Eingebettete HTML/SVG-Inhalte bleiben Downloads, kein aktiver Code aus Uploads.
            mime = meta[1]
            safe_inline = mime.startswith(('image/png','image/jpeg','image/gif','image/webp','audio/','video/'))
            disposition = 'inline' if safe_inline else 'attachment'
            filename = meta[0].replace('"','').replace('\\','_')
            return self.send(200,file.read_bytes(),mime,{'Content-Disposition':f'{disposition}; filename="{filename.encode("ascii", "ignore").decode() or "datei"}"'})
        self.send(404,{'error':'Unbekannter Pfad'})

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/upload':
            n = int(self.headers.get('Content-Length') or 0)
            if not (0 < n <= MAX_UPLOAD): return self.send(413, {'error':'Datei zu groß (max. 100 MB)'})
            filename = Path(unquote(parse_qs(parsed.query).get('name',['datei'])[0]).replace('\\','/')).name[:160] or 'datei'
            mime = (self.headers.get('Content-Type') or 'application/octet-stream').split(';')[0].strip().lower()
            mid = uuid.uuid4().hex
            (MEDIA / mid).write_bytes(self.rfile.read(n))
            with connect() as db: db.execute('INSERT INTO media (id,filename,mimetype,size) VALUES (?,?,?,?)',(mid,filename,mime,n))
            return self.send(201,{'id':mid,'filename':filename,'mime':mime,'size':n,'url':'/media/'+mid})
        if parsed.path == '/api/items':
            try:
                obj = self.json_body()
                kind = str(obj.get('kind','text'))
                if kind not in ('text','image','audio','video','file','link','message'): raise ValueError('Unbekannter Typ')
                day = str(obj['day'])
                from datetime import date
                date.fromisoformat(day)
                id_ = str(obj.get('id') or uuid.uuid4().hex)[:64]
                vals = (id_,day,kind,float(obj.get('x',50)),float(obj.get('y',70)),float(obj.get('width',300)),float(obj.get('height',180)),str(obj.get('content',''))[:100000],str(obj.get('media_id',''))[:80],int(bool(obj.get('preview',0))))
                with connect() as db:
                    db.execute('''INSERT INTO paper_items (id,day,kind,x,y,width,height,content,media_id,preview)
                        VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                        day=excluded.day,kind=excluded.kind,x=excluded.x,y=excluded.y,
                        width=excluded.width,height=excluded.height,content=excluded.content,
                        media_id=excluded.media_id,preview=excluded.preview,updated_at=CURRENT_TIMESTAMP''',vals)
                return self.send(200,{'ok':True,'id':id_})
            except (ValueError,KeyError,TypeError) as e: return self.send(400,{'error':str(e)})
        self.send(404,{'error':'Unbekannter Pfad'})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/items/'):
            id_ = parsed.path.split('/')[-1]
            with connect() as db: db.execute('DELETE FROM paper_items WHERE id=?',(id_,))
            return self.send(200, {'ok':True})
        self.send(404,{'error':'Unbekannter Pfad'})


if __name__ == '__main__':
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://{HOST}:{PORT}'
    print(f'Midnight Organizer: {url}  | Daten: {DATA}')
    try:
        import webview
        webview.create_window('Midnight Organizer · V6 Endlospapier',url,fullscreen=True,background_color='#071320')
        webview.start()
    except ImportError:
        print('pywebview nicht installiert – öffne die URL im Browser. Strg+C beendet.')
        webbrowser.open(url)
        try:
            while True: time.sleep(3600)
        except KeyboardInterrupt: pass
    finally:
        server.shutdown()
