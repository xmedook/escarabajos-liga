import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

interface Partido {
  id: number;
  equipo_local_nombre: string;
  equipo_visitante_nombre: string;
  fecha: string;
  hora: string;
  lugar: string;
  estado: string;
  goles_local: number;
  goles_visitante: number;
}

export default function PartidoScreen() {
  const { user } = useAuth();
  const [proximoPartido, setProximoPartido] = useState<Partido | null>(null);

  useEffect(() => {
    fetchProximoPartido();
  }, []);

  async function fetchProximoPartido() {
    try {
      const { data: jornadas } = await api.get('/jornadas');
      for (const j of jornadas) {
        const { data: partidos } = await api.get(`/jornadas/${j.id}/partidos`);
        const proximo = partidos.find((p: Partido) => p.estado !== 'finalizado');
        if (proximo) {
          setProximoPartido(proximo);
          return;
        }
      }
    } catch {
      // ignore
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Próximo Partido</Text>

      {proximoPartido ? (
        <View style={styles.card}>
          <View style={styles.matchTeams}>
            <Text style={styles.teamName}>{proximoPartido.equipo_local_nombre}</Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.teamName}>{proximoPartido.equipo_visitante_nombre}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={Colors.gray} />
            <Text style={styles.infoText}>
              {proximoPartido.fecha ? new Date(proximoPartido.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Fecha por definir'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color={Colors.gray} />
            <Text style={styles.infoText}>{proximoPartido.hora ? proximoPartido.hora.slice(0, 5) : 'Hora por definir'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={Colors.gray} />
            <Text style={styles.infoText}>{proximoPartido.lugar || 'Lugar por definir'}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="football-outline" size={48} color={Colors.gray} />
          <Text style={styles.emptyText}>No hay partidos programados</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(app)/partido/asistencia')}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
          <Text style={styles.actionText}>Asistencia</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/(app)/partido/alineacion')}>
          <Ionicons name="grid" size={24} color={Colors.white} />
          <Text style={styles.actionText}>Alineación</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  matchTeams: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamName: { flex: 1, fontSize: 17, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
  vs: { fontSize: 14, color: Colors.gray, marginHorizontal: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: Colors.gray, marginLeft: 8 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 40, alignItems: 'center', elevation: 1 },
  emptyText: { marginTop: 12, fontSize: 15, color: Colors.gray },
  actions: { flexDirection: 'row', marginTop: 20, gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 12, padding: 16, gap: 8 },
  actionBtnSecondary: { backgroundColor: Colors.secondary },
  actionText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
});
