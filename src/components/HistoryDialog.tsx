import React from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Equipment, Reading } from '../domain/types';
import { useHistoryViewModel } from '../viewmodel/useHistoryViewModel';

interface HistoryDialogProps {
  equipment: Equipment;
  onClose: () => void;
}

function ReadingRow({ reading }: { reading: Reading }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.date}>{new Date(reading.createdAt).toLocaleString('es-AR')}</Text>
        <Text style={styles.source}>{reading.source}</Text>
      </View>
      <Text style={styles.temperature}>{reading.temperature.toFixed(1)} °C</Text>
    </View>
  );
}

export function HistoryDialog({ equipment, onClose }: HistoryDialogProps) {
  const { state, retry } = useHistoryViewModel(equipment.id);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.code}>{equipment.id} · ÚLTIMAS 10 LECTURAS</Text>
          <Text style={styles.title}>{equipment.name}</Text>

          {state.status === 'loading' ? <ActivityIndicator color="#2365C7" style={styles.message} /> : null}

          {state.status === 'error' ? (
            <View style={styles.message}>
              <Text style={styles.error}>{state.message}</Text>
              <Pressable onPress={retry} style={styles.secondary}>
                <Text style={styles.secondaryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          {state.status === 'success' ? (
            <FlatList
              style={styles.list}
              data={state.readings}
              keyExtractor={(reading) => String(reading.id)}
              renderItem={({ item }) => <ReadingRow reading={item} />}
              ListEmptyComponent={<Text style={styles.empty}>Todavía no se registraron lecturas para este equipo.</Text>}
            />
          ) : null}

          <Pressable onPress={onClose} style={styles.primary}>
            <Text style={styles.primaryText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,35,62,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#FFF', borderRadius: 15, padding: 18, gap: 8 },
  code: { fontSize: 10, fontWeight: '900', color: '#2365C7', letterSpacing: 0.3 },
  title: { fontSize: 16, fontWeight: '800', color: '#14233E' },
  list: { maxHeight: 420, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#DFE7F2' },
  rowText: { flex: 1 },
  date: { fontSize: 12, color: '#14233E', fontWeight: '700' },
  source: { fontSize: 11, color: '#687990', marginTop: 2 },
  temperature: { fontSize: 14, color: '#14233E', fontWeight: '800' },
  message: { marginVertical: 16, gap: 10 },
  error: { fontSize: 12, color: '#C45639', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#687990', marginVertical: 20 },
  primary: { backgroundColor: '#2365C7', borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondary: { backgroundColor: '#DDE9F8', borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  secondaryText: { color: '#162D50', fontSize: 13, fontWeight: '800' },
});
