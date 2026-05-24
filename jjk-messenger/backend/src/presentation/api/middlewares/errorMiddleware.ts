// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Middleware de gestion d'erreurs global.
 * @date 2025
 * @author Jack-Josias_v9.1
 * @description Ce middleware intercepte toutes les erreurs passées à `next()`.
 *              Il doit être le DERNIER middleware enregistré dans l'application Express.
 *              Il formate une réponse d'erreur JSON cohérente.
 * @see Leçon de Sagesse #115 (BSAGF v9.1) sur l'importance d'un gestionnaire d'erreurs global.
 */
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import logger from '../../../infrastructure/logging/logger';

// 🧬 CORRIGÉ: Ajout du type explicite `ErrorRequestHandler` pour garantir la compatibilité
//    avec la signature attendue par Express, résolvant ainsi l'erreur de compilation TS2769.
// @suture (MSD/MIMI v1.2) Intervention de typage micro-invasive.
// @intention (CRIDE/AHIDS v1.0) L'intention est de se conformer strictement au contrat de type d'Express pour les middlewares d'erreur.
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  // 🧬 Vérifier si l'objet res est une réponse HTTP valide avant d'envoyer une réponse
  if (!res || typeof res.status !== 'function') {
    logger.error({
      message: `Erreur non gérée interceptée (contexte non-HTTP): ${err.message}`,
      stack: err.stack,
      // req.path et req.method pourraient ne pas être disponibles ici, logger prudemment
      path: req?.path,
      method: req?.method
      // 🧬 La tentative de logger le socketId a causé un TypeError car req.socket n'est pas toujours un Socket.IO Socket ici.
      // Les informations spécifiques au socket devraient être loggées dans le contexte Socket.IO approprié.
    });
    // 🛡️ Dans un contexte non-HTTP (comme Socket.IO), on log simplement l'erreur.
    // On ne peut pas envoyer de réponse HTTP.
    return;
  }

  // 🧬 Si c'est une requête HTTP, procéder au traitement standard
  // 🧬 Gestion spécifique pour les erreurs de validation Zod
  if (err instanceof ZodError) {
    logger.warn({
      message: 'Erreur de validation Zod interceptée',
      path: req.path,
      errors: err.flatten().fieldErrors,
    });
    res.status(400).json({
      message: 'Données invalides.',
      errors: err.flatten().fieldErrors,
    });
  } else {
    logger.error({
      message: `Erreur non gérée interceptée: ${err.message}`,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    // 🛡️ Ne pas exposer les détails de la stack en production
    const isProd = process.env.NODE_ENV === 'production';
    const errorMessage = isProd ? 'Une erreur serveur est survenue.' : err.message;
    // Gérer les erreurs de cas d'utilisation qui ont déjà un statut (ex: 401, 404)
    // @ts-ignore
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: 'Erreur Interne du Serveur',
      error: errorMessage,
    });
  }
};