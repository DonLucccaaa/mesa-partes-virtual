const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const { pool } = require("../src/db");

const demoUsers = {
  admin: {
    name: "Administrador",
    email: "admin@mesapartes.local",
    role: "ADMIN",
    passwordVariable: "ADMIN_PASSWORD",
  },
  citizenOne: {
    name: "Ana Torres",
    email: "ana.torres@demo.local",
    role: "USER",
    passwordVariable: "DEMO_USER_PASSWORD",
  },
  citizenTwo: {
    name: "Luis Mendoza",
    email: "luis.mendoza@demo.local",
    role: "USER",
    passwordVariable: "DEMO_USER_PASSWORD",
  },
};

const demoDocuments = [
  {
    trackingCode: "MP-DEMO-0001",
    user: "citizenOne",
    subject: "Solicitud de constancia",
    documentType: "Solicitud",
    description: "Solicitud de constancia para trámite académico.",
    status: "RECIBIDO",
    history: [
      { status: "RECIBIDO", observation: null, changedBy: null },
    ],
  },
  {
    trackingCode: "MP-DEMO-0002",
    user: "citizenOne",
    subject: "Solicitud de licencia",
    documentType: "Solicitud",
    description: "Solicitud de licencia para actividad institucional.",
    status: "EN_REVISION",
    history: [
      { status: "RECIBIDO", observation: null, changedBy: null },
      {
        status: "EN_REVISION",
        observation: "La documentación se encuentra en revisión.",
        changedBy: "admin",
      },
    ],
  },
  {
    trackingCode: "MP-DEMO-0003",
    user: "citizenTwo",
    subject: "Pedido de información",
    documentType: "Pedido",
    description: "Pedido de información sobre un procedimiento interno.",
    status: "ATENDIDO",
    history: [
      { status: "RECIBIDO", observation: null, changedBy: null },
      {
        status: "EN_REVISION",
        observation: "Se derivó el pedido al área responsable.",
        changedBy: "admin",
      },
      {
        status: "ATENDIDO",
        observation: "El pedido fue atendido correctamente.",
        changedBy: "admin",
      },
    ],
  },
  {
    trackingCode: "MP-DEMO-0004",
    user: "citizenTwo",
    subject: "Recurso administrativo",
    documentType: "Recurso",
    description: "Recurso administrativo para revisión de resolución.",
    status: "RECHAZADO",
    history: [
      { status: "RECIBIDO", observation: null, changedBy: null },
      {
        status: "RECHAZADO",
        observation: "Falta documentación obligatoria.",
        changedBy: "admin",
      },
    ],
  },
];

function requiredPassword(variableName) {
  const password = process.env[variableName];

  if (!password) {
    throw new Error(`Falta ${variableName} en backend/.env`);
  }

  return password;
}

async function upsertUser(client, user) {
  const passwordHash = await bcrypt.hash(
    requiredPassword(user.passwordVariable),
    10
  );
  const result = await client.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       password = EXCLUDED.password,
       role = EXCLUDED.role
     RETURNING id, email, role`,
    [user.name, user.email, passwordHash, user.role]
  );

  return result.rows[0];
}

async function seedDemo() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const users = {};
    for (const [key, user] of Object.entries(demoUsers)) {
      users[key] = await upsertUser(client, user);
    }

    await client.query(
      `DELETE FROM status_history
       WHERE document_id IN (
         SELECT id FROM documents
         WHERE user_id IN ($1, $2)
       )`,
      [users.citizenOne.id, users.citizenTwo.id]
    );
    await client.query(
      `DELETE FROM documents
       WHERE user_id IN ($1, $2)`,
      [users.citizenOne.id, users.citizenTwo.id]
    );
    await client.query(
      `DELETE FROM audit_logs
       WHERE user_id IN ($1, $2, $3)`,
      [users.admin.id, users.citizenOne.id, users.citizenTwo.id]
    );

    for (const document of demoDocuments) {
      const created = await client.query(
        `INSERT INTO documents
          (tracking_code, user_id, subject, document_type, description,
           file_path, status, observation)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, $7)
         RETURNING id`,
        [
          document.trackingCode,
          users[document.user].id,
          document.subject,
          document.documentType,
          document.description,
          document.status,
          document.history[document.history.length - 1].observation,
        ]
      );
      const documentId = created.rows[0].id;

      for (const entry of document.history) {
        await client.query(
          `INSERT INTO status_history
            (document_id, status, observation, changed_by)
           VALUES ($1, $2, $3, $4)`,
          [
            documentId,
            entry.status,
            entry.observation,
            entry.changedBy ? users[entry.changedBy].id : null,
          ]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action, description)
         VALUES ($1, 'CREATE_DOCUMENT', $2)`,
        [users[document.user].id, `Creación del documento ${documentId}`]
      );

      for (const entry of document.history.slice(1)) {
        await client.query(
          `INSERT INTO audit_logs (user_id, action, description)
           VALUES ($1, 'UPDATE_DOCUMENT_STATUS', $2)`,
          [
            users.admin.id,
            `Actualización de estado del documento ${documentId} a ${entry.status}`,
          ]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Datos de demostración listos.");
    console.log("Administrador:", demoUsers.admin.email);
    console.log("Ciudadanos:", demoUsers.citizenOne.email, demoUsers.citizenTwo.email);
    console.log("Documentos creados:", demoDocuments.length);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

seedDemo()
  .catch((error) => {
    console.error("No se pudieron crear los datos de demostración:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
