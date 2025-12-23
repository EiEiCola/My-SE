# แผนการทดสอบ User Acceptance Testing (UAT)

## ภาพรวม
เอกสารนี้ระบุสถานการณ์การทดสอบ User Acceptance Testing (UAT) สำหรับการนำเสนอโปรเจคของกลุ่ม Team 12 **(เฉพาะระบบประชาสัมพันธ์ - มุมมองสมาชิก)**
**หมายเหตุ**: โปรเจคนี้ใช้ฐานข้อมูล **PostgreSQL** (ตรวจสอบจาก `go.mod`) ซึ่งแตกต่างจาก Lab Sheet ที่กำหนดให้ใช้ SQLite

## ระบบประชาสัมพันธ์ (Public Relations / Announcement)

**Entity หลัก**: `PRSubmission` (User Request)

### กรณีทดสอบแบบ Positive (1 กรณี)
**Case 1.1: สร้างคำขอลงประชาสัมพันธ์สำเร็จ (Create PR Submission Successfully)**
*   **ผู้ทดสอบ (Actor)**: Member (User)
*   **การกระทำ (Action)**: เข้าไปที่หน้า "สร้างประกาศ" (`/User/Announcement/create`), กรอกข้อมูล หัวข้อ, หมวดหมู่, คำอธิบาย, เนื้อหา, วันที่เริ่ม-สิ้นสุด, แนบรูป, แล้วกด "สร้างประกาศ"
*   **ผลลัพธ์ที่คาดหวัง**: ระบบบันทึกข้อมูลสำเร็จ (Status 201), เปลี่ยนหน้ากลับมาที่หน้ารวม (`/User/Announcement`), และรายการคำขอใหม่ปรากฏในรายการ

### กรณีทดสอบแบบ Negative (3 กรณี)
**Case 1.2: สร้างประกาศโดยไม่กรอกหัวข้อ (Create with Missing Title)**
*   **ผู้ทดสอบ (Actor)**: Member
*   **การกระทำ (Action)**: เว้นว่างช่อง "หัวข้อประกาศ" (Title), กรอกช่องอื่นๆ ครบ, กดบันทึก
*   **ผลลัพธ์ที่คาดหวัง**: ระบบ (Frontend) แสดงข้อความแจ้งเตือนสีแดง "กรุณากรอกหัวข้อประกาศ" และไม่ส่งข้อมูลไป Backend

**Case 1.3: สร้างประกาศโดยไม่กรอกเนื้อหา (Create with Missing Content)**
*   **ผู้ทดสอบ (Actor)**: Member
*   **การกระทำ (Action)**: เว้นว่างช่อง "เนื้อหาประกาศ" (Content), กรอกช่องอื่นๆ ครบ, กดบันทึก
*   **ผลลัพธ์ที่คาดหวัง**: ระบบ (Backend) ส่งกลับข้อผิดพลาด และ UI แสดงข้อความแจ้งเตือน "Content is required" (หรือข้อความที่ระบบส่งกลับ)

**Case 1.4: สร้างประกาศโดยระบุช่วงเวลาผิดพลาด (Create with Invalid Date Range)**
*   **ผู้ทดสอบ (Actor)**: Member
*   **การกระทำ (Action)**: ระบุ **วันที่สิ้นสุด** เป็นวันที่ *ก่อนหน้า* **วันที่เริ่มต้น**
*   **ผลลัพธ์ที่คาดหวัง**: ระบบ (Frontend) แสดงข้อความแจ้งเตือน "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น" และไม่บันทึกข้อมูล

---

## ขั้นตอนการทดสอบด้วย Selenium IDE (สำหรับระบบประชาสัมพันธ์ - สมาชิก)

ส่วนนี้อธิบายขั้นตอน (Steps) ที่ต้องใช้ในการบันทึก (Record) การทดสอบด้วย Selenium IDE

**สำคัญ**: ตรวจสอบว่าระบบ Frontend `npm run dev` และ Backend `go run main.go` ทำงานอยู่ก่อนเริ่ม Record

### 1. Test Case: User Create PR Success (สร้างคำขอสำเร็จ)
**ชื่อ Test**: `User_Create_PR_Success`
1.  **Open**: เปิด URL `http://localhost:5173/User/Announcement`
2.  **Click**: ปุ่ม "+ สร้างประกาศ" (คลาส `.create-btn`)
3.  **Type**: ช่อง `id=title` -> พิมพ์ `Selenium User PR Test`
4.  **Select**: ช่อง `id=category` -> เลือก `กิจกรรม`
5.  **Type**: ช่อง `id=description` -> พิมพ์ `Short description`
6.  **Type**: ช่อง `id=content` -> พิมพ์ `Detailed content...`
7.  **Type**: ช่อง `id=start-date` -> เลือกวันที่เริ่ม
8.  **Type**: ช่อง `id=end-date` -> เลือกวันที่สิ้นสุด (ต้องไม่น้อยกว่าวันเริ่ม)
9.  **Click**: ปุ่ม "สร้างประกาศ" (ปุ่ม `id=submit-btn` หรือปุ่ม submit สีน้ำเงิน)
10. **AssertText**: ตรวจสอบว่ากลับมาหน้าแรกและเจอหัวข้อ `Selenium User PR Test`

### 2. Test Case: User Create PR Missing Title (ไม่กรอกหัวข้อ)
**ชื่อ Test**: `User_Create_PR_Missing_Title`
1.  **Open**: เปิด URL `http://localhost:5173/User/Announcement/create`
2.  **Type**: ช่อง `id=description` -> พิมพ์ `Missing title test`
3.  **Click**: ปุ่ม "สร้างประกาศ"
4.  **AssertText**: ตรวจสอบข้อความแจ้งเตือน `.form-error` ว่า "กรุณากรอกหัวข้อประกาศ"

### 3. Test Case: User Create PR Missing Content (ไม่กรอกเนื้อหา)
**ชื่อ Test**: `User_Create_PR_Missing_Content`
1.  **Open**: เปิด URL `http://localhost:5173/User/Announcement/create`
2.  **Type**: ช่อง `id=title` -> พิมพ์ `Missing Content Test`
3.  **Type**: ช่อง `id=content` -> (เว้นว่าง)
4.  **Click**: ปุ่ม "สร้างประกาศ"
5.  **AssertText**: ตรวจสอบข้อความแจ้งเตือน `.form-error` ว่า "Content is required" (ตรวจสอบ Error จาก Backend)

### 4. Test Case: User Create PR Invalid Dates (วันที่ไม่ถูกต้อง)
**ชื่อ Test**: `User_Create_PR_Invalid_Dates`
1.  **Open**: เปิด URL `http://localhost:5173/User/Announcement/create`
2.  **Type**: ช่อง `id=title` -> พิมพ์ `Invalid Date Test`
3.  **Type**: ช่อง `id=start-date` -> เลือก `2025-12-31`
4.  **Type**: ช่อง `id=end-date` -> เลือก `2025-01-01` (ย้อนหลัง)
5.  **Click**: ปุ่ม "สร้างประกาศ"
6.  **AssertText**: ตรวจสอบข้อความแจ้งเตือน `.form-error` ว่า "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น"
