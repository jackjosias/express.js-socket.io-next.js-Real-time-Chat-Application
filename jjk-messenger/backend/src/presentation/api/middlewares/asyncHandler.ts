// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Wrapper pour les gestionnaires de route asynchrones Express.
 * @date 2025
 * @author Jack-Josias_v9.1
 * @description Cette fonction d'ordre supérieur prend un gestionnaire de route asynchrone,
 *              exécute la promesse et capture toute erreur rejetée, en la passant
 *              au prochain middleware (le gestionnaire d'erreurs d'Express) via `next()`.
 * @suture (MSD/MIMI v1.2) S'intègre de manière transparente dans la chaîne de middlewares d'Express.
 * @intention (CRIDE/AHIDS v1.0) Centraliser et découpler la logique de gestion d'erreur asynchrone.
 * @see Leçon de Sagesse #114 (BSAGF v9.1) sur l'adaptation du code au système de types.
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Définit un type pour nos contrôleurs async. Nous utilisons 'any' car la promesse peut résolvez après que la réponse a été envoyée.
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  // La fonction retournée est un RequestHandler asynchrone.
  // Elle exécute la fonction async et gère la promesse avec try/catch.
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};