import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { equiposApi } from '../../../services/api';

interface Equipo {
  id: number;
  nombre: string;
  color_primario: string;
  color_secundario: string;
  escudo_url?: string;
}

const EMPTY: Omit<Equipo, 'id'> = { nombre: '', color_primario: '#1a472a', color_secundario: '#ffffff' };

export default function EquiposScreen() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Equipo | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await equiposApi.list();
      setEquipos(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalVisible(true);
  };

  const openEdit = (eq: Equipo) => {
    setEditing(eq);
    setForm({ nombre: eq.nombre, color_primario: eq.color_primario, color_secundario: eq.color_secundario });
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.nombre.trim()) return Alert.alert('Error', 'El nombre es obligatorio');
    try {
      if (editing) {
        await equiposApi.update(editing.id, form);
      } else {
        await equiposApi.create(form);
      }
      setModalVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message);
    }
  };

  const remove = (eq: Equipo) => {
    Alert.alert('Eliminar equipo', `¿Eliminar "${eq.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await equiposApi.delete(eq.id);
            load();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || e.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Equipo }) => {
    const expanded = expandedId === item.id;
    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardMain} onPress={() => setExpandedId(expanded ? null : item.id)}>
          <View style={[styles.colorCircle, { backgroundColor: item.color_primario }]} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.nombre}</Text>
            <Text style={styles.cardMeta}>{item.color_primario} / {item.color_secundario}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#a7c4a7" />
        </TouchableOpacity>
        {expanded && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil" size={18} color="#52b788" />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={() => remove(item)}>
              <Ionicons name="trash" size={18} color="#dc2626" />
              <Text style={[styles.actionText, { color: '#dc2626' }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#52b788" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={equipos}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#52b788" />}
        ListEmptyComponent={<Text style={styles.empty}>No hay equipos registrados</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? 'Editar Equipo' : 'Nuevo Equipo'}</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} placeholder="Nombre del equipo" placeholderTextColor="#666" />

            <Text style={styles.label}>Color primario (hex)</Text>
            <View style={styles.colorRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={form.color_primario} onChangeText={(t) => setForm({ ...form, color_primario: t })} placeholder="#1a472a" placeholderTextColor="#666" />
              <View style={[styles.colorPreview, { backgroundColor: form.color_primario }]} />
            </View>

            <Text style={styles.label}>Color secundario (hex)</Text>
            <View style={styles.colorRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={form.color_secundario} onChangeText={(t) => setForm({ ...form, color_secundario: t })} placeholder="#ffffff" placeholderTextColor="#666" />
              <View style={[styles.colorPreview, { backgroundColor: form.color_secundario }]} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveText}>{editing ? 'Guardar' : 'Crear'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1a13' },
  center: { flex: 1, backgroundColor: '#0f1a13', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#1a2e1f', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#2d6a4f' },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardName: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cardMeta: { color: '#a7c4a7', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2d6a4f' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6 },
  dangerBtn: { borderLeftWidth: 1, borderLeftColor: '#2d6a4f' },
  actionText: { color: '#52b788', fontSize: 14, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#52b788', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  empty: { color: '#a7c4a7', textAlign: 'center', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1a2e1f', borderRadius: 16, padding: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#a7c4a7', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f1a13', borderRadius: 10, padding: 12, color: '#ffffff', fontSize: 15, borderWidth: 1, borderColor: '#2d6a4f' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorPreview: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#2d6a4f' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#0f1a13' },
  cancelText: { color: '#a7c4a7', fontSize: 15, fontWeight: '600' },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#52b788' },
  saveText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
