const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const { pool, query } = require("./db");
const {
  authenticateToken,
  isJwtSecretConfigured,
  requireAdmin,
  requireUser,
} = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 3000;
const uploadsDirectory = path.join(__dirname, "..", "uploads");

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}.pdf`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (file.mimetype !== "application/pdf" || extension !== ".pdf") {
      const error = new Error("Solo se permiten archivos PDF");
      error.code = "INVALID_FILE_TYPE";
      return callback(error);
    }

    return callback(null, true);
  },
});

function handlePdfUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "El archivo PDF no puede superar los 10 MB",
      });
    }

    if (error.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Error al cargar el archivo:", error.message);
    return res.status(400).json({
      message: "No se pudo cargar el archivo",
    });
  });
}

function generateTrackingCode() {
  return `MP-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

function parseDocumentId(value) {
  return /^\d+$/.test(value) ? Number(value) : null;
}

function documentResponse(document) {
  return {
    id: document.id,
    tracking_code: document.tracking_code,
    subject: document.subject,
    document_type: document.document_type,
    description: document.description,
    observation: document.observation,
    status: document.status,
    created_at: document.created_at,
    updated_at: document.updated_at,
    has_file: Boolean(document.file_path),
  };
}

const documentStatuses = new Set([
  "RECIBIDO",
  "EN_REVISION",
  "ATENDIDO",
  "RECHAZADO",
]);

const auditActions = new Set([
  "REGISTER",
  "LOGIN",
  "CREATE_DOCUMENT",
  "UPDATE_DOCUMENT_STATUS",
  "DOWNLOAD_DOCUMENT",
]);

async function recordAudit(executor, userId, action, description) {
  if (!auditActions.has(action)) {
    throw new Error(`Acción de auditoría no permitida: ${action}`);
  }

  const execute = typeof executor === "function"
    ? executor
    : executor.query.bind(executor);

  await execute(
    `INSERT INTO audit_logs (user_id, action, description)
     VALUES ($1, $2, $3)`,
    [userId || null, action, description]
  );
}

function historyResponse(entry) {
  return {
    id: entry.id,
    status: entry.status,
    observation: entry.observation,
    changed_at: entry.created_at,
    changed_by: entry.changed_by_name || null,
  };
}

async function removeUploadedFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("No se pudo eliminar el archivo cargado:", error.message);
    }
  }
}

app.use(cors());
app.use(express.json());

app.post("/api/auth/login", async (req, res) => {
  const body = req.body || {};
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password =
    typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return res.status(400).json({
      message: "Correo y contraseña son obligatorios",
    });
  }

  try {
    const result = await query(
      `SELECT id, name, email, password, role
       FROM users
       WHERE LOWER(email) = $1`,
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    if (!isJwtSecretConfigured()) {
      console.error("JWT_SECRET no está configurado correctamente");
      return res.status(500).json({
        message: "La autenticación no está configurada correctamente",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    await recordAudit(query, user.id, "LOGIN", "Inicio de sesión exitoso");

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    return res.status(500).json({
      message: "No se pudo iniciar sesión",
    });
  }
});

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

    const client = await pool.connect();
    let result;

    try {
      await client.query("BEGIN");
      const passwordHash = await bcrypt.hash(password, 10);
      result = await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, 'USER')
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash]
      );
      await recordAudit(client, result.rows[0].id, "REGISTER", "Registro de usuario");
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

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

app.post(
  "/api/documents",
  authenticateToken,
  requireUser,
  handlePdfUpload,
  async (req, res) => {
    const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const documentType =
      typeof req.body.document_type === "string"
        ? req.body.document_type.trim()
        : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";

    if (!subject || !documentType || !description || !req.file) {
      if (req.file) {
        await removeUploadedFile(req.file.path);
      }

      return res.status(400).json({
        message: "Asunto, tipo de documento, descripción y archivo PDF son obligatorios",
      });
    }

    try {
      const fileHeader = await fs.promises.readFile(req.file.path, {
        encoding: null,
      });

      if (fileHeader.subarray(0, 5).toString() !== "%PDF-") {
        await removeUploadedFile(req.file.path);
        return res.status(400).json({
          message: "El archivo no contiene un PDF válido",
        });
      }

      const client = await pool.connect();
      let result;

      try {
        await client.query("BEGIN");
        const trackingCode = generateTrackingCode();
        result = await client.query(
          `INSERT INTO documents
            (tracking_code, user_id, subject, document_type, description, file_path, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'RECIBIDO')
           RETURNING id, tracking_code, subject, document_type, description,
                     file_path, status, created_at, updated_at`,
          [
            trackingCode,
            req.user.id,
            subject,
            documentType,
            description,
            path.relative(path.join(__dirname, ".."), req.file.path),
          ]
        );

        await client.query(
          `INSERT INTO status_history (document_id, status, observation, changed_by)
           VALUES ($1, 'RECIBIDO', NULL, NULL)`,
          [result.rows[0].id]
        );
        await recordAudit(
          client,
          req.user.id,
          "CREATE_DOCUMENT",
          `Creación del documento ${result.rows[0].id}`
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      return res.status(201).json({
        message: "Documento registrado correctamente",
        document: result.rows[0],
      });
    } catch (error) {
      await removeUploadedFile(req.file.path);
      console.error("Error al registrar documento:", error.message);
      return res.status(500).json({
        message: "No se pudo registrar el documento",
      });
    }
  }
);

app.get("/api/documents/my", authenticateToken, requireUser, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, tracking_code, subject, document_type, status, created_at,
              updated_at, file_path
       FROM documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      documents: result.rows.map(documentResponse),
    });
  } catch (error) {
    console.error("Error al consultar documentos del usuario:", error.message);
    return res.status(500).json({
      message: "No se pudieron consultar los documentos",
    });
  }
});

