import { Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';
import {
  expandOutline,
  gridOutline,
  contractOutline,
  ellipseOutline,
  triangleOutline,
  squareOutline,
} from 'ionicons/icons';
import ConsiderPage from './pages/consider';
import TrailPage from './pages/trail';
import MapPage from './pages/map';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { useState, useEffect } from 'react';

import { useSpaceTimeStore, useKeyStore } from './useCases/useStore';

import { AppContext } from './utils/appContext';
import { Consideration, Pass, PassIdHeaderPair } from './utils/appTypes';
import { usePersistentState } from './useCases/usePersistentState';

import { useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { signConsideration } from './useCases/useKeyHolder';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HackIonReactRouter = IonReactHashRouter as any;

setupIonicReact();

const App: React.FC = () => {
  const publicKeys = useKeyStore((state) => state.publicKeys);
  const setPublicKeys = useKeyStore((state) => state.setPublicKeys);
  const selectedKeyIndex = useKeyStore((state) => state.selectedKeyIndex);
  const selectedKey = useKeyStore((state) => state.selectedKey);
  const setSelectedKey = useKeyStore((state) => state.setSelectedKey);

  const [tipHeader, setTipHeader] = useState<PassIdHeaderPair>();
  const [currentPass, setCurrentPass] = usePersistentState<Pass | null>(
    'current-pass',
    null,
  );

  const [genesisPass, setGenesisPass] = usePersistentState<Pass | null>(
    'genesis-pass',
    null,
  );

  const graphDOT = useSpaceTimeStore((state) => state.getGraphDOT);
  const setGraphDOT = useSpaceTimeStore((state) => state.setGraphDOT);
  const [rankingFilter, setRankingFilter] = useState(0);

  const profile = useSpaceTimeStore((state) => state.getProfile);
  const setProfile = useSpaceTimeStore((state) => state.setProfile);

  const pkConsiderations = useSpaceTimeStore(
    (state) => state.getConsiderationsByPK,
  );
  const setPkConsiderations = useSpaceTimeStore(
    (state) => state.setConsiderationsByPK,
  );

  const setConsiderationByID = useSpaceTimeStore(
    (state) => state.setConsiderationByID,
  );

  const getConsiderationByID = useSpaceTimeStore(
    (state) => state.getConsiderationByID,
  );

  const [pendingConsiderations, setPendingConsiderations] = useState<
    Consideration[]
  >([]);

  const [selectedNode, setSelectedNode] = usePersistentState(
    'selected-node',
    '',
  );

  const { sendJsonMessage, readyState } = useWebSocket(
    `wss://${selectedNode}`,
    {
      protocols: ['passtrail.1'],
      onOpen: () => console.log('opened', selectedNode),
      onError: () => console.log('errored', selectedNode),
      shouldReconnect: () => true,
      share: true,
      onMessage: (event) => {
        const { type, body } = JSON.parse(event.data);

        switch (type) {
          case 'inv_pass':
            document.dispatchEvent(
              new CustomEvent<{
                consideration_id: string;
                error: string;
              }>('inv_pass', { detail: body.pass_ids }),
            );
            requestTipHeader();
            break;
          case 'tip_header':
            setTipHeader(body);
            break;
          case 'profile':
            setProfile(body);
            break;
          case 'graph':
            setGraphDOT(body.public_key, body.graph);
            break;
          case 'pass':
            if (body.pass.header.height === 0) {
              setGenesisPass(body.pass);
            }
            setCurrentPass(body.pass);
            break;
          case 'consideration':
            const { consideration_id, consideration } = body;
            setConsiderationByID(consideration_id, consideration);
            break;
          case 'push_consideration_result':
            document.dispatchEvent(
              new CustomEvent<{
                consideration_id: string;
                error: string;
              }>('push_consideration_result', { detail: body }),
            );
            break;
          case 'public_key_considerations':
            setPkConsiderations(
              body.public_key,
              body.filter_passes?.flatMap((i: any) => i.considerations) ?? [],
            );
            document.dispatchEvent(
              new CustomEvent<string>('public_key_considerations', {
                detail: body.public_key,
              }),
            );
            break;
          case 'filter_consideration_queue':
            setPendingConsiderations(body.considerations);
            break;
        }
      },
    },
  );

  const requestPeers = useCallback(() => {
    if (readyState !== ReadyState.OPEN) return;
    sendJsonMessage({
      type: 'get_peer_addresses',
    });
  }, [readyState, sendJsonMessage]);

  const requestPassById = useCallback(
    (pass_id: string) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_pass',
        body: { pass_id },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestPassByHeight = useCallback(
    (height: number) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_pass_by_height',
        body: { height },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestTipHeader = useCallback(() => {
    if (readyState !== ReadyState.OPEN) return;
    sendJsonMessage({ type: 'get_tip_header' });
  }, [readyState, sendJsonMessage]);

  const requestProfile = useCallback(
    (publicKeyB64: string) => {
      if (readyState !== ReadyState.OPEN) return;
      if (!publicKeyB64) throw new Error('missing publicKey');

      sendJsonMessage({
        type: 'get_profile',
        body: {
          public_key: publicKeyB64,
        },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestGraphDOT = useCallback(
    (publicKeyB64: string = '') => {
      if (readyState !== ReadyState.OPEN) return;

      sendJsonMessage({
        type: 'get_graph',
        body: {
          public_key: publicKeyB64,
        },
      });
    },
    [readyState, sendJsonMessage],
  );

  const pushConsideration = async (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: number,
  ) => {
    if (readyState !== ReadyState.OPEN) return;
    if (to && memo && tipHeader?.header.height && publicKeys.length) {
      const consideration = await signConsideration(
        to,
        memo,
        tipHeader?.header.height,
        selectedKeyIndex,
        passphrase,
      );

      if (!consideration) return;

      sendJsonMessage({
        type: 'push_consideration',
        body: {
          consideration,
        } as any,
      });
    }
  };

  const requestConsideration = useCallback(
    (consideration_id: string) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_consideration',
        body: { consideration_id },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestPkConsiderations = useCallback(
    (publicKeyB64: string) => {
      if (readyState !== ReadyState.OPEN) return;
      if (!publicKeyB64) throw new Error('missing publicKey');

      //TODO: skip if exists in cache
      //allow user to explicitly refresh

      if (tipHeader?.header.height) {
        sendJsonMessage({
          type: 'get_public_key_considerations',
          body: {
            public_key: publicKeyB64,
            start_height: tipHeader?.header.height + 1,
            end_height: 0,
            limit: 10,
          },
        });
      }
    },
    [readyState, sendJsonMessage, tipHeader],
  );

  const applyFilter = useCallback(
    (publicKeysB64: string[]) => {
      if (readyState !== ReadyState.OPEN) return;
      if (publicKeysB64.length) {
        sendJsonMessage({
          type: 'filter_add',
          body: {
            public_keys: publicKeysB64,
          },
        });
      }
    },
    [readyState, sendJsonMessage],
  );

  const requestPendingConsiderations = useCallback(
    (publicKeyB64: string) => {
      if (readyState !== ReadyState.OPEN) return;
      //applyFilter must be called first with a public key
      applyFilter([publicKeyB64]);
      sendJsonMessage({
        type: 'get_filter_consideration_queue',
      });
    },
    [readyState, applyFilter, sendJsonMessage],
  );

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    prefersDark.matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const eventHandler = (mediaQuery: MediaQueryListEvent) =>
      setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    prefersDark.addEventListener('change', eventHandler);

    return () => {
      prefersDark.removeEventListener('change', eventHandler);
    };
  }, [prefersDark, setColorScheme]);

  const appState = {
    publicKeys,
    setPublicKeys,
    selectedKeyIndex,
    selectedKey,
    setSelectedKey,
    requestTipHeader,
    tipHeader,
    setTipHeader,
    requestPassById,
    requestPassByHeight,
    currentPass,
    setCurrentPass,
    genesisPass,
    setGenesisPass,
    requestProfile,
    profile,
    setProfile,
    requestGraphDOT,
    graphDOT,
    setGraphDOT,
    rankingFilter,
    setRankingFilter,
    pushConsideration,
    requestConsideration,
    getConsiderationByID,
    setConsiderationByID,
    requestPkConsiderations,
    pkConsiderations,
    setPkConsiderations,
    requestPendingConsiderations,
    pendingConsiderations,
    setPendingConsiderations,
    selectedNode,
    setSelectedNode,
    colorScheme,
  };

  useEffect(() => {
    //First load
    if (!!selectedNode) {
      requestPeers();
      requestTipHeader();
    }
  }, [selectedNode, requestTipHeader, requestPeers]);

  return (
    <AppContext.Provider value={appState}>
      <IonApp>
        <HackIonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/">
                <MapPage />
                <ToggleTabBar hide={true} />
              </Route>
              <Route exact path="/trail">
                <TrailPage />
                <ToggleTabBar />
              </Route>
              <Route exact path="/map">
                <MapPage />
                <ToggleTabBar />
              </Route>
              <Route exact path="/consider">
                <ConsiderPage />
                <ToggleTabBar />
              </Route>
            </IonRouterOutlet>
            <IonTabBar id="app-tab-bar" slot="bottom">
              <IonTabButton tab="trail" href="/trail">
                <IonIcon
                  aria-hidden="true"
                  icon={
                    colorScheme === 'light' ? expandOutline : ellipseOutline
                  }
                />
              </IonTabButton>
              <IonTabButton tab="consider" href="/consider">
                <IonIcon
                  aria-hidden="true"
                  icon={
                    colorScheme === 'light' ? contractOutline : triangleOutline
                  }
                />
              </IonTabButton>
              <IonTabButton tab="map" href="/map">
                <IonIcon
                  aria-hidden="true"
                  icon={colorScheme === 'light' ? gridOutline : squareOutline}
                />
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </HackIonReactRouter>
      </IonApp>
    </AppContext.Provider>
  );
};

const ToggleTabBar = ({ hide }: { hide?: boolean }) => {
  useEffect(() => {
    const tabBar = document.getElementById('app-tab-bar');
    if (tabBar !== null) {
      tabBar.style.display = hide ? 'none' : 'flex';
    }
  }, [hide]);
  return <></>;
};

export default App;
