// ใน config/data_seed/reset.go
package dataseed

import (
	"log"

	"gorm.io/gorm"
)

// ใช้เฉพาะตอน DEV เพื่อ Reset id ให้เริ่มตั้งแต่ 0
func ResetDatabase(db *gorm.DB) {
    // ... (ส่วนนี้ปล่อยไว้ก่อน หรือลบทิ้ง ถ้าไม่ใช้)
}

// ================= ใช้กรณีอยากล้างตารางทั้งหมดเลย =================
func ResetDatabaseByDROP(db *gorm.DB) {
	log.Println("Dropping All Tables and Constraints...")
	
    // คำสั่ง SQL ที่ถูกต้องสำหรับ PostgreSQL เพื่อค้นหาและ DROP ตารางทั้งหมดใน Schema 'public'
    sql := `
        DO $$ DECLARE
            r record;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
    `

	if err := db.Exec(sql).Error; err != nil {
		log.Println("ResetDatabaseByDROP error:", err)
	} else {
		log.Println("ResetDatabaseByDROP: All tables dropped successfully.")
	}
}