app.get(
  "/api/documents/:id/history",
  authenticateToken,
  requireUser,
  async (req, res) => {
    const documentId = parseDocumentId(req.params.id);

    if (documentId === null) {
      return res.status(400).json({
        message: "El identificador del documento no es válido",
      });
    }

    try {
      const result = await query(
        `SELECT h.id, h.status, h.observation, h.created_at,
                u.name AS changed_by_name
         FROM status_history h
         JOIN documents d ON d.id = h.document_id
         LEFT JOIN users u ON u.id = h.changed_by
         WHERE h.document_id = $1 AND d.user_id = $2
         ORDER BY h.created_at ASC, h.id ASC`,
        [documentId, req.user.id]
      );

      if (result.rowCount === 0) {
        const documentResult = await query(
          "SELECT id FROM documents WHERE id = $1 AND user_id = $2",
          [documentId, req.user.id]
        );

        if (documentResult.rowCount === 0) {
          return res.status(404).json({
            message: "Documento no encontrado",
          });
        }
      }

      return res.status(200).json({
        history: result.rows.map(historyResponse),
      });
    } catch (error) {
      console.error("Error al consultar historial ciudadano:", error.message);
      return res.status(500).json({
        message: "No se pudo consultar el historial",
      });
    }
  }
);

app.get(
  "/api/documents/track/:trackingCode",
  async (req, res) => {
    const trackingCode = req.params.trackingCode.trim().toUpperCase();

    try {
      const result = await query(
        `SELECT tracking_code, subject, status, created_at, updated_at
         FROM documents
         WHERE UPPER(tracking_code) = $1`,
        [trackingCode]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "No existe un documento con ese código de seguimiento",
        });
      }

      return res.status(200).json({
        document: result.rows[0],
      });
    } catch (error) {
      console.error("Error al consultar seguimiento:", error.message);
      return res.status(500).json({
        message: "No se pudo consultar el seguimiento",
      });
    }
  }
);

