/**
 * Interfaces de repository pour ConnectionLog
 * Définit les contrats que les implémentations concrètes doivent respecter
 */

import { type ConnectionLog } from "../../domain/entity/ConnectionLog";

export interface IConnectionLogRepository {
  findById(id: string): Promise<ConnectionLog | null>;
  findByUserId(userId: string): Promise<ConnectionLog[]>;
  findActiveByUserId(userId: string): Promise<ConnectionLog | null>;
  create(connectionLog: ConnectionLog): Promise<ConnectionLog>;
  update(connectionLog: ConnectionLog): Promise<ConnectionLog>;
  closeActiveConnection(userId: string): Promise<ConnectionLog | null>;
}
