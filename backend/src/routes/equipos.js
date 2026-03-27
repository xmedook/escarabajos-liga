const { Router } = require('express');
const pool = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipos ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, escudo_url, color_primario, color_secundario } = req.body;
    const result = await pool.query(
      'INSERT INTO equipos (nombre, escudo_url, color_primario, color_secundario) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, escudo_url, color_primario || '#1a472a', color_secundario || '#ffffff']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/jugadores', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jugadores WHERE equipo_id = $1 ORDER BY dorsal',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
