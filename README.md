# Moshly Site

Moshly is a suite of tools designed for touring artists, managers, and creative professionals. This repository contains the frontend website for the Moshly universe.

## 🚀 Overview

Moshly is on the verge of dropping a super-fine suite of wonderful mini-tools that every industry professional wishes they had in their back pocket. Built for the industry's pace, these tools focus on:
- **Efficiency**: No bloat, no friction — just sharp, focused tools.
- **Flexibility**: Tools that adapt to your workflow, from touring logistics to creative management.
- **Exclusive Access**: Major plan members get first-day access to everything in the pipeline.

## 🛠️ Tech Stack

- **Language**: HTML5, Vanilla JavaScript
- **Styling**: CSS3 (Modern features like CSS Variables, Grid, and Flexbox)
- **Payments**: [Paddle](https://paddle.com/) Integration
- **Fonts**: Google Fonts (Inter)
- **Deployment**: Static site hosting (e.g., Netlify, Vercel, or GitHub Pages)

## 📦 Project Structure

```text
.
├── admin.html          # Admin dashboard interface
├── assets/             # Images, icons, and logos
├── contact.html        # Contact page
├── dashboard.html      # User dashboard
├── faq.html            # Frequently Asked Questions
├── feeme.html          # FeeMe app landing page
├── index.html          # Main landing page
├── launcher.html       # App launcher interface
├── launching-soon/     # Splash page for upcoming features
├── pricing.html        # Pricing and plans
├── privacy.html        # Privacy policy
├── style.css           # Global stylesheet
├── pricing.css         # Pricing page specific styles
└── terms.html          # Terms of service
```

## 💰 Pricing Plans

Moshly offers flexible plans to scale with your career:

### 0. Free
- **Note**: This plan is available by exploring the Moshly universe without a paid commitment.
- **Key Features**:
  - **1 project**
  - Access to future free tools
  - Topable AI features

### 1. Solo
- **Price**: €4.99/month (or €49.99/year)
- **Key Features**:
  - Pick **2 tools** of your choice
  - Fully functional — no feature limits
  - **12 PDF exports** per month
  - **500 AI credits** / month
  - **1 project**

### 2. Collective
- **Price**: €9.99/month (or €99.99/year)
- **Key Features**:
  - Pick **4 tools** of your choice
  - **50 PDF exports** per month
  - **1,250 AI credits** / month
  - **3 projects**

### 3. Business
- **Price**: €24.99/month (or €249.99/year)
- **Key Features**:
  - Pick **10 tools** of your choice
  - **100 PDF exports** per month
  - **2,500 AI credits** / month
  - **6 projects**
  - Priority support line

### 4. Major
- **Price**: €79.99/month (or €799.99/year)
- **Key Features**:
  - **All Moshly tools** — every single one
  - **250 PDF exports** per month
  - **6,000 AI credits** / month
  - **15 projects**
  - Max priority support line

*Note: Daily credits reset at midnight (Lisbon time).*

## ⚙️ Setup & Development

### Requirements
- A modern web browser.
- A local web server (optional, for development).

### Run Locally
Since this is a static site, you can simply open `index.html` in your browser. For better experience with modules and routing, use a local server:

**Using Python:**
```bash
python3 -m http.server 8000
```

**Using Node.js (serve):**
```bash
npx serve .
```

## 📜 Scripts & Automation
- **Start**: Run `npm start` to launch a local development server.
- **Dev**: Run `npm run dev` to launch a local development server.
- **Dependencies**: Managed via `package.json`. Run `npm install` to install dev dependencies.

## 🔑 Environment Variables
- **Paddle Token**: Currently hardcoded in `pricing.html` as a test token.
- **TODO**: Move API keys and configuration to a centralized config or environment variables.

## 🔄 Spoke App System (Architecture)

Moshly follows a **Spoke Architecture** for its suite of tools, ensuring a unified experience across different specialized applications.

- **Central Hub**: The main dashboard (at `moshly.io`) acts as the central authority, handling Authentication, Profile Management, and Subscription state.
- **Isolated Spokes**: Specialized tools (e.g., `feeme.moshly.io`) operate as independent "spokes." They focus on their specific functionality while "checking in" with the Hub for session verification.
- **Unified Authentication**: All spokes communicate with the same backend API and share session state via secure `postMessage` or shared `localStorage` patterns, allowing users to move seamlessly between tools without re-authenticating.

## 🧪 Tests
- **TODO**: No automated tests found. 
- Recommendation: Implement Playwright or Cypress for E2E testing of the checkout flow.

## 📄 License
- **TODO**: No LICENSE file found. Please add appropriate licensing information.

### What's left
✅ Task complete — nothing remaining.

*verified by vibecheck*
*,filename: