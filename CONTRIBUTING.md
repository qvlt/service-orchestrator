# Contributing to @qvlt/service-orchestrator

Thank you for your interest in contributing to @qvlt/service-orchestrator! This document provides guidelines for contributing to the project.

## TL;DR

1. Fork the repository
2. Create a feature branch from `dev`
3. Make your changes
4. Test your changes
5. Submit a pull request to `dev`

## Project Flow

### Branch Strategy

- `main` - Production releases
- `dev` - Development branch for new features
- `feature/*` - Feature branches (created from `dev`)

### Development Commands

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linting
pnpm lint

# Build the package
pnpm build

# Run smoke tests
pnpm smoke
```

## Commit Style

Please use conventional commit format:

```
type(scope): description

feat: add new job scheduler
fix: resolve memory leak in orchestrator
docs: update README with new examples
```

## Pull Request Process

1. Ensure your changes are tested
2. Update documentation if needed
3. Ensure all CI checks pass
4. Request review from maintainers

## Questions?

If you have questions, please open an issue or contact us at security@qvlt.io.
