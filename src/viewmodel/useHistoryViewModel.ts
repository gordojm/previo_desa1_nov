import { useEffect, useState } from 'react';
import type { Reading } from '../domain/types';
import { sqlitePlantRepository, type PlantRepository } from '../data/plantRepository';

export type HistoryState =
  | { status: 'loading' }
  | { status: 'success'; readings: Reading[] }
  | { status: 'error'; message: string };

export interface HistoryViewModel {
  state: HistoryState;
  retry: () => void;
}

export function useHistoryViewModel(
  equipmentId: string,
  repo: PlantRepository = sqlitePlantRepository
): HistoryViewModel {
  const [state, setState] = useState<HistoryState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setState({ status: 'loading' });
    repo.listReadings(equipmentId)
      .then((readings) => {
        if (isCurrent) setState({ status: 'success', readings });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ status: 'error', message: `No se pudo leer el historial: ${String(error)}` });
      });
    return () => {
      isCurrent = false;
    };
  }, [equipmentId, attempt, repo]);

  const retry = () => setAttempt((current) => current + 1);

  return { state, retry };
}
