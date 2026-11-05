# Cambios y validación

## Funcionalidad 1 — Umbral

- Cambios realizados: Agregado un componente de diálogo que contiene el nombre del equipo, el input para el nuevo límite, el texto que contiene el error y los botones de interacción. Se hizo la implementación de el estado de alarma en los componentes de cada equipo y en el del resumen. El guardado se realiza en SQLite y después se actualiza la vista.
- Verificación:

https://github.com/user-attachments/assets/718b920d-8da4-48f6-986f-ffaf69a0b6d8

## Funcionalidad 2 — Historial

- Cambios realizados: Agregado un componente de diálogo que muestra una lista con las últimas lecturas para ese equipo, con fecha/hora, temperatura y origen, un empty state y limite de 10 ultimas lecturas.
- Verificación:

https://github.com/user-attachments/assets/fe913d95-a804-4e34-a908-6b4ed9d6a74e

## Refactorización A

- Problema: el viewmodel importaba la db local en vez de interactuar con el repositorio. además el retorno no estaba tipado.
- Solución: definir la interfaz del repositorio para que el viewmodel pueda recibirla por parámetro y devolver el tipo necesario (PlantViewModel)
- Evidencia:


``` typescript
import { sqlitePlantRepository, type PlantRepository } from '../data/plantRepository';

export function usePlantViewModel(repo: PlantRepository = sqlitePlantRepository): PlantViewModel {
```

``` typescript
export interface PlantRepository {
  findEquipment(filter: string): Promise<Equipment[]>;
  saveEquipmentState(id: string, enabled: boolean): Promise<void>;
  saveMaxTemp(id: string, maxTemp: number): Promise<void>;
  listReadings(equipmentId: string, limit?: number): Promise<Reading[]>;
  simulateCycle(equipment: SimulationInput[]): Promise<void>;
  syncReference(): Promise<SyncResult>;
}
```

## Refactorización B

- Problema: las consultas de busqueda no descartan la request cuando se realiza un cambio, y la race condition podria dar lugar a que una respuesta vieja pise una nueva.
- Solución: se usa el flag de vigencia (isCurrent) para que aplique la respuesta a la query mas reciente. tambien se podria aplicar un debounce a la busqueda para ahorrar en costos de request.
- Evidencia:

``` typescript
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
```

## Uso de IA (opcional)

- Herramienta utilizada: Claude Code
- Qué acepté, revisé o corregí: acepté un cambio por fuera de la consigna para remover un error en el typecheck. Mi propuesta tecnica fue comenzar primero por los 2 refators pedidos para no dar lugar a que ensucien las implementaciones posteriores y su funcionamiento. Después se implementaron las funcionalidades de seteo de umbral e historial. La bajada técnica fue hecha respetando los contenidos de la materia.
