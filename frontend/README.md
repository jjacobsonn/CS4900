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

The frontend uses Mock Service Worker for development and testing. To connect to the real backend:

1. Update `src/api/client.ts` with backend URL
2. Ensure backend CORS is configured to allow frontend origin
3. Backend API should be running on `http://localhost:3000`

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Jest** - Testing framework
- **MSW** - API mocking for tests

---

**Last Updated:** February 16, 2026
