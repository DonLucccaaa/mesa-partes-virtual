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

## 2026-09-07 - HU02 Inicio de sesión

### Solicitud relacionada

Implementar el inicio de sesión con JWT, persistencia básica en `localStorage`, redirección según rol y cierre de sesión, sin construir todavía las funcionalidades internas de los dashboards.

### Historia de usuario

HU02 - Inicio de sesión.

### Archivos creados

- `backend/src/middleware/auth.js`
- `frontend/src/views/LoginView.vue`
- `frontend/src/views/DashboardView.vue`
- `frontend/src/views/AdminView.vue`
- `frontend/src/components/LogoutButton.vue`

### Archivos modificados

- `backend/src/app.js`
- `backend/package.json`
- `backend/package-lock.json`
- `frontend/src/router/index.js`
- `frontend/src/views/HomeView.vue`
- `README.md`
- `doc/change-log.md`

### Cambios realizados

- Se agregó `POST /api/auth/login`.
- Se busca el usuario por correo normalizado y se compara la contraseña con `bcryptjs`.
- Se genera un JWT firmado con `JWT_SECRET`, incluyendo `id` y `role`, con expiración de dos horas.
- La respuesta incluye el token y los datos básicos del usuario sin la contraseña.
- La vista `/login` consume la API mediante `fetch()`, guarda `token` y `user` en `localStorage`, y redirige a `/dashboard` para USER o `/admin` para ADMIN.
- Se agregaron vistas placeholder para permitir las redirecciones sin implementar todavía sus funcionalidades.
- Se agregó cierre de sesión eliminando `token` y `user` de `localStorage`.
- Se creó el middleware backend `authenticateToken` para futuras rutas protegidas.

### Decisiones técnicas

- Se agregó únicamente `jsonwebtoken`; no se incorporaron refresh tokens, Pinia ni lógica documental.
- El middleware queda disponible para futuras rutas y no se aplicó a endpoints que aún no requieren autenticación.

### Pruebas realizadas

- `node --check backend/src/app.js` y `node --check backend/src/middleware/auth.js`: sintaxis válida.
- `npm run build` en `frontend`: compilación exitosa.
- Login USER: respondió `200`, generó JWT con `id` y `role: USER`, sin devolver contraseña.
- Login ADMIN: respondió `200`, generó JWT con `id` y `role: ADMIN`, sin devolver contraseña.
- Credenciales incorrectas: respondieron `401` con mensaje claro.
- Se verificó que los datos temporales de prueba fueron eliminados de PostgreSQL.

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

## 2026-09-07 - PROMPT 05 Protección de rutas y roles

### Solicitud relacionada

Implementar protección básica de rutas frontend y middlewares backend para autenticación y autorización por rol, sin implementar documentos ni funcionalidades administrativas internas.

### Historia de usuario

No aplica - protección de navegación y autorización.

### Archivos creados

- `frontend/src/views/TrackView.vue`
- `frontend/src/views/DocumentsNewView.vue`
- `frontend/src/views/DocumentDetailView.vue`
- `frontend/src/views/AdminDocumentDetailView.vue`

### Archivos modificados

- `backend/src/middleware/auth.js`
- `frontend/src/router/index.js`
- `frontend/src/views/HomeView.vue`
- `doc/change-log.md`

### Cambios realizados

- Se definieron rutas públicas `/login`, `/register` y `/track`.
- Se definieron rutas protegidas para USER: `/dashboard`, `/documents/new` y `/documents/:id`.
- Se definieron rutas protegidas para ADMIN: `/admin` y `/admin/documents/:id`.
- El guard de Vue Router valida la existencia y expiración del JWT en `localStorage`.
- El guard valida el rol almacenado para impedir el acceso de USER a rutas ADMIN y viceversa.
- Se añadió `requireAdmin` al middleware backend.
- `authenticateToken` verifica el esquema Bearer, valida el JWT con `JWT_SECRET` y expone sus claims en `req.user`.
- Se agregaron placeholders únicamente para permitir probar la navegación.

### Decisiones técnicas

- La protección del frontend es una primera barrera de navegación; las futuras APIs deberán aplicar `authenticateToken` y `requireAdmin` en el backend.
- No se agregaron endpoints de documentos, estadísticas, auditoría ni correo.
- Si existe un token inválido o datos de usuario incompletos, el guard limpia la sesión local y redirige a `/login`.

