import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const PITCH_WIDTH = Dimensions.get('window').width - 32;
const PITCH_HEIGHT = PITCH_WIDTH * 1.4;

interface JugadorAlineacion {
  jugador_id: number;
  nombre: string;
  apellido: string;
  dorsal: number;
  posicion_x: number;
  posicion_y: number;
  titular: boolean;
}

const FORMACIONES: Record<string, { x: number; y: number }[]> = {
  '4-3-3': [
    { x: 0.5, y: 0.92 }, // portero
    { x: 0.15, y: 0.72 }, { x: 0.38, y: 0.72 }, { x: 0.62, y: 0.72 }, { x: 0.85, y: 0.72 }, // defensas
    { x: 0.25, y: 0.48 }, { x: 0.5, y: 0.48 }, { x: 0.75, y: 0.48 }, // mediocampo
    { x: 0.2, y: 0.22 }, { x: 0.5, y: 0.18 }, { x: 0.8, y: 0.22 }, // delanteros
  ],
  '4-4-2': [
    { x: 0.5, y: 0.92 },
    { x: 0.15, y: 0.72 }, { x: 0.38, y: 0.72 }, { x: 0.62, y: 0.72 }, { x: 0.85, y: 0.72 },
    { x: 0.15, y: 0.48 }, { x: 0.38, y: 0.48 }, { x: 0.62, y: 0.48 }, { x: 0.85, y: 0.48 },
    { x: 0.35, y: 0.2 }, { x: 0.65, y: 0.2 },
  ],
  '3-5-2': [
    { x: 0.5, y: 0.92 },
    { x: 0.25, y: 0.72 }, { x: 0.5, y: 0.72 }, { x: 0.75, y: 0.72 },
    { x: 0.1, y: 0.48 }, { x: 0.3, y: 0.48 }, { x: 0.5, y: 0.48 }, { x: 0.7, y: 0.48 }, { x: 0.9, y: 0.48 },
    { x: 0.35, y: 0.2 }, { x: 0.65, y: 0.2 },
  ],
};

