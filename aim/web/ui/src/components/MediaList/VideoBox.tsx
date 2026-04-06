import React from 'react';
import classNames from 'classnames';

import { Skeleton } from '@material-ui/lab';
import { Dialog, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

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
  const [isFullViewOpen, setIsFullViewOpen] = React.useState<boolean>(false);
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

  const handleClick = () => {
    if (blobData) {
      setIsFullViewOpen(true);
    }
  };

  const thumbWidth = style.width - 6;
  const thumbHeight = mediaItemHeight - 40;

  const renderThumbnail = () => {
    if (!blobData) return null;
    const thumbStyle: React.CSSProperties = {
      width: thumbWidth,
      height: thumbHeight,
      objectFit: 'contain' as const,
      display: 'block',
      backgroundColor: '#1a1a1a',
    };
    if (isGif) {
      return (
        <img
          src={`data:image/gif;base64,${blobData}`}
          alt={data.caption}
          style={thumbStyle}
        />
      );
    }
    return (
      <video
        muted
        autoPlay
        loop
        playsInline
        style={thumbStyle}
      >
        <source
          src={`data:${getMimeType(format)};base64,${blobData}`}
          type={getMimeType(format)}
        />
      </video>
    );
  };

  const renderFullView = () => {
    if (!blobData) return null;
    const fullStyle: React.CSSProperties = {
      maxWidth: '85vw',
      maxHeight: '80vh',
      display: 'block',
    };
    if (isGif) {
      return (
        <img
          src={`data:image/gif;base64,${blobData}`}
          alt={data.caption}
          style={fullStyle}
        />
      );
    }
    return (
      <video controls autoPlay style={fullStyle}>
        <source
          src={`data:${getMimeType(format)};base64,${blobData}`}
          type={getMimeType(format)}
        />
      </video>
    );
  };

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
          <div
            className='VideoBox__wrapper'
            onClick={handleClick}
            style={{ cursor: blobData ? 'pointer' : 'default' }}
          >
            {blobData ? (
              renderThumbnail()
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
      <ErrorBoundary>
        <Dialog
          onClose={() => setIsFullViewOpen(false)}
          open={isFullViewOpen}
          maxWidth={false}
          PaperProps={{
            style: {
              backgroundColor: '#1a1a1a',
              padding: '16px',
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            },
          }}
        >
          <IconButton
            onClick={() => setIsFullViewOpen(false)}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              color: '#fff',
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {renderFullView()}
            {data.caption && (
              <Text
                style={{ color: '#ccc', textAlign: 'center' }}
                size={12}
                weight={400}
              >
                {data.caption}
              </Text>
            )}
          </div>
        </Dialog>
      </ErrorBoundary>
    </ErrorBoundary>
  );
};

export default VideoBox;
