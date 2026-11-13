import { useEffect, useState } from 'react';
import { loadWhoData } from './loadWhoData';
import type { WhoDataset } from './whoData';

export type WhoDataState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; dataset: WhoDataset };

/** Loads the WHO reference data once, when the growth chart is opened. */
export function useWhoData(): WhoDataState {
  const [state, setState] = useState<WhoDataState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadWhoData()
      .then((dataset) => {
        if (!cancelled) setState(dataset ? { status: 'ready', dataset } : { status: 'missing' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'missing' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
