Wallet Tracker PWA

A Progressive Web App (PWA) designed for tracking and detailed analysis of personal expenses. Developed to offer a smooth and native experience on both desktop and smartphones, the app ensures real-time data synchronization and advanced management of financial metrics.

🚀 Key Features

Progressive Web App (PWA): Fully installable on smartphones (iOS and Android) with a mobile-optimized interface and offline cache support via Service Worker.

Cloud Sync & Security: Centralized data storage on Firebase Firestore and a secure login system via Firebase Authentication (Email/Password).

Advanced Analytics Dashboard: Clear chart visualizations (adapted for small screens), dynamic monitoring of average monthly expenses by category, and accumulated average annual expenses.

Saving Rate Tracking: Calculation of the saving rate trend with an automatic chart reset on the first day of each new month.

Historical Data Management: Dedicated interface for the instant import of historical expense backups via a JSON string.

Automated Reporting: Integrated serverless system for automatically sending a summary email with financial statistics on the last day of each month.

🛠️ Tech Stack

Frontend: React, Vite (PWA ecosystem)

Backend & Database: Firebase (Firestore, Authentication)

Hosting & CI/CD: Vercel (Continuous Deployment via GitHub)

💻 Local Installation

1. Clone the repository and navigate to the directory

git clone https://github.com/your-username/wallet-tracker-analysis.git
cd wallet-tracker-analysis


2. Install dependencies

npm install


3. Configure environment variables
Create a .env file in the root of the project and insert your Firebase configuration keys:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id


4. Start the development server

npm run dev
