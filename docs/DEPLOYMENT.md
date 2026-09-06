# Wally — การนำขึ้นใช้งานส่วนตัว

อัปเดต 7 กันยายน 2026

## ระบบที่เตรียมไว้

- Vercel: โปรเจกต์ `wally` ในทีม `586`
- Neon: ฐานข้อมูล `wally-db`, แผน Free, Singapore (`sin1`)
- เชื่อม Neon กับ environment `production` เท่านั้น
- สร้างตารางด้วย `prisma migrate deploy` แล้ว
- ตั้งค่า Google OAuth, Auth.js secret และ cron secret ใน Vercel แล้ว โดยไม่เก็บค่าในเอกสาร
- `DIRECT_URL` ใช้การเชื่อมต่อ Neon แบบไม่ผ่าน pooler
- `vercel.json` ให้ฟังก์ชันทำงานใน Singapore ใกล้ฐานข้อมูล
- `.vercelignore` กันไฟล์ environment, build เก่า, เอกสาร, QA fixture `ui-preview` และเครื่องมือสร้างผู้ใช้ทดสอบออกจากการอัปโหลด CLI
- Production URL: https://wally-gamma.vercel.app
- Google OAuth อนุญาต production origin และ callback ของ URL ข้างต้นแล้ว

## ก่อนเริ่มใช้

1. เปิด https://wally-gamma.vercel.app
2. เข้าสู่ระบบด้วย Google
3. สร้างบัญชีการเงิน และบันทึกรายรับ/รายจ่ายแรก
4. ลองออกจากระบบและกลับเข้ามาใหม่ เพื่อตรวจว่าข้อมูลยังอยู่

ไม่ต้องใช้หน้า HTML artifact เพื่อบันทึกเงินจริง ให้ใช้งานแอปบน URL production เท่านั้น

## ขอบเขตการทดสอบ

- Production build ในเครื่องผ่าน
- Vitest: 33 ผ่าน, 10 integration tests ถูกข้ามเพราะฐานข้อมูล localhost ไม่ทำงาน
- การ migrate ไปฐานข้อมูล Neon ใหม่สำเร็จ
- Google Login ผ่านทั้งรอบแรกและการออก/เข้าใหม่ ผู้ใช้และ database session ถูกสร้างใน Neon
- หมวดหมู่เริ่มต้นถูกสร้างสำเร็จ: 21 หมวดหลักและ 42 หมวดย่อย
- หน้า `/dashboard` และ `/admin` redirect ผู้ใช้ที่ยังไม่เข้าสู่ระบบตามที่กำหนด
- Admin email ของ production คือ `shokunsupapol.work@gmail.com`; ผู้ใช้เดิมจะได้รับ role `ADMIN` เมื่อเข้าสู่ระบบครั้งถัดไป
- หลังแก้ callback พบ error log เก่าหนึ่งรายการจากคำขอ callback ที่ไม่มีพารามิเตอร์ แต่การล็อกอินรอบใหม่สำเร็จและไม่เกิด error เพิ่ม
- ยังไม่ได้ตั้งค่า Finnhub API key; ใช้กรอกราคาการลงทุนเองได้ก่อน

## การอัปเดตครั้งถัดไป

ตรวจโค้ดและรัน tests/build ก่อน deploy จากโฟลเดอร์นี้ด้วย Vercel CLI:

```sh
vercel deploy --prod --scope 586
```

หากแก้ schema ให้ตรวจ migration และสำรองข้อมูลตามความเหมาะสมก่อนรัน `prisma migrate deploy` โดยใช้ environment ของ production ห้ามใช้ `migrate reset` กับฐานข้อมูลที่ใช้งานจริง

การเชื่อม GitHub อัตโนมัติยังไม่สำเร็จตอนสร้างโปรเจกต์ การ deploy ครั้งนี้ส่งโค้ดจากเครื่องโดยตรง ปัจจุบันไฟล์ส่วนใหญ่ใน repository ยังไม่ได้ commit การตั้ง Git deployment ภายหลังต้องตรวจรายการไฟล์และ `.gitignore` ก่อน push
