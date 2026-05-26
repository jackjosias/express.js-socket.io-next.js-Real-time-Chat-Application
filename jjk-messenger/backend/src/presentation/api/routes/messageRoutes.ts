// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Fichier de routes pour les messages.
 */
import { Router } from 'express';
import { type MessageController } from '../controllers/MessageController';
import { type IAuthService } from '../../../application/service/IAuthService';
import { authMiddleware } from '../middlewares/authMiddleware';

import { getMessagesSchema } from '../validators/messageValidators';
import { validate } from '../middlewares/validationMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const createMessageRoutes = (messageController: MessageController, authService: IAuthService): Router => {
  const router = Router();

  // 🛡️ Route pour récupérer l'historique des messages avec un utilisateur (protégée, validée et avec gestion async)
  router.get('/:userId', authMiddleware(authService), validate(getMessagesSchema), asyncHandler(messageController.getMessages));

  return router;
};
