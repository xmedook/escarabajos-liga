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

app.listen(PORT, () => {
  console.log(`Escarabajos Liga API corriendo en puerto ${PORT}`);
});
