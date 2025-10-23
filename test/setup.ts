// antes: import "@testing-library/jest-dom";
import '@testing-library/jest-dom/vitest';

import { setupServer } from 'msw/node';
import { handlers } from './msw';

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
