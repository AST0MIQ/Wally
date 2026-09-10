# ธีมทดสอบ "แสงเหนือ" (Aurora) — เช็กลิสต์ประกอบภาพ 18 ใบ

ภาพทั้งหมดสร้างด้วย `gpt_image_2` · แนวตั้ง 752×1344 (9:16) · แนวนอน 1344×752 (16:9)
ทุกใบผ่านเกณฑ์อัตราส่วนของระบบพอดี **ไม่ต้องครอบก่อน อัปโหลดได้เลย ไม่มีเตือน**

## ชุดสีของธีม — กรอกให้เหมือนกันทุก asset

| token | hex | ใช้ตรงไหน |
|---|---|---|
| `background` | `#0B0E1F` | พื้นหลังสุดของแอป |
| `surface` | `#161B36` | พื้นการ์ด |
| `primary` | `#8F7DF7` | สีเน้นหลัก (ม่วง) |
| `text` | `#F2F1FB` | ตัวอักษรหลัก — คอนทราสต์ 15.2:1 บน surface |
| `muted` | `#A9AECF` | ตัวอักษรรอง — คอนทราสต์ 7.8:1 บน surface |
| `border` | `#2E3560` | เส้นขอบการ์ด |
| `glow` | `#4DD9C0` | แสงเรือง (เขียวมิ้นต์) |
| `cash` | `#5AC8FA` | หมวดเงินสด |
| `investment` | `#B388FF` | หมวดการลงทุน |

> แต่ละช่องจะโชว์เฉพาะสีที่มีผลกับมันจริง ๆ ไม่ต้องกรอกครบ 9 ค่าทุกชิ้น
> เช่นพื้นหลังแอปมีให้กรอกแค่ `background` `primary` `glow`

## ภาพที่ต้องอัปโหลดเข้าคลังรูปก่อน 3 ใบ

| ภาพที่ | ชื่อที่ควรตั้ง | หมวดในคลังรูป |
|---|---|---|
| **1** | Aurora — พื้นหลัง | **พื้นหลังแอป** |
| **2** | Aurora — ละอองแสง | **เอฟเฟกต์พื้นหลัง** |
| **3** | Aurora — ปกชุด | **ปกชุดธีม** |

ที่เหลือใบที่ 4–18 อัปโหลดเป็นหมวด **รูปตัวอย่างไอเทม** ทั้งหมด

## asset 15 ชิ้น — สร้างตามนี้

| ภาพที่ | ช่อง (slot) | รูปตกแต่งที่ใช้จริง | ค่าที่ตั้ง |
|---|---|---|---|
| 4 | พื้นหลังแอป | **ภาพที่ 1** | `surface=GRADIENT` `texture=FINE_NOISE` `motion=NONE` `intensity=MEDIUM` |
| 5 | เอฟเฟกต์พื้นหลัง | **ภาพที่ 2** | `ambientEffect=GLOW_ORBS` `intensity=LOW` |
| 6 | แถบเมนู | — | `shape=ROUNDED` `surface=GLASS` `borderEffect=NONE` `intensity=LOW` |
| 7 | แถบด้านบน | — | `surface=GLASS` `borderEffect=GLOW` `intensity=LOW` |
| 8 | การ์ดภาพรวม | — | `shape=SOFT` `surface=ELEVATED` `borderEffect=GRADIENT_BORDER` `motion=SHIMMER` `intensity=MEDIUM` |
| 9 | การ์ดบัญชี | — | `shape=SOFT` `surface=GLASS` `borderEffect=NONE` `motion=NONE` |
| 10 | การ์ดการลงทุน | — | `shape=SOFT` `surface=GRADIENT` `motion=PULSE` `intensity=LOW` |
| 11 | รายการรับจ่าย | — | `shape=ROUNDED` `surface=FLAT` `borderEffect=NONE` |
| 12 | กรอบโปรไฟล์ | — | `borderEffect=GRADIENT_BORDER` `motion=PULSE` `intensity=MEDIUM` |
| 13 | ป้ายโปรไฟล์ | — | `shape=PILL` |
| 14 | แสงรอบโปรไฟล์ | — | `motion=PULSE` `intensity=LOW` |
| 15 | รูปแบบกราฟ | — | `chartStyle=NEON` `intensity=MEDIUM` |
| 16 | ชุดไอคอน | — | `iconStyle=DUOTONE` |
| 17 | เอฟเฟกต์ตอนกด | — | `interactionEffect=GLOW_TAP` `intensity=MEDIUM` |
| 18 | เอฟเฟกต์ฉลอง | — | `celebrationEffect=SPARKLE` `intensity=MEDIUM` |

**เลข "ภาพที่" ในคอลัมน์แรก = รูปตัวอย่างไอเทมของ asset ชิ้นนั้น** ส่วนคอลัมน์ที่ 3
คือรูปที่ถูกวาดเป็นธีมจริง ซึ่งมีแค่ 2 ชิ้นบนสุด

## ลำดับงาน

1. **คลังรูป** → อัปโหลด 18 ใบ เลือกหมวดตามตารางข้างบน
2. **คอลเลกชัน → คอลเลกชันใหม่** → slug `aurora` ชื่อ "แสงเหนือ" เลือกปก = ภาพที่ 3 → บันทึกเป็น DRAFT
3. **ออกแบบไอเทม** → สร้าง 15 ชิ้นตามตาราง slug ใช้ `aurora-<ช่อง>` เช่น `aurora-app-background`
4. กลับไปที่คอลเลกชัน → ผูก asset ทั้ง 15 เข้าชุด
5. **ทดลองธีม** → ตรวจทั้งโหมดสว่างและมืด แล้วค่อยกด PUBLISHED

> ⚠️ ธีมนี้ออกแบบมาสำหรับ **โหมดมืด** ถ้าดูในโหมดสว่างแล้วจืด ให้ตั้ง `lightCompatible = false`
> ตอนยังเป็น DRAFT เพื่อให้ renderer ข้ามเลเยอร์นี้ในโหมดสว่างไปเลย
>
> ⚠️ ตั้งค่าของ asset **ล็อกถาวรหลังกด PUBLISHED ครั้งแรก** ตรวจให้จบตอนยังเป็น DRAFT
