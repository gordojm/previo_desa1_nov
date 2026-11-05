import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Equipment } from '../domain/types';

interface ThresholdDialogProps {
  equipment: Equipment;
  saving: boolean;
  error: string | null;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function ThresholdDialog({ equipment, saving, error, onSave, onCancel }: ThresholdDialogProps) {
  const [text, setText] = useState(String(equipment.maxTemp));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => { if (!saving) onCancel(); }}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.code}>{equipment.id}</Text>
          <Text style={styles.title}>{equipment.name}</Text>
          <Text style={styles.label}>LÍMITE DE TEMPERATURA (°C)</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            keyboardType="decimal-pad"
            editable={!saving}
            autoFocus
            selectTextOnFocus
          />
          <Text style={styles.hint}>Mayor que 0 y menor o igual a 150.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable disabled={saving} onPress={onCancel} style={[styles.secondary, saving ? styles.disabled : null]}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable disabled={saving} onPress={() => onSave(text)} style={[styles.primary, saving ? styles.disabled : null]}>
              {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.primaryText}>Guardar</Text>}
            </Pressable>
          </View>
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
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: '#687990', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#CCD9E9', borderRadius: 11, height: 46, paddingHorizontal: 14, color: '#14233E', fontSize: 14 },
  hint: { fontSize: 11, color: '#687990' },
  error: { fontSize: 12, color: '#C45639', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 8 },
  primary: { flex: 1, backgroundColor: '#2365C7', borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center' },
  secondary: { flex: 1, backgroundColor: '#DDE9F8', borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  primaryText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  secondaryText: { color: '#162D50', fontSize: 13, fontWeight: '800' },
});
