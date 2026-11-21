# Contributing to Lumio Photos

We welcome contributions from the community!

## Development Guidelines

1. **Keep it Serverless**: Lumio must never introduce a middleman server that receives user files, sessions, or photos.
2. **Type Safety**: All TypeScript code must compile without errors (`npm run build`).
3. **Security First**: Cryptographic operations must use standard, audited WebCrypto APIs. Do not commit secrets or test sessions.
4. **Testing**: Run `npm test` before submitting pull requests.

## Workflow

1. Fork and clone the repository.
2. Create a feature branch: `git checkout -b feat/my-improvement`.
3. Commit your changes following conventional commit syntax.
4. Push and open a Pull Request.
