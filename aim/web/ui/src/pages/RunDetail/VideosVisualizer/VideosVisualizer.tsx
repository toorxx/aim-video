import React from 'react';
import { useResizeObserver } from 'hooks';

import MediaPanel from 'components/MediaPanel';
import { MediaTypeEnum } from 'components/MediaPanel/config';
import BusyLoaderWrapper from 'components/BusyLoaderWrapper/BusyLoaderWrapper';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';

import {
  ImageRenderingEnum,
  MediaItemAlignmentEnum,
} from 'config/enums/imageEnums';

import blobsURIModel from 'services/models/media/blobsURIModel';
import videosExploreService from 'services/api/videosExplore/videosExplore';

import {
  decodeBufferPairs,
  decodePathsVals,
  iterFoldTree,
} from 'utils/encoder/streamEncoding';
import arrayBufferToBase64 from 'utils/arrayBufferToBase64';

import './VideosVisualizer.scss';

function VideosVisualizer(
  props: any,
): React.FunctionComponentElement<React.FunctionComponent> {
  const { data, isLoading } = props;
  const videoWrapperRef = React.useRef<any>(null);
  const [focusedState, setFocusedState] = React.useState({
    active: false,
    key: null,
  });
  const [offsetHeight, setOffsetHeight] = React.useState(
    videoWrapperRef?.current?.offsetHeight,
  );
  const [offsetWidth, setOffsetWidth] = React.useState(
    videoWrapperRef?.current?.offsetWidth,
  );

  useResizeObserver(
    () => setOffsetWidth(videoWrapperRef?.current?.offsetWidth),
    videoWrapperRef,
  );

  React.useEffect(() => {
    blobsURIModel.init();
  }, []);

  React.useEffect(() => {
    setOffsetHeight(videoWrapperRef?.current?.offsetHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoWrapperRef?.current?.offsetHeight]);

  function getVideosBlobsData(uris: string[]) {
    const request = videosExploreService.getVideosByURIs(uris);
    return {
      abort: request.abort,
      call: () => {
        return request
          .call()
          .then(async (stream) => {
            let bufferPairs = decodeBufferPairs(stream);
            let decodedPairs = decodePathsVals(bufferPairs);
            let objects = iterFoldTree(decodedPairs, 1);

            for await (let [keys, val] of objects) {
              const URI = keys[0];
              blobsURIModel.emit(URI as string, {
                [URI]: arrayBufferToBase64(val as ArrayBuffer) as string,
              });
            }
          })
          .catch((ex) => {
            if (ex.name === 'AbortError') {
              // Abort Error
            } else {
              // eslint-disable-next-line no-console
              console.log('Unhandled error: ');
            }
          });
      },
    };
  }

  const onActivePointChange = React.useCallback(
    (activePoint: any, focusedStateActive: boolean = false) => {
      setFocusedState({ key: activePoint.key, active: focusedStateActive });
    },
    [],
  );

  const additionalProperties = React.useMemo(() => {
    return {
      alignmentType: MediaItemAlignmentEnum.Height,
      mediaItemSize: 25,
      imageRendering: ImageRenderingEnum.Pixelated,
    };
  }, []);

  const sortFieldsDict = React.useMemo(() => {
    return {
      step: {
        group: 'record',
        label: 'record.step',
        value: 'step',
        readonly: false,
        order: 'desc',
      },
    };
  }, []);

  return (
    <ErrorBoundary>
      <BusyLoaderWrapper
        className='VisualizationLoader'
        isLoading={!!props.isLoading}
      >
        <div className='VideosVisualizer' ref={videoWrapperRef}>
          <MediaPanel
            mediaType={MediaTypeEnum.VIDEO}
            getBlobsData={getVideosBlobsData}
            data={data?.videosSetData}
            orderedMap={data?.orderedMap}
            isLoading={!data || isLoading}
            panelResizing={false}
            tableHeight={'0'}
            sortFieldsDict={sortFieldsDict}
            wrapperOffsetHeight={offsetHeight || 0}
            wrapperOffsetWidth={offsetWidth || 0}
            focusedState={focusedState}
            additionalProperties={additionalProperties}
            onActivePointChange={onActivePointChange}
            illustrationConfig={{ title: 'No Tracked Videos' }}
          />
        </div>
      </BusyLoaderWrapper>
    </ErrorBoundary>
  );
}

VideosVisualizer.displayName = 'VideosVisualizer';

export default React.memo(VideosVisualizer);
