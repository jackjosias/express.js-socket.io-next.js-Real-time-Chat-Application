// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Fichier de validateurs pour les données utilisateur.
 * @date 2025
 * @author Jack-Josias_v9.1
 * @description Centralise les schémas de validation Zod pour les objets liés aux utilisateurs.
 *              Cette structure sera utilisée par les contrôleurs pour valider les entrées.
 * @see Leçon de Sagesse #44 (BSAGF v9.1) sur la validation systématique des données entrantes.
 */
import { z } from 'zod';

// 📝 Exemple de schéma de validation qui pourrait être utilisé à l'avenir.
// export const updateUserProfileSchema = z.object({
//   email: z.string().email().optional(),
//   bio: z.string().max(200).optional(),
// });