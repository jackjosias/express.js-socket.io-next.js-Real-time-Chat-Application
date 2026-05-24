/**
 * Fichier de configuration pour les variables d'environnement
 */
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
// 🧬 Correction du chemin pour la robustesse en dev (ts-node) et en prod (node dist/index.js)
// En développement, __dirname est `backend/src/config`. En production, il sera `backend/dist/src/config`.
// Le chemin `../../.env` fonctionne pour `src`, mais pas pour `dist`.
// `process.cwd()` pointe à la racine du projet (`backend/`) dans les deux cas.
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

interface Config {
  port: number;
  jwtSecret: string;
  databaseUrl: string;
  nodeEnv: string;
}

// Valeurs par défaut pour le développement
const config: Config = {
  port: parseInt(process.env.PORT || '3002', 10),
  jwtSecret: process.env.JWT_SECRET || '', // La valeur sera validée ci-dessous
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/JJK_messenger',
  nodeEnv: process.env.NODE_ENV || 'development'
};

// 🛡️ Vérifier que les variables essentielles sont définies, quel que soit l'environnement
if (!config.jwtSecret) {
  console.error("ERREUR CRITIQUE: La variable d'environnement JWT_SECRET n'est pas définie.");
  throw new Error('JWT_SECRET doit être défini pour démarrer l\'application.');
}

export default config;