import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonTextarea,
  IonToolbar,
} from '@ionic/react';
import { globeOutline } from 'ionicons/icons';
import { useInputValidationProps } from '../../useCases/useInputValidation';

const Navigator = ({
  currentNode,
  onDismiss,
}: {
  currentNode: string;
  onDismiss: (data?: string | null | undefined, role?: string) => void;
}) => {
  const {
    value: node,
    isValid: isNodeValid,
    isTouched: isNodeTouched,
    onBlur: onBlurNode,
    onInputChange: setNode,
  } = useInputValidationProps((node: string) =>
    /(?<=^|\s)(\w*-?\w+\.[a-z]{2,}\S*)/.test(node),
  );
  const host = 'sure-formerly-filly.ngrok-free.app';
  const genesisID =
    '00000000c746b9e51cd4ddf5fa6d3e88a7e8d0cfca941436a4a9c842beb7c7e5';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              color="medium"
              disabled={!currentNode && !node}
              onClick={() => onDismiss(null, 'cancel')}
            >
              Cancel
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              disabled={!node}
              onClick={() => onDismiss(node, 'confirm')}
              strong={true}
            >
              Confirm
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <h1>Dwellings</h1>
              <IonCardSubtitle>
                Dwelling on the inconsiderable frontier.
              </IonCardSubtitle>
              <IonText color="tertiary">
                <h6>
                  Whatever is true, whatever is honorable, whatever is right,
                  whatever is pure, whatever is lovely, whatever is admirable-
                  if anything is excellent or praiseworthy- dwell on these
                  things.
                </h6>
              </IonText>
            </IonCardTitle>
          </IonCardHeader>
        </IonCard>
        <section className="ion-padding">
          <IonText color="primary">
            <p>Enter a pass-trail to continue.</p>
          </IonText>
          <IonTextarea
            className={`${isNodeValid && 'ion-valid'} ${
              isNodeValid === false && 'ion-invalid'
            } ${isNodeTouched && 'ion-touched'}`}
            label="pass-trail url"
            labelPlacement="stacked"
            placeholder="peer-url/pass-id"
            value={node}
            onIonBlur={onBlurNode}
            enterkeyhint="go"
            onIonInput={(event) =>
              setNode((event.target.value! ?? '').replace(/^https?:\/\//, ''))
            }
            rows={5}
          />
          <IonText color="secondary">
            <p>Favorite pass-trail.</p>
          </IonText>
          <IonChip onClick={() => setNode(`${host}/${genesisID}`)}>
            <>Japa-da</>
            <IonIcon icon={globeOutline} color="primary"></IonIcon>
          </IonChip>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;