app.get("/api/documents/:id/file", authenticateToken, requireUser, async (req, res) => {
  const documentId = parseDocumentId(req.params.id);

  if (documentId === null) {
    return res.status(400).json({
      message: "El identificador del documento no es válido",
    });
  }

  try {
    const result = await query(
      `SELECT file_path
       FROM documents
       WHERE id = $1 AND user_id = $2`,
      [documentId, req.user.id]
    );
    const document = result.rows[0];

    if (!document) {
      return res.status(404).json({
        message: "Documento no encontrado",
      });
    }

    if (!document.file_path) {
      return res.status(404).json({
        message: "El documento no tiene un archivo PDF",
      });
    }

    const filePath = path.join(uploadsDirectory, path.basename(document.file_path));
    return res.sendFile(filePath, {
      headers: {
        "Content-Disposition": "inline",
      },
    }, (error) => {
      if (!error) {
        recordAudit(
          query,
          req.user.id,
          "DOWNLOAD_DOCUMENT",
          `Descarga del documento ${documentId}`
        ).catch((auditError) => {
          console.error("No se pudo registrar la descarga:", auditError.message);
        });
      }

      if (error && !res.headersSent) {
        return res.status(error.code === "ENOENT" ? 404 : 500).json({
          message: error.code === "ENOENT"
            ? "El archivo PDF no fue encontrado"
            : "No se pudo abrir el archivo PDF",
        });
      }
    });
  } catch (error) {
    console.error("Error al abrir el PDF:", error.message);
    return res.status(500).json({
      message: "No se pudo abrir el archivo PDF",
    });
  }
});

app.get("/api/documents/:id", authenticateToken, requireUser, async (req, res) => {
  const documentId = parseDocumentId(req.params.id);

  if (documentId === null) {
    return res.status(400).json({
      message: "El identificador del documento no es válido",
    });
  }

  try {
    const result = await query(
      `SELECT id, tracking_code, subject, document_type, description,
              observation, status, created_at, updated_at, file_path
       FROM documents
       WHERE id = $1 AND user_id = $2`,
      [documentId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Documento no encontrado",
      });
    }

    return res.status(200).json({
      document: documentResponse(result.rows[0]),
    });
  } catch (error) {
    console.error("Error al consultar detalle del documento:", error.message);
    return res.status(500).json({
      message: "No se pudo consultar el documento",
    });
  }
});

app.get("/api/admin/documents", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id, d.tracking_code, d.subject, d.document_type,
              d.status, d.created_at, u.name AS citizen_name
       FROM documents d
       JOIN users u ON u.id = d.user_id
       ORDER BY d.created_at DESC`
    );

    return res.status(200).json({
      documents: result.rows,
    });
  } catch (error) {
    console.error("Error al consultar documentos administrativos:", error.message);
    return res.status(500).json({
      message: "No se pudieron consultar los documentos",
    });
  }
});

app.get("/api/admin/documents/:id/file", authenticateToken, requireAdmin, async (req, res) => {
  const documentId = parseDocumentId(req.params.id);

  if (documentId === null) {
    return res.status(400).json({
      message: "El identificador del documento no es válido",
    });
  }

  try {
    const result = await query(
      "SELECT file_path FROM documents WHERE id = $1",
      [documentId]
    );
    const document = result.rows[0];

    if (!document) {
      return res.status(404).json({
        message: "Documento no encontrado",
      });
    }

    if (!document.file_path) {
      return res.status(404).json({
        message: "El documento no tiene un archivo PDF",
      });
    }

    const filePath = path.join(uploadsDirectory, path.basename(document.file_path));
    return res.sendFile(filePath, {
      headers: {
        "Content-Disposition": "inline",
      },
    }, (error) => {
    if (!error) {
      recordAudit(
        query,
        req.user.id,
        "DOWNLOAD_DOCUMENT",
        `Descarga del documento ${documentId}`
      ).catch((auditError) => {
        console.error("No se pudo registrar la descarga:", auditError.message);
      });
    }

    if (error && !res.headersSent) {
        return res.status(error.code === "ENOENT" ? 404 : 500).json({
          message: error.code === "ENOENT"
            ? "El archivo PDF no fue encontrado"
            : "No se pudo abrir el archivo PDF",
        });
      }
    });
  } catch (error) {
    console.error("Error al abrir el PDF administrativo:", error.message);
    return res.status(500).json({
      message: "No se pudo abrir el archivo PDF",
    });
  }
});

app.get("/api/admin/documents/:id", authenticateToken, requireAdmin, async (req, res) => {
  const documentId = parseDocumentId(req.params.id);

  if (documentId === null) {
    return res.status(400).json({
      message: "El identificador del documento no es válido",
    });
  }

  try {
    const result = await query(
      `SELECT d.id, d.tracking_code, d.subject, d.document_type,
              d.description, d.observation, d.status, d.created_at,
              d.updated_at, d.file_path, u.id AS citizen_id,
              u.name AS citizen_name, u.email AS citizen_email
       FROM documents d
       JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [documentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Documento no encontrado",
      });
    }

    const document = result.rows[0];
    return res.status(200).json({
      document: {
        id: document.id,
        tracking_code: document.tracking_code,
        subject: document.subject,
        document_type: document.document_type,
        description: document.description,
        observation: document.observation,
        status: document.status,
        created_at: document.created_at,
        updated_at: document.updated_at,
        has_file: Boolean(document.file_path),
        citizen: {
          id: document.citizen_id,
          name: document.citizen_name,
          email: document.citizen_email,
        },
      },
    });
  } catch (error) {
    console.error("Error al consultar detalle administrativo:", error.message);
    return res.status(500).json({
      message: "No se pudo consultar el documento",
    });
  }
});

