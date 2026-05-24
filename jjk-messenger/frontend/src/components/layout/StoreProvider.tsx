'use client';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/store';
import { rehydrateAuthState } from '@/store/slices/authSlice';
import { setCurrentUserId } from '@/store/slices/chatSlice';

// CONVENTION_COMMENTAIRES_JACK_JOSIAS_EMOJI_V9_1
/**
 * 🧬 Composant Provider pour le store Redux, avec logique de réhydratation côté client.
 * @date 2025
 * @author Jack-Josias_v9.1
 * @description Ce composant assure que le store Redux est créé une seule fois par requête.
 *              Il contient également la logique cruciale pour réhydrater l'état
 *              depuis le localStorage UNIQUEMENT côté client, après le premier rendu,
 *              ce qui résout les erreurs d'hydratation SSR.
 * @suture (MSD/MIMI v1.2) S'enveloppe autour de l'application dans `layout.tsx` pour fournir le contexte Redux.
 * @intention (CRIDE/AHIDS v1.0) Séparer la création du store de la logique de réhydratation client-side.
 */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState<AppStore>(() => makeStore());

  // 🧬 Logique de réhydratation qui ne s'exécute qu'une fois côté client
  useEffect(() => {
    // Dispatch l'action pour lire le localStorage et mettre à jour l'état d'authentification
    store.dispatch(rehydrateAuthState());

    // S'abonne aux changements du store pour synchroniser le `currentUserId` dans chatSlice
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const currentUserId = state.auth.userId;
      // Évite les dispatchs inutiles si la valeur n'a pas changé
      if (state.chat.currentUserId !== currentUserId) {
        store.dispatch(setCurrentUserId(currentUserId));
      }
    });

    return () => unsubscribe(); // Nettoie l'abonnement
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
