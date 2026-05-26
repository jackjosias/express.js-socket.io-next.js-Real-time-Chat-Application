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
import { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import logger from '../../../infrastructure/logging/logger';

type ErrorWithStatus = Error & {
  status?: unknown;
  statusCode?: unknown;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function getStatusCode(error: unknown): number {
  if (!(error instanceof Error)) {
    return 500;
  }

  const candidate = error as ErrorWithStatus;
  const status = typeof candidate.statusCode === 'number'
    ? candidate.statusCode
    : candidate.status;

  return typeof status === 'number' && status >= 400 && status <= 599 ? status : 500;
}

export const errorMiddleware: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    logger.warn({
      message: 'Erreur de validation Zod interceptée',
      path: req.path,
      errors: fieldErrors,
    });
    res.status(400).json({
      message: 'Données invalides.',
      errors: fieldErrors,
    });
    return;
  }

  const rawMessage = getErrorMessage(error);
  const statusCode = getStatusCode(error);
  const logPayload = {
    message: statusCode >= 500
      ? `Erreur non gérée interceptée: ${rawMessage}`
      : `Erreur HTTP attendue interceptée: ${rawMessage}`,
    stack: getErrorStack(error),
    path: req.path,
    method: req.method,
    statusCode,
  };

  if (statusCode >= 500) {
    logger.error(logPayload);
  } else {
    logger.warn(logPayload);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const message = statusCode >= 500 ? 'Erreur Interne du Serveur' : rawMessage;

  res.status(statusCode).json({
    message,
    error: isProd && statusCode >= 500 ? 'Une erreur serveur est survenue.' : rawMessage,
  });
};
