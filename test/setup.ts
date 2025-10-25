// test/setup.ts
import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { handlers } from "./msw";
import { vi } from "vitest";
import * as React from "react";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock next/image sin JSX
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement("img", { ...props, alt: props?.alt ?? "" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
