// --- Fichier Modifié: backend/src/infrastructure/logging/logger.ts ---
import debug from 'debug';

/**
 * 🧬 Logger structuré centralisé (Debug)
 * @author Jack-Josias_v9.1
 * @date 2025
 * @description Crée et exporte des instances du logger 'debug' pour différents niveaux.
 *              Le contrôle de l'affichage se fait via la variable d'environnement DEBUG.
 *              Ex: DEBUG=app:info,app:error
 */
const logger = {
  info: debug('app:info'),
  warn: debug('app:warn'),
  error: debug('app:error'),
};

// Par défaut, les logs d'info affichent sur stdout, les autres sur stderr.
logger.info.log = console.log.bind(console);

export default logger;