# Loan Management System

A full-stack loan management workflow system built with **Node.js**, **Express**, **MongoDB** for the backend, and **Next.js**, **React**, **TailwindCSS** for the frontend.

This project covers the full loan lifecycle:
- Authentication and role-based access
- Lead / application tracking
- Loan sanction and disbursement
- Installment generation
- Payment collection
- Document upload and verification

## Tech Stack

**Backend:**
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Auth:** JWT
- **File Uploads:** Multer

**Frontend:**
- **Framework:** Next.js
- **Library:** React
- **Language:** TypeScript
- **Styling:** TailwindCSS

## Project Structure

```text
.
├── backend/            # Express REST API
│   ├── src/            # Source code (controllers, routes, services, models)
│   ├── .env.example    # Backend environment variables template
│   └── package.json    # Backend dependencies
├── frontend/           # Next.js web application
│   ├── src/            # Next.js source code (app router, components, contexts)
│   ├── .env.local      # Frontend environment variables
│   └── package.json    # Frontend dependencies
└── .env.example        # Combined environment variables template for reference
```

## Setup Instructions

### 1. Environment Configuration

We have a combined `.env.example` at the root of the project that you can use as a reference.

**Backend (`backend/.env`)**
Create a `.env` file in the `backend/` directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/loan-management
# Or use MongoDB Atlas: MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=change_this_to_a_long_random_secret
```

**Frontend (`frontend/.env.local`)**
Create an `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. Backend Setup

Navigate to the backend directory, install dependencies, and start the development server:

```bash
cd backend
npm install
npm run dev
```

*Optional but recommended: Seed demo data (roles, sample users, workflow data)*
```bash
npm run seed
```
*Note: Seed login accounts use the password: `password123`*

### 3. Frontend Setup

Navigate to the frontend directory, install dependencies, and start the Next.js development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be accessible at `http://localhost:3000`.

## Features

- **Role-Based Access Control (RBAC)**: Secure access with 6 distinct roles.
- **Full Loan Lifecycle Management**: Tracks applications from Lead -> Sanction -> Disbursal -> Closure.
- **Multi-Step Borrower Application**: Step-by-step application flow (Personal Info -> Configuration -> Documents).
- **Dedicated Team Dashboards**: Specific UI views for Sales, Sanction, Disbursement, and Collection teams.
- **Automated Installment Generation**: Automatically generates EMI schedules for sanctioned loans.
- **Payment Tracking**: Records full and partial payments using UTR numbers.
- **Document Verification**: Secure file uploads and admin verification.

## UI Endpoints

**Public / Auth Routes:**
- `/login` - User login portal
- `/signup` - Borrower registration

**Borrower Routes:**
- `/apply/personal` - Update personal & employment details
- `/apply/configure` - Set requested loan amount and tenure
- `/apply/documents` - Upload required documents (e.g., PAN, Salary Slip)
- `/apply/status` - Check current loan application status

**Staff Dashboards:**
- `/dashboard` - Main dashboard / Admin overview
- `/dashboard/sales` - Manage new leads and convert to loans
- `/dashboard/sanction` - Approve/reject loans and generate installments
- `/dashboard/disbursement` - Mark loans as disbursed
- `/dashboard/collection` - View outstanding amounts and record payments

## Roles and Responsibilities

1. **Borrower**: Signs up, submits loan applications, uploads required documents, and tracks their application status.
2. **Sales**: Reviews new borrower leads, verifies details, assigns leads, and converts them into formal Loan records.
3. **Sanction**: Evaluates converted loans, decides whether to approve or reject them based on eligibility, and generates the installment schedule.
4. **Disbursement**: Reviews sanctioned loans and marks them as disbursed once funds are transferred.
5. **Collection**: Monitors active loans, checks outstanding installments, and logs received payments.
6. **Admin**: Oversees the system and verifies uploaded borrower documents.

## Seed Accounts for Testing

If you run `npm run seed` in the backend, the database will be pre-populated with test accounts for each role.

**Password for all seed accounts:** `password123`

| Role | Email |
| :--- | :--- |
| Admin | `admin@lms.com` |
| Sales | `sales@lms.com` |
| Sanction | `sanction@lms.com` |
| Disbursement | `disbursement@lms.com` |
| Collection | `collection@lms.com` |
| Borrower | `borrower@lms.com` |

## Loan Workflow Summary

The intended step-by-step flow across the application is:

1. **Borrower** registers and creates a lead/application, uploading necessary documents.
2. **Sales** reviews and assigns the lead. Once verified, they convert it to a Loan.
3. **Sanction** reviews the loan application and approves or rejects it. If approved, an installment schedule is generated.
4. **Disbursement** marks the loan as disbursed and funds are released.
5. **Collection** tracks installments and records payments based on UTR numbers.
6. When the total paid reaches the required repayment amount, the loan is automatically closed.
