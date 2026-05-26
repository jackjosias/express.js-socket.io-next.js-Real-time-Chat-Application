import { type Request, type Response } from "express";
import { type RefreshSessionUseCase } from "../../../application/use-cases/Auth/RefreshSessionUseCase";
import { type LogoutSessionUseCase } from "../../../application/use-cases/Auth/LogoutSessionUseCase";
import { type RegisterUserUseCase } from "../../../application/use-cases/User/RegisterUserUseCase";
import { type LoginUserUseCase } from "../../../application/use-cases/User/LoginUserUseCase";
import { CSRF_HEADER_NAME, REFRESH_TOKEN_COOKIE_NAME } from "../../../infrastructure/security/authConstants";
import { clearAuthCookies, setAuthCookies } from "../security/authCookies";
import { getCookie } from "../security/cookieUtils";

type AuthCredentialsBody = {
  username: string;
  password: string;
};

function isAuthCredentialsBody(value: unknown): value is AuthCredentialsBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.username === "string" && typeof candidate.password === "string";
}

function getAuthCredentials(value: unknown): AuthCredentialsBody {
  if (!isAuthCredentialsBody(value)) {
    const error = new Error("Invalid authentication payload") as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  return value;
}

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private refreshSessionUseCase: RefreshSessionUseCase,
    private logoutSessionUseCase: LogoutSessionUseCase
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = getAuthCredentials(req.body as unknown);
    const user = await this.registerUserUseCase.execute(username, password);
    res.status(201).json({
      message: "Utilisateur cree avec succes",
      user: { id: user.id, username: user.username, createdAt: user.createdAt },
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = getAuthCredentials(req.body as unknown);
    const session = await this.loginUserUseCase.execute(username, password);
    setAuthCookies(res, session);
    res.status(200).json({
      message: "Connexion reussie",
      userId: session.userId,
      username: session.username,
    });
  };

  session = (req: Request, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ message: "Utilisateur non authentifie" });
      return;
    }

    res.status(200).json({
      userId: req.user.userId,
      username: req.user.username,
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = getCookie(req, REFRESH_TOKEN_COOKIE_NAME);
    const csrfToken = req.header(CSRF_HEADER_NAME);

    if (!refreshToken || !csrfToken) {
      clearAuthCookies(res);
      res.status(401).json({ message: "Session invalide ou expiree" });
      return;
    }

    const session = await this.refreshSessionUseCase.execute(refreshToken, csrfToken);
    setAuthCookies(res, session);
    res.status(200).json({
      message: "Session renouvelee",
      userId: session.userId,
      username: session.username,
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = getCookie(req, REFRESH_TOKEN_COOKIE_NAME);
    await this.logoutSessionUseCase.execute(refreshToken);
    clearAuthCookies(res);
    res.status(204).send();
  };
}
