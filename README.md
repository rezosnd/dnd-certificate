# 🎓 Decode & Dominate 2.0 • Certificate Portal

> **The official high-fidelity digital certificate generation and verification platform for the Decode & Dominate 2.0 finale.**

[![Version](https://img.shields.io/badge/version-1.0.0-black.svg?style=flat-square)](#)
[![Tech Stack](https://img.shields.io/badge/stack-MERN--PostgreSQL-black.svg?style=flat-square)](#)
[![Design](https://img.shields.io/badge/design-Premium--Minimalist-white.svg?style=flat-square)](#)

---

## ✨ Features

- **🚀 Instant Generation**: Dynamic JPG generation using Puppeteer with 100% pixel-perfection.
- **🛡️ QR Verification**: Each certificate includes a unique ID and QR code for instant authenticity checks.
- **💼 LinkedIn Integration**: One-click sharing with professional pre-written post templates and auto-mentions for **KIIT** and **VeritasCo**.
- **⚡ Performance Optimized**: Served with high-fidelity **AVIF** image assets for ultra-fast load times.
- **📱 Responsive UI**: A premium, mobile-first experience designed for the modern web.

---

## 🛠️ Tech Stack & Architecture

This platform is built using a modern full-stack architecture focused on high-performance asset delivery and secure verification.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | **React 19 + Vite** | Lightweight, fast-loading user interface with modern hooks. |
| **Backend** | **Node.js + Express** | Robust API handling and dynamic template rendering. |
| **Database** | **Neon (PostgreSQL)** | Persistent storage for participant records and verification IDs. |
| **Generation** | **Puppeteer** | Headless Chrome engine used to generate pixel-perfect JPG certificates. |
| **Security** | **QR + Cryptic IDs** | Real-time verification system to prevent certification fraud. |
| **Imagery** | **Sharp (AVIF)** | Next-gen image compression for all branding and preview assets. |

---

## 🧠 How it Works

1.  **Authentication**: The system validates participant emails against a pre-authorized CSV-imported PostgreSQL database.
2.  **Dynamic Rendering**: Upon validation, the server renders a secure HTML/CSS template containing the participant's name and a unique QR code.
3.  **High-Fidelity Capture**: Puppeteer launches a headless browser instance to capture the rendered template as a high-quality (95% quality) JPEG image.
4.  **Instant Delivery**: The generated certificate is streamed directly to the user's browser with personalized metadata (e.g., `Name_dnd2.0.jpg`).
5.  **Social Amplification**: Integrated LinkedIn sharing allows users to post their achievement instantly using optimized OpenGraph metadata.

---

## 🛠️ Dev Setup

### 1. Backend
```bash
cd backend && npm install && npm start
```

### 2. Frontend
```bash
cd frontend && npm install && npm run dev
```

---

## 🤝 Partners

Digital Support provided by **[VeritasCo.Tech](https://veritasco.tech)**.

Organized by the **School of Computer Engineering, KIIT University** for the **KIIT Fest** Decode & Dominate 2.0 event.

---

<p align="center">
  MADE WITH ❤️ BY THE REHAN SUMAN
</p>
