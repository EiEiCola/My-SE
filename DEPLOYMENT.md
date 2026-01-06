# 🚀 Production Deployment Guide - sutcommu.online

## 📋 Prerequisites

1. ✅ VM with Docker & Docker Compose installed
2. ✅ Nginx Proxy Manager configured
3. ✅ Domain `sutcommu.online` pointed to VM IP
4. ✅ Docker Hub account (juribers)
5. ✅ External network `team12_npm_internal` created in Nginx Proxy Manager

---

## 🔧 Step 1: Setup GitHub Secrets

ไปที่ GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

เพิ่ม Secrets:
- `DOCKER_USERNAME`: juribers
- `DOCKER_PASSWORD`: [Docker Hub Password/Token ของคุณ]

---

## 🏗️ Step 2: Build & Push Docker Images

### วิธีที่ 1: ให้ GitHub Actions ทำให้อัตโนมัติ (แนะนำ)
```bash
# Push code ไป GitHub
git add .
git commit -m "Ready for production deployment"
git push origin main
```
GitHub Actions จะ build และ push images ไป Docker Hub อัตโนมัติ

### วิธีที่ 2: Build & Push แบบ Manual
```bash
# Build Backend
cd backend
docker build -t juribers/team12-backend:latest .
docker push juribers/team12-backend:latest

# Build Frontend
cd ../frontend
docker build -t juribers/team12-frontend:latest .
docker push juribers/team12-frontend:latest
```

---

## 🖥️ Step 3: Deploy on VM

### 3.1 SSH เข้า VM
```bash
ssh your-user@sutcommu.online
```

### 3.2 สร้าง Project Directory
```bash
mkdir -p ~/team12
cd ~/team12
```

### 3.3 สร้างไฟล์ `.env`
```bash
nano .env
```

วางข้อมูลนี้ (แก้ไขตามความเหมาะสม):
```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourSecurePassword123!
POSTGRES_DB=team12_db
DB_HOST=postgres
DB_PORT=5432

# Backend Configuration
ALLOWED_ORIGINS=https://sutcommu.online,http://sutcommu.online
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long!

# Optional
# PORT=8080
```

### 3.4 Upload `docker-compose.prod.yml`
วิธีที่ 1: ใช้ SCP
```bash
# จากเครื่องของคุณ
scp docker-compose.prod.yml your-user@sutcommu.online:~/team12/docker-compose.yml
```

วิธีที่ 2: สร้างบน VM โดยตรง
```bash
nano docker-compose.yml
# วางเนื้อหาจากไฟล์ docker-compose.prod.yml
```

### 3.5 สร้าง External Network (ถ้ายังไม่มี)
```bash
docker network create team12_npm_internal 2>/dev/null || true
```

### 3.6 สร้าง Uploads Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

### 3.7 Pull & Run
```bash
# Pull latest images
docker compose pull

# Start services
docker compose up -d

# ดู logs
docker compose logs -f
```

---

## ⚙️ Step 4: Configure Nginx Proxy Manager

### 4.1 เพิ่ม Proxy Host สำหรับ Frontend
- **Domain Names**: `sutcommu.online`, `www.sutcommu.online`
- **Scheme**: `http`
- **Forward Hostname/IP**: `team12-frontend` (container name)
- **Forward Port**: `80`
- **✅ Cache Assets**: เปิด
- **✅ Block Common Exploits**: เปิด
- **✅ Websockets Support**: เปิด

**SSL Tab:**
- **✅ Force SSL**: เปิด
- **SSL Certificate**: Request a new SSL Certificate (Let's Encrypt)
- **✅ Force SSL**: เปิด
- **✅ HTTP/2 Support**: เปิด

---

## 🔍 Step 5: Verify Deployment

### 5.1 ตรวจสอบ Containers
```bash
docker compose ps
```
ทุก service ต้องเป็น "Up" และ healthy

### 5.2 ตรวจสอบ Logs
```bash
# Backend logs
docker compose logs backend -f

# Frontend logs
docker compose logs frontend -f

# Database logs
docker compose logs postgres -f
```

### 5.3 ทดสอบ API
```bash
# จากเครื่อง VM
curl http://localhost:8080/api/health

# จาก Internet (ผ่าน domain)
curl https://sutcommu.online/api/health
```

### 5.4 เปิดเว็บในบราวเซอร์
```
https://sutcommu.online
```

---

## 🔄 Update Deployment (เมื่อมีการเปลี่ยนแปลง)

```bash
# SSH to VM
cd ~/team12

# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d

# Remove old images (optional)
docker image prune -f
```

---

## 🛠️ Troubleshooting

### ปัญหา: Container ไม่ start
```bash
# ดู logs
docker compose logs [service-name]

# Restart service
docker compose restart [service-name]
```

### ปัญหา: Database connection failed
```bash
# เช็คว่า postgres container รันอยู่หรือไม่
docker compose ps postgres

# เข้าไปดูใน database
docker compose exec postgres psql -U postgres -d team12_db
```

### ปัญหา: 502 Bad Gateway
- เช็คว่า backend container รันอยู่และ healthy
- เช็คว่า Nginx Proxy Manager ตั้งค่า forward ถูกต้อง
- เช็ค network connectivity: `docker network inspect team12_npm_internal`

### ปัญหา: CORS Error
- เช็คค่า `ALLOWED_ORIGINS` ในไฟล์ `.env`
- Restart backend: `docker compose restart backend`

---

## 📊 Monitoring

### ดูสถานะ Resource
```bash
docker stats
```

### ดูขนาด Images
```bash
docker images | grep team12
```

### ดูขนาด Volumes
```bash
docker system df -v
```

---

## 🗑️ Cleanup (Remove Everything)

```bash
cd ~/team12

# Stop and remove containers
docker compose down

# Remove with volumes (ลบข้อมูล database ด้วย)
docker compose down -v

# Remove images
docker rmi juribers/team12-backend:latest
docker rmi juribers/team12-frontend:latest
```

---

## 📝 Notes

1. **Database Backup**: ควร backup database เป็นประจำ
   ```bash
   docker compose exec postgres pg_dump -U postgres team12_db > backup_$(date +%Y%m%d).sql
   ```

2. **SSL Certificate**: Let's Encrypt จะ auto-renew ผ่าน Nginx Proxy Manager

3. **Uploads Persistence**: ไฟล์ที่ upload จะเก็บใน `./uploads` directory บน VM

4. **Environment Variables**: อย่า commit ไฟล์ `.env` จริงขึ้น git (ใช้เฉพาะ `.env.example`)

---

## ✅ Checklist

- [ ] GitHub Secrets configured
- [ ] Docker images built and pushed
- [ ] VM prepared with Docker
- [ ] External network created
- [ ] `.env` file configured on VM
- [ ] `docker-compose.yml` uploaded to VM
- [ ] Services started successfully
- [ ] Nginx Proxy Manager configured
- [ ] SSL certificate obtained
- [ ] Website accessible via https://sutcommu.online
- [ ] API endpoints working
- [ ] Database connected and seeded

---

## 🔗 Useful Links

- **Frontend**: https://sutcommu.online
- **API Health**: https://sutcommu.online/api/health
- **Docker Hub**: https://hub.docker.com/u/juribers

**Good luck with your deployment! 🚀**
