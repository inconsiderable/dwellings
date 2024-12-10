import { IonChip, IonIcon, IonText } from '@ionic/react';
import { copyOutline, locationOutline } from 'ionicons/icons';
import { useClipboard } from '../../useCases/useClipboard';
import { useContext, useEffect } from 'react';
import { AppContext } from '../../utils/appContext';
import { shortenB64 } from '../../utils/compat';

export const KeyAbbrev = ({ value }: { value: string }) => {
  const abbrevKey = shortenB64(value);

  return <code>{abbrevKey}</code>;
};

const KeyChip = ({ value }: { value: string }) => {
  const { copyToClipboard } = useClipboard();

  const { colorScheme, requestProfile, profile } = useContext(AppContext);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (value) {
        requestProfile(value);
      }
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, requestProfile]);

  const pubKeyRanking = profile(value)?.ranking;
  const pubKeyImbalance = profile(value)?.imbalance;
  const cathcment = profile(value)?.catchment;

  return (
    <>
      <span>
        <IonChip onClick={() => copyToClipboard(value)}>
          <KeyAbbrev value={value} />
          <IonIcon icon={copyOutline} color="primary"></IonIcon>
        </IonChip>
        {cathcment && (
          <IonChip
            onClick={(e) => {
              window.open(`https://plus.codes/${cathcment}`);
            }}
          >
            <IonIcon
              style={{
                marginLeft: '-4px',
              }}
              icon={locationOutline}
              color="primary"
            ></IonIcon>
          </IonChip>
        )}
      </span>

      {pubKeyRanking !== undefined && (
        <IonText color="primary">
          <p>
            {pubKeyRanking !== undefined && (
              <>
                <strong>Considerability: </strong>
                <i>{Number((pubKeyRanking / 1) * 100).toFixed(2)}%</i>
              </>
            )}
            <br />
            {pubKeyImbalance !== undefined && (
              <>
                <strong>Imbalance: </strong>
                <i>
                  {`${pubKeyImbalance} conx`}
                  {colorScheme === 'light' ? <>&#127793;</> : <>&#128165;</>}
                </i>
              </>
            )}
          </p>
        </IonText>
      )}
    </>
  );
};

export default KeyChip;
