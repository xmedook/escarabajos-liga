const { Router } = require('express');
const pool = require('../db/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { sanitizeError } = require('../middleware/errorHandler');

const router = Router();

const posicionesValidas = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];

function validateDorsal(dorsal) {
  const dorsalNum = parseInt(dorsal);
  if (isNaN(dorsalNum) || dorsalNum < 1 || dorsalNum > 99) {
    return 'Dorsal debe ser un número entre 1 y 99';
  }
  return null;
}

function validateFotoUrl(foto_url) {
  if (!foto_url) return null;
  const isHttps = foto_url.startsWith('https://');
  const isDataUri = foto_url.startsWith('data:image/');
  if (!isHttps && !isDataUri) {
    return 'foto_url debe ser HTTPS o data URI';
  }
  if (isDataUri && foto_url.length > 700000) {
    return 'Imagen demasiado grande (máx 500KB)';
  }
  return null;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { equipo_id } = req.query;
    let query = 'SELECT j.*, e.nombre AS equipo_nombre FROM jugadores j LEFT JOIN equipos e ON j.equipo_id = e.id';
    const params = [];
    if (equipo_id) {
      query += ' WHERE j.equipo_id = $1';
      params.push(equipo_id);
    }
    query += ' ORDER BY j.apellido';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const { nombre, apellido, dorsal, foto_url, posicion, equipo_id, usuario_id } = req.body;

    const dorsalErr = validateDorsal(dorsal);
    if (dorsalErr) return res.status(400).json({ error: dorsalErr });

    if (posicion && !posicionesValidas.includes(posicion)) {
      return res.status(400).json({ error: 'Posición no válida' });
    }

    const fotoErr = validateFotoUrl(foto_url);
    if (fotoErr) return res.status(400).json({ error: fotoErr });

    const result = await pool.query(
      'INSERT INTO jugadores (nombre, apellido, dorsal, foto_url, posicion, equipo_id, usuario_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, apellido, dorsal, foto_url, posicion, equipo_id, usuario_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const { nombre, apellido, dorsal, foto_url, posicion, equipo_id } = req.body;

    if (dorsal !== undefined) {
      const dorsalErr = validateDorsal(dorsal);
      if (dorsalErr) return res.status(400).json({ error: dorsalErr });
    }

    if (posicion && !posicionesValidas.includes(posicion)) {
      return res.status(400).json({ error: 'Posición no válida' });
    }

    const fotoErr = validateFotoUrl(foto_url);
    if (fotoErr) return res.status(400).json({ error: fotoErr });

    const result = await pool.query(
      'UPDATE jugadores SET nombre = COALESCE($1, nombre), apellido = COALESCE($2, apellido), dorsal = COALESCE($3, dorsal), foto_url = COALESCE($4, foto_url), posicion = COALESCE($5, posicion), equipo_id = COALESCE($6, equipo_id) WHERE id = $7 RETURNING *',
      [nombre, apellido, dorsal, foto_url, posicion, equipo_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Jugador no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM jugadores WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Jugador no encontrado' });
    res.json({ message: 'Jugador eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

module.exports = router;