### Pruebas realizadas

- `npm run build` en `frontend`: compilación exitosa.
- `node --check backend/src/middleware/auth.js` y `node --check backend/src/app.js`: sintaxis válida.
- Middleware sin token: respondió `401`.
- Middleware con token USER: autenticó correctamente y `requireAdmin` respondió `403`.
- Middleware con token ADMIN: autenticó correctamente y `requireAdmin` permitió continuar.
- `git diff --check`: sin errores de formato.

### Estado

- COMPLETADO

## 2026-09-07 - PROMPT 06 Registro de documentos y PDF

### Solicitud relacionada

Implementar el registro de documentos con archivo PDF para usuarios USER autenticados, incluyendo almacenamiento local, código de seguimiento y estado inicial.

### Historia de usuario

HU03 y HU04 - Registro de documento y adjuntar PDF.

### Archivos creados

- Ninguno.

### Archivos modificados

- `backend/package.json`
- `backend/package-lock.json`
- `backend/src/app.js`
- `backend/src/middleware/auth.js`
- `frontend/src/views/DocumentsNewView.vue`
- `frontend/src/views/DashboardView.vue`
- `README.md`
- `doc/change-log.md`

### Cambios realizados

- Se agregó `multer` con almacenamiento en `backend/uploads/`.
- Se limita el tamaño máximo a 10 MB y se validan extensión, MIME y firma inicial `%PDF-`.
- Se agregó `POST /api/documents`, protegido por `authenticateToken` y `requireUser`.
- El usuario se obtiene exclusivamente desde `req.user.id`; se ignora cualquier `user_id` enviado por el cliente.
- Se genera un código de seguimiento único con prefijo `MP-`.
- El documento se crea con estado `RECIBIDO`, fechas automáticas y ruta relativa del archivo.
- La vista `/documents/new` envía el formulario como `multipart/form-data` mediante `fetch()` y muestra el código de seguimiento.
- Se agregaron enlaces desde el dashboard y documentación de uso.

### Decisiones técnicas

- El PDF se guarda en el sistema de archivos local; PostgreSQL almacena solamente la ruta relativa.
- No se implementaron correo, estadísticas, auditoría, historial completo, múltiples archivos ni almacenamiento cloud.
- Los archivos cargados se eliminan si faltan datos, no son PDF válidos o falla la persistencia.

### Pruebas realizadas

- `npm install multer`: dependencia instalada correctamente.
- `node --check backend/src/app.js` y `node --check backend/src/middleware/auth.js`: sintaxis válida.
- `npm run build` en `frontend`: compilación exitosa.
- PDF válido como USER: respondió `201`, generó código `MP-...`, guardó el archivo y creó el documento con estado `RECIBIDO`.
- Consulta SQL: el `user_id` almacenado correspondió al usuario del JWT, ignorando el `user_id` enviado por el cliente.
- Archivo no PDF: respondió `400`.
- Archivo superior a 10 MB: respondió `413`.
- Sin autenticación: respondió `401`.
- ADMIN autenticado: respondió `403`.
- Los datos y archivos temporales de prueba fueron eliminados.

### Estado

- COMPLETADO

## 2026-09-07 - PROMPT 07 Documentos del ciudadano y seguimiento público

### Solicitud relacionada

Implementar la consulta de documentos propios, el detalle protegido con PDF y el seguimiento público por código, sin implementar el historial completo.

### Historia de usuario

HU05 y HU06 - Consulta de documentos del ciudadano y seguimiento público.

### Archivos creados

- Ninguno.

### Archivos modificados

- `backend/src/app.js`
- `frontend/src/views/DashboardView.vue`
- `frontend/src/views/DocumentDetailView.vue`
- `frontend/src/views/TrackView.vue`
- `frontend/src/style.css`
- `README.md`
- `doc/change-log.md`

### Cambios realizados

