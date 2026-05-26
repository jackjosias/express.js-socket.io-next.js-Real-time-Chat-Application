# Application Layer

The application layer exposes use case factories. It depends on domain
contracts, not on concrete RTK Query hooks or browser APIs.

Active use cases:

- `createLoginUseCase(authRepository)`;
- `createRegisterUseCase(authRepository)`.

Use cases validate domain payloads and delegate to injected repositories.
Presentation hooks decide how to show errors, toast, redirect or persist browser
state.
