# Fundcast — cliente web y móvil

Cliente de la API de Fundcast, que estima el monto de una ronda de financiación de una startup a partir de sus características. Está hecho con Expo y Expo Router: corre en web (exportado como sitio estático y servido con nginx) y en iOS/Android.

Backend: [fundcast-api](https://github.com/EgosPWD/fundcast-api).

## Funcionalidades

| Pantalla | Ruta | Qué hace |
| --- | --- | --- |
| Inicio de sesión | `/sign-in` | Acceso con correo y contraseña |
| Registro | `/register` | Alta de una cuenta nueva |
| Predecir | `/predict` | Formulario para estimar el monto de una ronda (pantalla inicial tras iniciar sesión) |
| Historial | `/history` | Predicciones realizadas por el usuario |
| Métricas | `/metrics` | Métricas del modelo activo |
| Entrenamiento | `/training` | Carga de datos y reentrenamiento del modelo. **Solo administradores** |

La sesión se guarda en el llavero del sistema (`expo-secure-store`) en móvil y en `localStorage` en web.

## Stack

| Pieza | Versión |
| --- | --- |
| Expo SDK | ~58 |
| React Native | 0.88.1 |
| React / React DOM | 19.3.0 |
| Expo Router | ~58 (rutas tipadas, React Compiler activado) |
| react-native-web | ~0.21 |
| TypeScript | ~6.0 |
| Jest + jest-expo + Testing Library (React Native) | Jest ~30.5, Testing Library ^14.1 |
| ESLint (eslint-config-expo) | ^9 |
| nginx (imagen de producción) | 1.27-alpine |

## Requisitos

- Node.js 22 (la versión que usa el `Dockerfile`) y npm.
- La API `fundcast-api` corriendo y accesible (por defecto en `http://localhost:8000`).
- Docker, solo si vas a construir la imagen.

## Variables de entorno

| Variable | Para qué sirve | Local | Producción |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base de la API que llama la app | `http://localhost:8000` | `https://api.tu-dominio.com` |

- Si no se define, el cliente usa `http://localhost:8000` (ver `src/api/client.ts`). La barra final se elimina.
- Se lee **en tiempo de compilación**: Expo incrusta los valores `EXPO_PUBLIC_*` en el bundle de JavaScript. En desarrollo, reinicia `expo start` después de cambiarla; en Docker se pasa como `--build-arg` y cambiarla exige **reconstruir** la imagen (reiniciar el contenedor no basta).
- Todo lo que empieza por `EXPO_PUBLIC_` termina en el navegador del usuario: **nunca pongas secretos ahí**.

## Puesta en marcha en desarrollo

```bash
git clone https://github.com/EgosPWD/fundcast-frontend.git
cd fundcast-frontend
npm install
echo "EXPO_PUBLIC_API_URL=http://localhost:8000" > .env   # ajusta la URL si la API no está en localhost:8000
npm run web            # abre la app web en http://localhost:8081
```

Para móvil, `npm start` (`expo start`) muestra un QR para Expo Go; también puedes usar `npm run android` o `npm run ios`. En un dispositivo físico, `localhost` apunta al propio teléfono: usa la IP de tu máquina en `EXPO_PUBLIC_API_URL` (por ejemplo `http://192.168.1.20:8000`).

## Docker

El `Dockerfile` tiene dos etapas:

1. **build** (`node:22-alpine`): `npm ci`, recibe `EXPO_PUBLIC_API_URL` como argumento de compilación (por defecto `http://localhost:8000`) y ejecuta `npx expo export --platform web`, que genera el sitio estático en `dist/`.
2. **runtime** (`nginx:1.27-alpine`): copia `dist/` a `/usr/share/nginx/html` y lo sirve en el puerto 80 con `nginx.conf`.

`nginx.conf` resuelve cada ruta a su HTML (`/predict` → `predict.html`, con `/index.html` como respaldo) y cachea `/_expo/` durante un año, porque esos bundles llevan hash. nginx **no hace de proxy** de la API: el navegador llama directamente a `EXPO_PUBLIC_API_URL`.

```bash
# Construir (la URL de la API queda fija en la imagen)
docker build --build-arg EXPO_PUBLIC_API_URL=http://localhost:8000 -t fundcast-frontend .

# Ejecutar en http://localhost:8080
docker run -d --rm --name fundcast-frontend -p 8080:80 fundcast-frontend
```

`.dockerignore` excluye `node_modules`, `dist`, `.env` y los `*.md`, así que el `.env` local **no** entra en la imagen: la URL solo llega por `--build-arg`.

## Ejecutar junto al backend

Este repositorio no tiene `docker-compose.yml`; el compose vive en `fundcast-api` y levanta la base de datos y la API.

1. Levanta el backend (detalles en su README):

   ```bash
   git clone https://github.com/EgosPWD/fundcast-api.git
   cd fundcast-api
   cp .env.example .env   # cambia DB_PASSWORD, JWT_SECRET y ADMIN_PASSWORD
   docker compose up -d --build
   ```

   La API queda en `http://localhost:8000` (documentación en `/docs`). Para otro puerto del host: `API_PORT=8001 docker compose up -d`.

2. Revisa `CORS_ORIGINS` en el `.env` del backend. Debe incluir el origen desde el que se abre la web. El ejemplo ya trae `http://localhost:8081` (Expo en desarrollo) y `http://localhost:8080` (contenedor nginx); en producción añade tu dominio, por ejemplo `https://app.tu-dominio.com`. Si lo cambias, reinicia la API.

3. Construye y ejecuta el frontend apuntando a esa API:

   ```bash
   cd ../fundcast-frontend
   docker build --build-arg EXPO_PUBLIC_API_URL=http://localhost:8000 -t fundcast-frontend .
   docker run -d --rm --name fundcast-frontend -p 8080:80 fundcast-frontend
   ```

4. Abre <http://localhost:8080> e inicia sesión. La cuenta de administrador es la de `ADMIN_EMAIL` / `ADMIN_PASSWORD` del backend.

Si cambiaste `API_PORT`, usa ese puerto en `EXPO_PUBLIC_API_URL` y reconstruye la imagen.

## Scripts disponibles

| Script | Comando | Qué hace |
| --- | --- | --- |
| `npm start` | `expo start` | Servidor de desarrollo (Expo Go, web y emuladores) |
| `npm run web` | `expo start --web` | Desarrollo en el navegador |
| `npm run android` | `expo start --android` | Desarrollo en Android |
| `npm run ios` | `expo start --ios` | Desarrollo en iOS |
| `npm run lint` | `expo lint` | ESLint con la configuración de Expo |
| `npm test` | `jest` | Pruebas unitarias y de pantallas |
| `npm run typecheck` | `tsc --noEmit` | Comprobación de tipos |
| `npm run gen:api` | `openapi-typescript` | Regenera `src/api/schema.ts` desde el contrato del backend |

## Pruebas y calidad

```bash
npm test
npm run typecheck
npm run lint
```

Las pruebas están en `__tests__/`, organizadas por área (`api`, `auth`, `components`, `history`, `lib`, `metrics`, `predict`, `training`). En los pull requests, el flujo `.github/workflows/pr-agent.yml` ejecuta una revisión automática con PR Agent.

## Estructura del proyecto

```text
src/
├── app/          rutas de Expo Router: sign-in, register y el grupo (app) con las pestañas
├── api/          cliente HTTP, endpoints de autenticación, tipos y schema.ts generado
├── auth/         sesión, lectura del JWT y almacenamiento del token (nativo y web)
├── features/     una carpeta por pantalla: predict, history, metrics, training
├── components/   componentes de interfaz compartidos
├── constants/    tema (colores, espaciados)
├── hooks/        hooks de tema y esquema de color
└── lib/          utilidades de formato
```

## Contrato con la API

- `src/api/schema.ts` se **genera** desde `docs/openapi.json` del backend con `npm run gen:api`. El script espera el backend clonado junto a este repositorio, en `../fundcast-api`. No lo edites a mano: regenéralo cuando cambie el contrato.
- `src/api/client.ts` envuelve `fetch`: añade `Authorization: Bearer <token>` y convierte cualquier error en un `ApiError` con el código HTTP y el `detail` de la API, que las pantallas muestran tal cual.
- Si una petición autenticada recibe un **401** (token expirado o inválido), la sesión se cierra y la app vuelve al inicio de sesión.
- Si el servidor no responde, el error es `No se pudo conectar con el servidor`.

## Solución de problemas

**Error de CORS en la consola del navegador.** El origen de la web (por ejemplo `http://localhost:8080` o tu dominio de producción) no está en `CORS_ORIGINS` del backend. Añádelo y reinicia la API.

**En producción la app llama a `http://localhost:8000`.** La imagen se construyó sin `--build-arg EXPO_PUBLIC_API_URL=...` y tomó el valor por defecto. Reconstruye la imagen con la URL correcta; reiniciar el contenedor no cambia el bundle.

**"No se pudo conectar con el servidor".** La API no está corriendo, la URL o el puerto de `EXPO_PUBLIC_API_URL` no son los correctos, o el navegador bloqueó la petición (CORS, o contenido mixto al llamar a `http://` desde una página `https://`). Comprueba que `<EXPO_PUBLIC_API_URL>/docs` abre en el navegador.
