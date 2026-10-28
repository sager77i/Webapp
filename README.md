# 🔥 TRENDPULSE (กระแสเมือง) - Talk of The Town Webapp

> **เว็บแอปพลิเคชันเกาะติดข่าวสารและประเด็นร้อน Talk of The Town ทั้งในประเทศไทย 🇹🇭 และต่างประเทศ 🌍**  
> 🌐 **Live Website:** [https://news.sager.app](https://news.sager.app) *(สำรอง: https://sager77i.github.io/Webapp/)*

---

## 🚀 การ Deploy ผ่าน GitHub Pages (Live Website)

เว็บแอปพลิเคชันนี้รองรับการเปิดใช้งานบน **GitHub Pages & Custom Domain** ได้ทันที 100%:
- URL เว็บไซต์: 👉 **`https://news.sager.app`**
- Custom Subdomain: `news.sager.app` (CNAME ชี้ไปที่ `sager77i.github.io`)
- มี GitHub Actions Workflow (`.github/workflows/deploy-pages.yml`) ติดตั้งพร้อม deploy อัตโนมัติทุกครั้งที่ push ขึ้น `main`

### วิธีเปิดใช้งาน GitHub Pages บน GitHub Repository:
1. ไปที่ GitHub Repo: [https://github.com/sager77i/Webapp/settings/pages](https://github.com/sager77i/Webapp/settings/pages)
2. ในส่วน **Build and deployment > Source**:
   - เลือก **GitHub Actions** (ระบบจะรัน Workflow อัตโนมัติ)
   - หรือเลือก **Deploy from a branch** > Branch: **`main`** / Folder: **`/(root)`** แล้วกด **Save**
3. รอประมาณ 1-2 นาที เว็บไซต์จะออนไลน์ทันทีที่ `https://sager77i.github.io/Webapp/`

---

## 🌟 จุดเด่นและฟังก์ชันการทำงานหลัก (Key Features)

1. **🔥 Hero Spotlight: Talk of The Town #1 ประจำวัน**
   - แสดงประเด็นร้อนระดับปรากฏการณ์ที่สังคมให้ความสนใจสูงสุด
   - สลับดูระหว่าง **ไทย 🇹🇭** และ **ต่างประเทศ 🌍** ได้ทันที
   - แสดง **Buzz Index Meter (มาตรวัดความร้อนแรง 0-100%)**
   - **AI Executive Summary**: สรุป 3 ประเด็นสำคัญที่ต้องรู้ใน 30 วินาที
   - โพลสำรวจความคิดเห็นมหาชนแบบเรียลไทม์ พร้อมกราฟแสดง % ทันทีหลังโหวต

2. **📰 ระบบคัดกรอง 2 ช่องทาง (Dual News Engine)**
   - **Talk of The Town คัดสรรพิเศษ (Curated High-Impact Stories)**: ข่าวเจาะลึกพร้อมบทวิเคราะห์, ไทม์ไลน์ลำดับเหตุการณ์, โพลสำรวจ และปุ่มรีแอ็กชัน
   - **สตรีมข่าวสด RSS (Live Real-Time Streaming)**: ดึงข้อมูลข่าวสดจากสำนักข่าวชั้นนำระดับโลกและไทยแบบอัตโนมัติ

3. **🎯 การจัดหมวดหมู่และตัวกรองที่ยืดหยุ่น**
   - ตัวกรองภูมิภาค: **ทั้งหมด**, **🇹🇭 ประเทศไทย**, **🌍 ต่างประเทศ**
   - ตัวกรองหมวดหมู่: 🏛️ การเมือง, 📈 เศรษฐกิจ, 👥 สังคม/ไวรัล, 🤖 เทคโนโลยี & AI, 🌱 สิ่งแวดล้อม, 🎬 บันเทิง
   - การเรียงลำดับ: ความร้อนแรงสูงสุด 🔥, อัปเดตล่าสุด 🕒, ยอดการเปิดอ่าน 👁️

4. **🔍 ระบบค้นหาอัจฉริยะ (Live Instant Search & Hashtags)**
   - ค้นหาข่าวแบบ Real-time พร้อมปุ่มล้างคำค้นหา
   - แถบ **Trending Hashtags (#แท็กฮิตติดเทรนด์)** เช่น `#TalkOfTheTown`, `#นโยบายเศรษฐกิจ`, `#AIRevolution`, `#สมรสเท่าเทียม`, `#หมูเด้ง` คลิกเพื่อกรองข่าวได้ทันที

5. **📖 หน้าต่างเจาะลึกประเด็น (Deep-Dive Modal)**
   - **Text-to-Speech (Audio Reader)**: กดฟังเสียง AI อ่านหัวข้อและสรุปข่าวภาษาไทย/อังกฤษได้ในคลิกเดียว
   - **Event Timeline (ไทม์ไลน์ลำดับเหตุการณ์)**: แสดงลำดับความเป็นมาของเรื่องราวตั้งแต่จุดเริ่มต้นจนถึงปัจจุบัน
   - **Public Opinion Poll (โพลมหาชน)**: ร่วมโหวตแสดงความคิดเห็นและดูผลลัพธ์มหาชน
   - **Emoji Reactions**: กดแสดงความรู้สึก (🔥 ร้อนแรง, 👏 ปรบมือ, 💡 ได้ไอเดีย, 😢 เศร้าใจ) พร้อมอัปเดตตัวเลขสด
   - **Social Share**: แชร์ไปยัง X (Twitter), LINE หรือคลิกคัดลอกลิงก์
   - **Direct Source Link**: ลิงก์ตรงไปยังสำนักข่าวต้นทาง

6. **🔖 ระบบบันทึกข่าว (Bookmarks)**
   - บันทึกข่าวที่สนใจเก็บไว้อ่านย้อนหลัง (บันทึกใน LocalStorage ไม่สูญหาย)
   - มีแท็บ "บันทึกไว้" พร้อม Badge แสดงจำนวนข่าวที่บันทึก

7. **💡 ระบบเสนอประเด็นร้อน (Suggest Topic Modal)**
   - ฟอร์มให้ผู้ใช้สามารถเสนอประเด็นร้อนหรือส่งลิงก์ข่าวที่กำลังเป็นกระแสเข้ามาในระบบได้

8. **🎨 ดีไซน์ระดับพรีเมียม (Modern Newsroom UI)**
   - รองรับ **Dark Mode** และ **Light Mode** พร้อมจำค่าที่ผู้ใช้เลือก
   - ฟอนต์ภาษาไทยยอดนิยม **Kanit** และ **Prompt** สบายตา อ่านง่าย
   - แถบวิ่ง **Breaking News Ticker** ข่าวด่วนด้านบนสุด
   - รองรับการใช้งานสมบูรณ์แบบบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟน (Responsive Mobile-First)

---

## 🚀 วิธีการเปิดใช้งาน (How to Run)

### วิธีที่ 1: ดับเบิลคลิกไฟล์ `start.bat` (ง่ายที่สุดสำหรับ Windows)
เพียงดับเบิลคลิกที่ไฟล์ [start.bat](file:///c:/Users/sager/Qsync/My%20Project%20on%20Github/Webapp/start.bat) ระบบจะเริ่มเซิร์ฟเวอร์ทันที

### วิธีที่ 2: รันผ่าน Terminal / Command Line
```bash
# รันเซิร์ฟเวอร์
node server.js
```
หรือหากมี `npm`:
```bash
npm start
```

จากนั้นเปิดเว็บเบราว์เซอร์ไปที่:
👉 **http://localhost:3000**

---

## 📁 โครงสร้างไฟล์ในโปรเจกต์ (Project Structure)

```
Webapp/
├── package.json               # ข้อมูลโปรเจกต์และ Scripts
├── server.js                  # Node.js HTTP Server & REST API (Zero-dependency)
├── start.bat                  # One-click launcher สำหรับ Windows
├── README.md                  # เอกสารแนะนำและคู่มือการใช้งาน
├── data/
│   ├── curated-news.json      # ข้อมูลข่าว Talk of The Town เจาะลึก (ไทย & เทศ)
│   ├── polls.json             # บันทึกคะแนนโหวตโพลแบบเรียลไทม์
│   ├── reactions.json         # บันทึกยอดกด Emoji Reaction
│   └── suggestions.json       # ข้อเสนอประเด็นร้อนจากผู้ใช้
└── public/
    ├── index.html             # โครงสร้างหน้าเว็บหลัก (HTML5 + Tailwind CSS)
    ├── styles.css             # สไตล์ตกแต่งเพิ่มเติม, แอนิเมชัน, Glassmorphism
    ├── app.js                 # โลจิกฝั่งผู้ใช้ (Search, Filter, TTS, Poll, Bookmark)
    └── favicon.svg            # ไอคอนประจำเว็บทรงเปลวไฟ
```

---

## 🔌 รายละเอียด REST API Endpoints

- `GET /api/news` : ดึงรายการข่าวสาร Talk of The Town (รองรับ query `region`, `category`, `search`, `includeLive`)
- `GET /api/live-rss` : ดึงข่าวสารสดผ่าน RSS feed แบบเรียลไทม์ (`region=th` หรือ `region=global`)
- `POST /api/poll/vote` : ส่งคะแนนโหวตโพล `{ pollId, optionId }`
- `POST /api/reaction` : บันทึกการกดรีแอ็กชัน `{ newsId, type }`
- `GET /api/trends` : ดึงข้อมูลแฮชแท็กติดเทรนด์และสถิติกราฟความรู้สึกมหาชน
- `POST /api/suggest-news` : ส่งประเด็นร้อนที่ผู้ใช้ต้องการเสนอเข้าสู่ระบบ

