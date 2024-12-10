import {
  IonBadge,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
} from '@ionic/react';
import { listOutline, chevronForwardOutline } from 'ionicons/icons';
import KeyViewer from '../keyViewer';

const MapList = ({
  connected,
  selectedKey,
  setSelectedKey,
}: {
  selectedKey: string;
  connected: {
    pubkey: string;
    ranking: number;
    label: string;
    catchment?: string;
  }[];
  setSelectedKey: (key: string) => void;
}) => {
  const forKey = connected.find((k) => k.pubkey === selectedKey);
  return (
    <IonList>
      <IonItem lines="none" unselectable="on">
        <IonLabel>
          <KeyViewer value={selectedKey} label={forKey?.label} />
        </IonLabel>
        <IonBadge className="ion-margin-start">
          {Number((forKey?.ranking ?? 0 / 1) * 100).toFixed(2)}%
        </IonBadge>
        <IonIcon slot="end" icon={listOutline}></IonIcon>
      </IonItem>
      <IonItem>
        {forKey?.catchment && (
          <IonBadge className="ion-margin-start">{forKey?.catchment}</IonBadge>
        )}
      </IonItem>
      <IonItemDivider></IonItemDivider>
      {connected
        .filter((k) => k.pubkey !== selectedKey)
        .sort((a, b) => b.ranking - a.ranking)
        .map(({ ranking, pubkey, label, catchment }) => (
          <IonItem
            lines="none"
            key={pubkey}
            aria-selected={selectedKey === pubkey}
            onClick={() => {
              setSelectedKey(pubkey);
            }}
          >
            <IonLabel>
              <KeyViewer readonly value={pubkey} label={label} />
            </IonLabel>

            <IonBadge className="ion-margin-start">
              {Number((ranking / 1) * 100).toFixed(2)}%
            </IonBadge>
            <IonIcon slot="end" icon={chevronForwardOutline}></IonIcon>
          </IonItem>
        ))}
    </IonList>
  );
};

export default MapList;
