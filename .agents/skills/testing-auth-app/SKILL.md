---
name: testing-auth-app
description: How to run and end-to-end test the Authentication-Backend express API and the React/Vite frontend locally (Mongo provisioning, .env, Base_URL override, known UI quirks).
---

# Testing the Authentication-Backend app locally

## Services
- Backend: `cd backend && node server.js` (or `npm start` → nodemon). Express on **:5000**.
  `server.js` is the entrypoint (dotenv + `mongoose.connect(process.env.MONGO_URI)` + `app.listen`);
  `app.js` only exports the app, so importing `app.js` never opens a DB connection or a port.
  Success log lines to look for: `server is running on port 5000` and `mongodb connected successfully...`.
- Frontend: `cd frontend && npm run dev` → vite on **:5173**. Node 20.18 prints a "Vite requires 20.19+"
  warning but works.
- CORS in `app.js` only allows origin `http://localhost:5173`, so serve the UI from exactly that port.

## MongoDB
There is usually no Mongo on the box. Fastest provisioning:
```
docker run -d --name testmongo -p 27017:27017 mongo:7
```
Then create `backend/.env` (gitignored — never commit):
```
MONGO_URI=mongodb://127.0.0.1:27017/authtest
JWT_SECRET_KEY=some-test-secret
```
Inspect data with: `docker exec testmongo mongosh authtest --quiet --eval 'db.signups.find()'`
(the user collection is `signups`, from `userModel.js`).
Without `MONGO_URI`, DB routes fail with `Operation 'signups.findOne()' buffering timed out after 10000ms`
(HTTP 500) — that error string is the tell-tale sign of a missing/unreachable Mongo.

## Frontend API base URL
`frontend/src/Utils/index.jsx` **hardcodes** `Base_URL="https://first-frontend-connect.vercel.app/"`
(no env override). To test the UI against the local backend, temporarily change it to
`http://localhost:5000/` and revert before finishing (`git checkout frontend/src/Utils/index.jsx`).
The deployed Vercel backend may be up (`GET /` → `"hello"`) while its database is not — always probe
`POST /api/v1/signup` against it before assuming the deployed path works.

## UI paths
`/` redirects to `/signup`. Signup form: First Name, Last Name, Email, Password → "Sign Up" button.
`/login`: Email, Password → "Login". Links switch between the two pages.

Expected messages:
- Signup OK → green `Signup successful 🎉` and the form clears (201).
- Signup with an existing email → red `Email already exists..` (409).
- Login OK → 200 `{"message":"Login successful","token":"<jwt>"}`.
- Login bad password → 401 `{"message":"Invalid email or password"}`.

**Known bug:** `Login.jsx` keeps `error`/`success` state but never renders it, so the login page shows
no visible feedback at all. Verify login outcomes via DevTools Network/Console, not the page. If this
is ever fixed, expect the same green/red paragraphs as on Signup.

**Gotcha:** after a success/error paragraph appears, the card grows and all form fields shift ~13px
down. Re-screenshot before clicking again or you will hit the wrong element.

## Test suites
`npm test` / `npm run test:coverage` in both `backend/` and `frontend/` (Vitest).
Baseline at master `c2c45f2`: backend 31 tests, frontend 22 tests, 100% coverage in both.

## Devin Secrets Needed
None. A local Mongo + a self-chosen `JWT_SECRET_KEY` are sufficient; no production credentials required.
