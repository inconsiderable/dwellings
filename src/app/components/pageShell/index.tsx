import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonToolbar,
  useIonModal,
} from '@ionic/react';
import { OverlayEventDetail } from '@ionic/core/components';
import { globeOutline } from 'ionicons/icons';
import Navigator from '../navigator';
import { useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../../utils/appContext';

interface ToolBarButton {
  label: string;
  renderIcon?: () => JSX.Element;
  action: () => void;
}

interface Props {
  renderBody: () => JSX.Element;
  tools?: ToolBarButton[];
}

export const PageShell = ({ renderBody, tools }: Props) => {
  const { selectedNode, setSelectedNode } = useContext(AppContext);

  const [present, dismiss] = useIonModal(Navigator, {
    onDismiss: (data: string, role: string) => dismiss(data, role),
    currentNode: selectedNode,
  });

  const openModal = useCallback(() => {
    present({
      onWillDismiss: (ev: CustomEvent<OverlayEventDetail>) => {
        if (ev.detail.role === 'confirm') {
          setSelectedNode(ev.detail.data!);
        }
      },
    });
  }, [present, setSelectedNode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!selectedNode) {
        openModal();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedNode, openModal]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonChip onClick={openModal}>
              Dwellings
              <IonIcon icon={globeOutline} color="primary"></IonIcon>
            </IonChip>
          </IonButtons>

          {!!tools?.length && (
            <IonButtons slot="end">
              {tools.map((tool) => (
                <IonButton key={tool.label} onClick={tool.action}>
                  {tool.renderIcon ? tool.renderIcon() : tool.label}
                </IonButton>
              ))}
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>{renderBody()}</IonContent>
    </IonPage>
  );
};
