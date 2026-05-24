<div align="center">
  <img src="public/favicon.svg" alt="Kiyo Logo" width="120" />
  <h1>Kiyo Quality Platform</h1>
  <p><strong>A Next-Generation Pharmaceutical Quality & Compliance Monitoring System</strong></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Mobile-Capacitor%20%2B%20PWA-119EFF?style=for-the-badge&logo=capacitor" alt="Capacitor" />
</p>

---

## 🔬 Overview

**Kiyo** is an end-to-end full-stack web application built for the pharmaceutical and manufacturing industries. It provides comprehensive tooling for online testing, real-time IoT monitoring, compliance auditing (WHO, FDA, GMP/ISO), and supply chain management. 

Designed for QA teams, lab technicians, regulatory auditors, and supply chain managers, Kiyo ensures that product quality is meticulously tracked from raw material to final certification.

## ✨ Features

- **📊 Live Dashboard**: Real-time overview of compliance metrics, active batches, sensor anomaly alerts, and defect rates.
- **📦 Batch Tracking**: Register, track, and monitor production batches with unique QR codes and end-to-end audit trails.
- **🧪 Quality Testing**: Execute simulated lab tests with automated Pass/Fail evaluations against international pharmaceutical standards.
- **🛡️ Compliance & CoA Generation**: Instantly generate professional **Certificates of Analysis (CoA)** formatted as PDFs for passing batches.
- **📡 Real-Time IoT Monitoring**: WebSocket-powered integration that simulates live environmental sensors (temperature, pressure, humidity).
- **📱 Mobile Integrated**: Fully responsive UI, Progressive Web App (PWA) ready, and wrapped as a Native Android application using Capacitor.
- **🧠 AI Analytics**: Advanced risk heatmaps, predictive shelf-life modeling, and simulated visual defect detection models.

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, Vite, Radix UI (shadcn), Recharts, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Real-Time**: WebSockets (ws) for live sensor data streaming.
- **Mobile Integration**: Capacitor Native (Android) & `vite-plugin-pwa`.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start the Backend Server (WebSockets & API)
In a new terminal window:
```bash
cd server
node index.js
```
*The API will start on `http://localhost:3001`.*

### 3. Start the Frontend Application
In a separate terminal window:
```bash
npm run dev
```
*The Vite application will start on `http://localhost:5173`.*

## 📱 Mobile Development

To build and sync the project to the native Android environment:
```bash
npm run build
npx cap sync
```
Open Android Studio to run the project on a physical device or emulator:
```bash
npx cap open android
```

---

*This project was developed within Google's AntiGravity AI IDE.*