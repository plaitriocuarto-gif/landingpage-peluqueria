# Turnero Peluquería

Sistema completo de turnos para peluquerías con panel de administración, gestión de empleados, horarios y reservas online.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: SQLite (better-sqlite3, sin servidor externo)
- **Auth**: JWT + bcryptjs

## Instalación

### 1. Clonar / descomprimir el proyecto

```bash
cd "Turnero peluquerias"
```

### 2. Instalar todas las dependencias

```bash
npm run install:all
```

Este comando instala las dependencias de la raíz, del servidor y del cliente.

### 3. Configurar variables de entorno

El archivo `.env` ya está creado con valores de desarrollo. Para producción, editar `.env`:

```env
JWT_SECRET=cambia_esto_por_algo_largo_y_seguro
SETUP_SECRET=tu_clave_para_crear_admin
PORT=3001
```

### 4. Poblar la base de datos (seed)

```bash
npm run seed
```

Esto crea:
- Admin: `admin@peluqueria.com` / `admin123`
- Cliente: `cliente@peluqueria.com` / `cliente123`
- 2 empleados (Juan García y María López) con horarios Lun–Sáb
- 3 servicios: Corte ($800), Barba ($500), Corte+Barba ($1200)

### 5. Iniciar en modo desarrollo

```bash
npm run dev
```

Levanta:
- **Servidor**: http://localhost:3001
- **Cliente**: http://localhost:5173

---

## Uso por primera vez

1. Abrí http://localhost:5173
2. Iniciá sesión como admin: `admin@peluqueria.com` / `admin123`
3. Entrás directo al Dashboard de administración
4. Podés crear más empleados en **Empleados**, editar horarios en **Horarios** y agregar servicios en **Servicios**
5. Para probar el flujo de cliente, usá `cliente@peluqueria.com` / `cliente123` o registrá una nueva cuenta

---

## Roles

| Rol | Acceso |
|-----|--------|
| `admin` | Dashboard completo, CRUD de empleados/servicios/horarios, todos los turnos |
| `staff` | Solo su agenda semanal (vista de calendario) |
| `cliente` | Reservar turnos, ver y cancelar los propios |

---

## Crear un admin adicional via API

```bash
curl -X POST http://localhost:3001/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"nuevo@admin.com","password":"segura123","nombre":"Nuevo Admin","setupSecret":"mi_clave_secreta_para_crear_admin"}'
```

---

## Estructura del proyecto

```
Turnero peluquerias/
├── package.json          # Script raíz con concurrently
├── .env                  # Variables de entorno
├── server/
│   ├── src/
│   │   ├── db/           # SQLite setup + schema + seed
│   │   ├── middleware/   # Auth JWT
│   │   ├── routes/       # auth, staff, services, appointments, config
│   │   └── index.ts      # Express app
│   └── data/             # Base de datos SQLite (se crea automáticamente)
└── client/
    └── src/
        ├── api/          # Funciones HTTP por recurso
        ├── contexts/     # Auth, Toast, Config
        ├── components/   # UI y layout reutilizables
        ├── pages/        # Landing, Login, Register, Booking, admin/*, staff/*
        └── types/        # Tipos TypeScript compartidos
```

---

## API Reference

### Auth
- `POST /api/auth/register` — registro cliente
- `POST /api/auth/login` — login (devuelve JWT)
- `POST /api/auth/register-admin` — crear admin (requiere SETUP_SECRET)
- `GET /api/auth/me` — perfil actual (requiere token)

### Empleados
- `GET /api/staff` — listar activos (público)
- `POST /api/staff` — crear (admin)
- `PUT /api/staff/:id` — editar (admin)
- `DELETE /api/staff/:id` — desactivar (admin)
- `GET /api/staff/:id/schedule` — ver horario
- `PUT /api/staff/:id/schedule` — editar horario (admin)
- `POST /api/staff/:id/exceptions` — agregar día libre / horario especial (admin)

### Servicios
- `GET /api/services` — listar activos (público)
- `POST /api/services` — crear (admin)
- `PUT /api/services/:id` — editar (admin)
- `DELETE /api/services/:id` — desactivar (admin)

### Turnos
- `GET /api/appointments/available?staffId=&date=&serviceId=` — slots disponibles
- `POST /api/appointments` — reservar (cliente)
- `GET /api/appointments/my` — mis turnos (cliente)
- `DELETE /api/appointments/:id` — cancelar propio (cliente)
- `GET /api/appointments` — todos los turnos con filtros (admin)
- `PUT /api/appointments/:id/status` — cambiar estado (admin)
- `GET /api/appointments/staff` — agenda del staff (staff/admin)

### Configuración
- `GET /api/config` — obtener config del local (público)
- `PUT /api/config` — actualizar config (admin)
