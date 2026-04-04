"""Basic tests for aim.Video object."""

import io
import os
import tempfile
import unittest


class TestVideoObject(unittest.TestCase):
    """Test Video SDK object creation and serialization."""

    def test_import(self):
        from aim.sdk.objects.video import Video
        self.assertEqual(Video.AIM_NAME, 'aim.video')

    def test_from_bytes_mp4(self):
        from aim.sdk.objects.video import Video
        # Minimal valid-ish bytes (won't play but tests the path)
        fake_mp4 = b'\x00' * 100
        v = Video(fake_mp4, format='mp4', caption='test')
        self.assertEqual(v.storage['format'], 'mp4')
        self.assertEqual(v.storage['caption'], 'test')
        buf = v.get()
        self.assertEqual(buf.read(), fake_mp4)

    def test_from_file_path(self):
        from aim.sdk.objects.video import Video
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
            f.write(b'\x00\x00\x00\x1cftypisom')
            path = f.name
        try:
            v = Video(path)
            self.assertEqual(v.storage['format'], 'mp4')
            data = v.get().read()
            self.assertGreater(len(data), 0)
        finally:
            os.unlink(path)

    def test_from_file_gif(self):
        from aim.sdk.objects.video import Video
        with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as f:
            f.write(b'GIF89a' + b'\x00' * 50)
            path = f.name
        try:
            v = Video(path)
            self.assertEqual(v.storage['format'], 'gif')
        finally:
            os.unlink(path)

    def test_from_bytesio(self):
        from aim.sdk.objects.video import Video
        buf = io.BytesIO(b'\x00' * 50)
        v = Video(buf, format='webm')
        self.assertEqual(v.storage['format'], 'webm')

    def test_invalid_format_raises(self):
        from aim.sdk.objects.video import Video
        with self.assertRaises(ValueError):
            Video(b'\x00' * 10, format='avi')

    def test_no_format_raises(self):
        from aim.sdk.objects.video import Video
        with self.assertRaises(ValueError):
            Video(b'\x00' * 10)

    def test_invalid_path_raises(self):
        from aim.sdk.objects.video import Video
        with self.assertRaises(ValueError):
            Video('/nonexistent/video.mp4')

    def test_json(self):
        from aim.sdk.objects.video import Video
        v = Video(b'\x00' * 10, format='mp4', caption='hello', fps=30)
        j = v.json()
        self.assertEqual(j['format'], 'mp4')
        self.assertEqual(j['caption'], 'hello')
        self.assertEqual(j['fps'], 30)

    def test_numpy_requires_imageio(self):
        """Test numpy path (may fail if imageio not installed)."""
        try:
            import numpy as np
        except ImportError:
            self.skipTest('numpy not available')

        from aim.sdk.objects.video import Video

        # 4 frames, 2x2 RGB
        arr = np.zeros((4, 2, 2, 3), dtype=np.uint8)
        try:
            v = Video(arr, fps=10, format='gif')
            self.assertEqual(v.storage['format'], 'gif')
            self.assertGreater(len(v.get().read()), 0)
        except ImportError:
            self.skipTest('imageio not available for numpy conversion')

    def test_numpy_wrong_dims_raises(self):
        try:
            import numpy as np
        except ImportError:
            self.skipTest('numpy not available')

        from aim.sdk.objects.video import Video
        arr = np.zeros((10, 10, 3), dtype=np.uint8)  # 3D, not 4D
        with self.assertRaises((ValueError, ImportError)):
            Video(arr, fps=10)


class TestVideoSequence(unittest.TestCase):
    def test_sequence_import(self):
        from aim.sdk.sequences.video_sequence import Videos
        self.assertEqual(Videos.sequence_name(), 'videos')

    def test_allowed_dtypes(self):
        from aim.sdk.sequences.video_sequence import Videos
        dtypes = Videos.allowed_dtypes()
        self.assertIn('aim.video', dtypes)

    def test_sequence_type_map(self):
        from aim.sdk.sequences.sequence_type_map import SEQUENCE_TYPE_MAP
        self.assertEqual(SEQUENCE_TYPE_MAP['aim.video'], 'videos')
        self.assertEqual(SEQUENCE_TYPE_MAP['list(aim.video)'], 'videos')


class TestTopLevelImport(unittest.TestCase):
    def test_sdk_exports(self):
        from aim.sdk import Video, Videos
        self.assertIsNotNone(Video)
        self.assertIsNotNone(Videos)


if __name__ == '__main__':
    unittest.main()
