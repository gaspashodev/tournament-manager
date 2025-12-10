# Tournament Manager

Une plateforme de gestion de tournois pour jeux de société, TCG et autres compétitions.

![Tournament Manager](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)

## ✨ Fonctionnalités

### Formats de tournoi supportés

- **🗡️ Élimination directe** : Format classique où une défaite élimine. Rapide et décisif.
- **🔀 Double élimination** : Deux chances de rester en vie avec bracket des vainqueurs et des perdants.
- **📊 Phases de groupes** : Répartition en groupes avec classement, puis phase éliminatoire.
- **🏆 Championnat** : Tous les participants s'affrontent. Le meilleur bilan l'emporte.

### Fonctionnalités principales

- ✅ Création de tournois avec assistant de configuration
- ✅ Gestion des participants (ajout, suppression, seeding)
- ✅ Génération automatique des brackets
- ✅ Visualisation du bracket en temps réel
- ✅ Enregistrement des résultats de match
- ✅ Classements des groupes avec calcul automatique des points
- ✅ Support du mode sombre
- ✅ Interface responsive (mobile/desktop)

### Prochaines fonctionnalités (roadmap)

- 🔄 Intégration avec le système de timer partagé
- 📤 Export des résultats
- 📧 Notifications
- 🔗 Partage de tournoi par lien

## 🚀 Installation

```bash
# Cloner le projet
git clone https://github.com/votre-username/tournament-manager.git
cd tournament-manager

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📦 Scripts disponibles

```bash
npm run dev      # Lance le serveur de développement
npm run build    # Build de production
npm run preview  # Preview du build de production
npm run lint     # Vérification ESLint
```

## 🏗️ Structure du projet

```
tournament-manager/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Layout
│   │   ├── tournament/      # Composants spécifiques aux tournois
│   │   └── ui/              # Composants UI réutilisables (shadcn-style)
│   ├── context/             # Context React (TournamentContext)
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitaires (cn, etc.)
│   ├── pages/               # Pages de l'application
│   ├── types/               # Types TypeScript
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Stack technique

- **React 18** - UI Library
- **TypeScript** - Typage statique
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling utility-first
- **React Router** - Navigation
- **Lucide React** - Icônes
- **class-variance-authority** - Variants de composants

## 🔌 Intégration future avec Game Timer

Le projet est conçu pour s'intégrer avec le système de timer partagé :

- Backend : `game-timer-backend`
- App mobile : `gametimer`

L'intégration permettra :
- Création automatique de rooms timer pour chaque match
- Synchronisation des temps de jeu
- Timer simultané ou cumulatif selon la configuration

## 📝 Configuration des tournois

### Élimination directe / Double élimination

```typescript
{
  seeding: 'random' | 'manual' | 'ranked',
  thirdPlaceMatch: boolean,
  bestOf: 1 | 3 | 5 | 7
}
```

### Phases de groupes

```typescript
{
  groupCount: number,
  qualifiersPerGroup: number,
  pointsWin: number,
  pointsDraw: number,
  pointsLoss: number,
  bestOf: 1 | 3 | 5 | 7
}
```

### Championnat

```typescript
{
  homeAndAway: boolean,
  bestOf: 1 | 3 | 5 | 7
}
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT
