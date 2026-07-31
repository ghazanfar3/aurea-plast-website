# Technical SEO batch updater for Aurea Plast (design-preserving)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root 'index.html'))) { $Root = (Get-Location).Path }
Set-Location $Root

$Domain = 'https://aureaplastclinic.com'
$OgImage = "$Domain/assets/images/og-cover.jpg"
$Logo = "$Domain/assets/images/logo.png"
$LastMod = (Get-Date).ToString('yyyy-MM-dd')

$ClinicSchema = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["MedicalClinic", "PlasticSurgery", "LocalBusiness"],
  "@id": "$Domain/#clinic",
  "name": "Aurea Plast Aesthetic & Reconstructive Surgery Clinic",
  "alternateName": "Aurea Plast",
  "url": "$Domain/",
  "logo": "$Logo",
  "image": "$OgImage",
  "telephone": "+923257333788",
  "email": "info@aureaplast.com",
  "priceRange": "\$\$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "2nd Floor, Wazir Hospital, Township Plot 300, Block 1, Sector C-1",
    "addressLocality": "Lahore",
    "addressRegion": "Punjab",
    "postalCode": "54770",
    "addressCountry": "PK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 31.442501974249058,
    "longitude": 74.29391717631317
  },
  "hasMap": "https://www.google.com/maps?cid=1325105483352752683",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      "opens": "14:00",
      "closes": "22:00"
    }
  ],
  "medicalSpecialty": ["Plastic Surgery", "Aesthetic Medicine", "Reconstructive Surgery"],
  "sameAs": [
    "https://www.instagram.com/aureaplast/",
    "https://www.facebook.com/people/Aurea-Plast/61583009556886/"
  ],
  "areaServed": { "@type": "City", "name": "Lahore" },
  "physician": [
    {
      "@type": "Physician",
      "name": "Dr. Noor Ul Ain",
      "medicalSpecialty": "Plastic and Reconstructive Surgery",
      "worksFor": { "@id": "$Domain/#clinic" }
    },
    {
      "@type": "Physician",
      "name": "Dr. Nasir Rafiq",
      "medicalSpecialty": "Aesthetic Medicine",
      "worksFor": { "@id": "$Domain/#clinic" }
    }
  ]
}
</script>
"@

$WebSiteSchema = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "$Domain/#website",
  "url": "$Domain/",
  "name": "Aurea Plast",
  "publisher": { "@id": "$Domain/#clinic" },
  "inLanguage": "en"
}
</script>
"@

$OrgSchema = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "$Domain/#organization",
  "name": "Aurea Plast Aesthetic & Reconstructive Surgery Clinic",
  "url": "$Domain/",
  "logo": {
    "@type": "ImageObject",
    "url": "$Logo"
  },
  "contactPoint": [{
    "@type": "ContactPoint",
    "telephone": "+923257333788",
    "contactType": "customer service",
    "areaServed": "PK",
    "availableLanguage": ["English", "Urdu"]
  }],
  "sameAs": [
    "https://www.instagram.com/aureaplast/",
    "https://www.facebook.com/people/Aurea-Plast/61583009556886/"
  ]
}
</script>
"@

$FaqSchema = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I book my first consultation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use our online booking form, call the clinic directly, or message us on WhatsApp — our team will confirm a time with Dr. Noor Ul Ain or Dr. Nasir Rafiq based on your procedure of interest."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer non-surgical aesthetic treatments?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We offer a range of non-surgical treatments designed to enhance your appearance with minimal downtime."
      }
    },
    {
      "@type": "Question",
      "name": "What should I do before my procedure?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You'll receive detailed pre-operative instructions, which may include avoiding certain medications, stopping smoking, and arranging transportation after surgery."
      }
    },
    {
      "@type": "Question",
      "name": "What happens during the first consultation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your consultation includes a medical assessment, discussion of your goals, treatment recommendations, expected outcomes, risks, recovery information, and an opportunity to ask questions."
      }
    },
    {
      "@type": "Question",
      "name": "Can I combine surgical and non-surgical treatments?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely — many patients combine a surgical procedure with complementary aesthetic treatments as part of one coordinated plan."
      }
    },
    {
      "@type": "Question",
      "name": "What financing or payment options are available?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our patient coordination team will walk you through available payment structures during your consultation."
      }
    }
  ]
}
</script>
"@

$PhysicianSchemas = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "Dr. Noor Ul Ain",
  "medicalSpecialty": "Plastic and Reconstructive Surgery",
  "url": "$Domain/about",
  "worksFor": { "@id": "$Domain/#clinic" },
  "image": "$OgImage"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "Dr. Nasir Rafiq",
  "medicalSpecialty": "Aesthetic Medicine",
  "url": "$Domain/about",
  "worksFor": { "@id": "$Domain/#clinic" },
  "image": "$Domain/assets/images/dr-nasir-rafiq.jpg"
}
</script>
"@

