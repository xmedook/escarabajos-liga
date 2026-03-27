const { Router } = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query(`
      WITH stats AS (
        SELECT
          e.id,
          e.nombre,
          e.escudo_url,
          e.color_primario,
          COUNT(p.id) FILTER (WHERE p.estado = 'finalizado') AS pj,
          COUNT(p.id) FILTER (WHERE p.estado = 'finalizado' AND (
            (p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante) OR
            (p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local)
          )) AS pg,
          COUNT(p.id) FILTER (WHERE p.estado = 'finalizado' AND p.goles_local = p.goles_visitante) AS pe,
          COUNT(p.id) FILTER (WHERE p.estado = 'finalizado' AND (
            (p.equipo_local_id = e.id AND p.goles_local < p.goles_visitante) OR
            (p.equipo_visitante_id = e.id AND p.goles_visitante < p.goles_local)
          )) AS pp,
          COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_local
                             WHEN p.equipo_visitante_id = e.id THEN p.goles_visitante
                             ELSE 0 END) FILTER (WHERE p.estado = 'finalizado'), 0) AS gf,
          COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_visitante
                             WHEN p.equipo_visitante_id = e.id THEN p.goles_local
                             ELSE 0 END) FILTER (WHERE p.estado = 'finalizado'), 0) AS gc
        FROM equipos e
        LEFT JOIN partidos p ON e.id = p.equipo_local_id OR e.id = p.equipo_visitante_id
        GROUP BY e.id, e.nombre, e.escudo_url, e.color_primario
      )
      SELECT *,
        (gf - gc) AS dif,
        (pg * 3 + pe) AS pts
      FROM stats
      ORDER BY pts DESC, dif DESC, gf DESC, nombre
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
