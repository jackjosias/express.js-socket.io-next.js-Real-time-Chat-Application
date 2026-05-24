// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Schémas de validation Zod pour les messages.
 * @date 2025
 * @author Jack-Josias_v9.1
 * @description Centralise les règles de validation pour les routes de messagerie.
 */
import { z } from 'zod';

export const getMessagesSchema = z.object({
  params: z.object({
    // 🛡️ CORRIGÉ: Remplacé .uuid() par .nonempty() pour correspondre au format d'ID de Prisma (CUID).
    // @suture (MSD/MIMI v1.2) Correction chirurgicale pour restaurer la cohérence entre la validation et le modèle de données.
    // @intention (CRIDE/AHIDS v1.0) L'intention est de valider la présence d'un ID sans imposer un format UUID incorrect, respectant ainsi l'intention du schéma de base de données.
    // @see Leçon de Sagesse #45 (BSAGF v9.1 SDV/PoCW/C.I.C.A.T.R.I.X.) sur l'alignement de la validation avec la source de vérité des données.
    userId: z.string().nonempty("L'ID de l'utilisateur ne peut pas être vide."),
  }),
});