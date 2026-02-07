# Tourism KZ - Frontend

A modern React TypeScript application for exploring tourism attractions in Kazakhstan.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **Utilities:** clsx, tailwind-merge, date-fns
- **Notifications:** React Hot Toast

## Project Structure

```
src/
├── api/              # API client configuration
│   └── client.ts     # Axios instance with interceptors
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── layout/      # Layout components (Navbar, Footer, Layout)
│   ├── attractions/ # Attraction-specific components
│   ├── categories/  # Category-specific components
│   ├── ratings/     # Rating components
│   └── analytics/   # Dashboard components
├── contexts/        # React contexts (AuthContext, etc.)
├── hooks/           # Custom React hooks
├── pages/           # Page components (one folder per page)
├── services/        # API service layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   ├── cn.ts        # className merger
│   ├── constants.ts # App constants
│   └── formatters.ts # Data formatters
└── styles/          # Style configuration
    └── theme.ts     # Design system tokens
```

## Design System

### Colors
- **Primary:** Sky Blue (#0ea5e9 and shades)
- **Secondary:** Amber (#f59e0b and shades)

### Typography
- **Font Family:** Inter (from Google Fonts)
- **Sizes:**
  - Display: 3rem (48px)
  - H1: 2.5rem (40px)
  - H2: 2rem (32px)
  - H3: 1.5rem (24px)
  - Body: 1rem (16px)

### Shadows
- Soft shadow for elevated components
- Card shadow for card elements

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- pnpm (recommended)

### Installation

```bash
cd frontend
pnpm install
```

### Development

```bash
pnpm dev
```

The app will run on `http://localhost:5173`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## API Integration

The frontend connects to the Go backend running at `http://localhost:8080`.

API documentation is available at `/docs/API_ENDPOINTS.md`.

## Features

- User authentication (sign up, sign in, sign out)
- Browse attractions by category and city
- Search functionality
- Detailed attraction views
- Rating system
- Analytics dashboard
- Responsive design

## Environment

The app uses Vite's proxy configuration to forward API requests to the backend:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- API Path: `/api/*`

## License

Private - Tourism Information System for Kazakhstan