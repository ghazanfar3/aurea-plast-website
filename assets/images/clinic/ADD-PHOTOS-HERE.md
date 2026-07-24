# How to add the clinic photos (required before images appear live)

Save these **5** photos into:

`assets/images/clinic/`

| Filename | Which photo |
|---|---|
| `hero-lounge.jpg` | Lounge with backlit circular **AureaPlast** logo (cream chairs) |
| `reception-desk.jpg` | Reception desk close-up with yellow **RECEPTION** letters |
| `reception-wide.jpg` | Wider reception / wood feature wall + pendant light |
| `waiting-sofas.jpg` | Waiting area with **blue sofas** + pull-up banner |
| `lounge-chairs.jpg` | Cream chairs under logo (alternate lounge angle) |

`lounge-portal.jpg` was removed and is not used.

## Push from your PC so Cursor/GitHub can use them

```powershell
cd "C:\Users\Malik Ghazanfar\Downloads\Demo Pages\aurea-plast"
git checkout main
git pull origin main
# confirm files exist:
dir assets\images\clinic
git add assets/images/clinic
git commit -m "Add Aurea Plast clinic photos"
git push origin main
```

Then tell Cursor: **deploy**
