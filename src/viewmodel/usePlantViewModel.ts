import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import type { Equipment, SyncMode } from '../domain/types';
import { sqlitePlantRepository, type PlantRepository } from '../data/plantRepository';

type ListRequest = {
  filter: string;
  successNotice: string;
  errorPrefix: string;
};

export interface PlantViewModel {
  items: Equipment[];
  filter: string;
  loading: boolean;
  notice: string;
  mode: SyncMode;
  humidity: number | null;
  vibration: number | null;
  search: (text: string) => void;
  changeEnabled: (id: string, enabled: boolean) => Promise<void>;
  simulate: () => Promise<void>;
  sync: () => Promise<void>;
}

export function usePlantViewModel(repo: PlantRepository = sqlitePlantRepository): PlantViewModel {
  const [items, setItems] = useState<Equipment[]>([]);
  const [listRequest, setListRequest] = useState<ListRequest>({
    filter: '',
    successNotice: 'Equipos locales listos.',
    errorPrefix: 'No se pudieron cargar equipos',
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Cargando equipos locales…');
  const [mode, setMode] = useState<SyncMode>('inicial');
  const [humidity, setHumidity] = useState<number | null>(null);
  const [vibration, setVibration] = useState<number | null>(null);

  // Every request is a new object, so the cleanup discards any response still pending.
  useEffect(() => {
    let isCurrent = true;
    repo.findEquipment(listRequest.filter)
      .then((rows) => {
        if (isCurrent) {
          setItems(rows);
          setNotice(listRequest.successNotice);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) setNotice(`${listRequest.errorPrefix}: ${String(error)}`);
      });
    return () => {
      isCurrent = false;
    };
  }, [listRequest, repo]);

  useEffect(() => {
    let active = true;
    let subscription: { remove(): void } | undefined;
    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (available && active) {
          Accelerometer.setUpdateInterval(1000);
          subscription = Accelerometer.addListener(({ x, y, z }) => {
            const magnitude = Math.sqrt(x * x + y * y + z * z);
            setVibration(Math.round(Math.abs(magnitude - 1) * 100) / 100);
          });
        }
      })
      .catch(() => setVibration(null));
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  // The functional form reads the latest filter, not the one captured by this render.
  const refreshList = (successNotice: string, errorPrefix: string) => {
    setListRequest((previous) => ({ filter: previous.filter, successNotice, errorPrefix }));
  };

  const search = (text: string) => {
    setListRequest({
      filter: text,
      successNotice: 'Listado actualizado.',
      errorPrefix: 'Error al filtrar',
    });
  };

  const changeEnabled = async (id: string, enabled: boolean) => {
    setItems((current) => current.map((item) =>
      item.id === id ? { ...item, enabled: enabled ? 1 : 0 } : item
    ));
    try {
      await repo.saveEquipmentState(id, enabled);
      setNotice(`Comando local aplicado a ${id}.`);
    } catch (error) {
      setNotice(`Error al guardar el estado: ${String(error)}`);
    }
  };

  const simulate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const all = await repo.findEquipment('');
      await repo.simulateCycle(all);
      setMode('simulado');
      refreshList('Lecturas simuladas registradas en SQLite.', 'No se pudo simular');
    } catch (error) {
      setNotice(`No se pudo simular: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    if (loading) return;
    setLoading(true);
    let successNotice: string;
    try {
      const all = await repo.findEquipment('');
      await repo.simulateCycle(all);
      const result = await repo.syncReference();
      setHumidity(result.humidity);
      setMode('sincronizado');
      successNotice = 'Referencia ambiental recibida por HTTP y guardada.';
    } catch {
      setMode('simulado');
      successNotice = 'Sin conexión externa. Se registraron lecturas simuladas.';
    }
    refreshList(successNotice, 'No se pudo actualizar la vista');
    setLoading(false);
  };

  return {
    items, filter: listRequest.filter, loading, notice, mode, humidity, vibration,
    search, changeEnabled, simulate, sync,
  };
}