$pages = @(
  @{
    File='index.html'; Path='/'; Name='Home'
    Title='Aurea Plast | Plastic Surgery Clinic Lahore'
    Desc='Boutique plastic, reconstructive and aesthetic clinic in Lahore led by Dr. Noor Ul Ain and Dr. Nasir Rafiq.'
    Keywords='plastic surgery Lahore, aesthetic clinic Pakistan, Dr Noor Ul Ain, Dr Nasir Rafiq, rhinoplasty Lahore'
    HasFaq=$true; HasClinic=$true; HasWebsite=$true; HasOrg=$true; HasPhysicians=$false
    ExtraPreload='<link rel="preload" as="image" href="assets/images/clinic/reception-lounge-v4.jpg" fetchpriority="high">'
  },
  @{
    File='about.html'; Path='/about'; Name='About'
    Title='About Aurea Plast | Surgeons & Clinic Story'
    Desc='Meet Dr. Noor Ul Ain and Dr. Nasir Rafiq and learn the story, values and milestones behind Aurea Plast in Lahore.'
    Keywords='about Aurea Plast, Dr Noor Ul Ain plastic surgeon, Dr Nasir Rafiq aesthetic physician, clinic Lahore'
    HasFaq=$true; HasClinic=$true; HasWebsite=$false; HasOrg=$false; HasPhysicians=$true
    ExtraPreload=''
  },
  @{
    File='plastic-surgery.html'; Path='/plastic-surgery'; Name='Plastic Surgery'
    Title='Plastic Surgery Procedures | Aurea Plast'
    Desc='Explore face, breast, body and reconstructive surgery procedures at Aurea Plast in Lahore with Dr. Noor Ul Ain.'
    Keywords='plastic surgery Lahore, rhinoplasty, facelift, breast augmentation, reconstructive surgery'
    HasFaq=$false; HasClinic=$false; HasWebsite=$false; HasOrg=$false; HasPhysicians=$false
    ExtraPreload=''
  },
  @{
    File='aesthetic-procedures.html'; Path='/aesthetic-procedures'; Name='Aesthetic Procedures'
    Title='Aesthetic Treatments Lahore | Aurea Plast'
    Desc='Non-surgical aesthetic treatments in Lahore including injectables and skin care, led by Dr. Nasir Rafiq.'
    Keywords='aesthetic treatments Lahore, Botox, dermal fillers, skin rejuvenation, Dr Nasir Rafiq'
    HasFaq=$false; HasClinic=$false; HasWebsite=$false; HasOrg=$false; HasPhysicians=$false
    ExtraPreload=''
  },
  @{
    File='success-stories.html'; Path='/success-stories'; Name='Success Stories'
    Title='Before & After Success Stories | Aurea Plast'
    Desc='Browse real patient before and after results from plastic surgery and aesthetic treatments at Aurea Plast Lahore.'
    Keywords='before after plastic surgery Lahore, Aurea Plast success stories, patient results'
    HasFaq=$false; HasClinic=$false; HasWebsite=$false; HasOrg=$false; HasPhysicians=$false
    ExtraPreload=''
  },
  @{
    File='contact.html'; Path='/contact'; Name='Contact'
    Title='Contact Aurea Plast | Clinic in Lahore'
    Desc='Contact Aurea Plast in Lahore for appointments, address, phone, WhatsApp, email and clinic working hours.'
    Keywords='contact Aurea Plast, plastic surgery clinic Lahore address, WhatsApp consultation'
    HasFaq=$false; HasClinic=$true; HasWebsite=$false; HasOrg=$false; HasPhysicians=$false
    ExtraPreload=''
  },
  @{
    File='appointment.html'; Path='/appointment'; Name='Book Appointment'
    Title='Book a Consultation | Aurea Plast Lahore'
    Desc='Book your Aurea Plast consultation online. Choose your doctor, procedure and preferred appointment time in Lahore.'
    Keywords='book consultation Lahore, plastic surgery appointment, Aurea Plast booking'
    HasFaq=$false; HasClinic=$false; HasWebsite=$false; HasOrg=$false; HasPhysicians=$false
    ExtraPreload=''
  }
)

function Get-Breadcrumb($name, $path) {
@"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "$Domain/" },
    { "@type": "ListItem", "position": 2, "name": "$name", "item": "$Domain$path" }
  ]
}
</script>
"@
}

