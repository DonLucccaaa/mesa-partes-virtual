# Mesa de Partes Virtual

Sistema académico para registrar, consultar y gestionar documentos
institucionales mediante una mesa de partes virtual.

## Tecnologías

- Frontend: Vue 3, Vue Router, Vite, JavaScript y CSS.
- Backend: Node.js, Express y API REST.
- Base de datos: PostgreSQL con `pg` y consultas SQL directas.
- Autenticación: bcryptjs y JWT.
- Archivos: Multer y almacenamiento local en `backend/uploads/`.
- PostgreSQL se ejecuta mediante Docker Compose.

## Requisitos

- Node.js y npm.
- Docker y Docker Compose.
- OpenSSL para generar un secreto JWT local.

## Instalación y configuración

1. Instalar dependencias:

   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   cd ..
   ```

2. Crear la configuración local del backend:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Editar `backend/.env`:

   ```env
   PORT=3000
   DATABASE_URL=postgresql://admin:Admin1234!@localhost:5432/appdb
   JWT_SECRET=REEMPLAZAR_CON_UN_SECRETO_ALEATORIO
   ADMIN_PASSWORD=CONTRASENA_LOCAL_DEL_ADMIN
   DEMO_USER_PASSWORD=CONTRASENA_LOCAL_DE_CIUDADANOS
   ```

   Generar un secreto seguro con:

   ```bash
   openssl rand -base64 32
   ```

   `backend/.env` no debe versionarse. El backend rechaza secretos JWT vacíos,
   de ejemplo o menores de 32 caracteres.

## PostgreSQL y schema

Iniciar PostgreSQL:

```bash
docker compose up -d postgres
```

Comprobar el contenedor:

```bash
docker compose ps
```

Crear las tablas:

```bash
docker compose exec -T postgres psql -U admin -d appdb < database/schema.sql
```

El esquema crea:

- `users`;
- `documents`;
- `status_history`;
- `audit_logs`.

Para detener PostgreSQL:

```bash
docker compose stop postgres
```

Para detenerlo y conservar el volumen:

```bash
docker compose down
```

`docker compose down -v` elimina también la base de datos y debe utilizarse
solo cuando se desea reiniciar todos los datos.

## Datos de demostración

Los datos de demostración no se cargan automáticamente. Después de aplicar el
schema, definir `ADMIN_PASSWORD` y `DEMO_USER_PASSWORD` en `backend/.env` y
ejecutar:

```bash
cd backend
npm run seed:demo
```

El script es reconstruible y reemplaza únicamente los documentos asociados a
los dos ciudadanos de demostración y sus registros de auditoría. Crea o
actualiza:

- un administrador: `admin@mesapartes.local`;
- ciudadano 1: `ana.torres@demo.local`;
- ciudadano 2: `luis.mendoza@demo.local`;
- cuatro documentos con códigos `MP-DEMO-0001` a `MP-DEMO-0004`;
- estados `RECIBIDO`, `EN_REVISION`, `ATENDIDO` y `RECHAZADO`;
- historial acumulativo y auditoría básica.

Los documentos de demostración tienen `file_path = NULL`, por lo que no
dependen de archivos PDF inexistentes. Para demostrar la carga de un PDF real,
utilizar `/documents/new` con una cuenta USER.

El administrador también puede crearse o actualizarse por separado con:

```bash
cd backend
npm run seed:admin
```

## Ejecución

Iniciar el backend:

```bash
cd backend
npm run dev
```

API: `http://localhost:3000`

Comprobar PostgreSQL y el backend:

```bash
curl http://localhost:3000/api/health
```

Iniciar el frontend en otra terminal:

```bash
cd frontend
npm run dev
```

Aplicación: `http://localhost:5173`

## Funcionalidades de USER

- Registrarse en `/register`.
- Iniciar sesión en `/login`.
- Consultar sus documentos en `/dashboard`.
- Registrar documentos con PDF en `/documents/new`.
- Ver detalle, observación, historial y PDF de sus documentos.
- Consultar seguimiento público en `/track`.
- Cerrar sesión eliminando la sesión local.

## Funcionalidades de ADMIN

- Iniciar sesión con `admin@mesapartes.local`.
- Ver todos los documentos en `/admin`.
- Consultar ciudadano, detalle, PDF e historial.
- Cambiar estados a `RECIBIDO`, `EN_REVISION`, `ATENDIDO` o `RECHAZADO`.
- Agregar observaciones.
- Consultar tarjetas de estadísticas por estado.
- Generar registros de auditoría de las acciones permitidas.

## Endpoints principales

