// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Schémas de validation Zod pour l'authentification.
 * @date 2025
 * @author Jack-Josias_v9.1
 * @description Centralise les règles de validation pour les routes d'authentification.
 */
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.").max(30),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères.").max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().nonempty("Le nom d'utilisateur est requis."),
    password: z.string().nonempty("Le mot de passe est requis."),
  }),
});