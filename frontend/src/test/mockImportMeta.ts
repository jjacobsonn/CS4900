/**
 * Mock import.meta.env for Jest tests
 * This file provides a mock implementation of Vite's import.meta.env
 */

// Mock import.meta at the global level for Jest
if (typeof globalThis.import === "undefined") {
  (globalThis as any).import = {
    meta: {
      env: {
        VITE_API_BASE_URL: "/api",
        VITE_USE_MSW: "true",
        MODE: "test"
      }
    }
  };
}
