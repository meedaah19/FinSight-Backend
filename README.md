
---

# Finsight Backend API

Finsight Backend is the server-side application powering the Finsight Personal Finance Tracker. It provides secure user authentication, expense management, analytics endpoints, and password recovery functionality.

## Features

- User authentication (Signup/Login/Logout)
- JWT token-based authorization
- User profile management
- Expense CRUD operations
- Financial analytics endpoints:
  - Monthly trends
  - Weekly comparisons
  - Category summaries
  - Personalized insights
- Forgot password & password reset via email
- Change password functionality
- MongoDB database integration

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Resend (Email API)
- Render (Deployment)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/meedaah19/FinSight-Backend
npm install

Create a .env file:
PORT=3000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key

Run locally
npm run dev

```

## API Endpoints

### Authentication
- POST /user/signup
- POST /user/login
- POST /user/logout
- Profile
- GET /user/profile
- PATCH /user/profile
- DELETE /user/profile

### Password
- POST /user/forgot-password
- POST /user/reset-password/:token
- PATCH /user/change-password

### Expenses
- POST /expenses
- GET /expenses
- PATCH /expenses/:id
- DELETE /expenses/:id

### Analytics
- GET /expenses/monthly-trends
- GET /expenses/weekly-comparison
- GET /expenses/category-summary
- GET /expenses/insights

## Deployment
Backend deployed on Render.

## Author
Built by Hameedat