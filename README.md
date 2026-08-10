# App Prototype - Personal Planner

A prototype personal planner app like Sunsama.

## Directory Structure

- [.claude](.claude/) - Project specific config for [Claude Code](https://claude.com/product/claude-code).
- [.zed](.zed/) - Customised [Zed Editor](https://zed.dev/) project configuration.
- [src/api](src/api/): [Deno](https://deno.com/) backend and Deno KV integration.
- [src/app](src/app/): [Deno Fresh](https://usefresh.dev/) page components, layout, and shared UI.
- [src/server](src/server/): [Deno](https://deno.com/) server and app routing.

## Initial Setup

1. Install the latest stable version of [Deno](https://deno.com/)
2. Run `deno task setup` from a terminal in this directory

## Commands

The main commands here are:

- `deno task setup`: Initial environment setup.
- `deno task serve`: Run the web server.
- `deno task test`: Run tests.
- `deno task check`: Run Deno code check tools.
- `deno task list`: List all commands.
