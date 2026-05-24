// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Middleware de validation générique utilisant Zod.
 * @date 2025
 * @author Jack-Josias_v9.1
 * @description Ce middleware est une fonction d'ordre supérieur qui prend un schéma Zod
 *              et renvoie un middleware Express. Il valide le corps, les paramètres et les requêtes (`req.body`, `req.params`, `req.query`)
 *              et renvoie une erreur 400 structurée en cas d'échec.
 * @suture (MSD/MIMI v1.2) S'intègre de manière transparente dans la chaîne de middlewares d'Express.
 * @intention (CRIDE/AHIDS v1.0) Centraliser et découpler la logique de validation, renforçant le SRP.
 * @see Leçon de Sagesse #44 (BSAGF v9.1) sur la validation systématique des données entrantes.
 */
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => { // Make this middleware synchronous
    schema.parseAsync({ // Execute async operation
      body: req.body,
      query: req.query,
      params: req.params,
    })
    .then(() => {
      next(); // Call next on success
    })
    .catch((error) => {
      if (error instanceof ZodError) {
        // Pass ZodError to the global error handler
        // The errorMiddleware should handle the 400 response formatting
        next(error);
      } else {
        // Pass other errors to the global error handler
        next(error);
      }
    });
  };