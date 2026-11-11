# Rana Photo Studio

A responsive passport-photo editing and A4 print-layout web application.

**Repository:** `DkDanger/Rana-Photo-Studio`  
**Status:** First application source implementation committed. Build and device testing are still required.

## Project goals

- Create passport photos at the exact physical size of **35 × 45 mm**.
- Prepare print output at **300 DPI** (approximately **413 × 531 px**).
- Upload and edit JPG, JPEG, PNG, and WebP images.
- Crop, rotate, adjust brightness/contrast/saturation, and position faces.
- Automatically remove photo backgrounds after upload using the browser-based BiRefNet-lite AI model; images stay on the device.
- Arrange multiple photos on A4 paper with adjustable margins, spacing, and copies.
- Export print-ready PDF and support browser printing at 100% scale.
- Provide Hindi and English interface translations.
- Support desktop and mobile browsers, with installable PWA/offline features where feasible.
- Keep photo processing local when possible and explain clearly whenever a feature requires network access.

## Planned technology

The previously drafted project configuration uses React, TypeScript, Vite, Zustand, IndexedDB, ONNX Runtime Web, and jsPDF. These dependencies and implementation details must be verified against the actual source files before the first successful build is claimed.

## Repository safety

This is a separate repository from the existing Rana Typing website. Do not modify or deploy `DkDanger/rana-typing-website` as part of this project unless the owner explicitly asks for integration.

Do not commit API keys, passwords, access tokens, private customer photos, or other secrets.

## Current source-code status

The first working-source implementation is now present. AI background removal is integrated using `@bg0/browser` with the BiRefNet-lite model. The model (about 94 MiB) downloads on first use and is cached by the browser; processing runs on-device. Persistent project storage, undo/redo and offline app caching remain future work.

## Planned source structure

```text
Rana-Photo-Studio/
├── public/
├── src/
│   ├── components/
│   ├── i18n/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This is a planned structure, not a claim that these files already exist.

## Development and verification

Once the complete source is committed, install dependencies and run the project checks defined in `package.json`. Verify TypeScript compilation, production build, image editing, background removal with the actual model file, A4 dimensions, PDF output, language parity, IndexedDB persistence, and mobile layout.

Never describe a feature as tested or working unless the corresponding test was actually run.
