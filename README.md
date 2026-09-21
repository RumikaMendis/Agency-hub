# 📊 D & G SFA — Multi-Agency Management Hub

> **Enterprise Sales Force Automation (SFA), Financial P&L, Inventory Control, and Payroll Management Platform**

`D & G SFA` is a comprehensive multi-agency management web application built to streamline operations across agencies (including *Bathipooja*, *Domie*, and *Kelani Cables*). The platform unifies daily sales tracking, credit collection, fuel/fleet management, stock auditing, cheque clearance, and employee payroll into a single real-time executive dashboard.

---

## ✨ Key Features & Modules

### 💼 Executive P&L & Banking
* **Real-time Profit & Loss Tracking**: Monitor gross revenue, operating expenses, and net profit margins across all agency divisions.
* **Banking Reconciliation**: Track bank deposits, cash flows, and daily opening/closing balances.

### 📈 Sales Force Automation (Sales Entry)
* **Daily Sales Entry**: Streamlined sales logs categorized by agency and representative.
* **Target vs. Actual Performance**: Monitor daily, weekly, and monthly sales quotas.

### 💳 Credit Bills & Collection Management
* **Credit Aging Analysis**: Track pending customer credit bills and overdue balances.
* **Payment Collection Logs**: Record cash, cheque, and online bank transfers against open invoices.

### ⛽ Fuel & Logistics Expense Tracking
* **Vehicle Fleet Log**: Monitor fuel consumption, mileage, and maintenance costs per delivery vehicle.
* **Cost Efficiency Analytics**: Analyze fuel cost per sales territory.

### 📦 Stock & Inventory Control
* **Item Master Catalog**: Manage product pricing, SKUs, and stock quantities (`ITEM.xlsx` integration).
* **Inventory Audit**: Real-time stock adjustment, damage logs, and reorder point alerts.

### 📜 Cheque Register & Clearance
* **Post-Dated Cheque (PDC) Tracker**: Manage incoming and outgoing cheques with due-date reminders.
* **Clearance Status**: Record cleared, pending, and bounced cheques.

### 💰 Payroll & Automated Payslip System
* **Salary Calculation**: Compute base salaries, commissions, allowances, and deductions.
* **PDF Payslip Generation**: Automated generation of monthly employee payslips and master pay sheets.

### 📩 Automated Report Dispatch
* **Serverless Email API**: Built-in Vercel serverless functions (`/api/send-email`) for automated dispatch of monthly executive summaries and financial reports.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Modern CSS3 (Custom Properties, Flexbox, Responsive Grid), Vanilla JavaScript (Modular ES6 Architecture).
* **Database & Cloud**: Cloud Firestore (Real-time NoSQL database), Firebase App Hosting & Config.
* **Backend & Serverless API**: Node.js, Express, Vercel Serverless Functions.
* **Tools & Automation**: Git, PDF Generation, Resend Email API integration.

---

## 📁 Project Architecture

```text
agency-hub/
├── api/
│   └── send-email.js              # Vercel Serverless Email Dispatch Endpoint
├── modules/
│   ├── audit.js                   # Office & Field Audit Checklist Logic
│   ├── cheques.js                 # Cheque Register & Clearance Manager
│   ├── credit-bills.js            # Credit Invoices & Aging Calculator
│   ├── dashboard.js               # Executive Summary & KPi Widgets
│   ├── data-manager.js            # Firestore Data Abstraction & Sync
│   ├── executive.js               # P&L and Bank Reconciliation Module
│   ├── fuel.js                    # Fuel & Fleet Expense Logs
│   ├── payroll.js                 # Payroll Engine & Payslip Generator
│   ├── reports.js                 # Automated PDF/HTML Report Builder
│   ├── sales-entry.js             # Daily SFA Sales Entry Module
│   ├── stock.js                   # Stock Audit & Inventory Control
│   └── worksheets.js              # Audit Worksheets & Task Verification
├── scripts/
│   └── send-monthly-report.js     # Scheduled Monthly Report Dispatch Script
├── Payslips_August_2026/          # Generated Monthly Payslips & Master Sheets
├── app.js                         # Core Application Router & Controller
├── index.html                     # Main Dashboard Application Layout
├── index.css                      # Unified Enterprise Styling Sheet
├── server.js                      # Express Backend Server (Local Development)
├── firebase.json                  # Firebase Hosting & Database Rules Config
├── firestore.rules                # Cloud Firestore Security Rules
└── vercel.json                    # Vercel Serverless Deployment Config
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* A modern web browser (Chrome, Safari, Edge, Firefox)

### Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RumikaMendis/Agency-hub.git
   cd Agency-hub
   ```

2. **Run locally using Node / Express**:
   ```bash
   npm start
   ```
   *or serve `index.html` using any local HTTP server (e.g. `npx serve .` or VS Code Live Server).*

3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🔐 Environment & Security

* Database access is governed by granular rules defined in [`firestore.rules`](file:///Users/rumika/Desktop/ME/agency-hub/firestore.rules).
* API routes enforce CORS validation and payload verification.

---

## 📝 License

This project is private and maintained for agency operations.
