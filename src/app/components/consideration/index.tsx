import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonCard,
  IonCardContent,
  IonCardHeader,
  useIonModal,
  IonText,
  IonNote,
  IonContent,
  IonPage,
  IonButton,
  IonToolbar,
  IonHeader,
  IonButtons,
  IonCardSubtitle,
  IonIcon,
  useIonActionSheet,
} from '@ionic/react';
import timeago from 'epoch-timeago';
import { Consideration } from '../../utils/appTypes';
import KeyViewer from '../keyViewer';
import { useClipboard } from '../../useCases/useClipboard';
import { ellipsisVertical } from 'ionicons/icons';
import {
  considerationID,
  getConsReference,
  shortenB64,
} from '../../utils/compat';
import { useContext, useEffect } from 'react';
import { AppContext } from '../../utils/appContext';
import { OverlayEventDetail } from '@ionic/core/components';

export const ConsiderationItem: React.FC<Consideration> = (consideration) => {
  const { requestConsideration, getConsiderationByID } = useContext(AppContext);

  const referenceID = getConsReference(consideration);
  const referenced = getConsiderationByID(referenceID);

  useEffect(() => {
    if (referenceID && !referenced) {
      requestConsideration(referenceID);
    }
  }, [referenceID, referenced, requestConsideration]);

  const [present, dismiss] = useIonModal(ConsiderationDetail, {
    onDismiss: () => dismiss(),
    consideration,
    referenced,
  });

  const { time, memo } = consideration;

  const timeMS = time * 1000;

  return (
    <IonItem lines="none" onClick={() => present()}>
      <IonLabel className="ion-text-wrap">
        <IonText color="tertiary">
          <sub>
            <time dateTime={new Date(timeMS).toISOString()}>
              <p>{timeago(timeMS)}</p>
            </time>
          </sub>
        </IonText>
        {memo && <p>{memo}</p>}
        {referenced && (
          <IonCard>
            <IonCardContent>{referenced.memo}</IonCardContent>
          </IonCard>
        )}
      </IonLabel>
    </IonItem>
  );
};

export default ConsiderationItem;

interface ConsiderationListProps {
  heading?: string;
  considerations: Consideration[];
}

export const ConsiderationList = ({
  considerations,
  heading,
}: ConsiderationListProps) => {
  return (
    <IonList>
      {heading && (
        <IonListHeader>
          <IonLabel>{heading}</IonLabel>
        </IonListHeader>
      )}
      {!considerations.length && (
        <IonItem>
          <IonLabel>No Activity</IonLabel>
        </IonItem>
      )}
      {considerations.map((tx, index) => (
        <ConsiderationItem
          key={index}
          by={tx.by}
          for={tx.for}
          memo={tx.memo}
          time={tx.time}
          nonce={tx.nonce}
          series={tx.series}
        />
      ))}
    </IonList>
  );
};

export const ConsiderationDetail = ({
  onDismiss,
  consideration,
  referenced,
}: {
  onDismiss: () => void;
  consideration: Consideration;
  referenced: Consideration;
}) => {
  const { copyToClipboard } = useClipboard();

  const [presentActionSheet] = useIonActionSheet();

  const handleActionSheet = ({ data }: OverlayEventDetail) => {
    if (data?.['action'] === 'copy') {
      copyToClipboard(considerationID(consideration));
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={() => onDismiss()}>
              Close
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                Considered by:{' '}
                <KeyViewer
                  value={
                    consideration.by ??
                    '0000000000000000000000000000000000000000000='
                  }
                />
              </div>
              <IonButton
                className="ion-no-padding"
                fill="clear"
                onClick={() => {
                  presentActionSheet({
                    onDidDismiss: ({ detail }) => handleActionSheet(detail),
                    header: `${shortenB64(
                      consideration.by ?? '0000000',
                    )} => ${shortenB64(consideration.for)}`,
                    buttons: [
                      {
                        text: 'Copy Rep ID',
                        data: {
                          action: 'copy',
                        },
                      },
                    ],
                  });
                }}
              >
                <IonIcon
                  color="primary"
                  slot="icon-only"
                  icon={ellipsisVertical}
                ></IonIcon>
              </IonButton>
            </IonCardSubtitle>
            <IonLabel>
              <IonNote>
                {new Date(consideration.time * 1000).toDateString()}
              </IonNote>
            </IonLabel>
          </IonCardHeader>
          <IonCardContent>
            <KeyViewer value={consideration.for} />
            <p>{consideration.memo}</p>
            {referenced && (
              <IonCard>
                <IonCardContent>
                  <KeyViewer value={referenced.for} />
                  <p>{referenced.memo}</p>
                </IonCardContent>
              </IonCard>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};
