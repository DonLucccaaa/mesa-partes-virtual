# Historial de cambios

## 2026-09-07 - Estructura inicial (PROMPT 00)

### Solicitud relacionada

Crear la estructura inicial del proyecto: frontend Vue, backend Express, PostgreSQL con Docker Compose, schema/seed, endpoint GET /api/health y página inicial. Sin registro, login, JWT en rutas, documentos, PDFs, administrador ni correo.

### Historia de usuario

No aplica - configuración, corrección, documentación o mantenimiento.

### Archivos creados

- `docker-compose.yml`
- `.gitignore`
- `database/schema.sql`
- `database/seed.sql`
- `backend/package.json`
- `backend/.env.example`
- `backend/src/app.js`
- `backend/src/db.js`
- `backend/uploads/.gitkeep`
- `frontend/` (proyecto Vite + Vue + Vue Router)
- `frontend/src/router/index.js`
- `frontend/src/views/HomeView.vue`

### Archivos modificados

- `README.md`
- `doc/change-log.md`

### Cambios realizados

Se inicializó el frontend con Vue 3, Vite y Vue Router, y el backend con Express, CORS, dotenv y pg. Se configuró PostgreSQL únicamente mediante Docker Compose. Se crearon las cuatro tablas del modelo y un usuario ADMIN de prueba en el seed. El endpoint GET /api/health responde el estado del API y comprueba la conexión a la base de datos.

### Decisiones técnicas

- Docker se usa solo para PostgreSQL; frontend y backend corren en el anfitrión.
- No se crearon carpetas vacías de controladores, rutas ni middleware.
- Dependencias de backend en esta etapa: express, cors, dotenv, pg.
- Dependencias de frontend: vue, vue-router, vite, @vitejs/plugin-vue.
- No se instalaron bcryptjs, jsonwebtoken, multer ni nodemailer.
- La contraseña del ADMIN del seed se almacenó hasheada. No se documentan valores de `.env` en este registro.

### Pruebas realizadas

- `docker compose up -d postgres` y aplicación de `schema.sql` y `seed.sql`: tablas creadas y ADMIN insertado.
- `npm run dev` en backend: el servidor escuchó en el puerto 3000.
- `curl http://localhost:3000/api/health`: respondió `status: ok` y `database: connected`.
- `npm run dev` en frontend: Vite respondió HTTP 200 en el puerto 5173.

### Estado

- COMPLETADO

## 2026-09-07 - HU01 Registro de usuario

### Solicitud relacionada

Implementar el registro de usuarios mediante `POST /api/auth/register` y la vista frontend `/register`, sin implementar login, JWT ni documentos.

### Historia de usuario

HU01 - Registro de usuario.

### Archivos creados

- `frontend/src/views/RegisterView.vue`

### Archivos modificados

- `backend/src/app.js`
- `frontend/src/router/index.js`
- `frontend/src/views/HomeView.vue`
- `frontend/src/style.css`
- `doc/change-log.md`

### Cambios realizados

- Se agregó `POST /api/auth/register`.
- Se validan nombre, correo y contraseña obligatorios.
- Se valida el formato básico del correo y se normaliza a minúsculas.
- Se verifica que el correo no exista y se responde con estado `409` cuando está registrado.
- La contraseña se hashea con `bcryptjs`.
- El backend asigna siempre `role = 'USER'` y no acepta el rol enviado por el frontend.
- La respuesta devuelve únicamente datos públicos del usuario y nunca incluye la contraseña.
- Se creó la vista `/register` con formulario, mensajes de éxito y error, y consumo mediante `fetch()`.
- Se agregó un enlace desde la página inicial hacia el registro.

### Decisiones técnicas

- No se creó la ruta `/login` porque login está fuera del alcance de HU01; después de un registro exitoso se mantiene el mensaje en pantalla.
- Se mantuvo la arquitectura existente sin crear capas adicionales ni lógica de autenticación.

### Pruebas realizadas

