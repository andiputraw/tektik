# Frontend Technical Documentation

## Overview

The Tektik frontend is a modern web application built with **Nuxt 4** (Vue 3). It is designed to be compiled into a static site (Cloudflare Pages) but supports dynamic features through client-side hydration and API integration. The UI is built using **Tailwind CSS 4** and **shadcn-ui** components for a polished, responsive look.

## Technology Stack

-   **Framework**: [Nuxt 4](https://nuxt.com/)
-   **UI Library**: [shadcn-vue](https://www.shadcn-vue.com/) / [Radix Vue](https://www.radix-vue.com/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Icons**: [Lucide Vue Next](https://lucide.dev/)
-   **State Management**: Nuxt `useState` / Pinia (implied) / Composables
-   **Drag & Drop**: `vuedraggable` (for Kanban board)
-   **Notifications**: `vue-sonner`

## Architecture

The frontend follows standard Nuxt conventions:

-   **Pages (`app/pages`)**: File-system based routing.
-   **Components (`app/components`)**: Reusable UI components.
-   **Composables (`app/composables`)**: Shared logic and state (e.g., fetching data, managing auth state).
-   **Layouts (`app/layouts`)**: Wrapper layouts for pages (e.g., Dashboard layout with sidebar).

### Directory Structure

```
frontend/
├── app/
│   ├── assets/       # Static assets (CSS, images)
│   ├── components/   # Vue components (shadcn-ui + custom)
│   ├── composables/  # Logic reuse (useAuth, useProject, etc.)
│   ├── layouts/      # Page wrappers
│   ├── lib/          # Utilities (utils.ts)
│   ├── pages/        # Application routes
│   └── app.vue       # Root component
├── nuxt.config.ts    # Nuxt configuration
├── tailwind.config.ts # Tailwind configuration (if external)
└── package.json      # Dependencies
```

## Key Features

### Kanban Board
The Kanban board (`pages/projects/[id]/index.vue` or similar) uses `vuedraggable` to allow dragging tasks between columns (statuses).
-   **Drag & Drop**: Updates the `status_id` of the task via API.
-   **Real-time Updates**: Listens to WebSocket events from the backend to update the board in real-time when other users move tasks.

### Authentication
-   **Google Login**: Integrated using Nuxt Auth or custom implementation.
-   **Session**: JWT stored in cookies/localStorage.
-   **Auth Guard**: Protected routes redirect to `/login`.

### Task Management
-   **My Tasks**: A unified view of all tasks assigned to the current user across different projects.
-   **Filtering**: Filter tasks by project, status, and assignee.

### Notifications
-   **Rich Notifications**: In-app notifications for task assignments and comments.
-   **Toasts**: Uses `vue-sonner` for feedback (success/error messages).

## Setup & Installation

1.  **Install Dependencies**:
    ```bash
    bun install
    ```

2.  **Environment Variables**:
    Create `.env` based on `.env.example`.
    -   `NUXT_PUBLIC_API_BASE`: URL of the backend API.

3.  **Local Development**:
    Start the development server:
    ```bash
    bun run dev
    ```
    Access at `http://localhost:3000`.

## Build & Deployment

The application is configured for static site generation (targeting Cloudflare Pages).

1.  **Build/Generate**:
    ```bash
    bun run generate
    ```
    This creates a `.output/public` directory ready for deployment.

2.  **Preview**:
    ```bash
    bun run preview
    ```
