# 🔒 Authentication Backend

A complete authentication system with both frontend and backend, built with Node.js and React. This project implements secure user registration, login, password management, and session handling with industry-standard practices.

## ✨ Features

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected route middleware
- Token refresh mechanism
- Email verification
- Password reset functionality
- Frontend login/register UI

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Validation | Express Validator |

## 📁 Project Structure

```
Authentication-Backend/
├── backend/           # Express.js authentication API
└── frontend/          # React frontend with auth UI
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB instance

### Installation

1. Clone the repository:
```bash
git clone https://github.com/manuskhan23/Authentication-Backend.git
cd Authentication-Backend
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:
```bash
# In backend directory, copy the example file and fill in the values
cp .env.example .env

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
PORT=5000
CORS_ORIGINS=http://localhost:5173
```

The backend refuses to start unless `MONGO_URI` and `JWT_SECRET` are set.

### Running the Application

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```

## 📸 Preview

> Coming soon

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center"><sub>Built with ❤️ by <a href="https://github.com/manuskhan23">manuskhan23</a></sub></p>