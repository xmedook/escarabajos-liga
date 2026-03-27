-- Agregar capitan al CHECK de rol
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('admin', 'coach', 'capitan', 'jugador'));

-- Agregar columna equipo_id si no existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='usuarios' AND column_name='equipo_id') THEN
    ALTER TABLE usuarios ADD COLUMN equipo_id INTEGER REFERENCES equipos(id);
  END IF;
END $$;
