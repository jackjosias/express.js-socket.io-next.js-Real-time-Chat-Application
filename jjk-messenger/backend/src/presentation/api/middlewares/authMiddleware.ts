/**
 * Middleware d'authentification
 * Vérifie la validité du token JWT et attache les informations utilisateur à la requête
 */
import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../../application/service/IAuthService';


// Extension de l'interface Request d'Express pour y ajouter l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}


export const authMiddleware = (authService: IAuthService) =>
{
  return (req: Request, res: Response, next: NextFunction) => {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Accès non autorisé' });
      return; // Ajout d'un return ici pour arrêter l'exécution
    }

    // Extraire le token
    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      res.status(401).json({ message: 'Token invalide ou expiré' });
      return; // Ajout d'un return ici pour arrêter l'exécution
    }

    // Attacher les informations utilisateur à la requête
    req.user = decoded;
    // Donc, req.user.userId fait référence à l'identifiant unique de l'utilisateur qui est actuellement connecté et qui fait la requête.


    next();
  };
};
