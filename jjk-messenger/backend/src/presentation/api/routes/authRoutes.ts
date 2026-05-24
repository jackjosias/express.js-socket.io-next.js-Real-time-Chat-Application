// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Fichier de routes pour l'authentification.
 */
import { Router, RequestHandler } from 'express';
import { AuthController } from '../controllers/AuthController';

import { loginSchema, registerSchema } from '../validators/authValidators';
import { asyncHandler } from '../middlewares/asyncHandler';
import { loginRateLimit, registerRateLimit } from '../middlewares/rateLimitMiddleware';
import { validate } from '../middlewares/validationMiddleware';

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  // 🛡️ Route pour l'inscription d'un nouvel utilisateur, avec validation et gestion async
  router.post('/register', registerRateLimit, validate(registerSchema), asyncHandler(authController.register));

  // 🛡️ Route pour la connexion d'un utilisateur existant, avec validation et gestion async
  router.post('/login', loginRateLimit, validate(loginSchema), asyncHandler(authController.login));

  return router;
};
