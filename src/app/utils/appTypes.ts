export interface Profile {
  public_key: string;
  ranking: number;
  imbalance: number;
  catchment?: string;
  pass_id?: string;
  height?: number;
  error?: string;
}

export interface GraphNode {
  id: number;
  label: string;
  catchment?: string;
  catchmentIndex?: number;
  group?: number;
  neighbors?: GraphNode[];
  links?: GraphLink[];
  pubkey: string;
  ranking: number;
}

export interface GraphLink {
  source: number;
  target: number;
  value: number;
}

export interface PassHeader {
  previous: string;
  hash_list_root: string;
  time: number;
  target: string;
  trail_work: string;
  nonce: number;
  height: number;
  consideration_count: number;
}

export interface PassIdHeaderPair {
  pass_id: string;
  header: PassHeader;
}

export interface Pass {
  header: PassHeader;
  considerations: Consideration[];
}

export interface Consideration {
  time: number;
  nonce?: number;
  by?: string;
  for: string;
  memo: string;
  series?: number;
  signature?: string;
}
