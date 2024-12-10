import naclUtil from 'tweetnacl-util';
import nacl from 'tweetnacl';
import * as bip39 from 'bip39';
import { sha3_256 } from 'js-sha3';
import { PLOTS_UNTIL_NEW_SERIES } from '../utils/constants';
import { Consideration } from '../utils/appTypes';
import { useContext } from 'react';
import { AppContext } from '../utils/appContext';

function generateMnemonic(privateEntropy: string): string {
  const hashedEntropy = sha3_256(privateEntropy);

  return bip39.entropyToMnemonic(hashedEntropy);
}

window.Buffer = window.Buffer || require('buffer').Buffer;

const getKeyHolder = async (passphrase: string, count: number) => {
  const mnemonic = generateMnemonic(passphrase);

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const keypairs = [];

  for (let i = 0; i < count; i++) {
    const derivedSeed = nacl.hash(
      Buffer.concat([seed, Buffer.from(String(i), 'utf-8')]),
    );
    const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed.slice(0, 32));
    keypairs.push({
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
      privateKey: keyPair.secretKey,
    });
  }

  return keypairs;
};

export const signConsideration = async (
  to: string,
  memo: string,
  tipHeight: number,
  keyHolderIndex: number,
  passPhrase: string,
) => {
  //Prompt -> Sign -> Forget
  //We never persist the passphrase or private keys in state or anywhere else.
  //Any usage of the private keys must require a user prompt for their passphrase.

  const keyholder = await getKeyHolder(passPhrase, Number(keyHolderIndex + 1));

  const keyPair = keyholder[keyHolderIndex];

  const consideration: Consideration = {
    time: Math.floor(Date.now() / 1000),
    nonce: Math.floor(Math.random() * (2 ** 31 - 1)),
    by: keyPair.publicKey,
    for: to,
    memo,
    series: Math.floor(tipHeight / PLOTS_UNTIL_NEW_SERIES) + 1,
  };

  const tx_hash = sha3_256(JSON.stringify(consideration));

  const tx_byte = new Uint8Array(
    (tx_hash.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)),
  );

  consideration.signature = naclUtil.encodeBase64(
    nacl.sign.detached(tx_byte, keyPair.privateKey),
  );
  return consideration;
};

const importKeys = async (passPhrase: string, returnedKeyCount: number) => {
  //We can keep the public keys in state
  //But we never persist the passphrase or private keys in state or anywhere else.
  return (await getKeyHolder(passPhrase, returnedKeyCount)).map(
    (keypair) => keypair.publicKey,
  );
};

export const useKeyHolder = () => {
  const {
    publicKeys,
    setPublicKeys,
    selectedKey,
    selectedKeyIndex,
    setSelectedKey,
  } = useContext(AppContext);

  const importKeyHolder = async (passphrase: string) => {
    const keys = await importKeys(passphrase, 10);

    setPublicKeys(keys);
  };

  const deleteKeyHolder = () => {
    setPublicKeys([]);
  };

  return {
    selectedKey,
    selectedKeyIndex,
    setSelectedKey,
    publicKeys,
    importKeyHolder,
    deleteKeyHolder,
  };
};
