# App Prototype - Personal Planner

A prototype personal planner app like Sunsama.

## Structure

- [.claude](.claude/) - Project specific config for [Claude Code](https://claude.com/product/claude-code).
- [.zed](.zed/) - Customised [Zed Editor](https://zed.dev/) project configuration.
- [docs/adrs](docs/adrs/) - Architecture Decision Record documents.
- [docs/prompts](docs/prompts/) - Logs of AI prompts and results.
- [docs/AI-USE.md](docs/AI-USE.md) - Policy for use of AI Code Generation tools.
- [src/api](src/api/) - [Go](https://go.dev/) backend.
- [src/app](src/app/) - [Deno Fresh](https://usefresh.dev/) page components, layout, and shared UI.

## Local Setup

First install the required tools:

- [Deno](https://deno.com/) (`latest`) - Install via my [dotfiles deno-setup script](https://github.com/bcm-works/dotfiles/blob/main/dev/deno-setup.sh).
- [Go](https://go.dev/) (`1.26.6`) - Install via my [dotfiles go-setup script](https://github.com/bcm-works/dotfiles/blob/main/dev/go-setup.sh).

Run `deno task setup` from a terminal in this directory.

Then edit the Git Ignored file named `.env` with the relevant values.

*Optional:* Install AI tools via my [dotfiles ai-setup script](https://github.com/bcm-works/dotfiles/blob/main/ai/ai-install.sh).

## Commands

- `deno task setup` - Initial environment setup.
- `deno task update` - Update dependencies.
- `deno task test` - Run tests and code checks.
- `deno task start` - Start all services.
- `deno task start-db` - Start the database.

### Adding a new database migration

1. Create a new file in `src/api/migrations/` using the next sequential prefix, e.g. `0002_add_projects.sql`.
2. Write standard PostgreSQL SQL for the migration.
3. Start the API — the migration is applied automatically and recorded in `migrations`.

Migration filenames must end in `.sql` and are applied in alphabetical order. Each migration is applied exactly once.
