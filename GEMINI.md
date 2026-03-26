# Moshly Site - Gemini Instructions

This document provides context and guidelines for Gemini CLI when working on the Moshly Site project.

## 🚀 Project Overview
Moshly is a suite of tools for touring artists, managers, and creative professionals. This repository contains the frontend website (landing pages, dashboards, and static content).

## 🛠️ Tech Stack & Conventions
- **Frontend**: Pure HTML5, Vanilla JavaScript.
- **Styling**: Modern CSS3 (CSS Variables, Grid, Flexbox).
- **Interactions**: Minimal and performant. Avoid heavy frameworks unless explicitly requested.
- **State Management**: Local storage or simple state objects for the frontend.
- **Payments**: Paddle integration.

## 📂 Key Directories & Files
- `index.html`: Main landing page.
- `dashboard.html` / `admin.html`: User and admin interfaces.
- `style.css`: Global styles.
- `pricing.css`: Pricing-specific styles.
- `auth-client.js`: Client-side authentication logic.
- `assets/`: Logos, icons, and images.

## 🎨 Coding Standards
### HTML
- Use semantic HTML tags (`<header>`, `<main>`, `<footer>`, `<section>`, etc.).
- Maintain accessibility (ARIA labels where necessary).

### CSS
- Use CSS Variables for colors, spacing, and typography (defined in `:root`).
- Prefer Flexbox and Grid for layouts.
- Keep styles modular; if a page has specific styles, use a separate CSS file (like `pricing.css`).

### JavaScript
- Use modern ES6+ syntax (const/let, arrow functions, template literals).
- Keep functions small and focused.
- Document complex logic with concise comments.

## 🧪 Testing & Validation
- **Manual Testing**: Since there are no automated tests yet, verify changes by opening the site in a browser.
- **Lighthouse**: Aim for high scores in Performance, Accessibility, and Best Practices.
- **Validation**: Ensure HTML and CSS are valid.

## 🛠️ Common Tasks
- **Adding a Page**: Create a new `.html` file, link it in `index.html` or `launcher.html`, and add corresponding styles to `style.css` or a new CSS file.
- **Updating Pricing**: Modify `pricing.html` and `pricing.css`. Note the Paddle integration.
- **Asset Management**: Place new images/icons in the `assets/` directory.

## ⚠️ Important Notes
- **No Build Step**: The project is a static site. Changes are reflected immediately in the browser.
- **Environment Variables**: API keys should eventually be moved to a centralized config. For now, check `pricing.html` for Paddle tokens.
- **Consistency**: Ensure new pages match the aesthetic of the existing landing page.