function Build-HeadMeta($p) {
  $url = "$Domain$($p.Path)"
  $hasSwiper = (Get-Content $p.File -Raw) -match 'swiper'
  $swiperCss = if ($hasSwiper) { '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">' + "`n" } else { '' }
  $cssVer = '20260731173000'
  $crumbs = if ($p.Path -ne '/') { (Get-Breadcrumb $p.Name $p.Path) + "`n" } else { '' }
  $schemas = ''
  if ($p.HasWebsite) { $schemas += $WebSiteSchema + "`n" }
  if ($p.HasOrg) { $schemas += $OrgSchema + "`n" }
  if ($p.HasClinic) { $schemas += $ClinicSchema + "`n" }
  if ($p.HasPhysicians) { $schemas += $PhysicianSchemas + "`n" }
  if ($p.HasFaq) { $schemas += $FaqSchema + "`n" }
  $schemas += $crumbs

  $gstatic = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
@"
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$($p.Title)</title>
<meta name="description" content="$($p.Desc)">
<meta name="keywords" content="$($p.Keywords)">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="theme-color" content="#083B66">
<link rel="canonical" href="$url">
<meta property="og:locale" content="en_PK">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Aurea Plast">
<meta property="og:title" content="$($p.Title)">
<meta property="og:description" content="$($p.Desc)">
<meta property="og:url" content="$url">
<meta property="og:image" content="$OgImage">
<meta property="og:image:alt" content="Aurea Plast Aesthetic and Reconstructive Surgery Clinic">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$($p.Title)">
<meta name="twitter:description" content="$($p.Desc)">
<meta name="twitter:image" content="$OgImage">
<link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/images/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
$gstatic
$($p.ExtraPreload)
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.1/aos.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.1/aos.css"></noscript>
$swiperCss<link rel="stylesheet" href="css/style.css?v=$cssVer">
<link rel="stylesheet" href="css/components.css?v=$cssVer">
<link rel="stylesheet" href="css/clinic.css?v=$cssVer">
$schemas
"@
}

foreach ($p in $pages) {
  $path = Join-Path $Root $p.File
  $html = [System.IO.File]::ReadAllText($path)

  # Replace domain in existing content
  $html = $html.Replace('https://www.aureaplast.com', $Domain)
  $html = $html.Replace('http://aureaplastclinic.com', $Domain)
  $html = $html.Replace('http://www.aureaplast.com', $Domain)

  # Replace entire head inner content between <head> and </head>
  $newInner = (Build-HeadMeta $p).Trim() + "`n"
  $html = [regex]::Replace($html, '(?s)(?<=<head>\r?\n).*?(?=</head>)', $newInner)

  # Logo dimensions + descriptive alt
  $html = $html -replace '<img src="assets/images/logo\.png" alt="Aurea Plast Logo" class="brand-logo">', '<img src="assets/images/logo.png" alt="Aurea Plast Aesthetic and Reconstructive Surgery Clinic logo" class="brand-logo" width="160" height="40" decoding="async">'
  $html = $html -replace '<img src="assets/images/logo\.png" alt="Aurea Plast Logo" class="brand-logo" style="height: 40px; width: auto; margin-bottom: 12px;">', '<img src="assets/images/logo.png" alt="Aurea Plast Aesthetic and Reconstructive Surgery Clinic logo" class="brand-logo" width="160" height="40" decoding="async" style="height:40px;width:auto;margin-bottom:12px;">'

  # Defer non-critical scripts at bottom (keep order)
  $html = $html -replace '<script src="https://cdnjs\.cloudflare\.com/ajax/libs/gsap/3\.12\.5/gsap\.min\.js"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>'
  $html = $html -replace '<script src="https://cdnjs\.cloudflare\.com/ajax/libs/gsap/3\.12\.5/ScrollTrigger\.min\.js"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>'
  $html = $html -replace '<script src="https://cdnjs\.cloudflare\.com/ajax/libs/aos/2\.3\.1/aos\.js"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.1/aos.js" defer></script>'
  $html = $html -replace '<script src="https://cdn\.jsdelivr\.net/npm/swiper@11/swiper-bundle\.min\.js"></script>', '<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" defer></script>'
  $html = $html -replace '<script src="js/data\.js\?v=[^"]+"></script>', '<script src="js/data.js?v=20260731173000" defer></script>'
  $html = $html -replace '<script src="js/script\.js\?v=[^"]+"></script>', '<script src="js/script.js?v=20260731173000" defer></script>'
  $html = $html -replace '<script src="js/clinic-gallery\.js\?v=[^"]+"></script>', '<script src="js/clinic-gallery.js?v=20260731173000" defer></script>'
  $html = $html -replace '<script src="js/animations\.js\?v=[^"]+"></script>', '<script src="js/animations.js?v=20260731173000" defer></script>'
  $html = $html -replace '<script src="js/forms\.js\?v=[^"]+"></script>', '<script src="js/forms.js?v=20260731173000" defer></script>'
  $html = $html -replace '<script src="js/emailjs-config\.js\?v=[^"]+"></script>', '<script src="js/emailjs-config.js?v=20260731173000" defer></script>'
  $html = $html -replace '<script src="https://cdn\.jsdelivr\.net/npm/@emailjs/browser@4/dist/email\.min\.js"></script>', '<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" defer></script>'

  # Map iframe title for a11y
  $html = $html -replace '(<iframe src="https://www\.google\.com/maps/embed[^"]*")', '$1 title="Aurea Plast clinic location on Google Maps"'

  # Newsletter label accessibility
  $html = $html -replace '<form class="newsletter-form"><input type="email" placeholder="Your email address" required>', '<form class="newsletter-form" aria-label="Newsletter signup"><label class="sr-only" for="newsletter-email">Email address</label><input id="newsletter-email" type="email" name="email" placeholder="Your email address" required autocomplete="email">'

  [System.IO.File]::WriteAllText($path, $html, [System.Text.UTF8Encoding]::new($false))
  Write-Output "SEO updated: $($p.File) titleLen=$($p.Title.Length) descLen=$($p.Desc.Length)"
}