export default function AlineacionScreen() {
  const { user } = useAuth();
  const [jugadores, setJugadores] = useState<JugadorAlineacion[]>([]);
  const [partidoId, setPartidoId] = useState<number | null>(null);
  const [formacion, setFormacion] = useState('4-3-3');
  const [dragging, setDragging] = useState<number | null>(null);

  const isCoach = user?.rol === 'coach' || user?.rol === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: jornadas } = await api.get('/jornadas');
      for (const j of jornadas) {
        const { data: partidos } = await api.get(`/jornadas/${j.id}/partidos`);
        const proximo = partidos.find((p: any) => p.estado !== 'finalizado');
        if (proximo) {
          setPartidoId(proximo.id);
          const { data: alineacion } = await api.get(`/partidos/${proximo.id}/alineacion`);
          if (alineacion.length > 0) {
            setJugadores(alineacion);
          } else if (user?.equipo_id) {
            // Cargar jugadores del equipo con posiciones default
            const { data: equipo } = await api.get(`/equipos/${user.equipo_id}/jugadores`);
            const positions = FORMACIONES['4-3-3'];
            setJugadores(
              equipo.slice(0, 11).map((j: any, i: number) => ({
                jugador_id: j.id,
                nombre: j.nombre,
                apellido: j.apellido,
                dorsal: j.dorsal,
                posicion_x: positions[i]?.x ?? 0.5,
                posicion_y: positions[i]?.y ?? 0.5,
                titular: true,
              }))
            );
          }
          return;
        }
      }
    } catch {
      // ignore
    }
  }

  function aplicarFormacion(nombre: string) {
    if (!isCoach) return;
    setFormacion(nombre);
    const positions = FORMACIONES[nombre];
    setJugadores((prev) =>
      prev.map((j, i) => ({
        ...j,
        posicion_x: positions[i]?.x ?? j.posicion_x,
        posicion_y: positions[i]?.y ?? j.posicion_y,
      }))
    );
  }

  async function guardarAlineacion() {
    if (!partidoId || !user?.equipo_id) return;
    try {
      await api.post(`/partidos/${partidoId}/alineacion`, {
        jugadores: jugadores.map((j) => ({
          jugador_id: j.jugador_id,
          equipo_id: user.equipo_id,
          posicion_x: j.posicion_x,
          posicion_y: j.posicion_y,
          titular: j.titular,
        })),
      });
      Alert.alert('Guardado', 'Alineación guardada correctamente');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la alineación');
    }
  }

  function handlePlayerMove(index: number, dx: number, dy: number) {
    if (!isCoach) return;
    setJugadores((prev) => {
      const updated = [...prev];
      const newX = Math.max(0.05, Math.min(0.95, updated[index].posicion_x + dx / PITCH_WIDTH));
      const newY = Math.max(0.05, Math.min(0.95, updated[index].posicion_y + dy / PITCH_HEIGHT));
      updated[index] = { ...updated[index], posicion_x: newX, posicion_y: newY };
      return updated;
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isCoach && (
        <View style={styles.formacionRow}>
          {Object.keys(FORMACIONES).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.formChip, formacion === f && styles.formChipActive]}
              onPress={() => aplicarFormacion(f)}
            >
              <Text style={[styles.formText, formacion === f && styles.formTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.pitchContainer}>
        <Svg width={PITCH_WIDTH} height={PITCH_HEIGHT} viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}>
          {/* Cancha */}
          <Rect x={0} y={0} width={PITCH_WIDTH} height={PITCH_HEIGHT} fill="#2d6a4f" rx={8} />
          {/* Línea central */}
          <Line x1={0} y1={PITCH_HEIGHT / 2} x2={PITCH_WIDTH} y2={PITCH_HEIGHT / 2} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
          {/* Círculo central */}
          <Circle cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT / 2} r={PITCH_WIDTH * 0.12} stroke="rgba(255,255,255,0.3)" strokeWidth={2} fill="none" />
          {/* Área grande arriba */}
          <Rect x={PITCH_WIDTH * 0.2} y={0} width={PITCH_WIDTH * 0.6} height={PITCH_HEIGHT * 0.14} stroke="rgba(255,255,255,0.3)" strokeWidth={2} fill="none" />
          {/* Área grande abajo */}
          <Rect x={PITCH_WIDTH * 0.2} y={PITCH_HEIGHT * 0.86} width={PITCH_WIDTH * 0.6} height={PITCH_HEIGHT * 0.14} stroke="rgba(255,255,255,0.3)" strokeWidth={2} fill="none" />
          {/* Área chica arriba */}
          <Rect x={PITCH_WIDTH * 0.32} y={0} width={PITCH_WIDTH * 0.36} height={PITCH_HEIGHT * 0.06} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fill="none" />
          {/* Área chica abajo */}
          <Rect x={PITCH_WIDTH * 0.32} y={PITCH_HEIGHT * 0.94} width={PITCH_WIDTH * 0.36} height={PITCH_HEIGHT * 0.06} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fill="none" />

          {/* Jugadores */}
          {jugadores.map((j, i) => {
            const cx = j.posicion_x * PITCH_WIDTH;
            const cy = j.posicion_y * PITCH_HEIGHT;
            return (
              <G key={j.jugador_id}>
                <Circle cx={cx} cy={cy} r={18} fill={Colors.white} stroke={Colors.primary} strokeWidth={2} />
                <SvgText
                  x={cx}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="bold"
                  fill={Colors.primary}
                >
                  {j.dorsal ?? '?'}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {/* Overlay for drag (native touch) */}
        {isCoach && jugadores.map((j, i) => {
          const left = j.posicion_x * PITCH_WIDTH - 20;
          const top = j.posicion_y * PITCH_HEIGHT - 20;
          return (
            <View
              key={`touch-${j.jugador_id}`}
              style={[styles.touchZone, { left, top }]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderMove={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                handlePlayerMove(i, locationX - 20, locationY - 20);
              }}
            />
          );
        })}
      </View>

      {/* Leyenda jugadores */}
      <View style={styles.legend}>
        {jugadores.map((j) => (
          <Text key={j.jugador_id} style={styles.legendItem}>
            #{j.dorsal} {j.nombre} {j.apellido?.[0]}.
          </Text>
        ))}
      </View>

      {isCoach && (
        <TouchableOpacity style={styles.saveBtn} onPress={guardarAlineacion}>
          <Text style={styles.saveBtnText}>Guardar Alineación</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  formacionRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  formChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.lightGray },
  formChipActive: { backgroundColor: Colors.primary },
  formText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  formTextActive: { color: Colors.white },
  pitchContainer: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  touchZone: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  legendItem: { fontSize: 12, color: Colors.gray, backgroundColor: Colors.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
});
