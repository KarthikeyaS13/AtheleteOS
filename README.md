# AthletOS — Multi-Sport Performance Dashboard

# Live: https://athelete-os.vercel.app
---
AthletOS is a web app I built to track my workouts, nutrition, and performance in one place.
I run marathons and also do cycling and strength training. I was using different apps for each thing, and it was hard to understand overall training load and recovery. So I built this to solve that problem.
---
## What it does
- Log workouts (running, cycling, strength, swimming)
- Calculate training load based on effort (RPE) and volume
- Show fitness vs fatigue trends in charts
- Track daily nutrition (calories, macros, hydration)
- Plan races with countdown and targets
- Export weekly report (PDF & Excel)
- Track personal records
---
## How it works (simple idea)
Each workout is stored with distance/duration and RPE.
Training load is calculated using a simple formula like:
load = volume × (RPE / 5)
This helps compare different workouts and understand how hard I’m training over time.
The analytics page uses this data to show trends like fatigue and fitness.

---

## Tech Stack
- React (Vite)
- Redux Toolkit (state management)
- Tailwind CSS
- Recharts (charts)
- Formik + Yup (forms)
- jsPDF & ExcelJS (exports)
- LocalStorage (data persistence)
---
## Screenshots

### Dashboard
<img width="600" height="450" alt="Screenshot from 2026-04-29 15-57-15" src="https://github.com/user-attachments/assets/902a44df-9e9a-41d5-871b-fc2e6cef62f9" />

### Analytics
<img width="600" height="450" alt="Screenshot from 2026-04-29 16-03-00" src="https://github.com/user-attachments/assets/7f1e400a-b4bc-4b1b-99e3-fcfed49e8c97" />

### Workout Logging
<img width="600" height="450" alt="Screenshot from 2026-04-29 15-57-27" src="https://github.com/user-attachments/assets/6d33ce92-03f6-43d1-9c9c-b2e4bed18ad9" />

### Nutrition Tracker
<img width="600" height="450" alt="Screenshot from 2026-04-29 15-31-45" src="https://github.com/user-attachments/assets/35ef2719-c8eb-4d3a-b67e-b6ca2bfd274f" />

### Race Planner
<img width="600" height="450" alt="Screenshot from 2026-04-29 15-59-28" src="https://github.com/user-attachments/assets/0f8aa773-346a-48a4-b9ff-bde876a33e5f" />

### Training History
<img width="600" height="450" alt="Screenshot from 2026-04-29 16-00-01" src="https://github.com/user-attachments/assets/99659f90-dc53-46fa-9186-d081504315b7" />

### Weekly Report
<img width="600" height="450" alt="Screenshot from 2026-04-29 16-00-09" src="https://github.com/user-attachments/assets/7b4b18c2-6fb7-4ee5-9dcd-d1bb3c9dab20" />

## How to Run
npm install  
npm run dev
