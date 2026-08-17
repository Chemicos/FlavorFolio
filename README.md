# FlavorFolio

**FlavorFolio** is a full-featured social cooking platform built around recipe discovery, content creation and community interaction.

What originally started as a recipe-sharing application evolved into a larger social platform where users can publish recipes and short-form cooking content, follow creators, interact through comments and ratings, manage their own profiles, communicate through direct messages and receive real-time notifications.

The application also includes a dedicated administration and moderation system for managing content, users, reports and platform activity.

---

## Overview

Users can:
- discover and filter recipes;
- create and manage their own recipes;
- publish short-form cooking reels;
- follow other creators;
- save and rate recipes;
- comment and interact with content;
- manage a customizable public profile;
- control profile privacy;
- block other users;
- send direct messages;
- share recipes through conversations;
- receive real-time notifications.

Administrators have access to a separate moderation environment for reviewing recipes, managing users and monitoring platform activity.

---

## Tech Stack

### Frontend

- **React**
- **TypeScript**
- **Vite**
- **React Router**
- **Tailwind CSS**
- **Material UI Icons / Components**
- **Motion**

### Backend & Cloud

- **Firebase Authentication**
- **Cloud Firestore**
- **Firebase Storage**

### Additional Libraries

- **jsPDF**
- **jsPDF AutoTable**

---

## 📦 Installation

Clone the repository:

```bash
git clone <repository-url>
cd FlavorFolio
```

Install dependencies:

```bash
npm install
```

Create the required Firebase environment configuration and connect the project to a Firebase application with:

- Authentication
- Firestore
- Storage

Then start the development server:

```bash
npm run dev
```

---

## 🔐 Environment Configuration
Create a local `.env` file and configure the Firebase values required by `firebase-config.ts`.

```env
# Add the Firebase environment variables expected by the project here.
```

> The exact variable names depend on the current Firebase configuration used by the project.

---

## 👨‍💻 Author

**Chemicos**

FlavorFolio was designed and developed as a personal software development project.

---

## 📄 License

This project is currently intended for educational and portfolio purposes.
