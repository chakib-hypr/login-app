# Auth App

A small Express app with account registration, login, and a protected profile view.

## Requirements

- Node.js 20.6 or newer
- npm

## Run locally

1. In the project folder, install dependencies:

   ```sh
   npm install
   ```

2. Ensure a `.env` file exists in the project folder with a private JWT secret of at least 32 characters and a port:

   ```env
   JWT_SECRET= your input
   PORT=3000
   ```

   Generate a random secret with `openssl rand -hex 32`, then use its output as the `JWT_SECRET` value. Do not commit or share `.env`.

3. Start the server:

   ```sh
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser. Use this URL rather than VS Code Live Server; the Express server provides both the page and its `/api` endpoints.

User accounts are stored locally in `data/users.json` when first registered.
