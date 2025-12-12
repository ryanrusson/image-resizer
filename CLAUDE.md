# Image Resizer

Browser-based image manipulation tool. All processing happens client-side for privacy.

## Tech Stack

- Next.js 16 (App Router, static export)
- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- react-easy-crop, browser-image-compression

## Commands

```bash
pnpm dev      # Development server
pnpm build    # Static export to ./out
pnpm lint     # ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js pages and layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── image-editor/       # Feature components (crop, compress, favicon, etc.)
├── lib/
│   ├── image-processing/   # Canvas-based image manipulation
│   └── presets.ts          # Avatar presets and aspect ratios
└── types/                  # TypeScript interfaces
```

## Key Patterns

- `'use client'` components throughout (client-side processing)
- Canvas API for image manipulation
- Path alias: `@/` maps to `src/`
- Static export configured for GitHub Pages with dynamic basePath
