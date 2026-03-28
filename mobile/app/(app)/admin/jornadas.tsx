import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jornadasApi, equiposApi } from '../../../services/api';

interface Equipo { id: number; nombre: string; }
interface Partido {
  id: number; jornada_id: number;
  equipo_local_id: number; equipo_visitante_id: number;
  equipo_local_nombre: string; equipo_visitante_nombre: string;
  fecha: string; hora: string; lugar: string;
  goles_local?: number; goles_visitante?: number; estado?: string;
}
interface Jornada {
  id: number; numero: number; fecha_inicio: string; fecha_fin: string; temporada: string;
  partidos?: Partido[];
}

export default function JornadasScreen() {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingPartidos, setLoadingPartidos] = useState<number | null>(null);

  // Modals
  const [jornadaModal, setJornadaModal] = useState(false);
  const [partidoModal, setPartidoModal] = useState(false);
  const [editPartidoModal, setEditPartidoModal] = useState(false);

  // Forms
  const [jornadaForm, setJornadaForm] = useState({ numero: '', fecha_inicio: '', fecha_fin: '', temporada: '2026' });
  const [partidoForm, setPartidoForm] = useState({ equipo_local_id: 0, equipo_visitante_id: 0, fecha: '', hora: '', lugar: '' });
  const [selectedJornada, setSelectedJornada] = useState<number | null>(null);
  const [editingPartido, setEditingPartido] = useState<Partido | null>(null);
  const [editPartidoForm, setEditPartidoForm] = useState({ fecha: '', hora: '', lugar: '', goles_local: '', goles_visitante: '' });

  const load = useCallback(async () => {
    try {
      const [jRes, eRes] = await Promise.all([jornadasApi.list(), equiposApi.list()]);
      setJornadas(jRes.data);
      setEquipos(eRes.data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (jornada: Jornada) => {
    if (expandedId === jornada.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(jornada.id);
    if (!jornada.partidos) {
      setLoadingPartidos(jornada.id);
      try {
        const { data } = await jornadasApi.partidos(jornada.id);
        setJornadas(prev => prev.map(j => j.id === jornada.id ? { ...j, partidos: data } : j));
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoadingPartidos(null);
      }
    }
  };

  const saveJornada = async () => {
    if (!jornadaForm.numero || !jornadaForm.fecha_inicio || !jornadaForm.fecha_fin) {
      return Alert.alert('Error', 'Completa todos los campos');
    }
    try {
      await jornadasApi.create({ ...jornadaForm, numero: Number(jornadaForm.numero) });
      setJornadaModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message);
    }
  };

  const openNewPartido = (jornadaId: number) => {
    setSelectedJornada(jornadaId);
    setPartidoForm({ equipo_local_id: equipos[0]?.id || 0, equipo_visitante_id: equipos[1]?.id || 0, fecha: '', hora: '', lugar: '' });
    setPartidoModal(true);
  };

  const savePartido = async () => {
    if (!selectedJornada || !partidoForm.fecha || !partidoForm.hora) {
      return Alert.alert('Error', 'Completa fecha y hora');
    }
    if (partidoForm.equipo_local_id === partidoForm.equipo_visitante_id) {
      return Alert.alert('Error', 'Los equipos deben ser diferentes');
    }
    try {
      await jornadasApi.crearPartido(selectedJornada, partidoForm);
      setPartidoModal(false);
      // Reload partidos for that jornada
      const { data } = await jornadasApi.partidos(selectedJornada);
      setJornadas(prev => prev.map(j => j.id === selectedJornada ? { ...j, partidos: data } : j));
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message);
    }
  };

  const openEditPartido = (p: Partido) => {
    setEditingPartido(p);
    setEditPartidoForm({
      fecha: p.fecha?.split('T')[0] || '',
      hora: p.hora || '',
      lugar: p.lugar || '',
      goles_local: p.goles_local != null ? String(p.goles_local) : '',
      goles_visitante: p.goles_visitante != null ? String(p.goles_visitante) : '',
    });
    setEditPartidoModal(true);
  };

  const saveEditPartido = async () => {
    if (!editingPartido) return;
    try {
      const payload: any = { fecha: editPartidoForm.fecha, hora: editPartidoForm.hora, lugar: editPartidoForm.lugar };
      if (editPartidoForm.goles_local !== '') payload.goles_local = Number(editPartidoForm.goles_local);
      if (editPartidoForm.goles_visitante !== '') payload.goles_visitante = Number(editPartidoForm.goles_visitante);
      await jornadasApi.actualizarPartido(editingPartido.id, payload);
      setEditPartidoModal(false);
      // Reload partidos
      if (expandedId) {
        const { data } = await jornadasApi.partidos(expandedId);
        setJornadas(prev => prev.map(j => j.id === expandedId ? { ...j, partidos: data } : j));
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderPartido = (p: Partido) => (
    <TouchableOpacity key={p.id} style={styles.partidoCard} onPress={() => openEditPartido(p)}>
      <View style={styles.partidoTeams}>
        <Text style={styles.partidoTeam}>{p.equipo_local_nombre}</Text>
        <Text style={styles.vs}>vs</Text>
        <Text style={styles.partidoTeam}>{p.equipo_visitante_nombre}</Text>
      </View>
      <View style={styles.partidoMeta}>
        {p.goles_local != null && p.goles_visitante != null && (
          <Text style={styles.score}>{p.goles_local} - {p.goles_visitante}</Text>
        )}
        <Text style={styles.partidoInfo}>{p.hora || '--:--'} | {p.lugar || 'Por definir'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderJornada = ({ item }: { item: Jornada }) => {
    const expanded = expandedId === item.id;
    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardMain} onPress={() => toggleExpand(item)}>
          <View style={styles.jornadaBadge}>
            <Text style={styles.jornadaNum}>{item.numero}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>Jornada {item.numero}</Text>
            <Text style={styles.cardMeta}>{formatDate(item.fecha_inicio)} — {formatDate(item.fecha_fin)}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#a7c4a7" />
        </TouchableOpacity>
        {expanded && (
          <View style={styles.partidosSection}>
            {loadingPartidos === item.id ? (
              <ActivityIndicator color="#52b788" style={{ padding: 16 }} />
            ) : (
              <>
                {(item.partidos || []).map(renderPartido)}
                {(!item.partidos || item.partidos.length === 0) && (
                  <Text style={styles.noPartidos}>Sin partidos programados</Text>
                )}
                <TouchableOpacity style={styles.addPartidoBtn} onPress={() => openNewPartido(item.id)}>
                  <Ionicons name="add-circle-outline" size={18} color="#52b788" />
                  <Text style={styles.addPartidoText}>Nuevo partido</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#52b788" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={jornadas}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderJornada}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setJornadas(j => j.map(x => ({ ...x, partidos: undefined }))); load(); }} tintColor="#52b788" />}
        ListEmptyComponent={<Text style={styles.empty}>No hay jornadas</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setJornadaForm({ numero: '', fecha_inicio: '', fecha_fin: '', temporada: '2026' }); setJornadaModal(true); }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal Nueva Jornada */}
      <Modal visible={jornadaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nueva Jornada</Text>

            <Text style={styles.label}>Número</Text>
            <TextInput style={styles.input} value={jornadaForm.numero} onChangeText={t => setJornadaForm({ ...jornadaForm, numero: t })} placeholder="1" placeholderTextColor="#666" keyboardType="numeric" />

            <Text style={styles.label}>Fecha inicio (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={jornadaForm.fecha_inicio} onChangeText={t => setJornadaForm({ ...jornadaForm, fecha_inicio: t })} placeholder="2026-04-05" placeholderTextColor="#666" />

            <Text style={styles.label}>Fecha fin (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={jornadaForm.fecha_fin} onChangeText={t => setJornadaForm({ ...jornadaForm, fecha_fin: t })} placeholder="2026-04-06" placeholderTextColor="#666" />

            <Text style={styles.label}>Temporada</Text>
            <TextInput style={styles.input} value={jornadaForm.temporada} onChangeText={t => setJornadaForm({ ...jornadaForm, temporada: t })} placeholder="2026" placeholderTextColor="#666" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setJornadaModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveJornada}>
                <Text style={styles.saveText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Nuevo Partido */}
      <Modal visible={partidoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Nuevo Partido</Text>

              <Text style={styles.label}>Equipo local</Text>
              <View style={styles.chips}>
                {equipos.map(eq => (
                  <TouchableOpacity key={eq.id} style={[styles.chip, partidoForm.equipo_local_id === eq.id && styles.chipActive]} onPress={() => setPartidoForm({ ...partidoForm, equipo_local_id: eq.id })}>
                    <Text style={[styles.chipText, partidoForm.equipo_local_id === eq.id && styles.chipTextActive]}>{eq.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Equipo visitante</Text>
              <View style={styles.chips}>
                {equipos.map(eq => (
                  <TouchableOpacity key={eq.id} style={[styles.chip, partidoForm.equipo_visitante_id === eq.id && styles.chipActive]} onPress={() => setPartidoForm({ ...partidoForm, equipo_visitante_id: eq.id })}>
                    <Text style={[styles.chipText, partidoForm.equipo_visitante_id === eq.id && styles.chipTextActive]}>{eq.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={partidoForm.fecha} onChangeText={t => setPartidoForm({ ...partidoForm, fecha: t })} placeholder="2026-04-05" placeholderTextColor="#666" />

              <Text style={styles.label}>Hora (HH:MM)</Text>
              <TextInput style={styles.input} value={partidoForm.hora} onChangeText={t => setPartidoForm({ ...partidoForm, hora: t })} placeholder="10:00" placeholderTextColor="#666" />

              <Text style={styles.label}>Lugar</Text>
              <TextInput style={styles.input} value={partidoForm.lugar} onChangeText={t => setPartidoForm({ ...partidoForm, lugar: t })} placeholder="Cancha Las Torres" placeholderTextColor="#666" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPartidoModal(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={savePartido}>
                  <Text style={styles.saveText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Editar Partido */}
      <Modal visible={editPartidoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Editar Partido</Text>
              {editingPartido && (
                <Text style={styles.partidoHeader}>{editingPartido.equipo_local_nombre} vs {editingPartido.equipo_visitante_nombre}</Text>
              )}

              <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={editPartidoForm.fecha} onChangeText={t => setEditPartidoForm({ ...editPartidoForm, fecha: t })} placeholder="2026-04-05" placeholderTextColor="#666" />

              <Text style={styles.label}>Hora (HH:MM)</Text>
              <TextInput style={styles.input} value={editPartidoForm.hora} onChangeText={t => setEditPartidoForm({ ...editPartidoForm, hora: t })} placeholder="10:00" placeholderTextColor="#666" />

              <Text style={styles.label}>Lugar</Text>
              <TextInput style={styles.input} value={editPartidoForm.lugar} onChangeText={t => setEditPartidoForm({ ...editPartidoForm, lugar: t })} placeholder="Cancha Las Torres" placeholderTextColor="#666" />

              <Text style={styles.label}>Goles local</Text>
              <TextInput style={styles.input} value={editPartidoForm.goles_local} onChangeText={t => setEditPartidoForm({ ...editPartidoForm, goles_local: t })} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />

              <Text style={styles.label}>Goles visitante</Text>
              <TextInput style={styles.input} value={editPartidoForm.goles_visitante} onChangeText={t => setEditPartidoForm({ ...editPartidoForm, goles_visitante: t })} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditPartidoModal(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveEditPartido}>
                  <Text style={styles.saveText}>Guardar</Text>
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
  list: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#1a2e1f', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  jornadaBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d6a4f', alignItems: 'center', justifyContent: 'center' },
  jornadaNum: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardName: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cardMeta: { color: '#a7c4a7', fontSize: 12, marginTop: 2 },
  partidosSection: { borderTopWidth: 1, borderTopColor: '#2d6a4f', padding: 12, gap: 8 },
  partidoCard: { backgroundColor: '#0f1a13', borderRadius: 10, padding: 12 },
  partidoTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  partidoTeam: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  vs: { color: '#52b788', fontSize: 12, fontWeight: 'bold' },
  partidoMeta: { alignItems: 'center', marginTop: 6 },
  score: { color: '#52b788', fontSize: 18, fontWeight: 'bold' },
  partidoInfo: { color: '#a7c4a7', fontSize: 12, marginTop: 2 },
  noPartidos: { color: '#a7c4a7', textAlign: 'center', padding: 12, fontSize: 13 },
  addPartidoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  addPartidoText: { color: '#52b788', fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#52b788', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  empty: { color: '#a7c4a7', textAlign: 'center', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1a2e1f', borderRadius: 16, padding: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  partidoHeader: { color: '#52b788', fontSize: 15, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
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
