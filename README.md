# TaskMaster Pro

TaskMaster Pro is a full-stack web application designed for personal and small-team task management. Built with a robust Node.js backend and a lightning-fast vanilla JavaScript single-page application (SPA) frontend, it features secure authentication, Role-Based Access Control (RBAC), and full CRUD functionality.

## Features

- **User Authentication**: Secure registration and login using JSON Web Tokens (JWT) and bcrypt password hashing.
- **Role-Based Access Control (RBAC)**: Supports `user` and `admin` roles. The very first user to register automatically becomes an admin.
- **Task Management**: Create, read, update (status changes), and delete tasks.
- **Admin Dashboard**: Real-time system statistics and a comprehensive audit log of important system events (logins, task creation, deletions, unauthorized access attempts).
- **Responsive Vanilla SPA**: A dynamic, framework-free frontend featuring modern UI design, dark mode, smooth micro-animations, and toast notifications.

## Technology Stack

### Backend
- **Node.js & Express.js**: RESTful API and server architecture.
- **SQLite3**: Lightweight, file-based relational database.
- **Authentication**: `jsonwebtoken` and `bcryptjs`.
- **Security**: Parameterized SQL queries to prevent SQL injection.

### Frontend
- **HTML5 & CSS3**: Custom CSS design system with CSS variables (no frameworks).
- **JavaScript (ES6+)**: Vanilla JS for state management, DOM manipulation, and API integration.
- **Phosphor Icons**: For clean and modern UI iconography.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/taskmaster-pro.git
   cd taskmaster-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file in the root directory and define your secret keys:
   ```env
   PORT=3000
   JWT_SECRET=your_super_secret_key_here
   ```

### Running the Application

To start the server for development (using `nodemon`):
```bash
npm run dev
```

To start the server for production:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Architecture & Workflow (Spec-Driven Development)

This project was built following the **Spec Kit** workflow, demonstrating a structured approach to AI-assisted software development:
1. **Specify**: Defined core user scenarios and functional requirements (`specs/001-task-management-app/spec.md`).
2. **Plan**: Drafted the technical architecture and database schema.
3. **Tasks**: Broke down the project into granular, reviewable steps.
4. **Implement**: Executed the code base systematically.

---
