import { useContext, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonTextarea,
  useIonActionSheet,
  useIonModal,
  useIonToast,
} from '@ionic/react';
import {
  ellipsisHorizontal,
  ellipsisVertical,
  qrCodeOutline,
} from 'ionicons/icons';
import type { OverlayEventDetail } from '@ionic/core';
import { PageShell } from '../components/pageShell';
import { Html5QrcodePlugin } from '../utils/qr-scanner';
import { useInputValidationProps } from '../useCases/useInputValidation';
import KeyViewer from '../components/keyViewer';
import KeyHolder from '../components/keyHolder';
import { useKeyHolder } from '../useCases/useKeyHolder';
import { AppContext } from '../utils/appContext';
import { shortenHex } from '../utils/compat';
import { ImportKeyHolder } from '../components/importKeyHolder';

const Pass = () => {
  const { colorScheme, pushConsideration, profile, requestProfile } =
    useContext(AppContext);

  const {
    value: identifier,
    onBlur: onBlurIdentifier,
    isValid: isIdentifierValid,
    isTouched: isIdentifierTouched,
    onInputChange: setIdentifier,
  } = useInputValidationProps((identifier: string) =>
    new RegExp('[A-Za-z0-9/+]{43}=').test(identifier),
  );

  const {
    value: feedback,
    onBlur: onBlurFeedback,
    isValid: isFeedbackValid,
    isTouched: isFeedbackTouched,
    onInputChange: setFeedback,
  } = useInputValidationProps(
    (feedback: string) => feedback.length > 0 || feedback.length <= 200,
  );

  const execute = (passphrase: string, selectedKeyIndex: number) => {
    if (!isIdentifierValid || !isFeedbackValid) {
      return;
    }
    pushConsideration(identifier, feedback, passphrase, selectedKeyIndex);
  };

  const [presentScanner, dismissScanner] = useIonModal(ScanQR, {
    onDismiss: (data?: string) => dismissScanner(data),
  });

  const [presentToast] = useIonToast();

  const [presentModal, dismiss] = useIonModal(AuthorizeConsideration, {
    onDismiss: () => dismiss(),
    onAuthorize: (passphrase: string, selectedKeyIndex: number) => {
      execute(passphrase, selectedKeyIndex);
      dismiss();
    },
    identifier,
    feedback,
  });

  useEffect(() => {
    const pushResultHandler = (data: any) => {
      presentToast({
        message:
          data.detail.error ||
          `Consideration: ${shortenHex(
            data.detail.consideration_id,
          )} was executed`,
        duration: 5000,
        position: 'bottom',
      });

      if (!data.detail.error) {
        setIdentifier('');
        setFeedback('');
      }
    };

    document.addEventListener('push_consideration_result', pushResultHandler);

    return () => {
      document.removeEventListener(
        'push_consideration_result',
        pushResultHandler,
      );
    };
  }, [presentToast, setIdentifier, setFeedback]);

  const {
    publicKeys,
    selectedKey,
    setSelectedKey,
    importKeyHolder,
    deleteKeyHolder,
  } = useKeyHolder();

  const keyProfile = profile(selectedKey);
  const pubKeyImbalance = keyProfile?.imbalance;
  const pubKeyRanking = keyProfile?.ranking;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (selectedKey) {
        requestProfile(selectedKey);
      }
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedKey, requestProfile]);

  const [presentActionSheet] = useIonActionSheet();

  const handleActionSheet = ({ data, role }: OverlayEventDetail) => {
    if (data?.['action'] === 'delete') {
      deleteKeyHolder();
    }
  };

  return (
    <PageShell
      tools={
        !!selectedKey
          ? [
              {
                label: 'action sheet',
                renderIcon: () => (
                  <IonIcon
                    slot="icon-only"
                    ios={ellipsisHorizontal}
                    md={ellipsisVertical}
                  ></IonIcon>
                ),
                action: () =>
                  presentActionSheet({
                    onDidDismiss: ({ detail }) => handleActionSheet(detail),
                    header: 'Actions',
                    buttons: [
                      {
                        text: 'Delete keyholder',
                        role: 'destructive',
                        data: {
                          action: 'delete',
                        },
                      },
                      {
                        text: 'Cancel',
                        role: 'cancel',
                        data: {
                          action: 'cancel',
                        },
                      },
                    ],
                  }),
              },
            ]
          : []
      }
      renderBody={() => (
        <>
          {!selectedKey ? (
            <ImportKeyHolder importKeyholder={importKeyHolder} />
          ) : (
            <>
              <section className="ion-padding-top ion-padding-start ion-padding-end">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    <KeyViewer value={selectedKey} />
                    {selectedKey && (
                      <KeyHolder
                        hideLabel={true}
                        setSelectedKey={(key) => {
                          setSelectedKey(key);
                        }}
                        selectedKey={selectedKey}
                        publicKeys={publicKeys}
                      />
                    )}
                  </span>
                </div>
                <>
                  {pubKeyRanking !== undefined && (
                    <IonText color="primary">
                      <p>
                        <strong>Considerability: </strong>
                        <i>{Number((pubKeyRanking / 1) * 100).toFixed(2)}%</i>
                      </p>
                    </IonText>
                  )}
                  {pubKeyImbalance !== undefined && (
                    <IonText color="primary">
                      <p>
                        <strong>Imbalance: </strong>
                        <i>
                          {`${pubKeyImbalance} conx`}
                          {colorScheme === 'light' ? (
                            <>&#127793;</>
                          ) : (
                            <>&#128165;</>
                          )}
                        </i>
                      </p>
                    </IonText>
                  )}
                </>
              </section>
              <IonList>
                <IonItem lines="none">
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => {
                      presentScanner({
                        onWillDismiss: (
                          ev: CustomEvent<OverlayEventDetail>,
                        ) => {
                          if (typeof ev.detail.data === 'string') {
                            setIdentifier(ev.detail.data);
                          }
                        },
                      });
                    }}
                  >
                    Scan
                    <IonIcon slot="end" icon={qrCodeOutline}></IonIcon>
                  </IonButton>
                </IonItem>
                <IonItem lines="none">
                  <IonInput
                    className={`${isIdentifierValid && 'ion-valid'} ${
                      isIdentifierValid === false && 'ion-invalid'
                    } ${isIdentifierTouched && 'ion-touched'}`}
                    label="Identifier"
                    labelPlacement="stacked"
                    clearInput={true}
                    errorText="Invalid Identifier"
                    value={
                      identifier.substring(40) === '000='
                        ? identifier.replace(/0+=?$/g, '')
                        : identifier
                    }
                    onIonBlur={() => {
                      if (!new RegExp('[A-Za-z0-9/+]{43}=').test(identifier)) {
                        setIdentifier(
                          `${identifier
                            .replace(/[^A-Za-z0-9/+]/gi, '')
                            .padEnd(43, '0')}=`,
                        );
                      }
                      onBlurIdentifier();
                    }}
                    onIonInput={(event) =>
                      setIdentifier(event.target.value?.toString() ?? '')
                    }
                  />
                </IonItem>

                <IonItem lines="none">
                  <IonTextarea
                    className={`${isFeedbackValid && 'ion-valid'} ${
                      isFeedbackValid === false && 'ion-invalid'
                    } ${isFeedbackTouched && 'ion-touched'}`}
                    label="Memo"
                    placeholder=""
                    labelPlacement="stacked"
                    counter={true}
                    maxlength={200}
                    value={feedback}
                    onIonBlur={onBlurFeedback}
                    onIonInput={(event) =>
                      setFeedback(event.target.value ?? '')
                    }
                  />
                </IonItem>
              </IonList>
              <IonButton
                disabled={!isIdentifierValid || !isFeedbackValid}
                expand="block"
                className="ion-padding ion-no-margin"
                strong={true}
                onClick={() =>
                  presentModal({
                    initialBreakpoint: 0.75,
                    breakpoints: [0, 0.75],
                  })
                }
              >
                Consider
              </IonButton>
            </>
          )}
        </>
      )}
    />
  );
};

