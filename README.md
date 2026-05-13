# Kropigo

Kropigo is a modern agricultural marketplace monorepo designed to connect farmers (Kisan) directly with buyers. It streamlines the process of listing produce, managing orders, and facilitating transparent agricultural trade.

## 🏗 Project Structure

This is a **pnpm monorepo** with the following packages:

- **`apps/web`**: Next.js 15+ frontend application (Redux Toolkit, RTK Query, Tailwind CSS).
- **`apps/server`**: Node.js/Express backend API (Mongoose, JWT Auth, Zod Validation).
- **`packages/schemas`**: Shared TypeScript types and Zod schemas used across both frontend and backend.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)
- [MongoDB](https://www.mongodb.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd Kropigo-3
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Create `.env` files in `apps/web` and `apps/server` based on the provided patterns.

### Development

Run both the frontend and backend in development mode:

**Frontend:**
```bash
cd apps/web
pnpm dev
```

**Backend:**
```bash
cd apps/server
pnpm dev
```

## 🛠 Tech Stack

- **Frontend**: Next.js, React, Redux Toolkit, Tailwind CSS, Shadcn UI.
- **Backend**: Express.js, MongoDB (Mongoose), JWT, bcrypt.
- **Shared**: Zod for schema validation and type safety.
- **Package Management**: pnpm workspaces.

## 📄 License

This project is licensed under the ISC License.
