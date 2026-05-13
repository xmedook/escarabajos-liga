const { Expo } = require('expo-server-sdk');
const pool = require('../db/pool');

const expo = new Expo();

/**
 * Envía notificaciones push a una lista de push tokens.
 * @param {string[]} tokens
 * @param {string} title
 * @param {string} body
 * @param {object} data  — payload extra para la app
 */
async function sendPush(tokens, title, body, data = {}) {
  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t))
    .map(token => ({ to: token, sound: 'default', title, body, data }));

  if (!messages.length) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('[notifications] send error:', err.message);
    }
  }
}

/**
 * Devuelve los push tokens de todos los jugadores/coaches de un equipo.
 */
async function tokensByEquipo(equipo_id) {
  const { rows } = await pool.query(
    'SELECT push_token FROM usuarios WHERE equipo_id = $1 AND push_token IS NOT NULL',
    [equipo_id]
  );
  return rows.map(r => r.push_token);
}

/**
 * Devuelve los push tokens de todos los usuarios con un rol.
 */
async function tokensByRol(rol) {
  const { rows } = await pool.query(
    'SELECT push_token FROM usuarios WHERE rol = $1 AND push_token IS NOT NULL',
    [rol]
  );
  return rows.map(r => r.push_token);
}

/**
 * Notificaciones con triggers específicos del dominio
 */
const notify = {
  // Cuando el coach publica la alineación
  async alineacionPublicada(equipo_id, partido_info) {
    const tokens = await tokensByEquipo(equipo_id);
    await sendPush(tokens,
      '📋 Alineación publicada',
      `Ya está lista la alineación para ${partido_info}. ¡Revísala ahora!`,
      { screen: 'partido', type: 'alineacion' }
    );
  },

  // Recordatorio de partido (llamar 24h y 2h antes vía cron)
  async recordatorioPartido(partido) {
    const tokens = [
      ...await tokensByEquipo(partido.equipo_local_id),
      ...await tokensByEquipo(partido.equipo_visitante_id),
    ];
    await sendPush(tokens,
      '⚽ Partido próximo',
      `${partido.equipo_local} vs ${partido.equipo_visitante} — ${partido.hora}`,
      { screen: 'partido', partido_id: partido.id, type: 'recordatorio' }
    );
  },

  // Cuando el coach abre la ventana de confirmación de asistencia
  async pedirAsistencia(equipo_id, partido_info) {
    const tokens = await tokensByEquipo(equipo_id);
    await sendPush(tokens,
      '✋ Confirma tu asistencia',
      `¿Vas al partido ${partido_info}? Confirma antes de que cierre la lista.`,
      { screen: 'partido', type: 'asistencia' }
    );
  },

  // Cuando la lista de asistencia se cierra (al coach/capitán)
  async resumenAsistencia(equipo_id, confirmados, total) {
    const tokens = [
      ...await tokensByRol('coach'),
      ...await tokensByRol('capitan'),
    ];
    const equipoTokens = await pool.query(
      'SELECT push_token FROM usuarios WHERE equipo_id = $1 AND rol IN ($2,$3) AND push_token IS NOT NULL',
      [equipo_id, 'coach', 'capitan']
    ).then(r => r.rows.map(x => x.push_token));
    await sendPush(equipoTokens,
      '📊 Resumen de asistencia',
      `${confirmados}/${total} jugadores confirmados para el próximo partido.`,
      { screen: 'equipo', type: 'resumen_asistencia' }
    );
  },

  // Bienvenida al registrarse
  async bienvenida(push_token, nombre) {
    if (!push_token || !Expo.isExpoPushToken(push_token)) return;
    await sendPush([push_token],
      '👋 ¡Bienvenido a Escarabajos Liga!',
      `Hola ${nombre}, ya estás listo para la temporada.`,
      { screen: 'liga', type: 'bienvenida' }
    );
  },
};

module.exports = { sendPush, tokensByEquipo, tokensByRol, notify };
