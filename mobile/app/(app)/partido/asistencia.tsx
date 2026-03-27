import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

interface AsistenciaItem {
  id: number;
  jugador_id: number;
  nombre: string;
  apellido: string;
  dorsal: number;
  confirmado: 'si' | 'no' | 'pendiente';
}

export default function AsistenciaScreen() {
  const { user } = useAuth();
  const [asistencia, setAsistencia] = useState<AsistenciaItem[]>([]);
  const [partidoId, setPartidoId] = useState<number | null>(null);
  const [miJugadorId, setMiJugadorId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isCoach = user?.rol === 'coach' || user?.rol === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Buscar el próximo partido
      const { data: jornadas } = await api.get('/jornadas');
      for (const j of jornadas) {
        const { data: partidos } = await api.get(`/jornadas/${j.id}/partidos`);
        const proximo = partidos.find((p: any) => p.estado !== 'finalizado');
        if (proximo) {
          setPartidoId(proximo.id);
          const { data: asist } = await api.get(`/partidos/${proximo.id}/asistencia`);
          setAsistencia(asist);
          break;
        }
      }
      // Buscar mi jugador_id
      if (user?.equipo_id) {
        const { data: jugadores } = await api.get(`/equipos/${user.equipo_id}/jugadores`);
        const miJugador = jugadores.find((j: any) => j.usuario_id === user.id);
        if (miJugador) setMiJugadorId(miJugador.id);
      }
    } catch {
      // ignore
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  async function confirmar(jugadorId: number, estado: 'si' | 'no') {
    if (!partidoId) return;
    if (!isCoach && jugadorId !== miJugadorId) {
      Alert.alert('Error', 'Solo puedes confirmar tu propia asistencia');
      return;
    }
    try {
      await api.put(`/partidos/${partidoId}/asistencia`, { jugador_id: jugadorId, confirmado: estado });
      setAsistencia((prev) =>
        prev.map((a) => (a.jugador_id === jugadorId ? { ...a, confirmado: estado } : a))
      );
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la asistencia');
    }
  }

  const confirmados = asistencia.filter((a) => a.confirmado === 'si').length;

  const statusIcon = (estado: string) => {
    switch (estado) {
      case 'si': return <Ionicons name="checkmark-circle" size={24} color={Colors.success} />;
      case 'no': return <Ionicons name="close-circle" size={24} color={Colors.danger} />;
      default: return <Ionicons name="help-circle" size={24} color={Colors.warning} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.counterBox}>
        <Text style={styles.counterText}>{confirmados}/11 confirmados</Text>
        <View style={styles.counterBar}>
          <View style={[styles.counterFill, { width: `${Math.min((confirmados / 11) * 100, 100)}%` }]} />
        </View>
      </View>

      <FlatList
        data={asistencia}
        keyExtractor={(item) => item.jugador_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const canEdit = isCoach || item.jugador_id === miJugadorId;
          return (
            <View style={styles.card}>
              <View style={styles.playerInfo}>
                {statusIcon(item.confirmado)}
                <View style={styles.playerText}>
                  <Text style={styles.playerName}>{item.nombre} {item.apellido}</Text>
                  <Text style={styles.playerDorsal}>#{item.dorsal}</Text>
                </View>
              </View>
              {canEdit && (
                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSi, item.confirmado === 'si' && styles.btnActive]}
                    onPress={() => confirmar(item.jugador_id, 'si')}
                  >
                    <Text style={styles.btnText}>CONFIRMO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnNo, item.confirmado === 'no' && styles.btnNoActive]}
                    onPress={() => confirmar(item.jugador_id, 'no')}
                  >
                    <Text style={styles.btnText}>NO VOY</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No hay datos de asistencia</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  counterBox: { backgroundColor: Colors.primary, padding: 16 },
  counterText: { color: Colors.white, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  counterBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 },
  counterFill: { height: 8, backgroundColor: Colors.white, borderRadius: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  playerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerText: { marginLeft: 10, flex: 1 },
  playerName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  playerDorsal: { fontSize: 13, color: Colors.gray },
  buttons: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnSi: { backgroundColor: Colors.lightGray },
  btnNo: { backgroundColor: Colors.lightGray },
  btnActive: { backgroundColor: Colors.success },
  btnNoActive: { backgroundColor: Colors.danger },
  btnText: { fontWeight: 'bold', fontSize: 13, color: Colors.white },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.gray, fontSize: 15 },
});
