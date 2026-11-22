# Fundcast Frontend: contexto del proyecto

Cliente web (Expo / React Native) de **Startup Funding API**, que estima el monto en USD de una ronda de financiación de una startup.
Es el trabajo final de la materia de IA.
- Idioma de los documentos: español. Código y nombres técnicos: inglés.
- El backend vive en **otro repositorio**: [EgosPWD/fundcast-api](https://github.com/EgosPWD/fundcast-api). Este repo solo consume su API.

## 1. Contrato con la API
- El contrato está en `docs/openapi.json` del backend. Ahí está la fuente de verdad de rutas, campos y códigos; no inventes campos.
- Para la URL base usa `EXPO_PUBLIC_API_URL`. Se incrusta en el bundle al construir, así que **nunca pongas secretos en variables `EXPO_PUBLIC_*`**.
- Autenticación: JWT en el header `Authorization: Bearer <token>`. El token se obtiene con `POST /auth/login`.
- Errores: siempre JSON con la forma `{"detail": "..."}`.

  | Código | Significado |
  |---|---|
  | 401 | sin token o con un token inválido; vuelve al login |
  | 403 | el rol no tiene permiso |
  | 409 | conflicto: email ya registrado o reentrenamiento en curso |
  | 422 | entrada inválida; muestra el `detail` |
  | 503 | no hay un modelo activo |
- El origen del cliente debe estar en `CORS_ORIGINS` del backend (por ejemplo, `http://localhost:8081` en desarrollo).

| Pantalla / función | Endpoint | Rol |
|---|---|---|
| Registro e inicio de sesión | `POST /auth/register`, `POST /auth/login` | público |
| Enviar datos y ver la predicción | `POST /predict` | user, admin |
| Historial de predicciones (paginado) | `GET /predictions?page=&size=` | user (solo las suyas), admin (todas) |
| Métricas del modelo y versiones | `GET /metrics` | user, admin |
| Subir el CSV de entrenamiento | `POST /training-files` (multipart, campo `file`) | admin |
| Reentrenar | `POST /retrain` | admin |

## 2. Flujo de Git (Git Flow)
- `main`: solo versiones estables y entregables. Nunca se hace commit directo.
- `develop`: rama de integración. Todo trabajo nuevo sale de aquí y vuelve aquí.
- `feature/<nombre>`: una por entrega, con un nombre que describa lo que entrega (por ejemplo, `feature/login-screen` o `feature/prediction-form`). Sale de `develop` y vuelve por Pull Request a `develop`.
- `release/<versión>`: sale de `develop` para preparar una entrega. Se fusiona en `main` con el tag `vX.Y.Z` y después de vuelta en `develop`.
- `hotfix/<nombre>`: sale de `main` para corregir algo urgente. Se fusiona en `main` y en `develop`.

### Commits (Conventional Commits)
Formato: `<tipo>(<alcance opcional>): <descripción en español, imperativo, minúscula>`. El `<tipo>` y el alcance van en inglés.
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`, `style`.
- Ejemplos: `feat(auth): agrega la pantalla de inicio de sesión`, `fix(predict): muestra el detalle de un error 422`.
- Commits pequeños y coherentes: cada uno con su código y sus pruebas.
- Sin atribuciones de IA (`Co-Authored-By` u otras) en los mensajes.

### Pull Requests
- Título y descripción **en español**. El título sigue el formato de Conventional Commits.
- **PR Agent** (`.github/workflows/pr-agent.yml`) describe y revisa cada PR de forma automática. Necesita el secreto `OPENAI_KEY` en el repo. También se le puede pedir en un comentario: `/review`, `/describe`, `/improve`.
- Los hallazgos válidos se corrigen, se responde en el hilo y el hilo se resuelve antes de fusionar.

## 3. Seguridad
- `.env` nunca va en git. Las variables públicas del cliente (`EXPO_PUBLIC_*`) no son secretas.
- No guardes contraseñas. Guarda solo el token, y bórralo al cerrar sesión o al recibir un 401.

## 4. Docker
`Dockerfile` en dos etapas: `npx expo export --platform web` genera archivos estáticos (`web.output: "static"`) y nginx los sirve en el puerto 80.
```bash
docker build --build-arg EXPO_PUBLIC_API_URL=http://localhost:8000 -t fundcast-frontend .
docker run --rm -p 8080:80 fundcast-frontend
```

---

# Expo guidelines

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