- Se agregó `GET /api/documents/my`, protegido para USER y ordenado por fecha de creación descendente.
- Se agregó `GET /api/documents/:id`, filtrado por `req.user.id`, con descripción, observación, fechas y disponibilidad del archivo.
- Se agregó acceso protegido al PDF mediante `GET /api/documents/:id/file`, sin exponer la ruta interna almacenada.
- Se agregó `GET /api/documents/track/:trackingCode` sin autenticación, devolviendo únicamente código, asunto, estado y fechas.
- Se completó el dashboard con listado, mensaje para lista vacía, enlace a nuevo documento y acceso al detalle.
- Se completó el detalle del ciudadano con descripción, observación, fechas y visualización del PDF.
- Se completó `/track` con formulario y mensajes claros para códigos inexistentes.

### Decisiones técnicas

- Las consultas protegidas filtran siempre por `user_id = req.user.id`; no aceptan `user_id` por query string ni por ruta.
- Un documento de otro usuario responde `404` para no revelar su existencia.
- El seguimiento público no devuelve `user_id`, `file_path` ni otros datos personales.
- No se implementó el historial completo de estados.

### Pruebas realizadas

- `npm run build` en `frontend`: compilación exitosa.
- Documento propio: apareció en `/api/documents/my` y el detalle respondió `200`.
- Segundo usuario: recibió lista vacía y `404` al consultar el documento ajeno.
- El detalle no expuso `file_path` y el endpoint protegido entregó el PDF como `application/pdf`.
- Seguimiento público válido: respondió `200` con únicamente los campos permitidos.
- Código inexistente: respondió `404` con mensaje claro.
- Los datos, archivos y usuarios temporales fueron eliminados.

### Estado

- COMPLETADO

## 2026-09-07 - PROMPT 08 Panel administrativo y cambio de estado

### Solicitud relacionada

Implementar el panel administrativo, el detalle de documentos para ADMIN y el cambio de estado con observación, sin agregar correo ni estadísticas.

### Historia de usuario

HU08 y HU09 - Visualización administrativa y actualización del estado documental.

### Archivos creados

- Ninguno.

### Archivos modificados

- `backend/src/app.js`
- `frontend/src/views/AdminView.vue`
- `frontend/src/views/AdminDocumentDetailView.vue`
- `frontend/src/style.css`
- `README.md`
- `doc/change-log.md`

### Cambios realizados

- Se agregó `GET /api/admin/documents`, protegido por `authenticateToken` y `requireAdmin`, con todos los documentos ordenados por fecha descendente.
- El listado administrativo incluye código, nombre del ciudadano, asunto, tipo, estado y fecha de creación.
- Se agregó `GET /api/admin/documents/:id` con datos del documento y datos básicos del ciudadano.
- Se agregó `GET /api/admin/documents/:id/file` para visualizar el PDF desde el panel.
- Se agregó `PATCH /api/admin/documents/:id/status`.
- Se validan exclusivamente los estados `RECIBIDO`, `EN_REVISION`, `ATENDIDO` y `RECHAZADO`.
- Se actualizan `status`, `observation` y `updated_at`.
- El detalle administrativo refresca los datos después de un cambio y muestra confirmación.
- El ciudadano ve el nuevo estado y observación mediante sus endpoints existentes.

### Decisiones técnicas

- Todas las rutas administrativas validan el JWT y el rol ADMIN.
- No se aceptan identificadores de usuario desde el frontend para localizar documentos; el documento se identifica por su ruta y sus relaciones se obtienen desde PostgreSQL.
- No se implementaron correo, estadísticas ni auditoría.
- No se agregó historial de estados porque permanece fuera del alcance solicitado.

### Pruebas realizadas

- `npm run build` en `frontend`: compilación exitosa.
- Listado ADMIN: respondió `200`, incluyó el documento y el nombre del ciudadano.
- Detalle ADMIN: respondió `200` con datos del ciudadano sin exponer `file_path`.
- PDF administrativo: respondió `200` como `application/pdf`.
- USER en endpoint administrativo: respondió `403`.
- Se probaron los cuatro estados permitidos; todos respondieron `200` y persistieron observación.
- Estado inválido: respondió `400`.
- Consulta ciudadana posterior: reflejó el último estado `RECHAZADO` y su observación.
- Los datos, archivos y usuarios temporales fueron eliminados.

### Estado

- COMPLETADO

## 2026-09-07 - PROMPT 09 Historial de estados

### Solicitud relacionada

Implementar el historial básico de estados para ciudadanos y administradores utilizando la tabla `status_history`.