app.get(
  "/api/admin/documents/:id/history",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const documentId = parseDocumentId(req.params.id);

    if (documentId === null) {
      return res.status(400).json({
        message: "El identificador del documento no es válido",
      });
    }

    try {
      const result = await query(
        `SELECT h.id, h.status, h.observation, h.created_at,
                u.name AS changed_by_name
         FROM status_history h
         JOIN documents d ON d.id = h.document_id
         LEFT JOIN users u ON u.id = h.changed_by
         WHERE h.document_id = $1
         ORDER BY h.created_at ASC, h.id ASC`,
        [documentId]
      );

      const documentResult = await query(
        "SELECT id FROM documents WHERE id = $1",
        [documentId]
      );

      if (documentResult.rowCount === 0) {
        return res.status(404).json({
          message: "Documento no encontrado",
        });
      }

      return res.status(200).json({
        history: result.rows.map(historyResponse),
      });
    } catch (error) {
      console.error("Error al consultar historial administrativo:", error.message);
      return res.status(500).json({
        message: "No se pudo consultar el historial",
      });
    }
  }
);

app.patch(
  "/api/admin/documents/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const documentId = parseDocumentId(req.params.id);
    const status = typeof req.body.status === "string" ? req.body.status.trim() : "";
    const observation =
      typeof req.body.observation === "string" ? req.body.observation.trim() : null;

    if (documentId === null) {
      return res.status(400).json({
        message: "El identificador del documento no es válido",
      });
    }

    if (!documentStatuses.has(status)) {
      return res.status(400).json({
        message: "El estado indicado no es válido",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query(
        `UPDATE documents
         SET status = $1, observation = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, tracking_code, status, observation, updated_at`,
        [status, observation || null, documentId]
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Documento no encontrado",
        });
      }

      await client.query(
        `INSERT INTO status_history (document_id, status, observation, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [documentId, status, observation || null, req.user.id]
      );
      await recordAudit(
        client,
        req.user.id,
        "UPDATE_DOCUMENT_STATUS",
        `Actualización de estado del documento ${documentId} a ${status}`
      );
      await client.query("COMMIT");

      return res.status(200).json({
        message: "Estado actualizado correctamente",
        document: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error al actualizar estado:", error.message);
      return res.status(500).json({
        message: "No se pudo actualizar el estado",
      });
    } finally {
      client.release();
    }
  }
);

app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'RECIBIDO')::int AS recibido,
         COUNT(*) FILTER (WHERE status = 'EN_REVISION')::int AS en_revision,
         COUNT(*) FILTER (WHERE status = 'ATENDIDO')::int AS atendido,
         COUNT(*) FILTER (WHERE status = 'RECHAZADO')::int AS rechazado
       FROM documents`
    );

    return res.status(200).json({
      stats: result.rows[0],
    });
  } catch (error) {
    console.error("Error al consultar estadísticas:", error.message);
    return res.status(500).json({
      message: "No se pudieron consultar las estadísticas",
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
