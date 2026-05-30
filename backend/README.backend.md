# Loan Management System Backend

This is the backend for a loan management workflow built with **Node.js**, **Express**, **TypeScript**, **MongoDB**, and **Mongoose**.

The project covers the full loan lifecycle:

- authentication and role-based access
- lead / application tracking
- loan sanction and disbursement
- installment generation
- payment collection
- document upload and verification
- database seeding for demo users and sample workflow data

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Auth:** JWT
- **File Uploads:** Multer

## Project Structure

```text
src/
  config/        # Environment and database setup
  controllers/   # HTTP request handlers
  middlewares/   # Auth, role checks, uploads, error handling
  models/        # Mongoose schemas and models
  routes/        # Express route definitions
  services/      # Business logic layer
  types/         # Express request type augmentation
  utils/         # Seed script and helper utilities
  server.ts      # App entry point
```

## Scripts

Available npm scripts from [package.json](package.json):

```json
{
  "dev": "npm run build && node dist/server.js",
  "start": "npm run build && node dist/server.js",
  "build": "tsc -p tsconfig.json",
  "seed": "npm run build && node dist/utils/seed.js",
  "typecheck": "tsc --noEmit",
  "test": "npm run typecheck"
}
```

## Environment Variables

Create a [`.env`](.env) file in the backend root.

Required:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=change_this_to_a_long_random_secret
```

Optional:

```env
JWT_EXPIRES_IN=1d
```

Notes:

- The app currently reads `MONGO_URI` from the config layer.
- `JWT_SECRET` is required for authentication.
- `JWT_EXPIRES_IN` is not currently wired into the token generator, but you can keep it for future flexibility.

## Running The Project

Install dependencies first:

```bash
npm install
```

Run the backend in development mode:

```bash
npm run dev
```

Build the TypeScript project:

```bash
npm run build
```

Run the type check:

```bash
npm test
```

Seed demo data:

```bash
npm run seed
```

## API Base

The server mounts routes under `/api`.

Health check:

```http
GET /health
```

## Authentication

JWT auth is used for protected routes.

Send the token in the request header:

```http
Authorization: Bearer <token>
```

## Roles

The system currently uses these roles:

- `Admin`
- `Sales`
- `Sanction`
- `Disbursement`
- `Collection`
- `Borrower`

Role-based middleware is used to restrict routes to the correct team.

## Routes

The API is mounted under `/api`. Each route below shows: method, path, authentication, required role (if any), body/query example, and notes about expected responses.

Important request details
- Base URL: `http://localhost:<PORT>` (default `5000`)
- All protected routes require header: `Authorization: Bearer <token>`
- Token is obtained from `POST /api/auth/login` (see Auth section)

### Auth
Base path: `/api/auth`

- POST `/api/auth/register`
  - Auth: none
  - Role: any (you may register different roles for testing)
  - Body (JSON): `name`, `email`, `password`, optional `role`, `pan`, `dob`, `monthlySalary`, `employmentMode`
  - Response: `201` with `token` and `user` object
  - Notes: password is hashed before storing. See [src/routes/auth.routes.ts](src/routes/auth.routes.ts) and [src/controllers/auth.controller.ts](src/controllers/auth.controller.ts).

- POST `/api/auth/login`
  - Auth: none
  - Body (JSON): `{ "email": "...", "password": "..." }`
  - Response: `200` with `{ token, user }` on success
  - Example curl:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@lms.com","password":"password123"}'
