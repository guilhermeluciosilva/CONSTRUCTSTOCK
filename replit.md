# ConstructStock Pro

## Overview
A materials management application for construction and restaurant businesses. Built with React 19, Vite 6, and TypeScript.

## Tech Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)

## Project Structure
```
├── components/          # Reusable UI components
├── contexts/           # React contexts (App, Auth, Notification)
├── lib/                # Utility functions
├── pages/              # Page components organized by feature
│   ├── Admin/          # Admin pages (User, Org, Material management)
│   ├── Common/         # Shared pages (Dashboard, Stock, Reports)
│   ├── Construction/   # Construction-specific pages
│   ├── Restaurant/     # Restaurant-specific pages
│   └── ...
├── services/           # API service layer
├── utils/              # Helper utilities
├── App.tsx             # Main app component with routing
├── index.tsx           # Entry point
└── vite.config.ts      # Vite configuration
```

## Development
- **Port**: 5000
- **Start**: `npm run dev`
- **Build**: `npm run build`

## Deployment
- Static deployment with `dist` as the public directory
- Build command: `npm run build`
