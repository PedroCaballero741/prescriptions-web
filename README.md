# Prescriptions Web (Frontend)

Frontend del sistema de prescripciones con vistas separadas para **doctor**, **patient** y **admin**.

## Stack

- Next.js
- React + TypeScript
- TailwindCSS

## Requisitos

- Node.js 20+
- npm 10+

## Variables de entorno

Crear archivo `.env.local` en la raíz de este repo (`prescriptions-web/`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Instalación

Desde la raíz de `prescriptions-web`:

```bash
npm install
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Páginas mínimas esperadas

- `/login`
- `/doctor/prescriptions`
- `/doctor/prescriptions/new`
- `/doctor/prescriptions/[id]`
- `/patient/prescriptions`
- `/patient/prescriptions/[id]`
- `/admin`

## Reglas funcionales clave

- Protección de rutas por rol.
- Manejo de sesión con access/refresh token.
- Estados UX: loading, error, vacío.
- Toasts para acciones críticas.
- Filtros persistidos en querystring.

## Integración con API

Este frontend consume la API del repo backend (`prescriptions-api`):

- Auth: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/profile`
- Médico: `/prescriptions` (CRUD de emisión y listados con filtros en query)
- Paciente: `/me/prescriptions`, consume, PDF
- Admin: `/admin/metrics`, `/admin/prescriptions`, `/users`, directorios `/patients` y `/doctors` según pantalla

### Despliegue

Tras publicar front y API, conviene indicar aquí las URLs públicas (por ejemplo Vercel + Railway/Render).

Ejemplo de plantilla:

- Front: `https://…`
- API: `https://…`