| Método | Endpoint | Acceso | Uso |
|---|---|---|---|
| GET | `/api/health` | Público | Comprobar API y PostgreSQL |
| POST | `/api/auth/register` | Público | Registrar USER |
| POST | `/api/auth/login` | Público | Iniciar sesión y obtener JWT |
| POST | `/api/documents` | USER | Registrar documento y PDF |
| GET | `/api/documents/my` | USER | Listar documentos propios |
| GET | `/api/documents/:id` | USER | Ver detalle propio |
| GET | `/api/documents/:id/file` | USER | Ver PDF propio |
| GET | `/api/documents/:id/history` | USER | Ver historial propio |
| GET | `/api/documents/track/:trackingCode` | Público | Seguimiento por código |
| GET | `/api/admin/documents` | ADMIN | Listar todos los documentos |
| GET | `/api/admin/documents/:id` | ADMIN | Ver detalle administrativo |
| GET | `/api/admin/documents/:id/file` | ADMIN | Ver PDF administrativo |
| GET | `/api/admin/documents/:id/history` | ADMIN | Ver historial administrativo |
| PATCH | `/api/admin/documents/:id/status` | ADMIN | Cambiar estado |
| GET | `/api/admin/stats` | ADMIN | Consultar estadísticas |

## Estructura principal

```text
backend/
  scripts/create-admin.js
  scripts/seed-demo.js
  src/app.js
  src/db.js
  src/middleware/auth.js
  uploads/
database/
  schema.sql
  seed.sql
frontend/src/
  components/LogoutButton.vue
  router/index.js
  views/
docker-compose.yml
```

## Archivos importantes para la exposición

- `backend/src/db.js`: crea el `Pool` de PostgreSQL y expone `query`.
- `backend/src/app.js`: contiene registro, login, documentos, Multer,
  seguimiento, historial, estadísticas y auditoría.
- `backend/src/middleware/auth.js`: valida JWT y separa USER de ADMIN.
- `backend/scripts/create-admin.js`: crea el administrador con bcryptjs.
- `backend/scripts/seed-demo.js`: reconstruye los datos de demostración.
- `database/schema.sql`: define tablas, claves foráneas, estados y fechas.
- `database/seed.sql`: documenta los comandos de carga inicial y demo.
- `frontend/src/router/index.js`: define rutas y guard de autenticación/rol.
- `frontend/src/views/RegisterView.vue`: formulario y `fetch()` de registro.
- `frontend/src/views/LoginView.vue`: login, almacenamiento del JWT y
  redirección por rol.
- `frontend/src/components/LogoutButton.vue`: elimina `token` y `user`.
- `frontend/src/views/DocumentsNewView.vue`: formulario multipart y `fetch()`
  de registro de documentos.
- `frontend/src/views/DashboardView.vue`: listado de documentos del ciudadano.
- `frontend/src/views/DocumentDetailView.vue`: detalle, PDF e historial USER.
- `frontend/src/views/AdminView.vue`: listado administrativo y estadísticas.
- `frontend/src/views/AdminDocumentDetailView.vue`: cambio de estado, PDF e
  historial ADMIN.
- `backend/src/app.js`, función `handlePdfUpload`: Multer, extensión, MIME,
  firma `%PDF-` y límite de 10 MB.
- `backend/src/app.js`, función `generateTrackingCode`: código `MP-...`.
- `backend/src/app.js`, función `recordAudit`: auditoría de cinco acciones.

## Flujo recomendado para la exposición

1. Mostrar la arquitectura, `docker-compose.yml` y ejecutar PostgreSQL.
2. Aplicar `database/schema.sql` y explicar las cuatro tablas.
3. Configurar `.env` y ejecutar `npm run seed:demo`.
4. Iniciar backend y frontend; comprobar `/api/health`.
5. Iniciar sesión como `admin@mesapartes.local` y mostrar `/admin`, las
   estadísticas, los cuatro estados y el historial.
6. Cerrar sesión y entrar como `ana.torres@demo.local`; mostrar `/dashboard`,
   el detalle y el seguimiento `MP-DEMO-0002`.
7. Crear un documento nuevo con un PDF válido para explicar Multer, la
   asociación mediante JWT y el código de seguimiento.
8. Volver al administrador, localizar el nuevo documento y cambiar su estado
   con una observación.
9. Regresar al ciudadano para mostrar el estado e historial actualizado.
10. Consultar `/track` sin iniciar sesión y explicar que no expone datos
    personales.
11. Mostrar brevemente `audit_logs` y explicar que no almacena contraseñas ni
    tokens.
