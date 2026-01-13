This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker

The repository now ships with a `Dockerfile` and `docker-compose.yml` that build the app (`npm run build`) and run it with `npm start`. Because every `.env*` file next to `package.json` is copied into the build stage (nothing in `.dockerignore` strips them), the compiled output sees the same variables you keep locally.

1. Populate `.env` (and any `.env.*` variants you rely on) with the required values.
2. Run `docker compose up --build` to create the production image, expose it on `localhost:3000`, and pass the same `.env` to the runtime container via `env_file`.
3. Stop the stack with `docker compose down`.

If you need a different env file for runtime, pass `--env-file` to `docker compose` or use `docker run --env-file` instead.
