export const PATCH_NOTES = [
  { version: "1.3.1", th: ["ย้ายปุ่มเมนูไปฝั่งขวา และปัดจากขอบขวาของจอเพื่อเปิดเมนูได้ (บนมือถือ)"], en: ["Move the menu button to the right and swipe from the right edge to open it (mobile)"] },
  { version: "1.3.0", th: ["ปรับดีไซน์แถบเมนู หน้าต่าง และแจ้งเตือนเป็นสไตล์กระจกโปร่ง (liquid glass) รองรับทั้งธีมสว่างและมืด", "ย่อการ์ดภาพรวมทรัพย์สินสุทธิให้กระชับ อ่านง่ายขึ้น", "จัดหน้าพอร์ตใหม่: ลดตัวเลขซ้ำ และรวมปุ่มเพิ่มสินทรัพย์ให้อยู่ที่เดียว"], en: ["Refresh the nav bars, sheets and toasts with a liquid-glass look in both light and dark themes", "Tighten the net-worth overview card", "Reorganise the portfolio page: fewer duplicate figures, one place to add assets"] },
  { version: "1.2.0", th: ["บันทึกสีหลักไว้กับบัญชีผู้ใช้และซิงก์ข้ามอุปกรณ์", "เพิ่มเมนู Patch Notes พร้อมจุดแจ้งเตือนเวอร์ชันใหม่", "ปรับอีเมลผู้ดูแลระบบ"], en: ["Sync the app accent color with the user account", "Add Patch Notes with an unread update indicator", "Update the administrator email"] },
  { version: "1.1.6", th: ["แสดงความคืบหน้า OCR และผลลัพธ์ทีละภาพ"], en: ["Show OCR progress and results one image at a time"] },
  { version: "1.1.5", th: ["ย้ายแจ้งเตือนให้อยู่ใต้ Dynamic Island"], en: ["Keep update notifications below the Dynamic Island"] },
  { version: "1.1.4", th: ["แสดงจำนวนเงินด้วยทศนิยม 2 ตำแหน่ง"], en: ["Display monetary amounts with two decimal places"] },
  { version: "1.1.3", th: ["แก้ OCR นำเข้าหุ้นหลายรายการและรักษาทศนิยม"], en: ["Improve bulk holdings OCR and decimal accuracy"] },
  { version: "1.1.2", th: ["เก็บและคำนวณจำนวนเงินโดยไม่ตัดทศนิยม"], en: ["Preserve monetary decimals in calculations"] },
  { version: "1.1.1", th: ["เพิ่มการนำเข้าสินทรัพย์หลายรายการด้วย OCR"], en: ["Restore bulk asset import with OCR"] },
  { version: "1.1.0", th: ["เพิ่มราคาหุ้นและอัตราแลกเปลี่ยนล่าสุด", "ปรับหน้าพอร์ตและบัญชี พร้อมลากวางเพื่อโอนเงิน", "เพิ่มการอ่านสลิปลงทุน"], en: ["Add current stock prices and exchange rates", "Redesign portfolios and accounts with drag-to-transfer", "Add investment slip scanning"] },
  { version: "1.0.0", th: ["Wally เวอร์ชันแรกสำหรับจัดการบัญชี รายรับ รายจ่าย และการโอนเงิน"], en: ["Initial Wally release for accounts, income, expenses, and transfers"] },
] as const;
