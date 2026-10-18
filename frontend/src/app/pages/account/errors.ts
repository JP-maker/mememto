/** Messages affichés selon le code HTTP de l'API. Jamais de détail technique côté utilisateur. */
export function loginError(status: number): string {
  switch (status) {
    case 401:
      return 'E-mail ou mot de passe incorrect.';
    case 403:
      return "Ton adresse e-mail n'est pas encore confirmée. Ouvre le lien reçu à l'inscription.";
    case 429:
      return 'Trop d’essais. Réessaie dans 15 minutes.';
    default:
      return 'Connexion impossible pour le moment. Réessaie dans un instant.';
  }
}

export const GENERIC_ERROR = 'Une erreur est survenue. Réessaie dans un instant.';
