# ConstructStock Pro - Sistema de Gestão de Materiais

## Overview
A React-based material management system (inventory/stock management) for construction materials. Built with React 19, Vite, and TypeScript.

## Project Structure
- `/components` - Reusable React components
- `/contexts` - React context providers (App, Auth, Notification)
- `/lib` - Utility functions
- `/pages` - Application pages organized by feature
  - Admin - User, supplier, organization, material management
  - Documents - Document center
  - Movements - Stock movements
  - Purchases - Purchase orders
  - Reports - Report center
  - RM - Raw materials
  - Sales - Sales management
  - Stock - Stock listing
  - Transfers - Transfer management
- `/services` - API services
- `/utils` - Utility functions

## Tech Stack
- React 19.2.3
- Vite 6.2.0
- TypeScript 5.8.2
- Tailwind CSS (via CDN)

## Development
- **Dev Server**: `npm run dev` - Runs on port 5000
- **Build**: `npm run build` - Outputs to `/dist`
- **Preview**: `npm run preview`

## Environment Variables
- `GEMINI_API_KEY` - API key for Gemini integration

## Configuration
- Vite configured to allow all hosts for Replit proxy compatibility
- Static deployment configured with build output in `/dist`

## Last Updated
December 2025
