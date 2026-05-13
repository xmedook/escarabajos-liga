require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const equiposRoutes = require('./routes/equipos');
const jugadoresRoutes = require('./routes/jugadores');
const jornadasRoutes = require('./routes/jornadas');
const partidosRoutes = require('./routes/partidos');
const tablaRoutes = require('./routes/tabla');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

const allowedOrigins = [
  "https://escarabajos.nexosrv.one",
  "https://escarabajos-liga-web.onrender.com",
  "http://localhost:8081",
  "http://localhost:19006",
  "exp://",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV !== "production") return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
    callback(new Error("CORS: origen no permitido"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "500kb" }));

// Rutas
app.use('/auth', authRoutes);
app.use('/equipos', equiposRoutes);
app.use('/jugadores', jugadoresRoutes);
app.use('/jornadas', jornadasRoutes);
app.use('/partidos', partidosRoutes);
app.use('/tabla-posiciones', tablaRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'Escarabajos Liga API', version: '1.0.0' });
});

// Privacy Policy (requerida por App Store)
app.get('/privacy', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Política de Privacidad — Escarabajos Liga</title>
<style>
  body{font-family:sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#222;line-height:1.7}
  h1{color:#1a472a}h2{margin-top:32px;color:#1a472a}
</style>
</head>
<body>
<h1>Política de Privacidad — Escarabajos Liga</h1>
<p><em>Última actualización: mayo 2026</em></p>

<h2>1. Información que recopilamos</h2>
<p>Recopilamos nombre, correo electrónico y contraseña para crear tu cuenta. Almacenamos tu token de dispositivo únicamente para enviarte notificaciones push relacionadas con la liga (recordatorios de partidos, solicitudes de asistencia, publicación de alineaciones).</p>

<h2>2. Uso de la información</h2>
<p>Usamos tu información exclusivamente para operar la aplicación: gestionar equipos, jornadas, partidos, asistencia y estadísticas de la liga. No vendemos ni compartimos tu información con terceros.</p>

<h2>3. Notificaciones push</h2>
<p>Con tu permiso, enviamos notificaciones sobre eventos de la liga. Puedes desactivarlas en cualquier momento desde los ajustes de tu dispositivo.</p>

<h2>4. Seguridad</h2>
<p>Las contraseñas se almacenan cifradas (bcrypt). La comunicación con el servidor es por HTTPS.</p>

<h2>5. Eliminación de datos</h2>
<p>Para eliminar tu cuenta y datos, contáctanos en <a href="mailto:hola@nexodigital.mx">hola@nexodigital.mx</a>.</p>

<h2>6. Contacto</h2>
<p>nexodigital.mx · <a href="mailto:hola@nexodigital.mx">hola@nexodigital.mx</a></p>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Escarabajos Liga API corriendo en puerto ${PORT}`);
  const { startPartidoCron } = require('./services/partidoCron');
  startPartidoCron();
});
