/**
 * Contrôleur des messages
 * Gère les routes liées aux messages
 */
import { Request, Response } from 'express';
import { GetMessageHistoryUseCase } from '../../../application/use-cases/Message/GetMessageHistoryUseCase';

export class MessageController {
  constructor(private getMessageHistoryUseCase: GetMessageHistoryUseCase) {}

  getMessages = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }
    const { userId } = req.params;
    const messages = await this.getMessageHistoryUseCase.execute(req.user.userId, userId);
    res.status(200).json({ messages });
  };
}