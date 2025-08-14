# To-Do Realtime

## Project Description
A real-time To-Do application built with **Angular** for the frontend and **Express.js** for the backend.  
The current setup is the base monorepo structure - next steps will include MongoDB integration, Socket.IO, and CRUD features.

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
- Node.js v22.18 or higher
- MongoDB (local or cloud instance)

## Running the Project

### Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies  
   cd ../client
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file **in server directory** (follow the `.env.example` template):

3. **Start the Application**
   ```bash
   # Terminal 1 - Start the server
   cd server
   npm run dev

   # Terminal 2 - Start the client
   cd client
   ng serve
   ```

4. **Access the Application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

##  API Documentation

**Interactive API Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

The project includes comprehensive Swagger UI documentation with:
- **REST endpoints** for task management (GET, POST, PUT, DELETE, PATCH)
- **Interactive testing** - Try endpoints directly from the browser
- **Request/Response examples** with real data schemas
- **Task locking documentation** - Required for PUT/DELETE operations via Socket.IO

Access the documentation while the server is running to test the API interactively.



## Architecture Documentation

### Design Philosophy
This application follows software engineering principles emphasizing maintainability, scalability, and real-time collaboration. The architecture implements SOLID principles with clear separation of concerns across all layers.

### System Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │◄──►│   Server API    │◄──►│    Database     │
│   (Angular)     │    │   (Express)     │    │   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         └──────── Socket.IO ────┘
              (Real-time Events)
```

### Frontend Architecture

**Component Responsibility Separation**
The Angular frontend implements service-oriented architecture where components act as coordinators rather than containing business logic. Each service has a single, well-defined responsibility following the Single Responsibility Principle.

**State Management Strategy**
```
UI Components
     ↓
Form Services ← → UI State Services
     ↓
Business Store
     ↓
HTTP/WebSocket Services
     ↓
External APIs
```

The application uses a hybrid state management approach:
- **RxJS Observables** for complex data flows and server communication
- **Angular Signals** for local UI state and loading indicators
- **Centralized Store** for application-wide state management

**Service Layer Organization**
- **UI State Services**: Manage loading states, editing modes, and view states
- **HTTP Services**: Handle REST API communication with proper error handling
- **Realtime Services**: Manage WebSocket connections and real-time events
- **Store Services**: Coordinate business logic and maintain application state

### Backend Architecture

**Layered Architecture Pattern**
```
Routes Layer
     ↓
Controllers Layer  
     ↓
Services Layer
     ↓
Repository Layer
     ↓
Models Layer
```

Each layer has distinct responsibilities with dependencies flowing downward only:
- **Routes**: Define API endpoints and request/response handling
- **Controllers**: Coordinate between services and handle HTTP logic
- **Services**: Implement business logic and orchestrate operations
- **Repositories**: Abstract data access and database operations
- **Models**: Define data structure and validation rules

**Real-time Communication Design**
The application uses Socket.IO for bidirectional communication with room-based organization. Events are published through a centralized event system ensuring consistency across all connected clients.

**Conflict Resolution Strategy**
Implements optimistic locking to handle concurrent edits:
- Users can view tasks simultaneously without restrictions
- Editing a task requires acquiring a lock to prevent conflicts
- Lock acquisition is managed server-side with automatic cleanup
- Failed lock attempts provide clear user feedback

### Key Design Decisions


**Error Handling Strategy**
Centralized error management with custom error types provides consistent error reporting across the application. Different error categories are handled appropriately with meaningful user feedback.

**Configuration Management**
Application constants and configuration values are centralized and type-safe, making it easy to modify settings without hunting through multiple files.

### Scalability Considerations

**Frontend Scalability**
- TrackBy functions optimize list rendering
- Modular architecture supports feature-based scaling

**Backend Scalability**
- Room-based socket organization supports multiple server instances


**Real-time Scalability**
- Event-driven architecture supports high concurrent loads
- Lock manager prevents resource contention
- Efficient socket connection management
- Graceful degradation when real-time features are unavailable

### Development Guidelines

**Code Organization Principles**
- Follow established naming conventions throughout the codebase
- Maintain consistent file structure across frontend and backend

**Adding New Features**
When extending the application, follow these patterns:
- New data models require type definitions, validation, and API contracts
- UI features should leverage existing service patterns for consistency

**Testing Strategy**
The architecture supports comprehensive testing:
- Integration tests for API endpoints and database operations
- End-to-end tests for complete user workflows
- Real-time feature testing with multiple simulated clients

### Maintenance Considerations

**Code Quality Standards**
- Clear separation of concerns makes debugging straightforward
- UI components can be easily extended or replaced
- Database schema changes are isolated within the repository layer

This architecture provides a solid foundation for a collaborative task management system while maintaining flexibility for future growth and feature additions.
