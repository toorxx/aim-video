import io
import logging
import os.path

from aim.sdk.num_utils import inst_has_typename
from aim.storage.object import CustomObject
from aim.storage.types import BLOB


logger = logging.getLogger(__name__)


@CustomObject.alias('aim.video')
class Video(CustomObject):
    """Video object used to store video clips in Aim repository.

    Supported formats: mp4, webm, gif.

    Args:
         data: file path, bytes, io.BytesIO, or numpy.ndarray with shape (T, H, W, C).
         format (:obj:`str`): Video format. Inferred from path if possible.
         fps (:obj:`int`): Frames per second when encoding from numpy. Default 24.
         caption (:obj:`str`, optional): Optional caption. '' by default.
    """

    AIM_NAME = 'aim.video'

    MP4 = 'mp4'
    WEBM = 'webm'
    GIF = 'gif'

    video_formats = (MP4, WEBM, GIF)

    def __init__(self, data, format: str = '', fps: int = 24, caption: str = ''):
        super().__init__()

        video_format = format.lower() if format else ''

        # numpy array (T, H, W, C) → MP4
        if inst_has_typename(data, ['ndarray.numpy']):
            video_format = video_format or self.MP4
            data = self._numpy_to_bytes(data, fps, video_format)

        # Infer format from file path
        if isinstance(data, str) and not video_format:
            ext = os.path.splitext(data)[1].lstrip('.').lower()
            if ext in self.video_formats:
                video_format = ext

        if not video_format:
            raise ValueError(f'Video format must be provided. Supported: {self.video_formats}')
        if video_format not in self.video_formats:
            raise ValueError(f'Invalid video format. Must be one of {self.video_formats}')

        # Read from file path
        if isinstance(data, str):
            if not os.path.exists(data) or not os.path.isfile(data):
                raise ValueError(f'Invalid video file path: {data}')
            with open(data, 'rb') as f:
                data = f.read()
        elif isinstance(data, io.BytesIO):
            data = data.read()

        if not isinstance(data, bytes):
            raise TypeError('Content is not a byte-stream object')

        extra = {'caption': caption, 'format': video_format, 'fps': fps}
        self._prepare(data, **extra)

    @staticmethod
    def _numpy_to_bytes(arr, fps: int, fmt: str) -> bytes:
        """Convert numpy array (T, H, W, C) to video bytes using imageio."""
        try:
            import imageio.v3 as iio
        except ImportError:
            try:
                import imageio as iio
            except ImportError:
                raise ImportError(
                    'imageio is required for numpy→video conversion. '
                    'Install with: pip install imageio[ffmpeg]'
                )

        if arr.ndim != 4:
            raise ValueError(f'Expected numpy array with 4 dims (T,H,W,C), got {arr.ndim}')

        buf = io.BytesIO()
        # Use imageio to write frames
        if hasattr(iio, 'imwrite'):
            # imageio v3
            extension = f'.{fmt}'
            iio.imwrite(buf, arr, extension=extension, fps=fps)
        else:
            # imageio v2 fallback
            writer = iio.get_writer(buf, format=fmt, fps=fps)
            for frame in arr:
                writer.append_data(frame)
            writer.close()

        return buf.getvalue()

    def json(self):
        """Dump video metadata to a dict"""
        return {
            'caption': self.storage['caption'],
            'format': self.storage['format'],
            'fps': self.storage['fps'],
        }

    def _prepare(self, data, **extra) -> None:
        assert isinstance(data, bytes)
        for k, v in extra.items():
            self.storage[k] = v
        self.storage['data'] = BLOB(data=data)

    def get(self) -> io.BytesIO:
        """Read video data from storage into a buffer."""
        bs = self.storage.get('data')
        if not bs:
            return io.BytesIO()
        return io.BytesIO(bytes(bs))
