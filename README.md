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
