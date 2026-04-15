# Vellum Frontend

React/TypeScript frontend application for the Vellum digital asset review platform.

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client services
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── mocks/           # Mock Service Worker setup
│   ├── test/            # Test utilities
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main app component
├── public/              # Static assets
├── index.html           # HTML entry point
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Testing

Tests use Jest and React Testing Library. Mock Service Worker (MSW) is configured for API mocking.

**Run tests:**
```bash
npm test
```

## API Integration

The frontend now defaults to the real backend API during normal development.

- API requests are proxied through Vite to `http://localhost:3000`
- Uploaded file links under `/uploads/...` are also proxied to the backend in development
- MSW remains available for tests and optional mock-driven workflows

### Current Frontend Behavior

- `DashboardPage` is a review queue with default filtering for `In Review` and `Changes Requested`
- `UploadPage` sends multipart `FormData` and supports image/PDF uploads
- `AssetDetailPage` shows image/PDF previews, notes, file links, comments, and versions
- `AdminPage` is responsive and mobile-friendly; `Backend Test` is no longer part of the user-facing app

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Jest** - Testing framework
- **MSW** - API mocking for tests

---

**Last Updated:** March 12, 2026
