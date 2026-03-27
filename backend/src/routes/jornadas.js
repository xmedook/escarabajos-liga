const { Router } = require('express');
const pool = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jornadas ORDER BY numero');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { numero, fecha_inicio, fecha_fin, temporada } = req.body;
    const result = await pool.query(
      'INSERT INTO jornadas (numero, fecha_inicio, fecha_fin, temporada) VALUES ($1, $2, $3, $4) RETURNING *',
      [numero, fecha_inicio, fecha_fin, temporada || '2026']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/partidos', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        el.nombre AS equipo_local_nombre, ev.nombre AS equipo_visitante_nombre
       FROM partidos p
       JOIN equipos el ON p.equipo_local_id = el.id
       JOIN equipos ev ON p.equipo_visitante_id = ev.id
       WHERE p.jornada_id = $1
       ORDER BY p.fecha, p.hora`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/partidos', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { equipo_local_id, equipo_visitante_id, fecha, hora, lugar } = req.body;
    const result = await pool.query(
      'INSERT INTO partidos (jornada_id, equipo_local_id, equipo_visitante_id, fecha, hora, lugar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.params.id, equipo_local_id, equipo_visitante_id, fecha, hora, lugar]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
