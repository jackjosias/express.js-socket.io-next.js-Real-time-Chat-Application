export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterCredentials = LoginCredentials;

export type AuthSession = {
  userId: string;
  username: string;
};

export type AuthLoginResponse = AuthSession & {
  message?: string;
};

export type AuthSessionResponse = AuthSession;

export type RegisterResponse = {
  message: string;
  user?: {
    id: string;
    username: string;
    createdAt: string;
  };
};
