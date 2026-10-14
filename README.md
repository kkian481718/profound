# Profound (飽範) - Food Ordering & Delivery Coordination Platform

> 🍕 **Profound** is a full-stack food ordering and delivery logistics management system built to serve local communities, handling over **1,350+ customer orders** with 170+ orders per month.

---

## 🌟 Overview & Business Background
Profound originated as a solution to bridge local customers with regional restaurants and proxy-purchasing services (such as Costco regional group-buying). It integrates real-time order tracking, merchant inventory management, dynamic pickup locations, and delivery coordination.

---

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS, PostCSS, Responsive Mobile-First Design
- **Backend & Database:** Supabase (PostgreSQL, Realtime, Storage, Row-Level Security)
- **Analytics:** Google Analytics 4 (GA4) with custom conversion events
- **Code Quality & CI:** ESLint, Prettier, GitHub Actions

---

## ✨ Key Features
- **Customer Ordering Experience:**
  - Dynamic store and category filtering
  - Customized item options (temperature, sweetness, add-ons)
  - Responsive mobile ordering layout
- **Merchant & Admin Dashboard:**
  - Real-time order dispatching and status pipelines
  - Pagination and sorting by pickup locations
  - Store card layout with modal settings
- **Logistics & Delivery Coordination:**
  - Grouped orders by delivery runs and pickup points
  - Real-time order status tracking

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/kkian481718/profound.git
cd profound
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📄 License
This project is part of the founder's portfolio. All rights reserved © Profound Team.
