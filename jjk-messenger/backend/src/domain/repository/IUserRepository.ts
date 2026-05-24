/**
 * Interfaces de repository pour User
 * Définit les contrats que les implémentations concrètes doivent respecter
 */

import { User } from "../../domain/entity/User";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  updateOnlineStatus(userId: string, isOnline: boolean): Promise<User>;
  updateLastSeen(userId: string, lastSeenAt: Date): Promise<User>;
}
