<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/LocalStorage-333?style=for-the-badge&logo=databricks&logoColor=white" />
</p>

# 🏫 CampusFixit — Campus Maintenance & Repair Ticket System

> A modern, real-life campus issue reporting and tracking system built with pure HTML, CSS & JavaScript. Designed for students to report infrastructure problems and staff to manage repairs — all from a single, beautiful interface.

---

## ✨ Live Preview

Serve locally with any static server:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open **http://localhost:8080**

---

## 📸 Features at a Glance

| Feature | Student View | Staff View |
|---|---|---|
| **Submit tickets** | ✅ Full form with photo upload | — |
| **Anonymous by default** | ✅ Name never shown publicly | ✅ Real name visible for accountability |
| **Photo attachments** | ✅ Camera/gallery capture | ✅ View in lightbox & table thumbnails |
| **Search & filter** | ✅ Search + status filters | ✅ Search + filters + sort options |
| **Upvote / severity** | ✅ Vote on issues, trending badges | ✅ Vote counts with heat indicators |
| **Verify repairs** | ✅ Star rating + reopen option | — |
| **Manage tickets** | — | ✅ Assign → In Progress → Fixed workflow |
| **Staff notes & ETA** | — | ✅ Internal notes + estimated fix date |
| **Delete ownership** | ✅ Only original reporter can delete | ✅ Full access |
| **Dark mode** | ✅ | ✅ |

---

## 🏗️ Architecture

```
CampusFixit/
├── index.html          # Single-page app structure (modals, forms, dashboard, staff panel)
├── styles.css          # Glassmorphism UI — 500+ lines of modern CSS
├── app.js              # All logic — state, rendering, security, persistence
├── UI_reference.html   # Design reference file (read-only)
└── README.md
```

**No frameworks. No build tools. No backend.** Everything runs client-side with `localStorage` persistence.

---

## 🎓 Student Workflow

1. **Report an issue** — Fill out category, location, priority, description
2. **Attach a photo** — Take a picture or choose from gallery (optional, max 5 MB)
3. **All submissions are anonymous** — Your name is stored privately for ticket ownership only
4. **Track progress** — See live status updates: `Pending → Assigned → In Progress → Fixed → Verified`
5. **Upvote issues** — Click ▲ to boost visibility; 8+ votes = ⚡ Popular, 15+ = 🔥 Trending
6. **Verify repairs** — When staff marks a ticket as "Fixed", rate the quality (1–5 stars) or reopen
7. **Delete your ticket** — Only you can delete it (must re-enter your name to confirm)

---

## 🔧 Staff Workflow

1. **Authenticate** — Enter staff PIN (`1234`) to access the panel
2. **Overview dashboard** — Stat cards showing Total, Pending, In Progress, Awaiting Verify, Verified
3. **Manage tickets** — Status flow buttons: `Assign` → `Start` → `Mark Fixed`
4. **Add notes** — Internal staff notes with full activity log (hidden from students)
5. **Set ETA** — Date picker to set estimated fix date (shown to students on cards)
6. **Search & sort** — Filter by status, search any field, sort by newest/oldest/priority/votes
7. **View photos** — Click thumbnails to open full-size lightbox
8. **Contact reporter** — Phone/email visible in staff table for follow-up

---

## 🔒 Security Features

| Protection | Implementation |
|---|---|
| **XSS Prevention** | All dynamic content runs through `escapeHTML()` before `innerHTML` |
| **Staff PIN Gate** | Panel access requires PIN authentication (default: `1234`) |
| **Rate Limiting** | 5-second cooldown between ticket submissions |
| **Input Validation** | `minlength`, `maxlength`, required fields enforced in JS + HTML |
| **Collision-Safe IDs** | 6-character alphanumeric IDs with duplicate check |
| **Delete Ownership** | Students must re-enter their exact name to delete a ticket |
| **Staff Name Required** | All staff actions require a name to be entered first |
| **File Validation** | Photo uploads checked for image MIME type and 5 MB size limit |
| **Modal Escape** | All modals close on `Escape` key or click outside |

