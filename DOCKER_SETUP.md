# 🐳 Docker Setup Guide

## สิ่งที่ได้สร้างไว้ให้แล้ว

### 1. Backend Dockerfile (`backend/Dockerfile`)
- Multi-stage build เพื่อลดขนาด image
- ใช้ Alpine Linux สำหรับ production
- รองรับ Go 1.23

### 2. Frontend Dockerfile (`frontend/Dockerfile`)
- Build React app ด้วย Vite
- Serve ด้วย Nginx
- รวม nginx configuration สำหรับ SPA routing

### 3. Docker Compose (`docker-compose.yml`)
- PostgreSQL database
- Backend API (Go)
- Frontend (React)
- Network configuration
- Health checks

## 📋 วิธีใช้งาน

### เริ่มต้นครั้งแรก

```bash
# 1. Build และ start ทุก services
docker-compose up -d --build

# 2. ดู logs
docker-compose logs -f

# 3. ตรวจสอบสถานะ
docker-compose ps
```

### คำสั่งที่ใช้บ่อย

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop และลบ volumes (ข้อมูลใน database จะหายด้วย)
docker-compose down -v

# Rebuild services
docker-compose up -d --build

# ดู logs ของ service เฉพาะ
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Restart service เฉพาะ
docker-compose restart backend
docker-compose restart frontend

# เข้าไปใน container
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres
```

## 🌐 การเข้าถึง

หลังจาก start services แล้ว:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## 🔧 Configuration

### Environment Variables

แก้ไขใน `docker-compose.yml` หรือสร้างไฟล์ `.env`:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# Backend
DB_HOST=postgres
DB_PORT=5432
```

### Nginx Configuration

แก้ไขใน `frontend/nginx.conf` สำหรับ:
- API proxy settings
- Cache settings
- Compression settings

## 🐛 Troubleshooting

### Database connection failed
```bash
# ตรวจสอบว่า postgres พร้อมหรือยัง
docker-compose logs postgres

# Restart backend
docker-compose restart backend
```

### Frontend ไม่แสดงผล
```bash
# ตรวจสอบ build
docker-compose logs frontend

# Rebuild
docker-compose up -d --build frontend
```

### Port ถูกใช้งานอยู่แล้ว
```bash
# หยุด services ที่ทำงานอยู่
docker-compose down

# หรือเปลี่ยน port ใน docker-compose.yml
ports:
  - "3000:80"  # เปลี่ยนจาก 80 เป็น 3000
```

## 📦 Production Deployment

สำหรับ production ควร:

1. ใช้ environment-specific configuration
2. ตั้งค่า secrets อย่างปลอดภัย
3. ใช้ reverse proxy (Nginx/Traefik)
4. ตั้งค่า SSL/TLS certificates
5. Configure logging และ monitoring

## 🔄 Development Workflow

### Development Mode (Hot Reload)

สร้าง `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
    command: air  # Hot reload tool for Go

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📝 Notes

- Database data จะถูกเก็บใน Docker volume `postgres_data`
- Backend จะรอให้ PostgreSQL พร้อมก่อนเริ่มทำงาน (health check)
- Frontend จะ proxy API requests ไปที่ backend อัตโนมัติ
- ทุก services อยู่ใน network เดียวกัน (`team12-network`)
