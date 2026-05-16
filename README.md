# Sistema de Prescripciones — Frontend

> **English summary** at the [bottom of this file](#english-summary).

Interfaz web del sistema de prescripciones médicas con vistas independientes para **Médico**, **Paciente** y **Admin**. Construida con Next.js 14 (App Router), React y TypeScript.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Características implementadas](#características-implementadas)
3. [Requisitos previos](#requisitos-previos)
4. [Configuración local](#configuración-local)
5. [Variables de entorno](#variables-de-entorno)
6. [Cuentas de prueba](#cuentas-de-prueba)
7. [Ejecución de pruebas](#ejecución-de-pruebas)
8. [Estructura de páginas](#estructura-de-páginas)
9. [Decisiones técnicas](#decisiones-técnicas)
10. [Despliegue](#despliegue)
11. [English Summary](#english-summary)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | CSS personalizado (variables, utilitarios propios) |
| Autenticación | JWT almacenado en `localStorage`, renovación automática con refresh token |
| Notificaciones | `sonner` (toasts) |
| Protección de rutas | Middleware de Next.js + componente `RolePageShell` |
| HTTP client | Wrapper propio (`apiRequest`) con interceptor de refresh automático |

---

## Características implementadas

### Vistas por rol

**Médico**
- Listado de prescripciones propias con filtros por estado, fecha y paciente
- Formulario de nueva prescripción con ítems dinámicos (agregar/eliminar)
- Detalle de prescripción con descarga de PDF
- Perfil profesional: especialidad, firma (texto o imagen) y cédula profesional
- Directorio de pacientes vinculados

**Paciente**
- Bandeja de prescripciones con acciones rápidas (marcar como consumida, descargar PDF)
- Detalle completo de prescripción con lista de medicamentos
- Historial de prescripciones consumidas
- Perfil con datos personales

**Admin**
- Dashboard con métricas globales: totales de doctores, pacientes y prescripciones
- Gráficos de prescripciones por estado y serie temporal de los últimos 30 días
- Directorio completo de prescripciones con filtros avanzados
- Gestión de usuarios: crear, listar y eliminar (soft delete) por rol
- Configuración de la plataforma (nombre, email de soporte, prefijo de código)
- Preferencias de notificación
- Zona de peligro: exportar todos los datos en CSV y limpiar auditoría

### UX/UI
- Responsive: funciona en móvil, tablet y escritorio
- Estados de carga, error y lista vacía en todos los listados
- Toasts para acciones críticas (creación, consumo, errores)
- Filtros persistidos en el query string (recarga sin perder estado)
- Paginación en todos los listados con navegación por páginas
- Protección de rutas por rol con redirección automática

### Plus implementados
- Página pública `/rx/:code` para verificación de prescripciones sin login (ideal para farmacéuticos)
- Subida de imagen de firma y cédula profesional desde el perfil del médico
- Exportación CSV descargable directamente desde el navegador

---

## Requisitos previos

- Node.js 20+
- npm 10+
- La API backend corriendo (ver [prescriptions-api](https://github.com/PedroCaballero741/prescriptions-api))

---

## Configuración local

```bash
# 1. Clonar el repositorio
git clone https://github.com/PedroCaballero741/prescriptions-web.git
cd prescriptions-web

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.local.example .env.local   # o crear el archivo manualmente

# 4. Iniciar en modo desarrollo
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`.

> **Importante:** Asegúrate de tener la API backend corriendo antes de usar el frontend. Ver instrucciones de la API en [prescriptions-api](https://github.com/PedroCaballero741/prescriptions-api).

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# URL base de la API backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

En producción, reemplaza con la URL pública de la API (por ejemplo, la de Render o Railway):

```env
NEXT_PUBLIC_API_BASE_URL=https://tu-api.onrender.com
```

---

## Cuentas de prueba

Estas cuentas son creadas por el seed de la API backend:

| Rol | Email | Contraseña | Acceso |
|---|---|---|---|
| Admin | `admin@test.com` | `admin123` | `/admin` |
| Médico | `dr@test.com` | `dr123` | `/doctor/prescriptions` |
| Paciente | `patient@test.com` | `patient123` | `/patient/prescriptions` |

> Para que existan estas cuentas debes ejecutar `npx prisma db seed` en el proyecto de la API.

---

## Ejecución de pruebas

```bash
# Tests unitarios y de componentes
npm test

# Modo watch
npm run test:watch

# Linting
npm run lint
```

---

## Estructura de páginas

```
app/
├── login/                        # Inicio de sesión
├── rx/[code]/                    # Verificación pública de prescripción (sin login)
├── doctor/
│   ├── prescriptions/            # Listado de prescripciones del médico
│   ├── prescriptions/new/        # Nueva prescripción con ítems dinámicos
│   ├── prescriptions/[id]/       # Detalle y descarga de PDF
│   ├── patients/                 # Directorio de pacientes del médico
│   ├── schedule/                 # Agenda (vista base)
│   └── profile/                  # Perfil: especialidad, firma, cédula
├── patient/
│   ├── prescriptions/            # Bandeja de prescripciones del paciente
│   ├── prescriptions/[id]/       # Detalle de prescripción
│   ├── history/                  # Historial de consumidas
│   └── profile/                  # Perfil del paciente
└── admin/
    ├── prescriptions/            # Todas las prescripciones con filtros
    ├── users/                    # Gestión de usuarios
    └── settings/                 # Configuración y zona de peligro
```

---

## Decisiones técnicas

**Autenticación client-side:** Los tokens se almacenan en `localStorage` y se envían como `Bearer` en el header `Authorization`. El wrapper `apiRequest` detecta respuestas `401`, intenta renovar el access token con el refresh token automáticamente y reintenta la petición original, de manera transparente para el componente.

**Protección de rutas:** El middleware de Next.js intercepta las rutas protegidas y redirige a `/login` si no hay sesión válida. El componente `RolePageShell` verifica adicionalmente el rol del usuario y muestra un error si no coincide, evitando accesos cruzados entre roles.

**Sin librería de estado global:** Se optó por estado local con `useState`/`useEffect` en cada página para mantener el código simple y directo. Los datos de sesión se leen de `localStorage` a través de helpers en `lib/auth.ts`.

**CSS propio sin Tailwind:** Se utiliza un sistema de clases utilitarias propio definido en `globals.css` (`.card`, `.btn`, `.input`, `.stack`, `.badge`, etc.) para mantener consistencia visual sin depender de un framework externo.

**Iconos inline:** Los iconos SVG se definen como paths inline en el componente `Icon` dentro de `components/ui.tsx`, eliminando dependencias de librerías de iconos externas.

---

## Despliegue

| Servicio | URL |
|---|---|
| Frontend | *(añadir tras despliegue en Vercel)* |
| API | *(ver README de `prescriptions-api`)* |

**Pasos para desplegar en Vercel:**

1. Conectar el repositorio en [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Vercel detecta Next.js automáticamente — no se requiere configuración de build
3. Añadir la variable de entorno `NEXT_PUBLIC_API_BASE_URL` con la URL pública de la API
4. Desplegar — cada `git push` a `main` actualiza el despliegue automáticamente

---

## English Summary

### Prescriptions System — Frontend

Web interface for the medical prescriptions system with separate views for **Doctor**, **Patient**, and **Admin**. Built with Next.js 14 (App Router), React, and TypeScript.

**Quick start:**

```bash
git clone https://github.com/PedroCaballero741/prescriptions-web.git
cd prescriptions-web
npm install
# Create .env.local file (see Variables de entorno section above)
npm run dev
# App available at http://localhost:3000
```

**Required environment variable:**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

**Test accounts** (created by the API seed):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@test.com` | `admin123` |
| Doctor | `dr@test.com` | `dr123` |
| Patient | `patient@test.com` | `patient123` |

**Run tests:** `npm test` · `npm run lint`

**Deploy:** Connect the repo to [Vercel](https://vercel.com), set `NEXT_PUBLIC_API_BASE_URL`, and deploy. Every push to `main` triggers an automatic redeployment.
