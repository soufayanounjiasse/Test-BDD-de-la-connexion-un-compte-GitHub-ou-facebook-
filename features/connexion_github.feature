# language: fr
@connexion
Fonctionnalité: Connexion à un compte GitHub
  Afin d'accéder à mes dépôts
  En tant qu'utilisateur
  Je veux me connecter à mon compte GitHub

  # Par défaut, les scénarios tournent sur un FAUX site de connexion local (reproductible, sans réseau,
  # sans risque de bloquer un vrai compte). Le scénario @reel vise le vrai github.com.

  Contexte:
    Soit je suis sur la page de connexion de GitHub

  Scénario: Le mot de passe saisi n'est pas affiché en clair
    Alors le champ du mot de passe est masqué

  Scénario: Connexion réussie avec des identifiants valides
    Quand je saisis l'identifiant "etudiant-test" et le mot de passe "MotDePasse!42"
    Et je clique sur le bouton "Sign in"
    Alors je suis connecté en tant que "etudiant-test"

  Scénario: Connexion refusée avec un mauvais mot de passe
    Quand je saisis l'identifiant "etudiant-test" et le mot de passe "mauvais"
    Et je clique sur le bouton "Sign in"
    Alors le message d'erreur "Incorrect username or password." est affiché
    Et je ne suis pas connecté

  Plan du scénario: Connexion refusée pour des identifiants invalides
    Quand je saisis l'identifiant "<identifiant>" et le mot de passe "<mot_de_passe>"
    Et je clique sur le bouton "Sign in"
    Alors le message d'erreur "Incorrect username or password." est affiché
    Et je ne suis pas connecté

    Exemples:
      | identifiant   | mot_de_passe  |
      | etudiant-test | motdepasse!42 |
      | inconnu       | MotDePasse!42 |
      | inconnu       | mauvais       |
      |               |               |

  Scénario: Le tableau de bord est protégé quand on n'est pas connecté
    Quand je me rends directement sur le tableau de bord
    Alors je suis redirigé vers la page de connexion

  Scénario: Après une déconnexion, le tableau de bord n'est plus accessible
    Quand je saisis l'identifiant "etudiant-test" et le mot de passe "MotDePasse!42"
    Et je clique sur le bouton "Sign in"
    Alors je suis connecté en tant que "etudiant-test"
    Quand je clique sur le bouton "Sign out"
    Alors je suis redirigé vers la page de connexion
    Quand je me rends directement sur le tableau de bord
    Alors je suis redirigé vers la page de connexion

  Scénario: Après trois échecs, le compte est temporairement verrouillé
    Quand je me trompe 3 fois de mot de passe pour l'identifiant "etudiant-test"
    Et je saisis l'identifiant "etudiant-test" et le mot de passe "MotDePasse!42"
    Et je clique sur le bouton "Sign in"
    Alors le message d'erreur "Too many failed attempts. Try again in 30 seconds." est affiché
    Et je ne suis pas connecté

  Plan du scénario: Le délai de verrouillage augmente à chaque échec
    Quand je me trompe <essais> fois de mot de passe pour l'identifiant "etudiant-test"
    Et je saisis l'identifiant "etudiant-test" et le mot de passe "MotDePasse!42"
    Et je clique sur le bouton "Sign in"
    Alors le message d'erreur "Too many failed attempts. Try again in <delai> seconds." est affiché

    Exemples:
      | essais | delai |
      | 3      | 30    |
      | 4      | 45    |
      | 5      | 68    |

  @reel
  Scénario: Connexion à mon vrai compte GitHub
    Quand je saisis mes identifiants GitHub personnels
    Et je clique sur le bouton "Sign in"
    Alors je suis connecté avec mon compte personnel
