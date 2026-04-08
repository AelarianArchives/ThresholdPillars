// Mock for $app/environment in vitest
// In test environment (jsdom), browser is true so components render their DOM.
export const browser = true;
export const building = false;
export const dev = true;
export const version = 'test';
