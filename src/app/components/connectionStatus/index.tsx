import { ReadyState } from 'react-use-websocket';
import { IonToast } from '@ionic/react';
import { useEffect, useState } from 'react';

interface ConnectionStatusProps {
  readyState: ReadyState;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ readyState }) => {
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(readyState !== ReadyState.OPEN);
  }, [setIsOpen, readyState]);

  return (
    <IonToast
      isOpen={isOpen}
      position="bottom"
      header="Connection status"
      message={connectionStatus}
      duration={5000}
    ></IonToast>
  );
};

export default ConnectionStatus;
