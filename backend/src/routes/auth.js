const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { sanitizeError } = require('../middleware/errorHandler');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos. Espera 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Demasiados registros desde esta IP." },
});

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, password y nombre son requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (nombre.length > 100) {
      return res.status(400).json({ error: 'Nombre demasiado largo' });
    }

    const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, rol, equipo_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, equipo_id',
      [email, password_hash, nombre, 'jugador', null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, equipo_id: user.equipo_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
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
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, equipo_id: user.equipo_id },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: sanitizeError(err) });
  }
});

module.exports = router;
