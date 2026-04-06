import React from 'react';
import classNames from 'classnames';

import { Skeleton } from '@material-ui/lab';

import { Text } from 'components/kit';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';

import { BATCH_COLLECT_DELAY } from 'config/mediaConfigs/mediaConfigs';
import { MediaItemAlignmentEnum } from 'config/enums/imageEnums';

import blobsURIModel from 'services/models/media/blobsURIModel';

const VideoBox = ({
  index,
  style,
  data,
  addUriToList,
  mediaItemHeight,
  focusedState,
  additionalProperties,
}: any): React.FunctionComponentElement<React.ReactNode> => {
  const { format, blob_uri } = data;
  let [blobData, setBlobData] = React.useState<string>(
    blobsURIModel.getState()[blob_uri] ?? null,
  );

  React.useEffect(() => {
    let timeoutID: number;
    let subscription: any;

    if (blobData === null) {
      if (blobsURIModel.getState()[blob_uri]) {
        setBlobData(blobsURIModel.getState()[blob_uri]);
      } else {
        subscription = blobsURIModel.subscribe(blob_uri, (d: any) => {
          setBlobData(d[blob_uri]);
          subscription.unsubscribe();
        });
        timeoutID = window.setTimeout(() => {
          if (blobsURIModel.getState()[blob_uri]) {
            setBlobData(blobsURIModel.getState()[blob_uri]);
            subscription.unsubscribe();
          } else {
            addUriToList(blob_uri);
          }
        }, BATCH_COLLECT_DELAY);
      }
    }

    return () => {
      if (timeoutID) {
        clearTimeout(timeoutID);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [addUriToList, blobData, blob_uri]);

  const getMimeType = (fmt: string) => {
    switch (fmt) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'gif':
        return 'image/gif';
      default:
        return 'video/mp4';
    }
  };

  const isGif = format === 'gif';

  return (
    <ErrorBoundary key={index}>
      <div className='VideoBox' style={style}>
        <div
          className={classNames('VideoBox__content', {
            focus: focusedState.key === data.key && focusedState?.active,
            active: focusedState.key === data.key && !focusedState?.active,
          })}
          data-key={`${data.key}`}
          data-seqkey={`${data.seqKey}`}
          data-mediasetitem='mediaSetItem'
        >
          <div className='VideoBox__wrapper'>
            {blobData ? (
              isGif ? (
                <img
                  src={`data:image/gif;base64,${blobData}`}
                  alt={data.caption}
                  style={{ maxWidth: '100%', maxHeight: mediaItemHeight - 40 }}
                />
              ) : (
                <video
                  controls
                  style={{ maxWidth: '100%', maxHeight: mediaItemHeight - 40 }}
                >
                  <source
                    src={`data:${getMimeType(format)};base64,${blobData}`}
                    type={getMimeType(format)}
                  />
                </video>
              )
            ) : (
              <Skeleton
                variant='rect'
                height={Math.min(style.width * 0.75, mediaItemHeight - 40)}
                width={style.width - 6}
              />
            )}
            <Text style={{ maxWidth: style.width }} size={10} weight={400}>
              {data.caption}
            </Text>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default VideoBox;
