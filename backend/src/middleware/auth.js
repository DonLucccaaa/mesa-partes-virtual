const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Token de autenticación requerido",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({
      message: "Token de autenticación inválido o expirado",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Se requieren permisos de administrador",
    });
  }

  return next();
}

function requireUser(req, res, next) {
  if (!req.user || req.user.role !== "USER") {
    return res.status(403).json({
      message: "Solo los usuarios ciudadanos pueden realizar esta acción",
    });
  }

  return next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser,
};
