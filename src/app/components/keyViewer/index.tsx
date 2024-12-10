import { IonChip, IonIcon, useIonModal } from '@ionic/react';
import { receiptOutline } from 'ionicons/icons';
import { useContext, useEffect } from 'react';
import { ConsiderationList } from '../consideration';
import { AppContext } from '../../utils/appContext';
import KeyChip, { KeyAbbrev } from '../keyChip';

interface KeyViewerProps {
  value: string;
  label?: string;
  readonly?: boolean;
}

const KeyViewer: React.FC<KeyViewerProps> = ({ value, label, readonly }) => {
  const [present, dismiss] = useIonModal(KeyDetails, {
    onDismiss: () => dismiss(),
    value,
  });

  return value ? (
    <IonChip
      onClick={
        readonly
          ? () => {}
          : (e) => {
              e.stopPropagation();
              present({
                initialBreakpoint: 0.75,
                breakpoints: [0, 0.75, 1],
              });
            }
      }
    >
      {!readonly && <IonIcon icon={receiptOutline} color="primary"></IonIcon>}
      {label ? <code>{label}</code> : <KeyAbbrev value={value} />}
    </IonChip>
  ) : null;
};

export default KeyViewer;

const KeyDetails = ({
  onDismiss,
  value,
}: {
  onDismiss: () => void;
  value: string;
}) => {
  const { pkConsiderations, requestPkConsiderations } = useContext(AppContext);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (value) {
        requestPkConsiderations(value);
      }
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, requestPkConsiderations]);

  const considerations = pkConsiderations(value);

  return (
    <>
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <KeyChip value={value} />
        {!!considerations && !!considerations.length && (
          <div
            style={{
              alignSelf: 'stretch',
            }}
          >
            <ConsiderationList considerations={considerations} />
          </div>
        )}
      </div>
    </>
  );
};
