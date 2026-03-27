require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const equiposRoutes = require('./routes/equipos');
const jugadoresRoutes = require('./routes/jugadores');
const jornadasRoutes = require('./routes/jornadas');
const partidosRoutes = require('./routes/partidos');
const tablaRoutes = require('./routes/tabla');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
