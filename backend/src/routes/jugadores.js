const { Router } = require('express');
const pool = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT j.*, e.nombre AS equipo_nombre FROM jugadores j LEFT JOIN equipos e ON j.equipo_id = e.id ORDER BY j.apellido'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const { nombre, apellido, dorsal, foto_url, posicion, equipo_id, usuario_id } = req.body;
    const result = await pool.query(
      'INSERT INTO jugadores (nombre, apellido, dorsal, foto_url, posicion, equipo_id, usuario_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, apellido, dorsal, foto_url, posicion, equipo_id, usuario_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