---

## 🎨 Design System

Built to match a premium glassmorphism reference UI:

- **Font** — [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (400–800 weights)
- **Glassmorphism** — `backdrop-filter: blur(12px)` with semi-transparent `rgba` backgrounds
- **Dot grid background** — `radial-gradient` pattern at 24px spacing
- **Ambient glow orbs** — `::before` / `::after` pseudo-elements with 500px blur
- **Gradient accents** — `linear-gradient(135deg, #4f46e5, #0ea5e9)` on buttons, stat numbers, badges
- **Pill buttons** — `border-radius: 99px` for filters and role switcher
- **Floating table rows** — `border-spacing: 12px` with per-row rounded corners
- **Priority glow** — Left border with matching `box-shadow` glow (red/amber/green)
- **Card animations** — `cubic-bezier` entrance with hover lift effect
- **Dark mode** — Full theme with adjusted rgba opacities, custom scrollbar

### CSS Variables (Light)

```css
--bg-body: #f8fafc;
--bg-card: rgba(255,255,255,0.85);
--accent-grad: linear-gradient(135deg, #4f46e5, #0ea5e9);
--radius-lg: 24px;
--shadow-glow: 0 0 20px rgba(79,70,229,0.2);
```

---

## 📦 Data Model

Each ticket object stored in `localStorage`:

```javascript
{
  id: 'TK8X2A',              // 6-char collision-safe ID
  category: '💻 IT/Projector',
  location: 'Lecture Hall 3, Block A',
  priority: 'High',           // High | Medium | Low
  description: '...',
  reporter: 'Arjun Mehta',    // Always collected, never shown to students
  contact: 'arjun@campus.edu', // Optional phone/email
  photo: 'data:image/...',    // Base64 or null
  status: 'Pending',          // Pending → Assigned → In Progress → Fixed → Verified | Reopened
  assignedTo: null,            // Staff/team name
  eta: '2026-03-01',          // ISO date string or null
  votes: 14,
  notes: [{ actor, text, time }],
  log: [{ time, actor, text }],
  verifiedRating: null,        // 1–5 or null
  verifiedComment: null,
  createdAt: 1740000000000     // Timestamp
}
```

### localStorage Keys

| Key | Purpose |
|---|---|
| `campusfixit_tickets` | JSON array of all tickets |
| `campusfixit_theme` | `'dark'` or `'light'` |
| `campusfixit_staff_name` | Persisted staff name input |
| `campusfixit_voted` | JSON array of voted ticket IDs |

---

## 🧪 Demo Data

Ships with **8 realistic seed tickets** across categories (IT, AC, Furniture, Lighting, Plumbing, WiFi, Electrical, Cleaning) in various statuses. Click **🔄 Reset** in the header to restore demo data at any time.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/MrDunky14/CampusFixit.git
cd CampusFixit

# Serve with Python (or any static server)
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

**Staff PIN:** `1234`

---

## 📱 Responsive Design

Fully responsive layout with breakpoints at `900px`:
- **Desktop** — Side-by-side form + dashboard grid
- **Mobile** — Stacked layout, full-width cards, collapsible controls

---

## 🗺️ Status Flow

```
  ┌──────────┐
  │  Pending  │
  └────┬─────┘
       │ Staff assigns
  ┌────▼─────┐
  │ Assigned  │◄─────────────┐
  └────┬─────┘              │
       │ Staff starts       │ Student reopens
  ┌────▼──────────┐    ┌────┴──────┐
  │  In Progress  │    │  Reopened  │
  └────┬──────────┘    └───────────┘
       │ Staff marks fixed
  ┌────▼─────┐
  │  Fixed   │
  └────┬─────┘
       │ Student verifies (★★★★★)
  ┌────▼──────┐
  │ Verified  │
  └───────────┘
```

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for campus communities everywhere
</p>