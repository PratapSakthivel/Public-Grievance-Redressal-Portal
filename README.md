# 🏛️ Public Grievance Redressal Portal

A full-stack civic engagement platform enabling citizens to file complaints, track resolution, and hold government departments accountable — with real-time WebSocket updates.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 18 (Standalone, Lazy-loading, Reactive Forms) |
| **Backend** | Spring Boot 3.x (REST, WebSocket, Spring Security + JWT) |
| **Database** | PostgreSQL |
| **Auth** | JWT Bearer Token (HMAC-SHA256) |
| **Real-time** | WebSocket (Spring WebSocket) |

---

## 📁 Project Structure

```
public-grievance-portal/
├── database/
│   └── schema.sql              # PostgreSQL schema + seed data
├── backend/                    # Spring Boot application
│   ├── pom.xml
│   └── src/main/java/com/grievance/
│       ├── config/             # JWT, Security, WebSocket, CORS
│       ├── controller/         # REST API endpoints
│       ├── dto/                # Request/Response DTOs
│       ├── entity/             # JPA entities
│       ├── enums/              # Role, ComplaintStatus, Priority
│       ├── exception/          # Global exception handler
│       ├── repository/         # Spring Data JPA repositories
│       ├── service/            # Business logic layer
│       └── websocket/          # WebSocket broadcast handler
└── frontend/                   # Angular 18 application
    └── src/app/
        ├── guards/             # Auth route guards
        ├── interceptors/       # JWT HTTP interceptor
        ├── models/             # TypeScript interfaces
        ├── pages/              # Page components (lazy-loaded)
        ├── services/           # HTTP + WebSocket services
        └── shared/             # Reusable components + pipes
```

---

## 🔑 User Roles

| Role | Access |
|------|--------|
| **CITIZEN** | File complaints, upvote, track own complaints |
| **OFFICER** | View/update assigned department complaints |
| **DEPT_HEAD** | Manage department complaints, assign officers |
| **SUPER_ADMIN** | Full system access, analytics, user/dept management |

---

## 🗝️ Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gov.in | password123 |
| Dept Head | dept.head@gov.in | password123 |
| Officer | officer1@gov.in | password123 |
| Citizen | citizen1@gmail.com | password123 |

---

## ⚙️ Setup & Run

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup
```bash
psql -U postgres -c "CREATE DATABASE public_grievance;"
psql -U postgres -d public_grievance -f database/schema.sql
```

### 2. Backend
Update `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=YOUR_POSTGRES_USER
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```
Then run:
```bash
cd backend
./mvnw spring-boot:run
```
Backend runs on: http://localhost:8080

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:4200

---

## 📡 API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Register as citizen |
| POST | `/api/auth/login` | Login → returns JWT |

### Complaints
| Method | URL | Access |
|--------|-----|--------|
| GET | `/api/complaints/public` | Public |
| GET | `/api/complaints/{id}` | Public |
| GET | `/api/complaints/similar?category=&pincode=` | Public |
| POST | `/api/complaints` | CITIZEN |
| POST | `/api/complaints/{id}/upvote` | CITIZEN |
| GET | `/api/complaints/my` | CITIZEN |
| GET | `/api/complaints/assigned` | OFFICER |
| GET | `/api/complaints/department/{id}` | DEPT_HEAD |
| PUT | `/api/complaints/{id}/assign` | DEPT_HEAD |
| PUT | `/api/complaints/{id}/status` | OFFICER, DEPT_HEAD |

### Analytics
| Method | URL | Access |
|--------|-----|--------|
| GET | `/api/analytics/global` | SUPER_ADMIN |
| GET | `/api/analytics/department/{id}` | DEPT_HEAD |

### WebSocket
Connect to: `ws://localhost:8080/ws`

Events emitted:
- `NEW_COMPLAINT` — when a new complaint is filed
- `STATUS_UPDATE` — when status changes
- `COMPLAINT_ASSIGNED` — when officer is assigned
- `UPVOTE_TOGGLE` — when upvote count changes

---

## ✨ Key Features

- 🔔 **Real-time notifications** via WebSocket when complaints are filed/updated
- 🗺️ **Similar complaint detection** — warns citizen if matching complaints already exist
- 📊 **Admin analytics** — status breakdown, category distribution, hotspot pincodes, monthly trends
- ⬆️ **Upvote system** — citizens can upvote existing complaints to prioritize them
- 📋 **Activity timeline** — every status change is tracked with actor, timestamp, and remarks
- 🛡️ **Role-based access control** — JWT + Spring Security with 4-tier authorization
- 📱 **Responsive dark UI** — glassmorphism design with smooth animations
