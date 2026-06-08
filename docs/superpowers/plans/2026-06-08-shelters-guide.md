# Shelters Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full shelters-guide page and a homepage preview section with statistics and Israel regulation info.

**Architecture:** New static Next.js page at `/shelters-guide` with rich Hebrew content; homepage gets a new section between "how it works" and "trust badges"; navbar gains a "מדריך מיגון" link.

**Tech Stack:** Next.js App Router, Tailwind CSS, existing card/section design patterns.

---

### Task 1: Create `/app/shelters-guide/page.tsx`

**Files:**
- Create: `app/shelters-guide/page.tsx`

- [ ] Create the full guide page with hero, 3 shelter-type sections (ממ"ד, מיגונית, מחסה), statistics bar, regulations section, FAQ, and CTA.

### Task 2: Add homepage preview section

**Files:**
- Modify: `app/page.tsx`

- [ ] Insert shelter preview section (3 cards + stats + CTA) between "how it works" and "trust badges".

### Task 3: Add navbar link

**Files:**
- Modify: `components/layout/Navbar.tsx`

- [ ] Add `{ href: '/shelters-guide', label: 'מדריך מיגון' }` to navLinks array.

### Task 4: Update memory

**Files:**
- Modify: `memory/project_shelters_guide.md`

- [ ] Save project memory about this feature.
