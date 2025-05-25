import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock setTimeout and clearTimeout for notification service
global.setTimeout = vi.fn().mockImplementation((callback: () => void, delay: number) => {
  return 1; // Return a mock timer ID
}) as any;

global.clearTimeout = vi.fn(); 