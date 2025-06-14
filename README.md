# Mimir

AI-powered prototyping tool. Work with AI to generate useful boilerplate to hack on.

![image](https://github.com/user-attachments/assets/9f38c50b-1b32-4484-b048-89452bfe1bc0)


## What does this do?

Aspirationally, Mimir is trying to be a desktop app that combines an AI assistant with a live code editor and preview. I've always wanted a tool to speed up my prototyping and boilerplate generation, and everything else available in the wild has fallen short of my own expectations.

_Note: The app is very much not in a working state currently. I am iterating on it as I find time._

## Features

- Chat with AI to generate and modify code
- Live code editing with Monaco Editor
- Real-time preview of your application
- Git integration for version control
- Support for multiple LLM providers (OpenAI, Anthropic, Google)
- Local model support
- SQLite database for persistent storage

## Tech Stack

- **Desktop Framework**: Tauri 2.x
- **Frontend**:
  - Vue 3 with Composition API
  - TailwindCSS for styling
  - Radix-Vue components
  - Pinia for state management
  - Vue Query for data fetching
- **Backend**:
  - Node.js 20+
  - SQLite with Drizzle ORM
- **Code Editing**: Monaco Editor

## Installation

```bash
# Clone the repository
git clone https://github.com/spmurrayzzz/mimir.git

# Navigate to project directory
cd mimir

# Install dependencies
npm install
```

## Building for Production

```bash
# Build the application bundle
npm run tauri build
```

## Development

```bash
# Run the web app + Tauri backend
npm run tauri dev

# Lint the codebase
npm run lint
```

## Project Structure

```
mimir/
├── src/
│   ├── main/           # Electron main process code
│   ├── components/     # Vue components
│   ├── views/          # Application pages
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia stores
│   ├── composables/    # Vue composables
│   ├── prompts/        # AI prompt templates
│   ├── ipc/            # IPC handlers
│   ├── db/             # Database schema and operations
│   ├── lib/            # Utility functions
│   └── styles/         # Global styles
├── electron/           # Electron configuration
└── drizzle/            # ORM migrations
```

## Providers

Mimir supports multiple AI providers:
- OpenAI
- Anthropic
- Google AI
- Local Models
