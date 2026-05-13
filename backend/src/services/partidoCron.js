const cron = require('node-cron');
const pool = require('../db/pool');
const { notify } = require('./notifications');

/**
 * Cron que corre cada hora y envía recordatorios de partidos:
 * - 24h antes
 * - 2h antes
 */
function startPartidoCron() {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in2h  = new Date(now.getTime() +  2 * 60 * 60 * 1000);

      // Ventana de ±10 minutos alrededor del momento exacto
      const window = 10 * 60 * 1000;

      const { rows: partidos } = await pool.query(`
        SELECT p.id, p.fecha,
               e1.nombre AS equipo_local,   p.equipo_local_id,
               e2.nombre AS equipo_visitante, p.equipo_visitante_id,
               TO_CHAR(p.fecha AT TIME ZONE 'America/Mexico_City', 'HH12:MI AM') AS hora
        FROM partidos p
        JOIN equipos e1 ON e1.id = p.equipo_local_id
        JOIN equipos e2 ON e2.id = p.equipo_visitante_id
        WHERE p.estado = 'programado'
      `);

      for (const partido of partidos) {
        const fechaPartido = new Date(partido.fecha).getTime();
        const diff24 = Math.abs(fechaPartido - in24h.getTime());
        const diff2  = Math.abs(fechaPartido - in2h.getTime());

        if (diff24 <= window) {
          console.log(`[cron] Recordatorio 24h: partido ${partido.id}`);
          await notify.recordatorioPartido(partido);
        } else if (diff2 <= window) {
          console.log(`[cron] Recordatorio 2h: partido ${partido.id}`);
          await notify.recordatorioPartido(partido);
        }
      }
    } catch (err) {
      console.error('[cron:partidos]', err.message);
    }
  });

  console.log('[cron] Recordatorios de partidos activos');
}

module.exports = { startPartidoCron };
