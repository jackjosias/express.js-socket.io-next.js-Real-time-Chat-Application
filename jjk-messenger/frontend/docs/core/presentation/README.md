# Presentation Layer

The presentation layer contains client-facing components, providers and hooks.
It may use React state/effects, typed store hooks, infrastructure adapters and
application use cases.

Current map:

- `components/pages/auth/LoginPage.tsx`;
- `components/pages/auth/RegisterPage.tsx`;
- `components/pages/dashboard/DashboardPage.tsx`;
- `components/auth/*`;
- `components/chat/*`;
- `components/providers/StoreProvider.tsx`;
- `hooks/auth/*`;
- `hooks/dashboard/useDashboardViewModel.ts`;
- `hooks/common/useIsClient.ts`.

Do not put new heavy client logic directly in `src/app`.
