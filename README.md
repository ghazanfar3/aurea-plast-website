# Aurea Plast Website

Static website for **Aurea Plast** (plastic & aesthetic clinic, Lahore).

| | |
|---|---|
| **Your local folder** | `C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast` |
| **GitHub** | https://github.com/ghazanfar3/aurea-plast-website |
| **Live site** | https://aureaplastclinic.com |
| **Deploy** | GitHub Pages (`main` branch) — **only when you ask to deploy** |

---

## Rule: local first, deploy on request

```
1. Open / edit the local folder on your PC
2. Preview locally in the browser
3. Save changes (commit) when ready
4. Deploy to GitHub / live site ONLY when you say "deploy"
```

Until you ask to deploy, changes stay on your computer (and optional feature branches). The live site is not updated automatically by day-to-day edits.

---

## Connect your local folder to GitHub (Windows)

Your working folder:

`C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast`

### Option A — PowerShell script (easiest)

1. Install Git if needed: https://git-scm.com/download/win  
2. Open **PowerShell** and run:

```powershell
cd "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast"

# If this folder does not have scripts yet, clone first into a temp place
# or download connect-windows.ps1 from the GitHub repo, then:
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\connect-windows.ps1
```

If the folder is empty / not a git repo yet, you can also clone directly:

```powershell
cd "C:\Users\Malik Ghazanfar\Downloads\Demo Pages"
git clone https://github.com/ghazanfar3/aurea-plast-website.git aurea-plast
cd aurea-plast
```

### Option B — Manual commands

```powershell
cd "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast"
git init
git remote remove origin 2>$null
git remote add origin https://github.com/ghazanfar3/aurea-plast-website.git
git fetch origin
git checkout -B main origin/main
git pull origin main
git remote -v
```

You should see `origin` pointing at `ghazanfar3/aurea-plast-website`.

### Open in Cursor

**File → Open Folder** → select:

`C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast`

Then ask Cursor to make website changes here. Say **deploy** only when you want them on the live site.

---

## Preview locally (before deploy)

```powershell
cd "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast"
python -m http.server 4173
```

Open http://127.0.0.1:4173/

---

## Save work (local / GitHub backup, not live yet)

```powershell
git add .
git commit -m "Describe your change"
git push -u origin HEAD
```

Using a feature branch keeps `main` (live site) unchanged until deploy:

```powershell
git checkout -b feature/my-update
# edit files...
git add .
git commit -m "Describe your change"
git push -u origin feature/my-update
```

---

## Deploy (only when you ask)

When you say **deploy**, we will:

1. Merge / push approved changes to **`main`**
2. Let GitHub Pages rebuild **https://aureaplastclinic.com**

That is the only step that updates the public website.

---

## Project layout

```
├── index.html                 Home
├── about.html, contact.html, appointment.html, ...
├── css/                       Styles
├── js/                        Scripts
├── assets/                    Images & media
├── CNAME                      GitHub Pages custom domain
├── scripts/serve.sh           Local preview (Mac/Linux)
├── scripts/connect-windows.ps1  Connect Windows folder to GitHub
└── README.md                  This file
```
