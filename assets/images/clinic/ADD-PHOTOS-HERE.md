# How to add the clinic photos (required before deploy)

Save these 6 photos into:

`assets/images/clinic/`

| Filename | Which photo |
|---|---|
| `hero-lounge.jpg` | Lounge with backlit circular **AureaPlast** logo (cream chairs) |
| `reception-desk.jpg` | Reception desk close-up with yellow **RECEPTION** letters |
| `reception-wide.jpg` | Wider reception / wood feature wall + pendant light |
| `waiting-sofas.jpg` | Waiting area with **blue sofas** + pull-up banner |
| `lounge-chairs.jpg` | Cream chairs under logo (alternate lounge angle) |
| `lounge-portal.jpg` | Lounge with illuminated oval portal / doorway |

## Fastest method (Windows)

1. Open folder: `C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast\assets\images\clinic`
2. Copy your 6 photos in and **rename** them to the names above
3. In PowerShell from the project folder:
   ```powershell
   python scripts/optimize-clinic-images.py
   git add assets/images/clinic
   git commit -m "Add real Aurea Plast clinic photos"
   git push
   ```
4. Tell Cursor: **deploy**

## Or in Cursor

Drag the 6 renamed files into `assets/images/clinic` in the file tree, then say **continue** / **deploy**.
