# Maturity Model Manager

A React application with TypeScript to manage Maturity Models for a catalog of Services by Teams.

## Overview

This application allows organizations to:
- Define and manage Maturity Models with Measurements
- Organize Teams and Services
- Evaluate Services against Maturity Models
- Track progress through Campaigns
- Visualize Maturity Levels across Services and Teams

## Project Structure

The project is divided into two main parts:

### Frontend

- React with TypeScript
- Material UI for components
- React Router for navigation
- Formik for form handling
- Chart.js for visualizations

### Backend

- Node.js with Express and TypeScript
- SQLite for database
- JWT for authentication
- RESTful API design

## Features

- **User Roles**: Admin, Team Owner, and Team Member with different permissions
- **Teams Management**: Create and manage teams with owners and members
- **Services Catalog**: Maintain a catalog of services with details
- **Maturity Models**: Define models with measurements and categories
- **Campaigns**: Run evaluation campaigns for services
- **Dashboards**: Visualize maturity levels and progress
- **Evidence Management**: Track and validate evidence for measurements

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```
git clone <repository-url>
cd maturity-model-manager
```

2. Install dependencies for both frontend and backend
```
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```
cd backend
npm run dev
```

2. Start the frontend development server
```
cd frontend
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

### Default Users

The application comes with default users for testing:

- Admin: 
  - Username: admin
  - Password: admin123

- Team Owner:
  - Username: teamowner
  - Password: owner123

- Team Member:
  - Username: teammember
  - Password: member123

## Database

The application uses SQLite for data storage. The database file is created at `backend/data/maturity-model.db`.

## API Documentation

The backend provides the following API endpoints:

- `/api/auth`: Authentication endpoints
- `/api/teams`: Teams management
- `/api/services`: Services management
- `/api/maturity-models`: Maturity Models management
- `/api/campaigns`: Campaigns management
- `/api/evaluations`: Measurement Evaluations

## License

This project is licensed under the MIT License - see the LICENSE file for details.