### Historia de usuario

HU10 - Visualización del historial de estados.

### Archivos creados

- Ninguno.

### Archivos modificados

- `backend/src/app.js`
- `frontend/src/views/DocumentDetailView.vue`
- `frontend/src/views/AdminDocumentDetailView.vue`
- `frontend/src/style.css`
- `README.md`
- `doc/change-log.md`

### Cambios realizados

- Al crear un documento se registra en la misma transacción una entrada inicial `RECIBIDO`.
- Cada cambio administrativo de estado actualiza `documents` y agrega una nueva entrada en `status_history` dentro de una única transacción.
- El historial guarda estado, observación, administrador responsable y fecha.
- Se agregaron consultas protegidas para el historial ciudadano y administrativo.
- El ciudadano solo puede consultar el historial de sus propios documentos.
- El administrador puede consultar el historial de cualquier documento desde su detalle.
- Ambos detalles muestran el historial en orden cronológico y las observaciones cuando existen.

### Decisiones técnicas

- Las operaciones de creación y cambio de estado son atómicas: si falla el historial, tampoco se conserva el cambio principal.
- No se eliminan ni actualizan entradas anteriores.
- La entrada inicial no tiene administrador responsable porque la crea el sistema; los cambios posteriores guardan el administrador autenticado.
- Se mantiene la clave foránea existente entre `status_history` y `documents`.

### Pruebas realizadas

- `node --check backend/src/app.js` y `node --check backend/src/middleware/auth.js`: sintaxis válida.
- `npm run build` en `frontend`: compilación exitosa.
- Documento temporal creado con entrada inicial `RECIBIDO`.
- Se aplicaron tres cambios: `EN_REVISION`, `ATENDIDO` y `RECHAZADO`.
- El historial devolvió cuatro entradas en orden cronológico y conservó las tres observaciones.
- Las entradas de cambios mostraron al administrador responsable.
- El ciudadano consultó su historial correctamente.
- El acceso de ADMIN al endpoint ciudadano respondió `403`.
- Se eliminó el fixture temporal borrando primero su historial por la clave foránea.

### Estado

- COMPLETADO

## 2026-09-07 - PROMPT 10 Funcionalidades secundarias

### Solicitud relacionada

Implementar estadísticas administrativas simples y auditoría básica sin cambiar la arquitectura ni crear una interfaz de auditoría.

### Historia de usuario

No aplica - funcionalidades secundarias administrativas.

### Archivos creados

- Ninguno.

### Archivos modificados

- `backend/src/app.js`
- `frontend/src/views/AdminView.vue`
- `frontend/src/style.css`
- `README.md`
- `doc/change-log.md`

### Cambios realizados

- Se agregó `GET /api/admin/stats`, protegido para ADMIN, con total de documentos y conteos por estado.
- Se agregaron tarjetas simples al panel `/admin`.
- Se creó la función reutilizable `recordAudit`.
- Se registran únicamente `REGISTER`, `LOGIN`, `CREATE_DOCUMENT`, `UPDATE_DOCUMENT_STATUS` y `DOWNLOAD_DOCUMENT`.
- Los eventos de creación y cambio de estado se registran dentro de sus transacciones.
- Las descargas se registran únicamente cuando el archivo se entrega correctamente.
- Las descripciones de auditoría no contienen contraseñas, tokens ni información sensible.

### Decisiones técnicas

- No se instalaron librerías de gráficos ni se creó una interfaz administrativa para auditar.
- Las estadísticas se calculan directamente mediante agregaciones SQL.
- La auditoría reutiliza el mismo ejecutor SQL o cliente de transacción sin crear una nueva capa arquitectónica.

### Pruebas realizadas

- `node --check backend/src/app.js`: sintaxis válida.
- `npm run build` en `frontend`: compilación exitosa.
- `GET /api/admin/stats` respondió con total y conteos por estado.
- Se verificaron eventos `REGISTER`, `LOGIN`, `CREATE_DOCUMENT`, `UPDATE_DOCUMENT_STATUS` y `DOWNLOAD_DOCUMENT`.
- La descarga de PDF generó auditoría para ciudadano y administrador.
- Las pruebas temporales de estadísticas y auditoría fueron limpiadas.

### Estado

- COMPLETADO
