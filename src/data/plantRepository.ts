import type { Equipment } from '../domain/types';
import { getOutdoorReference } from '../network/ambientApi';
import { findEquipment, recordReading, saveEquipmentState, saveMaxTemp } from './localDb';

const AMBIENT_NODE_ID = 'A-003';

const round1 = (v: number) => Math.round(v * 10) / 10;

type SimulationInput = { id: string; temperature: number };
type SyncResult = { temperature: number; humidity: number | null };

export interface PlantRepository {
  findEquipment(filter: string): Promise<Equipment[]>;
  saveEquipmentState(id: string, enabled: boolean): Promise<void>;
  saveMaxTemp(id: string, maxTemp: number): Promise<void>;
  simulateCycle(equipment: SimulationInput[]): Promise<void>;
  syncReference(): Promise<SyncResult>;
}

export async function simulateCycle(equipment: SimulationInput[]): Promise<void> {
  for (const item of equipment) {
    if (item.id === AMBIENT_NODE_ID) continue;
    const delta = (Math.random() - 0.5) * 5;
    await recordReading(item.id, round1(item.temperature + delta), 'simulación');
  }
}

export async function syncReference(): Promise<SyncResult> {
  const reference = await getOutdoorReference();
  await recordReading(AMBIENT_NODE_ID, reference.temperature, 'API ambiental');
  return { temperature: reference.temperature, humidity: reference.humidity };
}

export const sqlitePlantRepository: PlantRepository = {
  findEquipment,
  saveEquipmentState,
  saveMaxTemp,
  simulateCycle,
  syncReference,
};

// Fake with no database or network, so a ViewModel can run without a device.
export const createInMemoryRepository = (initial: Equipment[] = []): PlantRepository => {
  let equipment = [...initial];

  const setTemperature = (id: string, temperature: number) => {
    equipment = equipment.map((item) => (item.id === id ? { ...item, temperature } : item));
  };

  return {
    findEquipment: async (filter) => {
      const text = filter.trim().toLowerCase();
      return equipment.filter(
        (item) => item.name.toLowerCase().includes(text) || item.id.toLowerCase().includes(text)
      );
    },
    saveEquipmentState: async (id, enabled) => {
      equipment = equipment.map((item) =>
        item.id === id ? { ...item, enabled: enabled ? 1 : 0 } : item
      );
    },
    saveMaxTemp: async (id, maxTemp) => {
      equipment = equipment.map((item) => (item.id === id ? { ...item, maxTemp } : item));
    },
    simulateCycle: async (items) => {
      for (const item of items) {
        if (item.id !== AMBIENT_NODE_ID) setTemperature(item.id, round1(item.temperature + 1));
      }
    },
    syncReference: async () => {
      const result = { temperature: 20, humidity: 50 };
      setTemperature(AMBIENT_NODE_ID, result.temperature);
      return result;
    },
  };
};
