const { Router } = require('express');
const pool = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { sanitizeError } = require('../middleware/errorHandler');

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipos ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, escudo_url, color_primario, color_secundario } = req.body;

    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (color_primario && !hexRegex.test(color_primario)) {
      return res.status(400).json({ error: 'Color primario debe ser hex válido (ej: #1a472a)' });
    }
    if (color_secundario && !hexRegex.test(color_secundario)) {
      return res.status(400).json({ error: 'Color secundario debe ser hex válido (ej: #ffffff)' });
    }

    const result = await pool.query(
      'INSERT INTO equipos (nombre, escudo_url, color_primario, color_secundario) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, escudo_url, color_primario || '#1a472a', color_secundario || '#ffffff']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, escudo_url, color_primario, color_secundario } = req.body;

    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (color_primario && !hexRegex.test(color_primario)) {
      return res.status(400).json({ error: 'Color primario debe ser hex válido (ej: #1a472a)' });
    }
    if (color_secundario && !hexRegex.test(color_secundario)) {
      return res.status(400).json({ error: 'Color secundario debe ser hex válido (ej: #ffffff)' });
    }

    const result = await pool.query(
      'UPDATE equipos SET nombre = COALESCE($1, nombre), escudo_url = COALESCE($2, escudo_url), color_primario = COALESCE($3, color_primario), color_secundario = COALESCE($4, color_secundario) WHERE id = $5 RETURNING *',
      [nombre, escudo_url, color_primario, color_secundario, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equipos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json({ message: 'Equipo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
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
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

module.exports = router;
