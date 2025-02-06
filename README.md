# Ericson Willians Portfolio

A modern web application that demonstrates advanced React architecture and real-time audio synthesis capabilities, presented through a carefully crafted retro-terminal interface. This project serves as a technical showcase of modern web development practices, combining React, TypeScript, and Web Audio APIs within an elegantly designed terminal-inspired user interface.

---

## Overview

This portfolio application demonstrates the seamless integration of modern web technologies while maintaining high performance and code quality standards. The architecture leverages Vite's advanced bundling capabilities, React's component model, and TypeScript's type safety to deliver a robust and maintainable codebase.

Key technical aspects include:

- Real-time audio synthesis implementation using the Web Audio API through Tone.js
- Dynamic data fetching and state management with the GitHub REST API
- Custom UI components built on the foundation of shadcn/ui and Radix primitives
- Comprehensive TypeScript integration for enhanced developer experience and code reliability

---

## Technical Stack

The application is built using a carefully selected set of modern technologies:

- **Build System**: Vite for superior development experience and optimized production builds
- **Framework**: React 19 with TypeScript for type-safe component development
- **Styling**: Tailwind CSS with custom configuration for consistent design implementation
- **UI Components**: shadcn/ui, providing accessible and customizable interface elements
- **Audio Processing**: Tone.js for professional-grade audio synthesis capabilities
- **Data Integration**: GitHub REST API for real-time repository data

---

## Architecture

The project follows a modular architecture that emphasizes code organization and maintainability:

```bash
src/
├── components/           # Reusable UI components
│   ├── synth/           # Audio synthesis components
│   └── ui/              # Core interface components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and helpers
├── types/               # TypeScript type definitions
└── constants/           # Application constants
```

---

## Core Features

### Advanced Audio Synthesis
The application implements a browser-based synthesizer that demonstrates practical applications of the Web Audio API through Tone.js. This showcases real-time audio processing capabilities in modern web browsers.

### Dynamic GitHub Integration
Implements real-time data fetching from the GitHub API, demonstrating efficient state management and data synchronization patterns in React applications.

### Professional UI Implementation
Features a carefully crafted terminal-inspired interface that maintains professional design standards while showcasing technical expertise in modern CSS and component architecture.

---

## Development

### Prerequisites
- Node.js (LTS version)
- pnpm package manager
- GitHub account for repository integration

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/ericsonwillians/ericson-willians-portfolio.git
   cd ericson-willians-portfolio
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

### Component Development
The project uses shadcn/ui components which can be managed through the provided CLI:
```bash
pnpm shadcn-ui add [component-name]
```

---

## Deployment

The application supports streamlined deployment to GitHub Pages:

1. Configure the deployment settings:
   ```json
   {
     "homepage": "https://<USERNAME>.github.io/<REPOSITORY_NAME>"
   }
   ```

2. Build and deploy:
   ```bash
   pnpm build
   pnpm deploy
   ```

---

## License

This project is made available under the MIT License. See the LICENSE file for more details.

---

## Acknowledgments

This project benefits from the following open-source technologies:
- Vite's advanced build tooling
- React's powerful component model
- Tailwind CSS's utility-first framework
- shadcn/ui's accessible component system
- Tone.js's professional audio capabilities

For technical details or contributions, please review the project's issues and pull requests.