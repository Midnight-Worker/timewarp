"""HTTP-Helfer für die vereinigte Papierwelt.

Diese API gibt lediglich Projektionen von Kalender- und Zeitpapierobjekten
zurück. Es werden KEINE zusätzlichen Terminkopien angelegt.
"""

from datetime import date
from urllib.parse import parse_qs

from calendar_paper_bridge import appointments_in_range
from timeline_database import get_entries
from graph_database import (
    add_connection,
    delete_connection,
    read_connections,
    read_positions,
    save_position,
)
from paper_database import connect_to_database


def validate_day(day):
    date.fromisoformat(day)
    return day


def graph_nodes_for_day(day):
    # Auf dem FREIEN Papier behalten auch mit Terminen verknüpfte Notizen
    # ihre eigene Identität: ein Termin ist eine andere Entität als die Quelle.
    original_entries = get_entries(day, day) + appointments_in_range(day, day)
    positions = read_positions(day)
    graph_nodes = []

    for entry in original_entries:
        if entry['kind'] == 'appointment':
            node_id = 'appointment:' + str(entry['appointment_id'])
        else:
            node_id = 'timeline:' + str(entry['id'])

        graph_nodes.append({
            'node_id': node_id,
            'kind': entry['kind'],
            'title': entry.get('content', ''),
            'local_time': entry['local_time'],
            'media_id': entry.get('media_id', ''),
            'preview': entry.get('preview', 0),
            'owner': entry.get('owner', ''),
            'appointment_id': entry.get('appointment_id'),
            'position': positions.get(node_id),
        })

    return graph_nodes


def all_node_ids_for_day(day):
    node_ids = {node['node_id'] for node in graph_nodes_for_day(day)}
    with connect_to_database() as connection:
        rows = connection.execute(
            'SELECT id FROM paper_items WHERE day = ?', (day,)
        ).fetchall()
    node_ids.update('paper:' + row[0] for row in rows)
    return node_ids


def handle_graph_get(request_handler, request_url):
    try:
        day = validate_day(parse_qs(request_url.query)['day'][0])
        request_handler.send_http_response(200, {
            'nodes': graph_nodes_for_day(day),
            'connections': read_connections(day),
        })
    except (KeyError, ValueError, IndexError) as error:
        request_handler.send_http_response(400, {'error': str(error)})


def handle_graph_post(request_handler, path):
    try:
        data = request_handler.read_json_request()
        day = validate_day(data['day'])
        node_ids = all_node_ids_for_day(day)

        if path == '/api/free-graph/position':
            node_id = str(data['node_id'])
            if node_id not in node_ids:
                raise ValueError('Knoten nicht gefunden')
            save_position(day, node_id, data['x'], data['y'])
        elif path == '/api/free-graph/connection':
            source_id = str(data['source_id'])
            target_id = str(data['target_id'])
            if source_id not in node_ids or target_id not in node_ids:
                raise ValueError('Verbindung zu unbekanntem Objekt')
            add_connection(day, source_id, target_id, data['relation_type'])
        else:
            request_handler.send_http_response(404, {'error': 'Pfad unbekannt'})
            return

        request_handler.send_http_response(200, {'ok': True})
    except (KeyError, TypeError, ValueError) as error:
        request_handler.send_http_response(400, {'error': str(error)})


def handle_graph_delete(request_handler, path):
    connection_id = path.removeprefix('/api/free-graph/connection/')
    delete_connection(connection_id)
    request_handler.send_http_response(200, {'ok': True})
