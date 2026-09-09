const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Mesa de Partes Virtual - API",
    version: "1.0.0",
    description:
      "API REST del sistema académico de Mesa de Partes Virtual. Permite a ciudadanos (USER) registrar y consultar documentos institucionales, y a administradores (ADMIN) gestionar estados, observaciones, historial y estadísticas.\n\nAutenticación: enviar el token JWT devuelto por `POST /api/auth/login` en el header `Authorization: Bearer <token>`.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
  tags: [
    { name: "Salud", description: "Comprobar disponibilidad de la API y PostgreSQL" },
    { name: "Autenticación", description: "Registro e inicio de sesión de usuarios" },
    { name: "Documentos (USER)", description: "Operaciones del ciudadano sobre sus documentos" },
    { name: "Documentos (ADMIN)", description: "Operaciones administrativas sobre todos los documentos" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token obtenido en POST /api/auth/login. Prefijo: Bearer <token>",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Descripción del error" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Ana Torres" },
          email: { type: "string", example: "ana.torres@demo.local" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Ana Torres" },
          email: { type: "string", format: "email", example: "ana.torres@demo.local" },
          password: { type: "string", format: "password", minLength: 6, example: "MiContrasena123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@mesapartes.local" },
          password: { type: "string", format: "password", example: "Admin1234!" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          tracking_code: { type: "string", example: "MP-DEMO-0001" },
          subject: { type: "string", example: "Solicitud de constancia" },
          document_type: { type: "string", example: "Solicitud" },
          description: { type: "string", example: "Descripción del trámite" },
          observation: { type: ["string", "null"], example: "En revisión" },
          status: { type: "string", enum: ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          has_file: { type: "boolean", example: true },
        },
      },
      DocumentList: {
        type: "object",
        properties: {
          documents: { type: "array", items: { $ref: "#/components/schemas/Document" } },
        },
      },
      DocumentCreateResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Documento registrado correctamente" },
          document: { $ref: "#/components/schemas/Document" },
        },
      },
      AdminDocumentListItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tracking_code: { type: "string" },
          subject: { type: "string" },
          document_type: { type: "string" },
          status: { type: "string", enum: ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"] },
          created_at: { type: "string", format: "date-time" },
          citizen_name: { type: "string", example: "Ana Torres" },
        },
      },
      AdminDocumentList: {
        type: "object",
        properties: {
          documents: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminDocumentListItem" },
          },
        },
      },
      AdminDocumentDetail: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tracking_code: { type: "string" },
          subject: { type: "string" },
          document_type: { type: "string" },
          description: { type: "string" },
          observation: { type: ["string", "null"] },
          status: { type: "string", enum: ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          has_file: { type: "boolean" },
          citizen: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
        },
      },
      TrackedDocument: {
        type: "object",
        properties: {
          tracking_code: { type: "string", example: "MP-DEMO-0002" },
          subject: { type: "string" },
          status: { type: "string", enum: ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      TrackResponse: {
        type: "object",
        properties: {
          document: { $ref: "#/components/schemas/TrackedDocument" },
        },
      },
      HistoryEntry: {
        type: "object",
        properties: {
          id: { type: "integer" },
          status: { type: "string", enum: ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"] },
          observation: { type: ["string", "null"] },
          changed_at: { type: "string", format: "date-time" },
          changed_by: { type: ["string", "null"], example: "Administrador" },
        },
      },
      HistoryList: {
        type: "object",
        properties: {
          history: { type: "array", items: { $ref: "#/components/schemas/HistoryEntry" } },
        },
      },
      StatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"],
            example: "EN_REVISION",
          },
          observation: { type: "string", example: "La documentación se encuentra en revisión" },
        },
      },
      Stats: {
        type: "object",
        properties: {
          total: { type: "integer", example: 4 },
          recibido: { type: "integer", example: 1 },
          en_revision: { type: "integer", example: 1 },
          atendido: { type: "integer", example: 1 },
          rechazado: { type: "integer", example: 1 },
        },
      },
      StatsResponse: {
        type: "object",
        properties: {
          stats: { $ref: "#/components/schemas/Stats" },
        },
      },
      Health: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          database: { type: "string", example: "connected" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Salud"],
        summary: "Comprobar API y PostgreSQL",
        description: "Devuelve el estado de la API y de la conexión a la base de datos.",
        responses: {
          "200": {
            description: "Conectado correctamente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Health" },
              },
            },
          },
          "500": {
            description: "No se pudo conectar a PostgreSQL",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar un ciudadano (USER)",
        description: "Crea una cuenta con rol USER. El correo debe ser único.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario registrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Registro exitoso" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "400": { description: "Datos inválidos o formato de correo incorrecto", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "El correo ya está registrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión y obtener JWT",
        description: "Valida credenciales por rol. El token expira en 2 horas.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Credenciales correctas. Devuelve token y usuario.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "400": { description: "Faltan correo o contraseña", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Correo o contraseña incorrectos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/documents": {
      post: {
        tags: ["Documentos (USER)"],
        summary: "Registrar un documento (requiere USER)",
        description:
          "Registra un documento con estado RECIBIDO y genera su código de seguimiento. El PDF se valida por extensión, MIME y firma `%PDF-`, con un límite de 10 MB.\n\nAutenticación: Bearer token de un usuario con rol USER.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["subject", "document_type", "description", "file"],
                properties: {
                  subject: { type: "string", example: "Solicitud de constancia" },
                  document_type: { type: "string", example: "Solicitud" },
                  description: { type: "string", example: "Detalle del trámite" },
                  file: { type: "string", format: "binary", description: "Archivo PDF (máx. 10 MB)" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Documento registrado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/DocumentCreateResponse" } },
            },
          },
          "400": { description: "Faltan campos o el archivo no es un PDF válido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol USER", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "413": { description: "El PDF supera los 10 MB", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/documents/my": {
      get: {
        tags: ["Documentos (USER)"],
        summary: "Listar documentos propios (requiere USER)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de documentos del ciudadano",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/DocumentList" } },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol USER", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/documents/{id}": {
      get: {
        tags: ["Documentos (USER)"],
        summary: "Ver detalle de un documento propio (requiere USER)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del documento" },
        ],
        responses: {
          "200": {
            description: "Detalle del documento",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { document: { $ref: "#/components/schemas/Document" } },
                },
              },
            },
          },
          "400": { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol USER o documento de otro ciudadano", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Documento no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/documents/{id}/file": {
      get: {
        tags: ["Documentos (USER)"],
        summary: "Ver PDF de un documento propio (requiere USER)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del documento" },
        ],
        responses: {
          "200": {
            description: "El archivo PDF (Content-Type: application/pdf)",
            content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
          },
          "400": { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol USER", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Documento o PDF no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/documents/{id}/history": {
      get: {
        tags: ["Documentos (USER)"],
        summary: "Ver historial de un documento propio (requiere USER)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del documento" },
        ],
        responses: {
          "200": {
            description: "Historial de estados del documento",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/HistoryList" } },
            },
          },
          "400": { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol USER", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Documento no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/documents/track/{trackingCode}": {
      get: {
        tags: ["Documentos (USER)"],
        summary: "Seguimiento público por código",
        description:
          "Consulta pública sin autenticación. Solo expone código, asunto, estado y fechas (sin datos personales ni PDF).",
        parameters: [
          { name: "trackingCode", in: "path", required: true, schema: { type: "string" }, description: "Código de seguimiento, p. ej. MP-DEMO-0002" },
        ],
        responses: {
          "200": {
            description: "Información de seguimiento",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/TrackResponse" } },
            },
          },
          "404": { description: "No existe un documento con ese código", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/admin/documents": {
      get: {
        tags: ["Documentos (ADMIN)"],
        summary: "Listar todos los documentos (requiere ADMIN)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista completa de documentos con el ciudadano dueño",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AdminDocumentList" } },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol ADMIN", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/admin/documents/{id}": {
      get: {
        tags: ["Documentos (ADMIN)"],
        summary: "Ver detalle administrativo (requiere ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del documento" },
        ],
        responses: {
          "200": {
            description: "Detalle con datos del ciudadano",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { document: { $ref: "#/components/schemas/AdminDocumentDetail" } },
                },
              },
            },
          },
          "400": { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol ADMIN", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Documento no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/admin/documents/{id}/file": {
      get: {
        tags: ["Documentos (ADMIN)"],
        summary: "Ver PDF administrativo (requiere ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del documento" },
        ],
        responses: {
          "200": {
            description: "El archivo PDF (Content-Type: application/pdf)",
            content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
          },
          "400": { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol ADMIN", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Documento o PDF no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/admin/documents/{id}/history": {
      get: {
        tags: ["Documentos (ADMIN)"],
        summary: "Ver historial administrativo (requiere ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del documento" },
        ],
        responses: {
          "200": {
            description: "Historial de estados del documento",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/HistoryList" } },
            },
          },
          "400": { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol ADMIN", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Documento no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/admin/documents/{id}/status": {
      patch: {
        tags: ["Documentos (ADMIN)"],
        summary: "Cambiar estado de un documento (requiere ADMIN)",
        description:
          "Actualiza el estado a RECIBIDO, EN_REVISION, ATENDIDO o RECHAZADO. Registra el cambio en `status_history` y en `audit_logs`.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del documento" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StatusUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Estado actualizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Estado actualizado correctamente" },
                    document: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        tracking_code: { type: "string" },
                        status: { type: "string", enum: ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"] },
                        observation: { type: ["string", "null"] },
                        updated_at: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "ID o estado inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol ADMIN", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Documento no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Documentos (ADMIN)"],
        summary: "Estadísticas de documentos (requiere ADMIN)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Conteo total y por estado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/StatsResponse" } },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Requiere rol ADMIN", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

module.exports = swaggerDocument;