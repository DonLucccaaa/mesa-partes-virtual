# Mesa de Partes Virtual

Proyecto académico de Fundamentos de Proyectos de Sistemas de Información.

Stack: Vue.js, Express.js y PostgreSQL (Docker).

## Requisitos

- Node.js
- Docker y Docker Compose
- npm

## PostgreSQL (Docker)

Iniciar:

```bash
docker compose up -d postgres
```

Verificar contenedores:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs postgres
```

Detener:

```bash
docker compose stop postgres
```

Detener y eliminar contenedores, conservando el volumen:

```bash
docker compose down
```

Detener y eliminar también los datos de PostgreSQL:

```bash
docker compose down -v
```

`docker compose down -v` borra la información de la base de datos. Usarlo solo si se desea reiniciar la base por completo.

## Crear tablas

Con el contenedor en ejecución:

```bash
docker compose exec -T postgres psql -U admin -d appdb < database/schema.sql
```

`database/seed.sql` no inserta usuarios. El administrador se crea con el script del backend.

## Crear el administrador de desarrollo

No hay inicio de sesión todavía. Este usuario sirve para pruebas posteriores.

1. Asegurarse de que PostgreSQL está en ejecución y que el schema ya se aplicó.
2. En `backend/.env` definir `ADMIN_PASSWORD` (no versionar ese archivo).
3. Ejecutar:

```bash
cd backend
npm install
npm run seed:admin
```

El script crea o actualiza:

- name: `Administrador`
- email: `admin@mesapartes.local`
- role: `ADMIN`

La contraseña se hashea con bcryptjs y no se guarda en texto plano en el repositorio.

Si en una etapa anterior quedó `admin@local.test`, ya no se usa. Se puede borrar a mano si se desea limpiar la tabla.

## Backend

```bash
cd backend
cp .env.example .env
```

Ajustar `DATABASE_URL` en `backend/.env` para apuntar a `localhost:5432`.

```bash
npm install
npm run dev
```

El API queda en `http://localhost:3000`.

Comprobar salud y conexión a PostgreSQL:

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{"status":"ok","database":"connected"}
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

La página inicial queda en `http://localhost:5173`.

Frontend y backend se ejecutan por separado.

## Iniciar sesión

La vista de inicio de sesión está disponible en `http://localhost:5173/login`.
El backend expone `POST /api/auth/login`, compara la contraseña con bcryptjs y
devuelve un JWT firmado con `JWT_SECRET`. El frontend guarda el token y los
datos básicos del usuario en `localStorage`.

Para probar como USER, registra primero un usuario desde `/register` y luego
inicia sesión con ese correo y contraseña. El usuario será enviado a
`/dashboard`.

Para probar como ADMIN, ejecuta previamente `npm run seed:admin` con
`ADMIN_PASSWORD` configurada en `backend/.env`, y utiliza el correo
`admin@mesapartes.local`. El usuario será enviado a `/admin`.

Los botones de cierre de sesión eliminan `token` y `user` de `localStorage` y
envían al usuario a `/login`.

## Registrar un documento

Solo un usuario con rol `USER` y una sesión activa puede registrar documentos
desde `http://localhost:5173/documents/new`.

El formulario envía `subject`, `document_type`, `description` y el campo
`file` como `multipart/form-data` a `POST /api/documents`. El archivo debe ser
PDF, no superar los 10 MB y se guarda en `backend/uploads/`. PostgreSQL guarda
únicamente la ruta relativa del archivo, junto con el usuario autenticado,
los datos del documento, el código de seguimiento y el estado inicial
`RECIBIDO`.

El dashboard de usuario consulta únicamente sus documentos y permite abrir el
detalle y el PDF. La ruta pública `/track` consulta un código de seguimiento
sin requerir autenticación y no muestra datos personales ni rutas internas.

El administrador puede consultar todos los documentos desde `/admin`, abrir el
detalle administrativo y actualizar el estado con una observación. Los estados
permitidos son `RECIBIDO`, `EN_REVISION`, `ATENDIDO` y `RECHAZADO`.

El detalle ciudadano y el detalle administrativo muestran el historial de
estados en orden cronológico. Cada documento comienza con una entrada
`RECIBIDO`; cada cambio administrativo agrega una nueva entrada sin borrar las
anteriores.

El panel `/admin` también muestra estadísticas simples por estado. El sistema
registra en `audit_logs` únicamente las acciones `REGISTER`, `LOGIN`,
`CREATE_DOCUMENT`, `UPDATE_DOCUMENT_STATUS` y `DOWNLOAD_DOCUMENT`, sin guardar
contraseñas ni tokens.
