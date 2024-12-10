import './style.css';
import { IonThumbnail } from '@ionic/react';

interface QrCodeProps {
  isSummary: boolean;
  from: string;
  to: string;
  memo: string;
  time: number;
}

const QrCode: React.FC<QrCodeProps> = ({ from, to, memo, time, isSummary }) => {
  return (
    <IonThumbnail slot="start">
      <img
        alt="Silhouette of mountains"
        src="https://ionicframework.com/docs/img/demos/thumbnail.svg"
      />
    </IonThumbnail>
  );
};

export default QrCode;
