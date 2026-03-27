// Matriz de permisos por rol
const PERMISSIONS = {
  admin: ["*"],
  coach: [
    "ver:tabla", "ver:fixtures", "ver:alineacion", "ver:asistencia_equipo",
    "editar:alineacion", "confirmar:asistencia_propia", "confirmar:asistencia_equipo",
    "registrar:resultado", "registrar:goles", "registrar:tarjetas"
  ],
  capitan: [
    "ver:tabla", "ver:fixtures", "ver:alineacion",
    "confirmar:asistencia_propia", "confirmar:asistencia_equipo"
  ],
  jugador: [
    "ver:tabla", "ver:fixtures", "ver:alineacion",
    "confirmar:asistencia_propia"
  ]
};

function can(user, permission) {
  if (!user) return false;
  const perms = PERMISSIONS[user.rol] || [];
  return perms.includes("*") || perms.includes(permission);
}

// Middleware factory
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    if (!can(req.user, permission)) {
      return res.status(403).json({
        error: "forbidden",
        message: `Se requiere permiso: ${permission}`,
        rol_actual: req.user.rol
      });
    }
    next();
  };
}

// Middleware: solo admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.rol !== "admin") {
    return res.status(403).json({ error: "forbidden", message: "Solo admins" });
  }
  next();
}

// Middleware: coach o admin de ese equipo
function requireCoachOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "unauthorized" });
  if (req.user.rol === "admin") return next();
  if (req.user.rol === "coach") {
    // Verificar que el coach pertenece al equipo del recurso
    const equipoId = req.params.equipo_id || req.body?.equipo_id;
    if (equipoId && req.user.equipo_id != equipoId) {
      return res.status(403).json({ error: "forbidden", message: "No eres coach de este equipo" });
    }
    return next();
  }
  return res.status(403).json({ error: "forbidden" });
}

module.exports = { can, requirePermission, requireAdmin, requireCoachOrAdmin, PERMISSIONS };
