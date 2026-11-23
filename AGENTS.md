# Fundcast Frontend: guía para agentes

Cliente web y móvil (Expo SDK 58, React Native, Expo Router, TypeScript) de Startup Funding API, que estima el monto en USD de una ronda de financiación. Trabajo final de la materia de IA. El backend vive en [EgosPWD/fundcast-api](https://github.com/EgosPWD/fundcast-api), normalmente clonado en `../fundcast-api`.

- Idioma: documentos, commits, PR y textos de la interfaz en español; código, identificadores y comentarios en inglés.

## Comandos

```bash
npm test               # jest (preset jest-expo) + @testing-library/react-native
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npm run gen:api        # regenera src/api/schema.ts desde ../fundcast-api/docs/openapi.json
npx expo install <pkg> # para agregar dependencias: resuelve versiones compatibles con el SDK
```

Antes de cada commit: `npm test`, `npm run typecheck` y `npm run lint`.

## Estructura

- `src/app/`: rutas de Expo Router. Cada archivo es una pantalla; las pantallas solo montan un componente de `src/features/`. `(app)/_layout.tsx` protege las pestañas con `Tabs.Protected` (la de entrenamiento solo para admin).
- `src/features/<feature>/`: lógica y componentes de cada función (`predict`, `history`, `metrics`, `training`).
- `src/api/`: `client.ts` (`apiRequest`, `ApiError`), `types.ts` (alias de tipos) y `schema.ts` (generado).
- `src/auth/`: sesión y almacenamiento del token (`token-storage.ts` con SecureStore, `.web.ts` con localStorage).
- Pruebas en `__tests__/`, **nunca dentro de `src/app/`** (ahí cada archivo sería una ruta).

## Contrato con la API

- Fuente de verdad: `docs/openapi.json` del backend. No inventes rutas ni campos.
- `src/api/schema.ts` es generado: no se edita a mano, se regenera con `npm run gen:api` cuando cambia el backend. Usa los alias de `src/api/types.ts`.
- Todas las llamadas pasan por `apiRequest`. Los errores llegan como `ApiError` con `status` y `detail`; muestra el `detail` del backend.
- Un 401 de una petición con token cierra la sesión (`setUnauthorizedHandler` en `src/auth/session.tsx`).
- Las categorías del formulario de predicción vienen de `GET /options` y se envían tal cual: el modelo compara el texto exacto.
- URL base: `EXPO_PUBLIC_API_URL`. Se incrusta en el bundle al construir: **nunca pongas secretos en `EXPO_PUBLIC_*`**. El origen del cliente debe estar en `CORS_ORIGINS` del backend.

## Pruebas

- En RNTL 14, `render` y `fireEvent` son asíncronos: siempre con `await`.
- Las variables que usa una fábrica de `jest.mock` deben empezar con `mock`.
- `fetch` se simula en cada prueba (`globalThis.fetch = jest.fn(...)`); las pruebas no llaman al backend real.

## Expo

Expo cambia mucho entre SDK: antes de usar una API de Expo o React Native, consulta la documentación de la versión instalada (`https://docs.expo.dev/versions/v58.0.0/`, o el índice `https://docs.expo.dev/llms.txt`), no la memoria.
- Navegación solo con Expo Router (`Link`, `router`, `useLocalSearchParams` desde `expo-router`).
- No existen `ios/` ni `android/`: se generan (Continuous Native Generation). La configuración nativa va en `app.json`.

## Seguridad

- `.env` nunca va en git.
- No guardes contraseñas: solo el token, que se borra al cerrar sesión o al recibir un 401.

## Docker

`Dockerfile` en dos etapas: `npx expo export --platform web` (`web.output: "static"`) y nginx sirve los archivos en el puerto 80.
```bash
docker build --build-arg EXPO_PUBLIC_API_URL=http://localhost:8000 -t fundcast-frontend .
docker run --rm -p 8080:80 fundcast-frontend
```

## Git

- Git Flow: `main` (entregas, sin commits directos), `develop` (integración), `feature/<nombre>` desde `develop` con PR a `develop`, `release/<versión>` (merge a `main` con tag `vX.Y.Z` y de vuelta a `develop`), `hotfix/<nombre>` desde `main`.
- Conventional Commits: `<tipo>(<alcance>): <descripción en español, imperativo, minúscula>`, por ejemplo `fix(predict): muestra el detalle de un error 422`. Cada commit lleva su código con sus pruebas.
- Sin atribuciones de IA (`Co-Authored-By` u otras).
- PR con título y descripción en español. PR Agent (`.github/workflows/pr-agent.yml`, secreto `OPENAI_KEY`) revisa cada PR automáticamente; también responde a `/review`, `/describe` y `/improve` en un comentario. Los hallazgos válidos se corrigen y se responden antes de fusionar.
- Un PR que depende de un cambio del contrato se fusiona después del PR del backend.
