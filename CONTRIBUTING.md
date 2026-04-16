# Contributing Guidelines

## Overview
This repository uses Vitest and Testing Library for frontend unit tests (React + Vite). Follow these guidelines when adding or modifying tests to keep consistency and maintainable coverage.

## Running tests
- Run tests once: `npm test`
- Run tests in watch mode during development: `npm run test:watch`
- Run the Vitest UI: `npm run test:ui`
- Generate coverage report: `npm run coverage`

Tests are expected to live alongside source files or in `src/__tests__/` and to follow the pattern `*.test.{js,jsx,ts,tsx}` or `*.spec.{js,jsx,ts,tsx}`.

## Writing tests
- Use `@testing-library/react` for DOM testing.
- Use `@testing-library/user-event` for user interactions.
- Include accessibility-focused assertions (queries by role, label, text) when possible.
- Keep tests small and deterministic.
- Use `src/setupTests.js` to register global test helpers (for example, `@testing-library/jest-dom`).

## Coverage
- Aim for meaningful coverage across components and utilities. The repository contains coverage reporters configured in `vitest.config.js`. CI pipelines should run `npm run coverage` and fail if required thresholds are not met.

## Pull Requests
- Ensure all tests pass locally before creating a pull request.
- Include new tests for bug fixes and features.
- CI will run the test suite; do not merge if tests fail.

## Files added by testing setup
- `vitest.config.js` — Vitest configuration to use `jsdom` and setup files.
- `src/setupTests.js` — Test setup (register `jest-dom`).
- Example tests under `src/__tests__/`.

## Contact
If you have questions about writing tests or the configuration, please open an issue or contact the repository maintainers.