const { Router } = require('express');
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/permissions');

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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
