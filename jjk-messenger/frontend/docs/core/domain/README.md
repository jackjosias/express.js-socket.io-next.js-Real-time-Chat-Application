# Domain Layer

The domain layer contains stable business contracts independent from React,
Next.js, Redux Toolkit and Socket.IO.

Current contents:

- `entities/user.ts`;
- `entities/message.ts`;
- `types/auth.ts`;
- `types/chat.ts`;
- `types/error.ts`;
- `schemas/auth.ts`;
- `repositories/auth.repository.ts`.

`schemas/auth.ts` currently uses small local validators because this frontend has
no Zod dependency. If Zod is introduced later, keep the public validation result
contract stable while replacing the internals.