```

- GET `/api/auth/me`
  - Auth: Bearer token
  - Response: `200` with full profile fields (includes `pan`, `dob`, `monthlySalary`, `employmentMode`)

### Applications (Leads)
Base path: `/api/applications`

- POST `/api/applications/leads`
  - Auth: Bearer token (borrower or admin for seed testing)
  - Body: `borrowerId`, `requestedAmount`, `tenure` (in days), `employmentMode` and either `salarySlipUrl` or upload via multipart/form-data (see Document upload section)
  - Response: `201` with created application object
  - Notes: if using file upload, use the Document API or the `salarySlipUrl` pointing to `/uploads/...`.

- PATCH `/api/applications/:id/apply`
  - Auth: Bearer token
  - Role: applicant or Sales depending on config — typically borrower or Sales
  - Path param: `:id` is the application `_id`
  - Response: `200` with updated application status

- PATCH `/api/applications/:id/assign`
  - Auth: Bearer token
  - Role: Sales
  - Body: `{ "assigneeId": "<userId>" }`
  - Response: `200` on success

- PATCH `/api/applications/:id/convert`
  - Auth: Bearer token
  - Role: Sales
  - Converts an approved application into a `Loan` record and returns the loan.

### Loans
Base path: `/api/loans`

- GET `/api/loans`
  - Auth: Bearer token
  - Response: list of loan objects (paginated if implemented)

- POST `/api/loans`
  - Auth: Bearer token
  - Role: Admin/Sales (depends on your usage)
  - Body: loan creation payload (see `Loan` model). Prefer using the application -> convert flow instead.

- GET `/api/loans/:id`
  - Auth: Bearer token
  - Path param: `:id` is loan `_id`
  - Response: single loan object

- PATCH `/api/loans/:id/sanction`
  - Auth: Bearer token
  - Role: `Sanction`
  - Body: `{ "approve": true|false, "reason": "..." }`
  - Response: updated loan object (status changes to `SANCTIONED` or `REJECTED`)

- PATCH `/api/loans/:id/disburse`
  - Auth: Bearer token
  - Role: `Disbursement`
  - Marks loan status to `DISBURSED` and records history

- PATCH `/api/loans/:id/close`
  - Auth: Bearer token
  - Role: any collection/admin actor; this endpoint checks payments and closes the loan if paid in full

### Payments
Base path: `/api/payments`

- POST `/api/payments`
  - Auth: Bearer token
  - Role: `Collection` (route guarded by `requireCollection`)
  - Body (JSON):
    - `loanId` (string) — ObjectId of the loan
    - `utrNumber` (string) — unique transaction reference
    - `amount` (number) — positive
    - `date` (ISO date, optional)
  - Response: `201` with `payment` object (includes `_id`). Use that `_id` with the GET route below.
  - Example:

```bash
curl -X POST http://localhost:5000/api/payments \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"loanId":"<loanId>","utrNumber":"UTR-001","amount":10000}'
```

- GET `/api/payments/loan/:loanId`
  - Auth: Bearer token
  - Returns: `{ payments: [ ... ] }` for the given loan

- GET `/api/payments/:id`
  - Auth: Bearer token
  - `:id` is the payment document `_id` (Mongo ObjectId)
  - Use this after creating a payment or by listing payments for a loan and selecting one `_id`.

### Installments
Base path: `/api/installments`

- POST `/api/installments/loan/:loanId/generate`
  - Auth: Bearer token
  - Role: `Sanction` (scheduled generation normally runs after sanction)
  - Generates installment schedule (EMIs) for the loan — creates `Installment` documents

- GET `/api/installments/loan/:loanId`
  - Auth: Bearer token
  - Returns list of installments for the loan

- GET `/api/installments/loan/:loanId/outstanding`
  - Auth: Bearer token
  - Role: `Collection` for typical use
  - Returns outstanding amounts and next due installment

### Documents
Base path: `/api/documents`

- POST `/api/documents/upload`
  - Auth: Bearer token
  - File uploads handled by Multer and stored under the `/uploads` folder served by `server.ts`.
  - Fields (multipart/form-data):
    - `file` — the file binary
    - `ownerId` — owner user id (borrower)
    - `loanId` — optional loan id
    - `documentType` — enum: `PAN`, `SALARY_SLIP`, etc.
  - Response: created document record `{ _id, ownerId, loanId, documentType, url, verified }`

- GET `/api/documents/loan/:loanId`
  - Auth: Bearer token
  - Returns documents attached to a loan

- GET `/api/documents/owner/:ownerId`
  - Auth: Bearer token
  - Returns documents for a borrower

- PATCH `/api/documents/:id/verify`
  - Auth: Bearer token
  - Role: `Admin` (or whichever role you want to allow verification)
  - Marks document as `verified` and records verifier id and time

### Uploads / file serving
- Uploaded files are saved to the `uploads` folder in project root and served by the server at `/uploads/*` (see [src/server.ts](src/server.ts)). Use `http://localhost:<PORT>/uploads/<path>` to download a file.

### Common status codes and errors
- `400` — bad request (missing/invalid params)
- `401` — unauthorized (missing/invalid token)
- `403` — forbidden (role missing)
- `404` — resource not found
- `409` — conflict (for example duplicate UTR)


### Application Routes

Base path: `/api/applications`

- `POST /leads` - create a lead / application
- `PATCH /:id/apply` - mark an application as applied
- `PATCH /:id/assign` - assign a lead to sales
- `PATCH /:id/convert` - convert an application to a loan

Notes:

- `POST /leads` expects a salary slip file upload or a `salarySlipUrl` in the body.
- `PATCH /:id/assign` and `PATCH /:id/convert` require a Sales role.

### Loan Routes

Base path: `/api/loans`

- `GET /` - list loans
- `POST /` - create loan record
- `GET /:id` - get loan by id
- `PATCH /:id/sanction` - approve or reject a loan
- `PATCH /:id/disburse` - mark a loan as disbursed
- `PATCH /:id/close` - close a loan if fully paid

Example sanction payload:

```json
{
  "approve": true,
  "reason": "Eligible as per BRE"
}
```

### Payment Routes

Base path: `/api/payments`

- `POST /` - record a payment
- `GET /loan/:loanId` - list payments for a loan
- `GET /:id` - get payment by id

Notes:

- `POST /` requires the `Collection` role.
- `utrNumber` must be unique.
- payment amount must be positive.

Example payment payload:

```json
{
  "loanId": "66b...",
  "utrNumber": "UTR123456789",
  "amount": 10000,
  "date": "2026-05-30T00:00:00.000Z"
}
```

### Installment Routes

Base path: `/api/installments`

- `POST /loan/:loanId/generate` - generate installment schedule
- `GET /loan/:loanId` - list installments for a loan
- `GET /loan/:loanId/outstanding` - get outstanding amount

Notes:

- schedule generation requires the `Sanction` role
- outstanding lookup requires the `Collection` role

### Document Routes

Base path: `/api/documents`

- `POST /upload` - upload a document
- `GET /loan/:loanId` - list documents for a loan
- `GET /owner/:ownerId` - list documents for a borrower
- `PATCH /:id/verify` - verify a document

Notes:

- file uploads are handled by Multer
- upload fields are stored under `/uploads`
- `documentType` must match the enum in the `Document` model

Example document upload payload:

```json
{
  "ownerId": "66b...",
  "loanId": "66b...",
  "documentType": "PAN"
}
```

## Seed Data

The seed script resets the seeded collections and creates demo workflow data:

- all role users
- a borrower lead/application
- a loan lifecycle from lead to disbursal
- installment records
- a sample payment
- sample documents

Run it with:

```bash
npm run seed
```

Seed login accounts use the password:

```text
password123
```

## Loan Workflow Summary

The intended flow is:

1. Borrower registers and creates a lead/application.
2. Sales reviews and assigns the lead.
3. Sanction reviews the application and approves or rejects it.
4. Disbursement marks the loan as disbursed.
5. Collection records payments.
6. When total paid reaches the total repayment, the loan closes.

