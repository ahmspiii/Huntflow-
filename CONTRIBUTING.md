# Contributing to HuntFlow

Thank you for your interest in contributing to **HuntFlow**, an open-source Threat Hunting Workflow & Malware Analysis Platform built by **Ahmed Alaa**.

## Development Setup

1. Fork the repository and clone your fork locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` (or create `.env` with `DATABASE_URL`) and start PostgreSQL:
   ```bash
   npm run db:up
   npx prisma db push
   npm run mitre:import
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Workflow

- Create a feature branch from `main`: `git checkout -b feat/your-feature`
- Ensure TypeScript and production build pass with zero errors:
  ```bash
  npx prisma generate
  npm run build
  ```
- Keep commits clear and focused.
- Submit a Pull Request describing your changes and how they were verified.
