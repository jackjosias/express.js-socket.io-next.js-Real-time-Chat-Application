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
import { type Request, type Response, type NextFunction } from 'express';
import { type AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => { // Make this middleware synchronous
    const payload = {
      body: req.body as unknown,
      query: req.query as unknown,
      params: req.params as unknown,
    };

    schema.parseAsync(payload)
    .then(() => {
      next(); // Call next on success
    })
    .catch((error: unknown) => {
      next(error);
    });
  };
