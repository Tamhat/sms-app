# 🎓 Student Management System — Registry Module

**PEN Global (concern of PEN Group) | Technical Assessment**  
**Tech Stack:** Next.js (App Router) · PostgreSQL · Prisma ORM · Tailwind CSS

---

## 📌 Project Overview

This application is a focused Registry Module designed for Registry Administrators and Students in an educational institution. It implements the four core operational workflows of a Student Management System (SMS):

1. **Student Enrolment:** Manage student records with auto-generated unique Student IDs (`SMS-YYYY-SEQ`), status tracking, and instant fee initialization.
2. **Fees & Payments:** Track tuition fees by programme, record transaction ledgers, compute real-time balances, and flag overdue accounts automatically.
3. **Assessment Submission:** Allow staff to create module assessments with deadlines and students to upload coursework files (`.pdf`, `.docx`) with resubmission support and late submission detection.
4. **Marksheet & Results:** Tutors enter numerical grades ($0-100$), auto-categorize academic classifications (Pass $\ge 40$, Merit $\ge 60$, Distinction $\ge 70$), add feedback, and publish/withhold marks per student.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- PostgreSQL database instance (local or hosted e.g. Supabase / Neon / Railway)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd sms-app
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` with your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sms_db?schema=public"
```

### 3. Database Migration & Seeding
Run Prisma migrations to setup the schema and populate demo data:
```bash
# Push schema to database
npx prisma db push

# Seed the database with demo data
npx prisma db seed
```

The seed script loads:
- **3 Programmes:** BSc Computer Science (£9,250), BA Business Administration (£8,500), MSc Data Science (£11,000)
- **7 Students:** Fully populated across various enrolment statuses (Enrolled, Deferred, Withdrawn, Completed)
- **Fee Accounts & Payments:** Sample payment ledger entries and simulated overdue fee balances
- **3 Assessments & Submissions:** Sample coursework submissions with late indicators
- **Grades & Feedback:** Sample results (Published & Withheld states)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Role Separation & Authentication

For convenience during assessment review, authentication is simplified into an instant **Role Selector**:
- **Registry Staff View (`/staff/dashboard`):** Full administrative controls across all 4 modules.
- **Student View (`/student/dashboard`):** Personalized student portal for viewing fee statements, submitting assignments, and checking published grades.

---

## 💡 Key Technical & Product Decisions

| Feature / Domain | Strategic Product Decision & Edge Case Handling |
| :--- | :--- |
| **Auto Student ID** | Generated dynamically using current calendar year and sequence padding (e.g. `SMS-2025-0001`). Prevent collisions via database constraints. |
| **Fee Ledger Immutability** | Programme fees automatically populate fee records upon enrolment. Payments subtract from outstanding balances and cannot exceed remaining balance. Overdue status is calculated dynamically based on due date vs balance. |
| **Submission Rules** | Enforces 1 submission per student per assessment while allowing unlimited resubmissions **before** deadline. Late submissions past the deadline are accepted but visually flagged as `Late` with timestamp tracking. |
| **Grades & Publication** | Classifications (Pass $\ge 40$, Merit $\ge 60$, Distinction $\ge 70$) are computed server-side. Results remain strictly hidden from student views until explicitly set to `isPublished: true` by staff. |

---

## 🤖 AI Usage & Reflection

As encouraged by the assessment instructions, AI assistance (Claude / Gemini via Antigravity AI Coding Assistant) was utilized during the development of this repository.

### How AI Was Used:
1. **Schema & API Architecture:** Used AI to brainstorm domain models and generate Prisma schema relations (Student $\leftrightarrow$ FeeRecord $\leftrightarrow$ Payment $\leftrightarrow$ Submission $\leftrightarrow$ Grade).
2. **UI Component Design:** Leveraged AI to generate modern dark-mode component styling guidelines, layout scaffolding, and badge visual indicators.
3. **Edge Case Spotting:** Prompted AI specifically for registry edge cases (e.g. handling fee overpayment validation, late submission detection, score reset logic when re-grading published marks).

### Human Ownership & Verification:
- **Data Model Validation:** Reviewed and adjusted decimal precision (`Decimal(10,2)`) in Prisma schema for monetary accuracy.
- **Business Logic Rules:** Manually verified and tested score boundary checks ($0-100$) and publication toggle guards in Next.js API routes.
- **Verification:** Ran end-to-end local testing across staff and student flows to ensure data persistence and real-time calculation accuracy.

---

## 📂 Repository Structure

```
sms-app/
├── app/
│   ├── api/             # Next.js App Router API Routes
│   │   ├── assessments/ # GET, POST, PATCH, DELETE assessments
│   │   ├── dashboard/   # Aggregate stats API
│   │   ├── fees/        # Fee calculation & ledger API
│   │   ├── grades/      # Grade entry & publish API
│   │   ├── payments/    # Payment transaction recording API
│   │   ├── students/    # Enrolment & search API
│   │   └── submissions/ # Coursework upload & late detection API
│   ├── staff/           # Registry Administrator Views
│   └── student/         # Student Portal Views
├── prisma/
│   ├── schema.prisma    # PostgreSQL Prisma Database Schema
│   └── seed.ts          # Comprehensive Demo Data Seed Script
├── lib/
│   ├── prisma.ts        # Prisma Client singleton instance
│   └── utils.ts         # Formatting & classification utilities
└── README.md
```