export default Pass;

export const ScanQR = ({
  onDismiss,
}: {
  onDismiss: (decodedText?: string) => void;
}) => {
  const onNewScanResult = (decodedText: string, decodedResult: any) => {
    onDismiss(decodedText ?? '');
  };
  return (
    <PageShell
      tools={[{ label: 'Cancel', action: onDismiss }]}
      renderBody={() => (
        <IonCard>
          <IonCardSubtitle>Scan QR</IonCardSubtitle>
          <IonCardContent>
            <Html5QrcodePlugin
              fps={10}
              qrbox={250}
              disableFlip={false}
              qrCodeSuccessCallback={onNewScanResult}
            />
          </IonCardContent>
        </IonCard>
      )}
    />
  );
};

const AuthorizeConsideration = ({
  onDismiss,
  onAuthorize,
  identifier,
  feedback,
}: {
  onDismiss: () => void;
  onAuthorize: (passphrase: string, selectedKeyIndex: number) => void;
  identifier: string;
  feedback: string;
}) => {
  const {
    value: passphrase,
    onBlur: onBlurPassphrase,
    isValid: isPassphraseValid,
    isTouched: isPassphraseTouched,
    onInputChange: setPassphrase,
  } = useInputValidationProps((input: string) => input.length > 0);

  const { publicKeys, selectedKey, selectedKeyIndex, setSelectedKey } =
    useKeyHolder();

  return (
    <div>
      <IonCard>
        <IonCardHeader>
          <IonCardSubtitle>
            Considered by:
            <KeyHolder
              publicKeys={publicKeys}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          </IonCardSubtitle>
          <IonCardSubtitle>Confirm consideration</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <IonTextarea
            aria-label="feedback"
            className="ion-margin-top"
            readonly
            value={feedback}
          />
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-evenly',
            }}
          >
            <KeyViewer value={identifier} />
          </span>
        </IonCardContent>
      </IonCard>
      <IonCard>
        <IonCardContent>
          <IonInput
            className={`${isPassphraseValid && 'ion-valid'} ${
              isPassphraseValid === false && 'ion-invalid'
            } ${isPassphraseTouched && 'ion-touched'}`}
            label="Enter Passphrase"
            labelPlacement="stacked"
            clearInput={true}
            errorText="Invalid passphrase"
            value={passphrase}
            type="password"
            onIonBlur={onBlurPassphrase}
            onIonInput={(event) =>
              setPassphrase(event.target.value?.toString() ?? '')
            }
          />
          <IonButton
            className="ion-margin-top"
            fill="solid"
            expand="block"
            strong={true}
            disabled={!isPassphraseValid}
            onClick={() => onAuthorize(passphrase, selectedKeyIndex)}
          >
            Confirm
          </IonButton>
          <IonButton
            fill="outline"
            expand="block"
            strong={true}
            onClick={() => onDismiss()}
          >
            Cancel
          </IonButton>
        </IonCardContent>
      </IonCard>
    </div>
  );
};
