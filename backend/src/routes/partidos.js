const { Router } = require('express');
const pool = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { sanitizeError } = require('../middleware/errorHandler');
const { notify } = require('../services/notifications');

const router = Router();

// GET /partidos — listar todos con info de equipos y jornada
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
              el.nombre AS equipo_local_nombre,   el.color_primario AS color_local,
              ev.nombre AS equipo_visitante_nombre, ev.color_primario AS color_visitante,
              j.numero AS jornada_numero
       FROM partidos p
       JOIN equipos el ON el.id = p.equipo_local_id
       JOIN equipos ev ON ev.id = p.equipo_visitante_id
       LEFT JOIN jornadas j ON j.id = p.jornada_id
       ORDER BY p.fecha ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// Asistencia
router.get('/:id/asistencia', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, j.nombre, j.apellido, j.dorsal
       FROM asistencia a
       JOIN jugadores j ON a.jugador_id = j.id
       WHERE a.partido_id = $1
       ORDER BY j.dorsal`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.put('/:id/asistencia', authMiddleware, async (req, res) => {
  try {
    const { jugador_id, confirmado } = req.body;
    const result = await pool.query(
      `INSERT INTO asistencia (partido_id, jugador_id, confirmado, confirmado_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (partido_id, jugador_id)
       DO UPDATE SET confirmado = $3, confirmado_at = NOW()
       RETURNING *`,
      [req.params.id, jugador_id, confirmado]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// Abrir ventana de asistencia — notifica a todos los jugadores del equipo
router.post('/:id/asistencia/abrir', authMiddleware, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const partido = await pool.query(
      `SELECT p.equipo_local_id, p.equipo_visitante_id,
              el.nombre AS local, ev.nombre AS visitante
       FROM partidos p
       JOIN equipos el ON el.id = p.equipo_local_id
       JOIN equipos ev ON ev.id = p.equipo_visitante_id
       WHERE p.id = $1`, [req.params.id]
    );
    if (partido.rows.length === 0) return res.status(404).json({ error: 'Partido no encontrado' });
    const pd = partido.rows[0];
    const info = `${pd.local} vs ${pd.visitante}`;
    notify.pedirAsistencia(pd.equipo_local_id, info).catch(() => {});
    notify.pedirAsistencia(pd.equipo_visitante_id, info).catch(() => {});
    res.json({ ok: true, mensaje: 'Notificaciones enviadas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// Alineación
router.get('/:id/alineacion', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, j.nombre, j.apellido, j.dorsal
       FROM alineacion al
       JOIN jugadores j ON al.jugador_id = j.id
       WHERE al.partido_id = $1
       ORDER BY al.titular DESC, j.dorsal`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.post('/:id/alineacion', authMiddleware, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const { jugadores } = req.body; // Array: [{ jugador_id, equipo_id, posicion_x, posicion_y, titular }]
    if (!Array.isArray(jugadores)) {
      return res.status(400).json({ error: 'Se espera un array de jugadores' });
    }

    // Borrar alineación previa
    await pool.query('DELETE FROM alineacion WHERE partido_id = $1', [req.params.id]);

    const values = jugadores.map((j, i) => {
      const offset = i * 5;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    }).join(', ');

    const params = jugadores.flatMap(j => [
      req.params.id, j.equipo_id, j.jugador_id, j.posicion_x, j.posicion_y, j.titular ?? true
    ]);

    if (jugadores.length > 0) {
      await pool.query(
        `INSERT INTO alineacion (partido_id, equipo_id, jugador_id, posicion_x, posicion_y, titular) VALUES ${
          jugadores.map((_, i) => {
            const o = i * 6;
            return `($${o+1}, $${o+2}, $${o+3}, $${o+4}, $${o+5}, $${o+6})`;
          }).join(', ')
        }`,
        params
      );
    }

    const result = await pool.query(
      `SELECT al.*, j.nombre, j.apellido, j.dorsal
       FROM alineacion al JOIN jugadores j ON al.jugador_id = j.id
       WHERE al.partido_id = $1 ORDER BY al.titular DESC, j.dorsal`,
      [req.params.id]
    );

    // Notificar al equipo que la alineación fue publicada
    const partido = await pool.query(
      `SELECT p.equipo_local_id, p.equipo_visitante_id,
              el.nombre AS local, ev.nombre AS visitante
       FROM partidos p
       JOIN equipos el ON el.id = p.equipo_local_id
       JOIN equipos ev ON ev.id = p.equipo_visitante_id
       WHERE p.id = $1`, [req.params.id]
    );
    if (partido.rows.length > 0) {
      const pd = partido.rows[0];
      const info = `${pd.local} vs ${pd.visitante}`;
      notify.alineacionPublicada(pd.equipo_local_id, info).catch(() => {});
      notify.alineacionPublicada(pd.equipo_visitante_id, info).catch(() => {});
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.put('/:id/alineacion', authMiddleware, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const { jugador_id, posicion_x, posicion_y, titular } = req.body;
    const result = await pool.query(
      `UPDATE alineacion SET posicion_x = $1, posicion_y = $2, titular = $3
       WHERE partido_id = $4 AND jugador_id = $5 RETURNING *`,
      [posicion_x, posicion_y, titular, req.params.id, jugador_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado en la alineación' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// Actualizar partido
router.put('/:id', authMiddleware, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const { fecha, hora, lugar, goles_local, goles_visitante, estado } = req.body;
    const result = await pool.query(
      `UPDATE partidos SET
        fecha = COALESCE($1, fecha), hora = COALESCE($2, hora), lugar = COALESCE($3, lugar),
        goles_local = COALESCE($4, goles_local), goles_visitante = COALESCE($5, goles_visitante),
        estado = COALESCE($6, estado)
       WHERE id = $7 RETURNING *`,
      [fecha, hora, lugar, goles_local, goles_visitante, estado, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partido no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// Stats del partido
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const [partido, goles, tarjetas] = await Promise.all([
      pool.query(
        `SELECT p.*, el.nombre AS equipo_local_nombre, ev.nombre AS equipo_visitante_nombre
         FROM partidos p
         JOIN equipos el ON p.equipo_local_id = el.id
         JOIN equipos ev ON p.equipo_visitante_id = ev.id
         WHERE p.id = $1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT g.*, j.nombre, j.apellido FROM goles g
         JOIN jugadores j ON g.jugador_id = j.id WHERE g.partido_id = $1 ORDER BY g.minuto`,
        [req.params.id]
      ),
      pool.query(
        `SELECT t.*, j.nombre, j.apellido FROM tarjetas t
         JOIN jugadores j ON t.jugador_id = j.id WHERE t.partido_id = $1 ORDER BY t.minuto`,
        [req.params.id]
      ),
    ]);

    if (partido.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    res.json({
      partido: partido.rows[0],
      goles: goles.rows,
      tarjetas: tarjetas.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

module.exports = router;
