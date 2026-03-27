const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, rol, equipo_id } = req.body;
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, password y nombre son requeridos' });
    }

    const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, rol, equipo_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, equipo_id',
      [email, password_hash, nombre, rol || 'jugador', equipo_id || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, equipo_id: user.equipo_id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, equipo_id: user.equipo_id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, equipo_id: user.equipo_id },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
