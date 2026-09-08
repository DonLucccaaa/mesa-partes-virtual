const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { query } = require("./db");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/api/auth/register", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Nombre, correo y contraseña son obligatorios",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      message: "El correo no tiene un formato válido",
    });
  }

  try {
    const existingUser = await query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [email]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        message: "El correo ya está registrado",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'USER')
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    return res.status(201).json({
      message: "Registro exitoso",
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "El correo ya está registrado",
      });
    }

    console.error("Error al registrar usuario:", error.message);
    return res.status(500).json({
      message: "No se pudo completar el registro",
    });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "No se pudo conectar a PostgreSQL",
    });
  }
});

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
