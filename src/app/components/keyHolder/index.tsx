import {
  IonChip,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  useIonModal,
} from '@ionic/react';
import {
  chevronExpandOutline,
  keyOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import QRCode from 'react-qr-code';
import { shortenB64 } from '../../utils/compat';
import KeyChip from '../keyChip';

const KeyHolder = ({
  hideLabel,
  publicKeys,
  selectedKey,
  setSelectedKey,
}: {
  hideLabel?: boolean;
  selectedKey: string;
  publicKeys: string[];
  setSelectedKey: (key: string) => void;
}) => {
  const [present, dismiss] = useIonModal(KeyDetails, {
    onDismiss: () => dismiss(),
    selectedKey,
    publicKeys,
    setSelectedKey,
  });

  return selectedKey ? (
    <IonChip
      onClick={(e) => {
        e.stopPropagation();
        present({
          initialBreakpoint: 0.75,
          breakpoints: [0, 0.75, 1],
        });
      }}
    >
      {!hideLabel && <code>{shortenB64(selectedKey)}</code>}
      <IonIcon
        style={
          hideLabel
            ? {
                marginLeft: '-4px',
              }
            : {}
        }
        icon={chevronExpandOutline}
        color="primary"
      ></IonIcon>
    </IonChip>
  ) : null;
};

export default KeyHolder;

const KeyDetails = ({
  onDismiss,
  publicKeys,
  selectedKey,
  setSelectedKey,
}: {
  onDismiss: () => void;
  selectedKey: string;
  publicKeys: string[];
  setSelectedKey: (key: string) => void;
}) => {
  return (
    <IonContent scrollY={false}>
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <QRCode
          id="QRCode"
          size={256}
          style={{
            background: 'white',
            padding: '8px',
            marginBottom: '10px',
            height: 'auto',
            width: 200,
          }}
          value={selectedKey}
          viewBox={`0 0 256 256`}
        />
        <KeyChip value={selectedKey} />
      </div>

      <IonList>
        <IonListHeader>
          <IonLabel>
            <h2>
              Alternate keys{' '}
              <IonIcon icon={keyOutline} color="primary"></IonIcon>
            </h2>
            <p>You have an unlimited number of keys in your keyholder.</p>
          </IonLabel>
        </IonListHeader>
        <section className="ion-content-scroll-host">
          {publicKeys.map((pubKey) => (
            <IonItem
              key={pubKey}
              button
              detail={selectedKey !== pubKey}
              onClick={() => {
                setSelectedKey(pubKey);
              }}
              aria-selected={selectedKey === pubKey}
              disabled={selectedKey === pubKey}
            >
              <IonLabel>
                <code>{shortenB64(pubKey)}</code>
                {pubKey === selectedKey && (
                  <IonIcon
                    className="ion-margin-start"
                    icon={checkmarkCircleOutline}
                    color="success"
                  ></IonIcon>
                )}
              </IonLabel>
            </IonItem>
          ))}
        </section>
      </IonList>
    </IonContent>
  );
};
