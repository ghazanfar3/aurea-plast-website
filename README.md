# Aurea Plast Website

Static website for **Aurea Plast** (plastic & aesthetic clinic, Lahore).

| | |
|---|---|
| **GitHub** | https://github.com/ghazanfar3/aurea-plast-website |
| **Live site** | https://aureaplastclinic.com |
| **Deploy** | GitHub Pages (publishes the `main` branch) |

---

## How work flows (local → GitHub → live)

```
1. Edit files on your computer (local)
2. Preview in the browser (local server)
3. Commit + push to GitHub
4. Merge into main  →  GitHub Pages updates the live site
```

**Do not edit the live site directly.** Always change files locally (or in Cursor), push to GitHub, then deploy via `main`.

---

## 1. Connect this project on your computer

### First time (clone)

```bash
git clone https://github.com/ghazanfar3/aurea-plast-website.git
cd aurea-plast-website
```

### Already have the folder

```bash
cd aurea-plast-website
git remote -v
# should show: origin → github.com/ghazanfar3/aurea-plast-website
git pull origin main
```

If `origin` is missing:

```bash
git remote add origin https://github.com/ghazanfar3/aurea-plast-website.git
git fetch origin
git checkout main
git pull origin main
```

---

## 2. Work locally (before deploying)

Preview the site on your machine:

```bash
chmod +x scripts/serve.sh   # once
./scripts/serve.sh
```

Open **http://127.0.0.1:4173/** in your browser.

Or without the script:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Edit HTML / CSS / JS under this folder, refresh the browser, and confirm the change looks right **locally first**.

---

## 3. Save to GitHub

```bash
git status
git add .
git commit -m "Describe your change clearly"
git push -u origin HEAD
```

Use a feature branch for larger work:

```bash
git checkout -b feature/my-update
# ... edit, commit ...
git push -u origin feature/my-update
```

Then open a Pull Request on GitHub and merge into `main` when ready.

---

## 4. Deploy to the live website

GitHub Pages is connected to the **`main`** branch (folder `/`).

- Push or merge to **`main`** → site rebuilds automatically
- Live URL: **https://aureaplastclinic.com**
- Custom domain file: `CNAME` → `aureaplastclinic.com`

Check deploy status: GitHub → **Settings → Pages** (or the repo’s Actions / Pages build).

Usually live within about 1 minute after `main` updates.

---

## Project layout

```
├── index.html                 Home
├── about.html, contact.html, appointment.html, ...
├── css/                       Styles
├── js/                        Scripts
├── assets/                    Images & media
├── CNAME                      GitHub Pages custom domain
├── scripts/serve.sh           Local preview server
└── README.md                  This file
```

---

## Quick checklist

1. Pull latest `main`
2. Edit locally
3. Preview with `./scripts/serve.sh`
4. Commit + push to GitHub
5. Merge to `main` to deploy live
