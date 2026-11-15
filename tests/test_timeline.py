"""Kleine isolierte Datenbanktests – mit der Python-Standardbibliothek."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import timeline_database


class TimelineDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp_folder = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_folder.name) / "test.sqlite3"
        self.patcher = patch.object(timeline_database, 'DATABASE_FILE', self.db_path)
        self.patcher.start()
        timeline_database.create_timeline_table()

    def tearDown(self):
        self.patcher.stop()
        self.temp_folder.cleanup()

    def test_entry_is_saved_and_found_by_day(self):
        item = {
            'id': 'test-1',
            'local_time': '2026-11-15T14:37',
            'kind': 'text',
            'content': 'Ausflug mit Fotos',
        }
        timeline_database.save_entry(item)

        entries = timeline_database.get_entries('2026-11-15', '2026-11-15')
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]['content'], 'Ausflug mit Fotos')
        self.assertEqual(
            timeline_database.get_day_counts('2026-11-15', '2026-11-15'),
            {'2026-11-15': 1},
        )

        timeline_database.delete_entry('test-1')
        self.assertEqual(timeline_database.get_entries('2026-11-15', '2026-11-15'), [])

    def test_invalid_time_is_rejected(self):
        with self.assertRaises(ValueError):
            timeline_database.save_entry({
                'local_time': '2026-11-15T99:99',
                'kind': 'text',
            })


if __name__ == '__main__':
    unittest.main()
