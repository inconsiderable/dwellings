import { ConsiderationList } from '../components/consideration';
import { PageShell } from '../components/pageShell';
import { useContext, useEffect, useState } from 'react';
import { IonSearchbar } from '@ionic/react';
import { Consideration } from '../utils/appTypes';
import { useKeyHolder } from '../useCases/useKeyHolder';
import { AppContext } from '../utils/appContext';

const Trail = () => {
  const {
    tipHeader,
    requestPassByHeight,
    currentPass,
    genesisPass,
    requestPkConsiderations,
    pkConsiderations,
    requestPendingConsiderations,
    pendingConsiderations,
  } = useContext(AppContext);

  const { selectedKey } = useKeyHolder();

  const tipHeight = tipHeader?.header.height ?? 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      requestPassByHeight(tipHeight);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tipHeight, requestPassByHeight]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (selectedKey) {
        requestPendingConsiderations(selectedKey);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedKey, requestPendingConsiderations]);

  let [fieldAddress, setFieldAddress] = useState('');

  const handleSearch = (ev: Event) => {
    const target = ev.target as HTMLIonSearchbarElement;
    if (!target) return;

    const value = target.value!;

    if (!value) {
      setFieldAddress('');
      return;
    }

    if (new RegExp('[A-Za-z0-9/+]{43}=').test(value)) {
      requestPkConsiderations(value);
      setFieldAddress(value);
    } else {
      //remove non Base64 characters eg: @&!; etc and pad with 00000
      const query = `${value.replace(/[^A-Za-z0-9/+]/gi, '').padEnd(43, '0')}=`;
      requestPkConsiderations(query);
      setFieldAddress(value.replace(/[^A-Za-z0-9/+]/gi, ''));
    }
  };

  const [fieldQueryTxns, setFieldQueryTxns] = useState<Consideration[]>([]);

  useEffect(() => {
    const resultHandler = (data: any) => {
      if (data.detail) {
        if (new RegExp('[A-Za-z0-9/+]{43}=').test(fieldAddress)) {
          setFieldQueryTxns(pkConsiderations(fieldAddress));
        } else {
          setFieldQueryTxns(
            pkConsiderations(`${fieldAddress.padEnd(43, '0')}=`),
          );
        }
      }
    };

    document.addEventListener('public_key_considerations', resultHandler);

    return () => {
      document.removeEventListener('public_key_considerations', resultHandler);
    };
  }, [fieldAddress, pkConsiderations]);

  return (
    <PageShell
      renderBody={() => (
        <>
          <IonSearchbar
            animated={true}
            placeholder="0000000000000000000000000000000000000000000="
            debounce={1000}
            onIonChange={(ev) => handleSearch(ev)}
            onIonInput={(ev) => setFieldAddress(ev.target.value! ?? '')}
            value={fieldAddress}
            type="search"
            enterkeyhint="search"
          />
          {fieldAddress ? (
            <ConsiderationList considerations={fieldQueryTxns} />
          ) : (
            <>
              <ConsiderationList
                heading="Genesis Pass"
                considerations={genesisPass?.considerations ?? []}
              />
              {!!pendingConsiderations && !!pendingConsiderations.length && (
                <ConsiderationList
                  heading="Pending"
                  considerations={pendingConsiderations}
                />
              )}
              {!!tipHeight && (
                <ConsiderationList
                  heading={`Current Pass: #${tipHeight}`}
                  considerations={currentPass?.considerations ?? []}
                />
              )}
            </>
          )}
        </>
      )}
    />
  );
};

export default Trail;
