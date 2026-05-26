# Infrastructure Layer

The infrastructure layer contains concrete technical adapters.

Active responsibilities:

- `store/`: Redux Toolkit store, slices and RTK Query APIs;
- `config/api.ts`: REST and realtime base URL resolution;
- `browser/authStorage.ts`: localStorage session persistence;
- `realtime/socketClient.ts`: shared retained Socket.IO connection;
- `repositories/auth/auth-api.repository.ts`: AuthRepository adapter backed by RTK Query.

The backend currently sends chat messages through Socket.IO and exposes no
`POST /api/messages` route. `chatApi.sendMessage` is therefore a local RTK
mutation placeholder while the actual send happens through the retained socket.
