import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jugadoresApi, equiposApi } from '../../../services/api';

interface Equipo { id: number; nombre: string; color_primario: string; }
interface Jugador {
  id: number; nombre: string; apellido: string; dorsal: number;
  posicion: string; equipo_id: number; equipo_nombre?: string;
}

const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];

const EMPTY_FORM = { nombre: '', apellido: '', dorsal: '', posicion: 'Delantero', equipo_id: 0 };

export default function JugadoresScreen() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEquipo, setFiltroEquipo] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Jugador | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const [jRes, eRes] = await Promise.all([
        jugadoresApi.list(filtroEquipo ?? undefined),
        equiposApi.list(),
      ]);
      setJugadores(jRes.data);
      setEquipos(eRes.data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroEquipo]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, equipo_id: equipos[0]?.id || 0 });
    setModalVisible(true);
  };

  const openEdit = (j: Jugador) => {
    setEditing(j);
    setForm({ nombre: j.nombre, apellido: j.apellido, dorsal: String(j.dorsal), posicion: j.posicion, equipo_id: j.equipo_id });
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) return Alert.alert('Error', 'Nombre y apellido son obligatorios');
    if (!form.equipo_id) return Alert.alert('Error', 'Selecciona un equipo');
    const payload = { ...form, dorsal: Number(form.dorsal) || 0 };
    try {
      if (editing) {
        await jugadoresApi.update(editing.id, payload);
      } else {
        await jugadoresApi.create(payload);
      }
      setModalVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message);
    }
  };

  const remove = (j: Jugador) => {
    Alert.alert('Eliminar jugador', `¿Eliminar "${j.nombre} ${j.apellido}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try { await jugadoresApi.delete(j.id); load(); }
          catch (e: any) { Alert.alert('Error', e.response?.data?.error || e.message); }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Jugador }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} onLongPress={() => remove(item)}>
      <View style={styles.dorsalBadge}>
        <Text style={styles.dorsalText}>{item.dorsal}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.cardMeta}>{item.posicion} — {item.equipo_nombre || 'Sin equipo'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#a7c4a7" />
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#52b788" /></View>;

  return (
    <View style={styles.container}>
      {/* Filtro por equipo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.filterChip, !filtroEquipo && styles.filterActive]}
          onPress={() => setFiltroEquipo(null)}
        >
          <Text style={[styles.filterText, !filtroEquipo && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        {equipos.map(eq => (
          <TouchableOpacity
            key={eq.id}
            style={[styles.filterChip, filtroEquipo === eq.id && styles.filterActive]}
            onPress={() => setFiltroEquipo(eq.id)}
          >
            <View style={[styles.filterDot, { backgroundColor: eq.color_primario }]} />
            <Text style={[styles.filterText, filtroEquipo === eq.id && styles.filterTextActive]}>{eq.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={jugadores}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#52b788" />}
        ListEmptyComponent={<Text style={styles.empty}>No hay jugadores</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{editing ? 'Editar Jugador' : 'Nuevo Jugador'}</Text>

              <Text style={styles.label}>Nombre</Text>
              <TextInput style={styles.input} value={form.nombre} onChangeText={t => setForm({ ...form, nombre: t })} placeholder="Nombre" placeholderTextColor="#666" />

              <Text style={styles.label}>Apellido</Text>
              <TextInput style={styles.input} value={form.apellido} onChangeText={t => setForm({ ...form, apellido: t })} placeholder="Apellido" placeholderTextColor="#666" />

              <Text style={styles.label}>Dorsal</Text>
              <TextInput style={styles.input} value={form.dorsal} onChangeText={t => setForm({ ...form, dorsal: t })} placeholder="10" placeholderTextColor="#666" keyboardType="numeric" />

              <Text style={styles.label}>Posición</Text>
              <View style={styles.chips}>
                {POSICIONES.map(p => (
                  <TouchableOpacity key={p} style={[styles.chip, form.posicion === p && styles.chipActive]} onPress={() => setForm({ ...form, posicion: p })}>
                    <Text style={[styles.chipText, form.posicion === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Equipo</Text>
              <View style={styles.chips}>
                {equipos.map(eq => (
                  <TouchableOpacity key={eq.id} style={[styles.chip, form.equipo_id === eq.id && styles.chipActive]} onPress={() => setForm({ ...form, equipo_id: eq.id })}>
                    <Text style={[styles.chipText, form.equipo_id === eq.id && styles.chipTextActive]}>{eq.nombre}</Text>
                  </TouchableOpacity>
                ))}
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
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1a13' },
  center: { flex: 1, backgroundColor: '#0f1a13', justifyContent: 'center', alignItems: 'center' },
  filterBar: { maxHeight: 52, backgroundColor: '#0f1a13' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2e1f', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  filterActive: { backgroundColor: '#52b788' },
  filterDot: { width: 10, height: 10, borderRadius: 5 },
  filterText: { color: '#a7c4a7', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },
  list: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#1a2e1f', borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 14 },
  dorsalBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d6a4f', alignItems: 'center', justifyContent: 'center' },
  dorsalText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardName: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  cardMeta: { color: '#a7c4a7', fontSize: 12, marginTop: 2 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#52b788', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  empty: { color: '#a7c4a7', textAlign: 'center', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1a2e1f', borderRadius: 16, padding: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  label: { color: '#a7c4a7', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f1a13', borderRadius: 10, padding: 12, color: '#ffffff', fontSize: 15, borderWidth: 1, borderColor: '#2d6a4f' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#0f1a13', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2d6a4f' },
  chipActive: { backgroundColor: '#52b788', borderColor: '#52b788' },
  chipText: { color: '#a7c4a7', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#0f1a13' },
  cancelText: { color: '#a7c4a7', fontSize: 15, fontWeight: '600' },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#52b788' },
  saveText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
