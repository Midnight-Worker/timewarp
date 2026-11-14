from pathlib import Path
import webview

page = (Path(__file__).parent / 'index.html').resolve().as_uri()
webview.create_window('Midnight Organizer · Jahresdeck', page, fullscreen=True,
                      background_color='#071320')
webview.start()
