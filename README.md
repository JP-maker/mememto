# Mememto

Site d'aide à la mémorisation : on colle une leçon, on choisit une méthode (rappel actif, répétition espacée, Feynman) et une date butoir, et Mememto répartit le travail sur les jours restants.

## Structure

```
backend/    API Spring Boot (Java 21, Maven, PostgreSQL, Flyway)
frontend/   Angular + nginx (proxifie /api vers le backend)
mockups/    Maquettes validées (index.html)
docker-compose.yml
```

Le backend est rangé par fonctionnalité sous `com.mememto` (`config`, `web`, puis une zone par domaine : `lesson`, `plan`, `user`…).

## Lancer en local

Première fois seulement : `cd frontend && npm install` (Node 22.22.3 ou plus récent), puis commiter `package-lock.json`.

```
cp .env.example .env     # puis changer POSTGRES_PASSWORD
docker compose up --build
```

- Application : http://localhost:4200
- Vérification : http://localhost:4200/api/ping doit répondre `{"status":"ok"}`
- API du plan : `POST /api/plan` avec `{"deadline":"2026-10-31","minutesPerDay":20}` renvoie les jours du plan

- E-mails de compte (confirmation, mot de passe oublié) : en local ils arrivent dans Mailpit, http://localhost:8025
- Comptes : `POST /api/auth/register | confirm | login | logout | forgot | reset`, `GET /api/auth/me`
- Leçons du compte (session requise) : `GET/POST /api/lessons`, `PUT/DELETE /api/lessons/{id}` (50 leçons maximum par compte)

Seul le frontend est exposé (Mailpit l'est aussi, sur ta machine uniquement). La base et l'API ne sont joignables que par le réseau Docker.

## Connexion Google et Microsoft

Renseigne `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` dans `.env`, puis `docker compose up --build -d`.
Adresses de retour à déclarer chez chaque fournisseur : `http://localhost:4200/login/oauth2/code/google` et `.../microsoft` (remplacer par ton domaine en production).
Microsoft : comptes personnels uniquement (Outlook, Hotmail) ; l'adresse d'un compte professionnel n'est pas garantie par Microsoft, elle est refusée.

## Tests

```
cd backend && mvn test
# sans Maven installé (Git Bash, depuis la racine du projet) :
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd)/backend:/app" -v mememto-m2:/root/.m2 -w /app maven:3.9-eclipse-temurin-21 mvn test
# PowerShell : remplacer $(pwd) par ${PWD} et retirer MSYS_NO_PATHCONV=1
cd frontend && npm test
```

## Intégration et publication (GitHub Actions)

- `ci.yml` : tests backend et frontend + compilation, à chaque push sur `main` et chaque pull request.
- `release.yml` : sur un tag `vX.Y.Z`, relance les tests puis publie `ghcr.io/<compte>/<dépôt>-backend` et `-frontend` (tags `X.Y.Z` et `latest`). La version s'affiche dans le pied de page.

```
git tag v0.1.0 && git push origin v0.1.0
```

À la première publication, les images GHCR sont privées : les rendre publiques (ou se connecter avec un jeton) depuis la page « Packages » du compte GitHub.

## Option « Avec mon IA »

À l'étape 3 du formulaire, l'utilisateur choisit son fournisseur et colle sa clé : l'IA renvoie pour chaque phrase le mot à cacher, des mots clés et trois faux choix. Le résultat est gardé avec la leçon, la séance l'utilise à la place du découpage automatique. Modèles réglables : `AI_ANTHROPIC_MODEL` (défaut `claude-haiku-5-5`) et `AI_OPENAI_MODEL` (défaut `gpt-4.1-mini`) ; à vérifier auprès des fournisseurs.

## Mise en production (serveur Docker)

Le serveur a besoin de Docker, des ports 80 et 443 ouverts, et d'un nom de domaine dont l'enregistrement DNS pointe vers lui.

1. Sur le serveur, créer le dossier `mememto/` avec un `.env` copié de `deploy/.env.prod.example` (`chmod 600`) et un dossier `mememto/deploy/`.
2. Images privées : `docker login ghcr.io` une fois avec un jeton GitHub ayant le droit `read:packages` (ou rendre les paquets publics).
3. Premier lancement à la main : copier `docker-compose.prod.yml` et `deploy/Caddyfile`, puis `docker compose -f docker-compose.prod.yml up -d`. Caddy obtient le certificat HTTPS tout seul.
4. Déploiement automatique à chaque tag `vX.Y.Z` : dans GitHub, créer l'environnement `production`, y mettre les secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (clé privée dédiée, ajoutée aux `authorized_keys` du serveur) et `DEPLOY_KNOWN_HOSTS` (résultat de `ssh-keyscan -t ed25519 <hôte>`), puis la variable de dépôt `DEPLOY_ENABLED=true`.
5. Penser à déclarer `https://<domaine>/login/oauth2/code/google` et `/microsoft` chez Google et Microsoft.

## Choix de sécurité (OWASP)

- Accès refusé par défaut, routes publiques listées une à une (`SecurityConfig`).
- CSRF actif, cookies de session `HttpOnly` et `SameSite=Lax`.
- En-têtes de protection : CSP, `nosniff`, `Referrer-Policy`, anti-clickjacking.
- Aucun secret dans le dépôt : mot de passe de base via `.env` (ignoré par git), sans valeur par défaut.
- Erreurs sans stacktrace ni message interne ; `ddl-auto: validate`, schéma géré par Flyway.
- Mots de passe hachés en Argon2id ; jetons e-mail à usage unique, stockés hachés (SHA-256), valables 24 h (confirmation) ou 1 h (réinitialisation).
- Les réponses d'inscription et de « mot de passe oublié » ne révèlent pas si une adresse existe. Cinq échecs de connexion bloquent l'adresse 15 minutes.
- Nouvel identifiant de session à chaque connexion.
- Conteneurs exécutés sans droits root.
- Option « Avec mon IA » : la clé de l'utilisateur voyage dans une seule requête `POST /api/prepare`, est transmise au fournisseur (Anthropic ou OpenAI, adresses fixes côté serveur) puis oubliée. Elle n'est ni stockée, ni journalisée (`toString` masqué), ni enregistrée avec la leçon ; les erreurs du fournisseur ne sont jamais renvoyées au navigateur (seul leur début figure dans les journaux du serveur).

## À faire ensuite

1. Mises à jour automatiques des dépendances (Dependabot) et actions GitHub épinglées par empreinte.
2. Limitation du débit sur `/api/prepare` et sur la connexion au-delà de la mémoire d'un seul serveur.
