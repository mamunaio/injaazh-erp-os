# 🌐 Injaazh ERP OS

[![Next.js](https://img.shields.io/badge/Next.js-15.0%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0%2B-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4b8cf8?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**Injaazh ERP OS** is a premium, next-generation, open-source Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) system designed for modern freelancers, digital agencies, and small businesses. It seamlessly integrates daily business management tools with advanced Google Gemini AI capabilities to automate insights, cold email outreach, project tracking, financial accounting, and SEO monitoring.

---

## 🚀 Key Modules & Features

### 1. 📊 Smart Dashboard & Gemini AI Insights
*   **Business Intelligence Dashboard**: High-level visual metrics of income, expenses, pending leads, and active projects.
*   **Daily AI Insights**: Powered by **Google Gemini 2.5 Flash**, providing automated summaries, growth opportunities, and recommendations based on real business data.
*   **Graceful Quota Fallback**: When Gemini API limits (free tier 20 req/day) are reached, the system automatically shifts to standard static insights to ensure zero downtime or application crashes.

### 2. 👥 CRM & Leads Management
*   **Pipelines & Tracking**: Track prospective clients and business deals from first contact to deal closure.
*   **AI Outreach Generator**: Generate hyper-personalized cold outreach emails based on proven templates, supporting custom adjustments, file attachments, and follow-up templates.

### 3. 💼 Kanban Projects Management
*   **Visual Project Boards**: Manage your delivery pipeline with a drag-and-drop Kanban interface powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
*   **Milestones & Progress**: Track deliverables, assign priorities, and update project status in real-time.

### 4. 🏪 Freelancer Marketplace Sync
*   **Platform Tracking**: Sync and track projects and clients across major freelancing portals like Upwork, Fiverr, and others.
*   **Client Hub**: Centrally manage marketplace client communications, payment histories, and feedback.

### 5. 💰 Finance & Money Analytics
*   **Double-Entry Ready Ledger**: Track bank accounts, online payment gateways, and cash balances.
*   **Advanced Recharts Visualizations**: Interactive line, bar, and area charts detailing historical cash flows, net profit margins, and monthly trends.

### 6. 💸 Daily Expenses & Personal Debt Tracker
*   **Expense Categorization**: Log and organize operating expenses, subscriptions, and overheads.
*   **Debt & Partial Payments Ledger**: Manage loans, credits, and client advances, with support for logging partial payments and tracking remaining balances.

### 7. 📈 SEO & AEO Tracker
*   **Search Engine Optimization**: Track organic search keywords, average rankings, and page indexing.
*   **Answer Engine Optimization (AEO)**: Track presence and optimize content for modern AI Search Engines (such as ChatGPT Search, Gemini, Perplexity).

### 8. 🔒 Security & User Management
*   **Secure Authentication**: Next-generation session handling with bcrypt password hashing and token-based protection.
*   **Two-Factor Authentication (2FA)**: Strengthen administrator accounts with standard TOTP (authenticator app) setup with visual QR codes (`otplib` and `qrcode`).

---

## 🛠️ Technology Stack

*   **Framework:** Next.js 16 (App Router)
*   **Runtime UI:** React 19 (concurrently rendering modern React architecture)
*   **Database ORM:** Mongoose / MongoDB Atlas
*   **Styling:** Tailwind CSS 4.0 & Framer Motion for premium micro-animations
*   **Rich Text Editing:** Tiptap Starter Kit (for professional proposals)
*   **AI Integration:** `@google/genai` (Native Gemini SDK)
*   **Mailing:** Nodemailer (SMTP configurations for campaigns and proposals)
*   **Charts:** Recharts

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the root directory and add the following:

```env
# MongoDB Connection
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/injaazh-erp"

# Gemini AI Credentials
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_AI_PROVIDER="Gemini AI"

# Authentication Secrets
JWT_SECRET="your-jwt-super-secret-key"

# Email SMTP Setup (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Injaazh Global <your-email@gmail.com>"
```

---

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/mamunaio/injaazh-erp-os.git
    cd injaazh-erp-os
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

4.  **Build for Production**
    ```bash
    npm run build
    npm run start
    ```

---

## 🧪 Testing

The codebase includes end-to-end (E2E) integration tests and validation scripts:

```bash
# Run unit and integration tests
npm test

# Run SEO/AEO verification script
npx tsx scripts/verify-seo-aeo.ts

# Run Outreach verification script
npx tsx scripts/verify-outreach.ts
```

---

## 🤝 Contributing

We welcome contributions! Please open an issue or submit a pull request with any improvements or additions.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Developed with ❤️ by the **Injaazh Global** team.*
