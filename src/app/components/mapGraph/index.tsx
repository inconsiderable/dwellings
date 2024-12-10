import ForceGraph2D from 'react-force-graph-2d';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonRange,
  useIonModal,
} from '@ionic/react';
import { optionsOutline } from 'ionicons/icons';
import { AppContext } from '../../utils/appContext';
import { shortenB64 } from '../../utils/compat';
import MapList from '../mapList';
import { GraphLink, GraphNode } from '../../utils/appTypes';

const NODE_R = 6;

function ConsiderationMap({
  forKey,
  setForKey,
  nodes,
  links,
  colorScheme,
  rankingFilter,
  setRankingFilter,
}: {
  forKey: string;
  setForKey: (pk: string) => void;
  nodes: GraphNode[];
  links: GraphLink[];
  rankingFilter: number;
  setRankingFilter: (filter: number) => void;
  colorScheme: 'light' | 'dark';
  tipHeight: number;
}) {
  const handleNodeFocus = useCallback(
    (node: any) => {
      setForKey(node?.pubkey);
    },
    [setForKey],
  );

  const handleNodeCanvasObject = useCallback(
    (node: any, ctx: any, globalScale: any) => {
      const label = node.label || shortenB64(node.pubkey);
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(
        (n) => n + fontSize * 0.2,
      ); // some padding

      ctx.fillStyle =
        colorScheme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y - bckgDimensions[1] / 2,
        bckgDimensions[0],
        bckgDimensions[1],
      );

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorScheme === 'light' ? '#ffffff' : '#000000';
      ctx.fillText(`${label}`, node.x, node.y);

      node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
    },
    [colorScheme],
  );

  const handleNodePointerAreaPaint = useCallback(
    (node: any, color: any, ctx: any) => {
      ctx.fillStyle = color;
      const bckgDimensions = node.__bckgDimensions;
      bckgDimensions &&
        ctx.fillRect(
          node.x - bckgDimensions[0] / 2,
          node.y - bckgDimensions[1] / 2,
          bckgDimensions[0],
          bckgDimensions[1],
        );
    },
    [],
  );

  const initialNode = useMemo(
    () => nodes.find((n) => n.pubkey === forKey),
    [nodes, forKey],
  );

  useEffect(() => {
    handleNodeFocus(initialNode);
  }, [initialNode, handleNodeFocus]);

  const forceRef = useRef<any>();

  const weightRatio = (weight: number) => {
    // if (tipHeight) {
    //   return (Number(weight) / Number(tipHeight)) * 50;
    // }
    return Number(weight);
  };

  const [present, dismiss] = useIonModal(Filters, {
    onDismiss: () => dismiss(),
    value: rankingFilter,
  });

  return (
    <>
      <IonCard style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <IonCardHeader className="ion-padding-horizontal">
          <IonCardSubtitle
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              Filtering <b>less than</b> {rankingFilter}%
            </div>
            <IonButton
              className="ion-no-padding"
              fill="clear"
              onClick={(e) => {
                e.stopPropagation();
                present({
                  initialBreakpoint: 0.75,
                  breakpoints: [0, 0.75, 1],
                });
              }}
            >
              <IonIcon
                color="primary"
                slot="icon-only"
                icon={optionsOutline}
              ></IonIcon>
            </IonButton>
          </IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <ForceGraph2D
              ref={forceRef}
              height={300}
              graphData={{ nodes, links }}
              linkColor={() =>
                colorScheme === 'light' ? '#55e816' : '#FE650D'
              }
              nodeRelSize={NODE_R}
              autoPauseRedraw={false}
              linkWidth={(link) => 1}
              linkDirectionalParticles={(link) =>
                Math.log2(weightRatio(link.value) * 2)
              }
              linkDirectionalParticleSpeed={(link) =>
                Math.log2(weightRatio(link.value) * 2) * 0.001
              }
              nodeCanvasObject={handleNodeCanvasObject}
              nodePointerAreaPaint={handleNodePointerAreaPaint}
              onNodeClick={handleNodeFocus}
              cooldownTicks={100}
              onEngineTick={() => {
                forceRef.current.zoomToFit();
              }}
              onEngineStop={() => forceRef.current.centerAt([0], [0], [300])}
            />
          </div>
        </IonCardContent>
      </IonCard>
      <MapList
        connected={nodes}
        selectedKey={forKey}
        setSelectedKey={setForKey}
      />
    </>
  );
}

export default ConsiderationMap;

export const Filters = ({
  onDismiss,
  value,
}: {
  onDismiss: () => void;
  value: string;
}) => {
  const { rankingFilter, setRankingFilter } = useContext(AppContext);

  return (
    <div className="ion-padding">
      <IonRange
        aria-label="Considerability filter"
        labelPlacement="start"
        label={`Filter < ${value}%`}
        pin={true}
        pinFormatter={(value: number) => `${value}%`}
        onIonChange={({ detail }) => setRankingFilter(Number(detail.value))}
        value={rankingFilter}
      />
    </div>
  );
};
