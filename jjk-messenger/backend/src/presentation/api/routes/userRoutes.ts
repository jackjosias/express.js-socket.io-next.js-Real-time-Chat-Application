// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Fichier de routes pour les utilisateurs.
 */
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { IAuthService } from '../../../application/service/IAuthService';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const createUserRoutes = (userController: UserController, authService: IAuthService): Router => {
  const router = Router();

  // 🛡️ Route pour récupérer la liste des utilisateurs (protégée et avec gestion async)
  router.get('/', authMiddleware(authService), asyncHandler(userController.getUsers));

  return router;
};