import React from 'react';
import { areEqual, VariableSizeList as List } from 'react-window';

import { MediaTypeEnum } from 'components/MediaPanel/config';
import AudioBox from 'components/kit/AudioBox';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';

import {
  MEDIA_ITEMS_SIZES,
  MEDIA_LIST_HEIGHT,
} from 'config/mediaConfigs/mediaConfigs';

import getBiggestImageFromList from 'utils/getBiggestImageFromList';

import ImageBox from './ImageBox';
import VideoBox from './VideoBox';
import { IMediaListProps } from './MediaList.d';

const mediaBoxType: any = {
  [MediaTypeEnum.IMAGE]: ImageBox,
  [MediaTypeEnum.AUDIO]: AudioBox,
  [MediaTypeEnum.VIDEO]: VideoBox,
};

const VIDEO_GRID_ITEM_WIDTH = 240;
const VIDEO_GRID_ITEM_HEIGHT = 200;

function MediaList({
  data,
  wrapperOffsetWidth,
  addUriToList,
  mediaItemHeight,
  focusedState,
  additionalProperties,
  tooltip,
  mediaType,
  wrapperOffsetHeight,
  selectOptions,
  onRunsTagsChange,
}: IMediaListProps): React.FunctionComponentElement<React.ReactNode> {
  const isVideo = mediaType === MediaTypeEnum.VIDEO;

  const itemSize = React.useCallback(
    (index: number) => {
      if (isVideo) {
        return 0;
      }
      if (mediaType === MediaTypeEnum.AUDIO) {
        return MEDIA_ITEMS_SIZES[mediaType]().width;
      } else {
        return MEDIA_ITEMS_SIZES[mediaType]({
          data,
          index,
          additionalProperties,
          wrapperOffsetWidth,
          wrapperOffsetHeight,
        }).width;
      }
    },
    [
      additionalProperties,
      data,
      isVideo,
      mediaType,
      wrapperOffsetHeight,
      wrapperOffsetWidth,
    ],
  );

  const listHeight = React.useMemo(() => {
    if (isVideo) {
      return 0;
    }
    const { maxWidth, maxHeight } = getBiggestImageFromList(data);
    const { alignmentType, mediaItemSize } = additionalProperties;
    if (mediaType === MediaTypeEnum.IMAGE) {
      return MEDIA_LIST_HEIGHT[MediaTypeEnum.IMAGE]({
        alignmentType,
        maxHeight,
        maxWidth,
        wrapperOffsetWidth,
        mediaItemSize,
        mediaItemHeight,
      });
    } else {
      return MEDIA_LIST_HEIGHT[MediaTypeEnum.AUDIO](mediaItemHeight);
    }
  }, [
    additionalProperties,
    data,
    isVideo,
    mediaItemHeight,
    mediaType,
    wrapperOffsetWidth,
  ]);

  if (isVideo) {
    return (
      <ErrorBoundary>
        <div
          className='MediaList__videoGrid'
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${VIDEO_GRID_ITEM_WIDTH}px, 1fr))`,
            gap: '8px',
            width: '100%',
            padding: '4px',
          }}
        >
          {data.map((item: any, index: number) => (
            <ErrorBoundary key={index}>
              <VideoBox
                index={index}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: VIDEO_GRID_ITEM_HEIGHT,
                }}
                data={item}
                addUriToList={addUriToList}
                mediaItemHeight={VIDEO_GRID_ITEM_HEIGHT}
                focusedState={focusedState}
                additionalProperties={additionalProperties}
                tooltip={tooltip}
                selectOptions={selectOptions}
                onRunsTagsChange={onRunsTagsChange}
              />
            </ErrorBoundary>
          ))}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <List
        height={listHeight}
        itemCount={data.length}
        itemSize={itemSize}
        layout='horizontal'
        width={wrapperOffsetWidth}
        style={{ overflowY: 'hidden' }}
        itemData={{
          data,
          addUriToList,
          mediaItemHeight: listHeight,
          focusedState,
          additionalProperties,
          tooltip,
          mediaType,
          selectOptions,
          onRunsTagsChange,
        }}
      >
        {MediaBoxMemoized}
      </List>
    </ErrorBoundary>
  );
}

export default MediaList;

const MediaBoxMemoized = React.memo(function MediaBoxMemoized(props: any) {
  const { index, style, data } = props;
  const Component = mediaBoxType[data.mediaType];

  return (
    <ErrorBoundary>
      <Component
        key={index}
        index={index}
        style={style}
        data={data.data[index]}
        addUriToList={data.addUriToList}
        mediaItemHeight={data.mediaItemHeight}
        focusedState={data.focusedState}
        additionalProperties={data.additionalProperties}
        tooltip={data.tooltip}
        selectOptions={data.selectOptions}
        onRunsTagsChange={data.onRunsTagsChange}
      />
    </ErrorBoundary>
  );
}, areEqual);