# Contact form label associations (ids)
$contactPath = Join-Path $Root 'contact.html'
$c = [System.IO.File]::ReadAllText($contactPath)
$c = $c.Replace('<div class="form-field"><label>Full Name <span class="req">*</span></label><input type="text" name="name" required></div>', '<div class="form-field"><label for="contact-name">Full Name <span class="req">*</span></label><input id="contact-name" type="text" name="name" required autocomplete="name"></div>')
$c = $c.Replace('<div class="form-field"><label>Phone <span class="req">*</span></label><input type="tel" name="phone" required></div>', '<div class="form-field"><label for="contact-phone">Phone <span class="req">*</span></label><input id="contact-phone" type="tel" name="phone" required autocomplete="tel"></div>')
$c = $c.Replace('<div class="form-field"><label>Email <span class="req">*</span></label><input type="email" name="email" required></div>', '<div class="form-field"><label for="contact-email">Email <span class="req">*</span></label><input id="contact-email" type="email" name="email" required autocomplete="email"></div>')
$c = $c.Replace('<div class="form-field"><label>Preferred Date</label><input type="date" name="date"></div>', '<div class="form-field"><label for="contact-date">Preferred Date</label><input id="contact-date" type="date" name="date"></div>')
$c = $c.Replace('<div class="form-field"><label>Message</label><textarea name="message" placeholder="Tell us a little about what you''re looking for…"></textarea></div>', '<div class="form-field"><label for="contact-message">Message</label><textarea id="contact-message" name="message" placeholder="Tell us a little about what you''re looking for…"></textarea></div>')
# Fallback for curly apostrophe variant
$c = $c -replace '<div class="form-field"><label>Message</label><textarea name="message" placeholder="([^"]*)"></textarea></div>', '<div class="form-field"><label for="contact-message">Message</label><textarea id="contact-message" name="message" placeholder="$1"></textarea></div>'
[System.IO.File]::WriteAllText($contactPath, $c, [System.Text.UTF8Encoding]::new($false))
Write-Output 'Contact form labels linked'

# Gallery ImageObject schema append before </head> on about if not present - already in clinic schema image
# Add ImageGallery schema near end of about head via re-read - skip if FAQ already covers

# Sitemap + robots
$sitemap = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>$Domain/</loc><lastmod>$LastMod</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>$Domain/about</loc><lastmod>$LastMod</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>$Domain/plastic-surgery</loc><lastmod>$LastMod</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>$Domain/aesthetic-procedures</loc><lastmod>$LastMod</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>$Domain/success-stories</loc><lastmod>$LastMod</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>$Domain/contact</loc><lastmod>$LastMod</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>$Domain/appointment</loc><lastmod>$LastMod</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>
"@
[System.IO.File]::WriteAllText((Join-Path $Root 'sitemap.xml'), $sitemap.Trim() + "`n", [System.Text.UTF8Encoding]::new($false))

$robots = @"
User-agent: *
Allow: /

# Keep API, logs and vendor privately non-indexed
Disallow: /api/
Disallow: /scripts/

Sitemap: $Domain/sitemap.xml
"@
[System.IO.File]::WriteAllText((Join-Path $Root 'robots.txt'), $robots.Trim() + "`n", [System.Text.UTF8Encoding]::new($false))

Write-Output 'sitemap.xml and robots.txt updated'
Write-Output 'Done'