- `npm run build` en `frontend`: compilación exitosa.
- `node --check backend/src/app.js`: sintaxis válida.
- Registro exitoso mediante `POST /api/auth/register`: respondió `201`.
- Registro con correo duplicado, incluyendo diferencia de mayúsculas: respondió `409`.
- Registro con campos obligatorios inválidos: respondió `400`.
- Envío de `role: ADMIN` desde el cliente: el usuario fue almacenado con `role: USER`.
- Consulta SQL: la contraseña almacenada tiene longitud compatible con bcrypt y la respuesta no contiene `password`.
- `GET /api/health`: respondió con la conexión a PostgreSQL activa.
- Los usuarios temporales de prueba fueron eliminados de la base de datos.

### Estado

- COMPLETADO

## 2026-09-07 - Datos iniciales y administrador (PROMPT 02)

### Solicitud relacionada

Crear datos mínimos de desarrollo: un usuario ADMIN inicial sin guardar la contraseña en texto plano, documentar cómo crearlo y no implementar login.

### Historia de usuario

No aplica - configuración, corrección, documentación o mantenimiento.

### Archivos creados

- `backend/scripts/create-admin.js`

### Archivos modificados

- `database/seed.sql`
- `backend/package.json`
- `backend/.env.example`
- `README.md`
- `doc/change-log.md`

### Cambios realizados

Se dejó de insertar el administrador desde SQL. Un script local hashea `ADMIN_PASSWORD` con bcryptjs e inserta o actualiza `admin@mesapartes.local` con rol ADMIN. No se agregaron ciudadanos de ejemplo ni login.

### Decisiones técnicas

- SQL puro no genera bcrypt de forma fiable; se usa un script mínimo en el backend.
- Dependencia nueva: bcryptjs.
- La contraseña vive solo en `backend/.env`, que no se versiona.
- El script es idempotente por email.

### Pruebas realizadas

- Pendiente de la ejecución del script contra PostgreSQL.

### Estado

- PARCIAL

## 2026-09-07 - Validación de PostgreSQL y administrador inicial

### Solicitud relacionada

Completar y validar PROMPT 01 - Configurar PostgreSQL y PROMPT 02 - Datos iniciales y administrador, continuando desde la implementación existente.

### Historia de usuario

No aplica - configuración y datos iniciales de desarrollo.

### Archivos creados

- Ninguno.

### Archivos modificados

- `database/schema.sql`
- `doc/change-log.md`

### Cambios realizados

- Se mantuvieron las cuatro tablas requeridas: `users`, `documents`, `status_history` y `audit_logs`.
- Se ajustaron las columnas de fecha para usar `CURRENT_TIMESTAMP`.
- Se validó el script `backend/scripts/create-admin.js`, que crea o actualiza el administrador `admin@mesapartes.local` con contraseña hasheada.
- Se confirmó que el script es idempotente al ejecutarlo dos veces.
- Se confirmó el endpoint temporal `GET /api/health` y su conexión con PostgreSQL.
- No se agregaron ciudadanos de ejemplo, login ni lógica de negocio.

### Decisiones técnicas

- Se conserva `pg` con `Pool`, consultas SQL directas y PostgreSQL ejecutado mediante Docker Compose.
- `database/seed.sql` permanece como documentación del mecanismo de seed; el administrador se genera mediante el script Node.js porque SQL puro no debe contener una contraseña real ni un hash fijo.
- Se detectó un administrador legado `admin@local.test` en el volumen local de PostgreSQL. No se eliminó automáticamente para evitar borrar datos existentes; no corresponde a un ciudadano de ejemplo.

### Pruebas realizadas

- `docker compose up -d postgres`: contenedor PostgreSQL en ejecución.
- Aplicación de `database/schema.sql`: completada correctamente; las tablas son idempotentes mediante `CREATE TABLE IF NOT EXISTS`.
- `cd backend && npm run seed:admin`: administrador creado correctamente.
- Segunda ejecución de `npm run seed:admin`: completada sin duplicar el administrador.
- Consulta SQL: `admin@mesapartes.local` existe con nombre y rol esperados y una contraseña de 60 caracteres compatible con bcrypt.
- `curl http://localhost:3000/api/health`: respondió `{"status":"ok","database":"connected"}`.

### Estado

- COMPLETADO
