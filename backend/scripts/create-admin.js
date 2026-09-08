const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const { pool, query } = require("../src/db");

const ADMIN_NAME = "Administrador";
const ADMIN_EMAIL = "admin@mesapartes.local";
const ADMIN_ROLE = "ADMIN";

async function createAdmin() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error("Falta ADMIN_PASSWORD en backend/.env");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       password = EXCLUDED.password,
       role = EXCLUDED.role`,
    [ADMIN_NAME, ADMIN_EMAIL, passwordHash, ADMIN_ROLE]
  );

  console.log("Administrador de desarrollo listo:", ADMIN_EMAIL);
}

createAdmin()
  .catch((error) => {
    console.error("No se pudo crear el administrador:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
