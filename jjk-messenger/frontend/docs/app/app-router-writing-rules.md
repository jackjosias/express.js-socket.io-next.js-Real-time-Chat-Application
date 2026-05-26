# App Router Writing Rules

`src/app` is only the Next.js routing surface. Pages and layouts remain Server
Components by default.

Allowed in `src/app`:

- `page.tsx` files that import and render a presentation component;
- `layout.tsx`, metadata, global CSS imports and provider mounting;
- redirects and route conventions.

Avoid in `src/app`:

- `useState`, `useEffect`, RTK Query hooks, direct WebSocket logic;
- form submit logic;
- business validation;
- direct backend URL construction.

Current routes follow this shape:

```text
/login     -> core/presentation/components/pages/auth/LoginPage
/register  -> core/presentation/components/pages/auth/RegisterPage
/dashboard -> core/presentation/components/pages/dashboard/DashboardPage
/          -> redirect('/login')
```
