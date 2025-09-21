# 1) Image de base (Node LTS, légère)
FROM node:20-slim

# 2) Dossier de travail dans le conteneur
WORKDIR /usr/src/app

# 3) Copier uniquement les manifestes d'abord (meilleure cache layer)
COPY package*.json ./

# 4) Installer les deps (prod seulement par défaut)
RUN npm ci --only=production

# 5) Copier le code de l'app
COPY app ./app

# 6) Exposer le port utilisé par l'API
EXPOSE 5000

# 7) Commande de démarrage (production)
CMD ["node", "app/server.js"]
