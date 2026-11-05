import type { Equipment, Reading } from '../domain/types';
import { getOutdoorReference } from '../network/ambientApi';
import { findEquipment, listReadings, recordReading, saveEquipmentState, saveMaxTemp } from './localDb';

const AMBIENT_NODE_ID = 'A-003';

const round1 = (v: number) => Math.round(v * 10) / 10;

type SimulationInput = { id: string; temperature: number };
type SyncResult = { temperature: number; humidity: number | null };

export interface PlantRepository {
  findEquipment(filter: string): Promise<Equipment[]>;
  saveEquipmentState(id: string, enabled: boolean): Promise<void>;
  saveMaxTemp(id: string, maxTemp: number): Promise<void>;
  listReadings(equipmentId: string, limit?: number): Promise<Reading[]>;
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
  listReadings,
  simulateCycle,
  syncReference,
};

// Fake with no database or network, so a ViewModel can run without a device.
export const createInMemoryRepository = (initial: Equipment[] = []): PlantRepository => {
  let equipment = [...initial];
  let readings: Reading[] = [];
  let nextReadingId = 1;

  const record = (equipmentId: string, temperature: number, source: string) => {
    equipment = equipment.map((item) => (item.id === equipmentId ? { ...item, temperature } : item));
    const reading: Reading = {
      id: nextReadingId,
      equipmentId,
      temperature,
      source,
      createdAt: new Date().toISOString(),
    };
    nextReadingId += 1;
    readings = [reading, ...readings];
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
    listReadings: async (equipmentId, limit = 10) =>
      readings.filter((reading) => reading.equipmentId === equipmentId).slice(0, limit),
    simulateCycle: async (items) => {
      for (const item of items) {
        if (item.id !== AMBIENT_NODE_ID) record(item.id, round1(item.temperature + 1), 'simulación');
      }
    },
    syncReference: async () => {
      const result = { temperature: 20, humidity: 50 };
      record(AMBIENT_NODE_ID, result.temperature, 'API ambiental');
      return result;
    },
  };
};
