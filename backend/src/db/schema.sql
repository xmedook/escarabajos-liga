-- Escarabajos Liga — Schema

CREATE TABLE IF NOT EXISTS equipos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  escudo_url TEXT,
  color_primario VARCHAR(7) DEFAULT '#1a472a',
  color_secundario VARCHAR(7) DEFAULT '#ffffff',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'jugador' CHECK (rol IN ('admin', 'coach', 'capitan', 'jugador')),
  equipo_id INTEGER REFERENCES equipos(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jugadores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  dorsal INTEGER,
  foto_url TEXT,
  posicion VARCHAR(30),
  equipo_id INTEGER REFERENCES equipos(id) ON DELETE SET NULL,
  usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jornadas (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  temporada VARCHAR(20) NOT NULL DEFAULT '2026',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partidos (
  id SERIAL PRIMARY KEY,
  jornada_id INTEGER REFERENCES jornadas(id) ON DELETE CASCADE,
  equipo_local_id INTEGER NOT NULL REFERENCES equipos(id),
  equipo_visitante_id INTEGER NOT NULL REFERENCES equipos(id),
  fecha DATE,
  hora TIME,
  lugar VARCHAR(200),
  goles_local INTEGER DEFAULT 0,
  goles_visitante INTEGER DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'programado' CHECK (estado IN ('programado', 'en_curso', 'finalizado')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asistencia (
  id SERIAL PRIMARY KEY,
  partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  confirmado VARCHAR(10) DEFAULT 'pendiente' CHECK (confirmado IN ('si', 'no', 'pendiente')),
  confirmado_at TIMESTAMP,
  UNIQUE(partido_id, jugador_id)
);

CREATE TABLE IF NOT EXISTS alineacion (
  id SERIAL PRIMARY KEY,
  partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  equipo_id INTEGER NOT NULL REFERENCES equipos(id),
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  posicion_x REAL DEFAULT 0,
  posicion_y REAL DEFAULT 0,
  titular BOOLEAN DEFAULT true,
  UNIQUE(partido_id, jugador_id)
);

CREATE TABLE IF NOT EXISTS goles (
  id SERIAL PRIMARY KEY,
  partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  minuto INTEGER,
  tipo VARCHAR(20) DEFAULT 'gol' CHECK (tipo IN ('gol', 'autogol', 'penalti'))
);

CREATE TABLE IF NOT EXISTS tarjetas (
  id SERIAL PRIMARY KEY,
  partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  minuto INTEGER,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('amarilla', 'roja'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_jugadores_equipo ON jugadores(equipo_id);
CREATE INDEX IF NOT EXISTS idx_partidos_jornada ON partidos(jornada_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_partido ON asistencia(partido_id);
CREATE INDEX IF NOT EXISTS idx_alineacion_partido ON alineacion(partido_id);
CREATE INDEX IF NOT EXISTS idx_goles_partido ON goles(partido_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_partido ON tarjetas(partido_id);
