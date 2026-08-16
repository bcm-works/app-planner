# Tech stack change

## Status

**Accepted (16 Aug 2026)**

## Context

Change the tech stack used for this project to better support my current drive to learn [Go](https://go.dev/).

Make this repository public and highlight it on my GitHub profile and a new post on my [site](https://github.com/bcm-works/site).

Build out this solution publically, while continuing to store *all consequential* AI prompts and results in the `docs/prompts` directory.

## Decision(s)

Previous tech stack:

- **Frontend App**: Deno Fresh and TypeScript
- **Backend API**: Deno and TypeScript
- **Database**: Deno KV
- **Infrastructure**: Deno Deploy

New tech stack:

- **Frontend App**: Deno Fresh and TypeScript
- **Backend API**: Go
- **Database**: SQLite stored on a persistent Docker Volume
- **Infrastructure**: Docker, GitHub Packages and Railway

Changes needed:

- Tooling updates via links to my [dotfiles dev scripts](https://github.com/bcm-works/dotfiles/tree/main/setup/dev)
- Keep all Go code inside of `/src/api`
- Use related previous tech solutions from [my site repo](https://github.com/bcm-works/site) as a starting point
- Use `docs/API.md` as the technical specification for building out the new backend
- Docs updates to support above changes

## Consequences

- The resulting infrastructure will be more complex
- The time to release will be slower while I improve my Go knowledge
