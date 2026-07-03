# GEODNET Raw RTCM Data Service Developer Portal

This repository contains the source code for the GEODNET Raw RTCM Data Service Developer Portal and Knowledge Base website. It is designed as a single-page static application (SPA) optimized for fast loading and hosting directly on **GitHub Pages**.

## Project Features

1.  **GEODNET Overview & Background**: Information about the world's largest decentralized GNSS reference station network (>20,000 active stations), complete with a custom high-fidelity SVG GEODNET logo and an interactive global network mesh simulation map.
2.  **NTRIP Connection Configurations**: Detailed server setup parameters for `rtcm.geodnet.com:2201` including broadcasted message mappings (MSM4 1074-1134) matching the specifications.
3.  **Station API Reference & Playground**: Fully interactive API Explorer documenting and simulating all endpoints in `GEODNET_STATION_API.md` (mountpoints, coordinates, station metadata, additions, replacements, and QC query systems).
4.  **Enterprise Console Simulator**: An interactive simulation of the wholesale base station management console (`https://rawdata.geodnet.com/console/login`), supporting authorized vs. available mountpoint lists, add station, replace station (edit), and CSV upload/download triggers.
5.  **GNSS Knowledge Base**: Searchable reference guides explaining:
    *   **GNSS Principles**: Constellations, multi-frequency carrier signals.
    *   **Real-Time Kinematic (RTK)**: Carrier phase double-differencing, integer ambiguity resolutions.
    *   **Virtual Reference Station (VRS)**: Atmospheric modeling, virtual base synthesis.
    *   **Precise Point Positioning (PPP)**: NRCAN calculations, ECEF XYZ coordinates.
    *   **RTCM Message Standards**: RTCM 3.2 MSM structures.
    *   **Precise Orbit Determination (POD)**: Dynamic orbit models (SRP, gravity field, perturbations).
    *   **Ionospheric Modeling**: TEC calculations, dual-frequency cancellations.
    *   **Tropospheric Modeling**: ZHD/ZWD delays, mapping functions (VMF3).
6.  **Quality Control Guidelines**: Explanations of base station states (Active, Online, Offline), database quality metrics (MP12, MP21, IOD slips, o/slps), and installation checks.
7.  **Inquiry & Onboarding Form**: Interactive onboarding form for interested customers requesting wholesale RTCM data streams.

## Directory Structure

```text
├── index.html       # Main webpage (SPA layout and components)
├── styles.css       # Custom styles with dark theme, glassmorphism, animations
├── script.js        # Interactive logical scripts (navigation, canvas network map, API explorer, search)
├── .gitignore       # Standard file exclusions
└── README.md        # This repository documentation file
```

## How to Run Locally

You can open the static files locally in any modern web browser:

1.  Clone this repository:
    ```bash
    git clone https://github.com/geodnet/rtcm.git
    ```
2.  Open the directory and double-click `index.html` (or run a local development server like VS Code Live Server or python `http.server`):
    ```bash
    python -m http.server 8000
    ```
3.  Navigate to `http://localhost:8000` in your web browser.

## Deployment to GitHub Pages

To host this website for free on GitHub Pages:

1.  Push this directory to your GitHub repository:
    ```bash
    git remote add origin https://github.com/geodnet/rtcm.git
    git branch -M main
    git add .
    git commit -m "Initial commit of developer portal and documentation"
    git push -u origin main
    ```
2.  In your GitHub repository settings:
    *   Go to **Settings** > **Pages** (in the left sidebar).
    *   Under **Build and deployment** > **Source**, select **Deploy from a branch**.
    *   Under **Branch**, select `main` and the root directory `/`. Click **Save**.
3.  After a minute, your developer portal will be live at:
    `https://geodnet.github.io/rtcm/`
