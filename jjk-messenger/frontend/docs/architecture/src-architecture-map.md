# Source Architecture Map

Date: 2026-05-25.

`src/app` stays thin and delegates interactive views to `core/presentation`.
The production path is now:

```text
src/app route
  -> core/presentation component
    -> core/presentation hook
      -> core/application use case when a business action is executed
        -> core/domain repository contract
      -> core/infrastructure adapter for RTK Query, storage or realtime
```

## Active Feature Placement

| Feature | Route | Presentation | Application | Infrastructure | Domain |
| --- | --- | --- | --- | --- | --- |
| Login | `src/app/login/page.tsx` | `core/presentation/components/pages/auth/LoginPage.tsx` | `createLoginUseCase` | `useAuthApiRepository`, `authApi`, `authStorage` | `LoginCredentials`, `AuthSession` |
| Register | `src/app/register/page.tsx` | `core/presentation/components/pages/auth/RegisterPage.tsx` | `createRegisterUseCase` | `useAuthApiRepository`, `authApi` | `RegisterCredentials`, validation policies |
| Dashboard chat | `src/app/dashboard/page.tsx` | `core/presentation/components/pages/dashboard/DashboardPage.tsx` | none yet for chat send because backend exposes WebSocket send only | `chatApi`, `retainAuthenticatedSocket` | `User`, `Message`, `SendMessageRequest` |

## Canonical Surfaces

There are no compatibility re-export folders left at the top level. The canonical
frontend source surfaces are `src/app`, `src/core`, and `src/shared`.

Do not add implementation or adapter files under legacy top-level `src/store`,
`src/components`, or `src/utils` paths.
