# To-Do Realtime

## Project Description
A real-time To-Do application built with **Angular** for the frontend and **Express.js** for the backend.  
The current setup is the base monorepo structure — next steps will include MongoDB integration, Socket.IO, and CRUD features.

## Technologies
- **Frontend:** Angular 20
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Real-Time:** Socket.IO

## Structure
```
project-root/
│
├── client/        # Frontend - Angular
│
├── server/        # Backend - Express.js
│
├── .gitignore
└── README.md
```

## Prerequisites
- Node.js v18 or higher

## Running the Project

### Run the Backend
```bash
cd server
npm install
npm run dev
```
The server runs on `http://localhost:3000`  

Example `.env`:
```
PORT=3000
CLIENT_ORIGIN=http://localhost:4200
```

### Run the Frontend
```bash
cd client
npm install
npm start
```
The client runs on `http://localhost:4200`

