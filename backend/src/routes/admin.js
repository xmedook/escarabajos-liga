const { Router } = require('express');
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/permissions');
const { sanitizeError } = require('../middleware/errorHandler');
const { notify, sendPush } = require('../services/notifications');

const router = Router();

// Todas las rutas requieren auth + admin
router.use(authMiddleware, requireAdmin);

// GET /admin/usuarios — listar todos
router.get('/usuarios', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.nombre, u.rol, u.equipo_id, u.created_at,
              e.nombre AS equipo_nombre
       FROM usuarios u
       LEFT JOIN equipos e ON u.equipo_id = e.id
       ORDER BY u.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// POST /admin/usuarios — crear usuario
router.post('/usuarios', async (req, res) => {
  try {
    const { email, password, nombre, rol, equipo_id } = req.body;
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'email, password y nombre son requeridos' });
    }
    const validRoles = ['admin', 'coach', 'capitan', 'jugador'];
    if (rol && !validRoles.includes(rol)) {
      return res.status(400).json({ error: `Rol inválido. Válidos: ${validRoles.join(', ')}` });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (email, password_hash, nombre, rol, equipo_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, equipo_id, created_at`,
      [email.toLowerCase().trim(), hash, nombre, rol || 'jugador', equipo_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// PUT /admin/usuarios/:id/rol — cambiar rol
router.put('/usuarios/:id/rol', async (req, res) => {
  try {
    const { rol } = req.body;
    const validRoles = ['admin', 'coach', 'capitan', 'jugador'];
    if (!validRoles.includes(rol)) {
      return res.status(400).json({ error: `Rol inválido. Válidos: ${validRoles.join(', ')}` });
    }
    const result = await pool.query(
      'UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, email, nombre, rol, equipo_id',
      [rol, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// PUT /admin/usuarios/:id/equipo — asignar equipo
router.put('/usuarios/:id/equipo', async (req, res) => {
  try {
    const { equipo_id } = req.body;
    const result = await pool.query(
      'UPDATE usuarios SET equipo_id = $1 WHERE id = $2 RETURNING id, email, nombre, rol, equipo_id',
      [equipo_id, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// DELETE /admin/usuarios/:id — eliminar
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// POST /admin/notificaciones/broadcast — enviar push a todos o a un equipo
router.post('/notificaciones/broadcast', async (req, res) => {
  try {
    const { titulo, cuerpo, equipo_id } = req.body;
    if (!titulo || !cuerpo) {
      return res.status(400).json({ error: 'titulo y cuerpo son requeridos' });
    }
    const query = equipo_id
      ? 'SELECT push_token FROM usuarios WHERE equipo_id = $1 AND push_token IS NOT NULL'
      : 'SELECT push_token FROM usuarios WHERE push_token IS NOT NULL';
    const params = equipo_id ? [equipo_id] : [];
    const { rows } = await pool.query(query, params);
    const tokens = rows.map(r => r.push_token);
    await sendPush(tokens, titulo, cuerpo, { type: 'broadcast' });
    res.json({ ok: true, enviadas: tokens.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// POST /admin/notificaciones/asistencia/:partidoId — pedir asistencia
router.post('/notificaciones/asistencia/:partidoId', async (req, res) => {
  try {
    const partido = await pool.query(
      `SELECT p.equipo_local_id, p.equipo_visitante_id,
              el.nombre AS local, ev.nombre AS visitante
       FROM partidos p
       JOIN equipos el ON el.id = p.equipo_local_id
       JOIN equipos ev ON ev.id = p.equipo_visitante_id
       WHERE p.id = $1`, [req.params.partidoId]
    );
    if (partido.rows.length === 0) return res.status(404).json({ error: 'Partido no encontrado' });
    const pd = partido.rows[0];
    const info = `${pd.local} vs ${pd.visitante}`;
    await notify.pedirAsistencia(pd.equipo_local_id, info);
    await notify.pedirAsistencia(pd.equipo_visitante_id, info);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: sanitizeError(err) });
  }
});

module.exports = router;
