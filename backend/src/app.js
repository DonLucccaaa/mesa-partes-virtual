const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const { query } = require("./db");
const { authenticateToken, requireUser } = require("./middleware/auth");

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

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET no está configurado");
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

      let result;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const trackingCode = generateTrackingCode();

        try {
          result = await query(
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
          break;
        } catch (error) {
          if (error.code !== "23505" || attempt === 2) {
            throw error;
          }
        }
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
