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

Update the Git Ignored file named `.env` with the relevant Deno Deploy database ID and access token.

*Optional:* Install AI tools via my [dotfiles ai-setup script](https://github.com/bcm-works/dotfiles/blob/main/ai/ai-install.sh).

## Commands

### App Frontend

The main commands are:

- `deno task setup` - Initial environment setup.
- `deno task serve` - Start the web server.
- `deno task test` - Run all tests and show test coverage.
- `deno task check` - Run Deno code check tools.
- `deno task list` - List all commands.
