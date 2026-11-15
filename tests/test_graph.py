"""Kleiner Datenbanktest – ohne echte Termine oder Benutzerdateien."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import calendar_database
import calendar_paper_bridge
import appointment_positions
import graph_database
import graph_routes
import paper_database
import timeline_database


class GraphDatabaseTests(unittest.TestCase):
    def test_one_appointment_and_one_timeline_note(self):
        with tempfile.TemporaryDirectory() as directory:
            database_path = Path(directory) / 'test.sqlite3'
            modules = [calendar_database, graph_database, paper_database, timeline_database, appointment_positions]
            patches = [patch.object(module, 'DATABASE_FILE', database_path) for module in modules]
            for active_patch in patches:
                active_patch.start()
            try:
                paper_database.prepare_storage()
                calendar_database.create_calendar_tables()
                timeline_database.create_timeline_table()
                graph_database.create_graph_tables()
                appointment_positions.create_position_table()

                timeline_database.save_entry({
                    'id': 'notiz-1',
                    'local_time': '2026-11-15T10:30',
                    'kind': 'text',
                    'content': 'Reisebericht',
                })
                revision = calendar_database.read_calendar()['revision']
                saved, _ = calendar_database.replace_calendar(revision, [{
                    'id': 12,
                    'at': '2026-11-15T09:30:00Z',
                    'owner': 'me',
                    'title': 'Reiseplanung',
                    'duration': 90,
                    'source_entry_id': 'notiz-1',
                }])
                self.assertTrue(saved)

                nodes = graph_routes.graph_nodes_for_day('2026-11-15')
                identifiers = {node['node_id'] for node in nodes}
                self.assertEqual(identifiers, {'timeline:notiz-1', 'appointment:12'})

                graph_database.save_position('2026-11-15', 'appointment:12', 300, 200)
                graph_database.add_connection(
                    '2026-11-15', 'timeline:notiz-1', 'appointment:12', 'dependency'
                )
                self.assertEqual(len(graph_database.read_connections('2026-11-15')), 1)
                self.assertEqual(graph_database.read_positions('2026-11-15')['appointment:12']['x'], 300)
            finally:
                for active_patch in reversed(patches):
                    active_patch.stop()


if __name__ == '__main__':
    unittest.main()
