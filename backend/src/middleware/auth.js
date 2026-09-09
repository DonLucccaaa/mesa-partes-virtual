const jwt = require("jsonwebtoken");

const exampleJwtSecret = "cambiar_clave_local_de_desarrollo";

function isJwtSecretConfigured() {
  const secret = process.env.JWT_SECRET;
  return Boolean(
    secret &&
    secret !== exampleJwtSecret &&
    secret.length >= 32
  );
}

function authenticateToken(req, res, next) {
  if (!isJwtSecretConfigured()) {
    console.error("JWT_SECRET no está configurado correctamente");
    return res.status(500).json({
      message: "La autenticación no está configurada correctamente",
    });
  }

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
  isJwtSecretConfigured,
  requireAdmin,
  requireUser,
};
