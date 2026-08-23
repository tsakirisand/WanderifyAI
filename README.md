# Wanderify - Intelligent AI Travel Itinerary Planner

**Wanderify** is a premium, state-of-the-art AI-powered travel planner that generates complete, personalized daily itineraries in seconds. Stop spending hours researching destinations, budgets, and routing. Wanderify automates the entire planning process, offering a visual, interactive dashboard tailored to your unique travel preferences.

---

## 🌟 Key Features

### 🧠 1. AI-Powered Travel Engine
- Uses the **Google Gemini API** to generate detailed, customized travel itineraries.
- Suggests structured daily activities divided into Morning, Afternoon, and Evening slots.
- Includes local travel tips, dining recommendations, and curated "Hidden Gems" for each destination.

### 💳 2. Secure Stripe Integration (Stripe Hosted Checkout)
- Charged at a flat rate ($1.99 USD) per itinerary generation/download using **Stripe Hosted Checkout**.
- Safely stores all trip parameters inside Stripe session metadata.
- Employs **Transaction Idempotency** (using the Stripe Session ID as the Firestore document ID) to guarantee exactly one trip is created per purchase, preventing duplicates between Webhooks and Success redirects.

### 🌤️ 3. Live Weather Forecasts (WeatherAPI.com)
- Securely fetches live weather conditions through Next.js Server Actions to protect API keys.
- Shows a live 10-day weather forecast if the travel dates are upcoming.
- Automatically falls back to historical climate data (from the same date last year) if travel dates are in the far future or past.
- Clear badge indicators display whether the weather is **"Real Weather"**, **"Typical Weather"** (historical), or **"Simulated"**.

### 🗺️ 4. Interactive Route Maps (Leaflet & OpenStreetMap)
- Embeds a fully interactive map using Leaflet.js with clean **CartoDB Voyager** map layers.
- Places numbered pins (**1**, **2**, **3**) matching the chronological order of activities.
- Draws dashed route lines (polylines) connecting the planned stops.
- Popups display detailed description and suggested time when a pin is clicked.

### ✈️ 5. Flight & Hotel Recommendations
- **Flight Recommendations**: Displays suggested airlines, flight duration, and estimated costs.
- **Hotel Recommendations**: Suggests top-rated accommodations matching your budget profile, including price-per-night, ratings, and brief descriptions.

### 📍 6. Google Maps Navigation Links
- Direct deep links are attached to all activities, hotels, restaurants, and hidden gems.
- Clicking the navigation icon opens Google Maps directly with pre-filled locations for easy routing.

### 📄 7. PDF Export (Tailwind CSS v4 Compatible)
- Allows users to download their itineraries as clean PDFs for offline use.
- Built using dynamic imports of `jsPDF` and **`html2canvas-pro`** (which supports Tailwind CSS v4's oklab/oklch color specifications without rendering errors).

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, Server Actions)
- **Styling & Animations:** Tailwind CSS v4, Framer Motion
- **Database:** Firebase Firestore (Admin SDK)
- **Authentication:** Firebase Client Authentication (including email verification and Google Provider login)
- **Payments:** Stripe SDK / Stripe Hosted Checkout
- **APIs:** 
  - Google Gen AI SDK (`gemini-2.5-flash`)
  - WeatherAPI.com
  - Leaflet.js

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following keys:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Google Gemini API Key
GEMINI_API_KEY="your-gemini-key"

# WeatherAPI.com API Key
WEATHER_API_KEY="your-weatherapi-key"

# Stripe API Keys
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Email Settings (Nodemailer SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
EMAIL_FROM="Wanderify <your-email@gmail.com>"
```

---

## 🚀 Installation & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```
