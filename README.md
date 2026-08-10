# App Prototype - Personal Planner

A prototype personal planner app like Sunsama.

## Directory Structure

- [.claude](.claude/) - Project specific config for [Claude Code](https://claude.com/product/claude-code).
- [.zed](.zed/) - Customised [Zed Editor](https://zed.dev/) project configuration.
- [docs/adrs](docs/adrs/) - Architecture Decision Record documents.
- [docs/prompts](docs/prompts/) - Logs of AI prompts and results.
- [docs/AI-USE.md](docs/AI-USE.md) - Policy for use of AI Code Generation tools.
- [src/api](src/api/) - [Deno](https://deno.com/) backend and Deno KV integration.
- [src/app](src/app/) - [Deno Fresh](https://usefresh.dev/) page components, layout, and shared UI.
- [src/server.tsx](src/server/server.tsx) - [Deno](https://deno.com/) server Deno Deploy entrypoint.

## Initial Setup

1. Install the latest stable version of [Deno](https://deno.com/).
2. Run `deno task setup` from a terminal in this directory.
3. Update the Git Ignored file named `.env` with the relevant Deno Deploy database ID and access token.

## Commands

The main commands are:

- `deno task setup` - Initial environment setup.
- `deno task serve` - Start the web server.
- `deno task test` - Run all tests and show test coverage.
- `deno task check` - Run Deno code check tools.
- `deno task list` - List all commands.
