# Node.js MongoDB Backend Application

This project is a backend application built with Node.js and MongoDB. It provides APIs for user authentication, locker management, and other functionalities.

## Features

- **User Authentication**: 
  - Register, login, logout, password reset, and forgot password functionalities.
  - Admin-specific routes for managing users.
- **Locker Management**:
  - CRUD operations for lockers (Casiers).
  - Filter lockers by status (e.g., available, reserved).
- **Email Notifications**:
  - Sends emails for user registration and password reset.
- **Scheduled Tasks**:
  - Daily cron job for potential future tasks.
- **Health Check Endpoint**:
  - `/health` endpoint to verify server status.

## Technologies Used

- **Node.js**: Backend runtime.
- **Express.js**: Web framework.
- **MongoDB**: Database for storing user and locker data.
- **Mongoose**: ODM for MongoDB.
- **JWT**: For user authentication and authorization.
- **Bcrypt**: For password hashing.
- **Nodemailer**: For sending emails.
- **Node-cron**: For scheduling tasks.
- **Docker**: For containerization.
- **PM2**: For process management.
- **Jest**: Testing framework for unit tests.

## Prerequisites

- Node.js (v16 or later)
- MongoDB (local or cloud instance)
- Docker (optional, for containerized setup)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mydatabase
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d
SALT_ROUNDS=10
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
FRONTEND_URL=http://localhost:3000
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo.git
   cd project/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. For development with hot-reloading:
   ```bash
   npm run dev
   ```

## Docker Setup

1. Build and run the Docker container:
   ```bash
   docker-compose up --build
   ```

2. Access the application at `http://localhost:5000`.

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /login`: Login a user.
- `POST /register`: Register a new user.
- `POST /logout`: Logout a user.
- `POST /reset-password`: Reset a user's password.
- `POST /forgot-password`: Send a password reset link.
- `GET /`: Get all users (admin only).

### Locker Routes (`/api/casier`)

- `GET /`: Get all lockers.
- `GET /:id`: Get a locker by ID.
- `GET /status/:status`: Get lockers by status.
- `POST /`: Create a new locker.
- `PUT /:id`: Update a locker.
- `DELETE /:id`: Delete a locker.

### Health Check

- `GET /health`: Check server health.

## Project Structure

```
backend/
├── controller/          # API controllers
├── routes/              # API routes
├── schema/              # Mongoose schemas
├── utils/               # Utility functions (auth, email, notifications)
├── Dockerfile           # Dockerfile for containerization
├── docker-compose.yaml  # Docker Compose configuration
├── package.json         # Project dependencies
└── server.js            # Application entry point
```

## Testing

- Use tools like Postman or cURL to test the API endpoints.
- Ensure MongoDB is running locally or provide a valid `MONGO_URI`.

## Jest Tests

Run unit tests using Jest :

```bash
# Run all tests
npm run test

# Run tests with coverage report
npm run test:cov
```

Access the coverage report in the `coverage/lcov-report` directory with `index.html`.

## Future Enhancements

- Add integration tests.
- Implement more granular role-based access control.
- Enhance email templates with HTML formatting.
- Add frontend integration.

## License

This project is licensed under the MIT License.
