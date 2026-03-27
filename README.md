# Escarabajos Liga

App de gestión de liga amateur de fútbol +38 para iOS y Android.

## Stack Técnico

- **Mobile**: React Native + Expo (expo-router, SVG, AsyncStorage)
- **Backend**: Node.js + Express + PostgreSQL
- **Deploy**: Render (API + PostgreSQL) + EAS (mobile)

## Funcionalidades

- Tabla de posiciones en tiempo real
- Calendario de jornadas y partidos
- Confirmación de asistencia por jugador
- Alineación visual (cancha SVG con drag & drop)
- Formaciones preset (4-3-3, 4-4-2, 3-5-2)
- Perfil con estadísticas personales (goles, tarjetas)
- Roles: admin, coach, jugador

## Setup Local

### Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tu DATABASE_URL y JWT_SECRET
npm install
npm run db:init   # Inicializa el schema en PostgreSQL
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

La app se conecta al backend via `EXPO_PUBLIC_API_URL`. Por defecto usa `http://localhost:3000`.

## Deploy

### Backend (Render)

1. Conecta el repo a Render
2. El archivo `render.yaml` configura automáticamente el servicio web y la base de datos PostgreSQL
3. Render generará automáticamente el `JWT_SECRET` y conectará `DATABASE_URL`

### Mobile (EAS)

```bash
cd mobile
npx eas build --platform all
npx eas submit
```

## Estructura

```
backend/
  src/
    db/schema.sql       # Schema PostgreSQL
    routes/              # Auth, equipos, jugadores, jornadas, partidos, tabla
    middleware/auth.js   # JWT auth + roles
    index.js             # Express server

mobile/
  app/
    (auth)/login.tsx     # Pantalla de login
    (app)/
      liga/              # Tabla de posiciones + jornadas
      equipo/            # Lista de jugadores del equipo
      partido/           # Próximo partido, asistencia, alineación
      perfil/            # Datos y stats del jugador
  contexts/              # AuthContext (login, logout, token)
  services/api.ts        # Axios client
  constants/colors.ts    # Paleta verde/negro/blanco
```
