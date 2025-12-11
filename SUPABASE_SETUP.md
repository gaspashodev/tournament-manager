# Configuration Supabase pour Tournament Manager

## Prérequis

1. Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
2. Un projet Supabase créé

## Installation

### 1. Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anon (Settings > API)

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditez `.env` avec vos valeurs :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

### 3. Créer les tables

Option A : Via l'interface SQL de Supabase

1. Allez dans votre projet Supabase
2. Ouvrez l'éditeur SQL (SQL Editor)
3. Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
4. Exécutez la requête

Option B : Via la CLI Supabase

```bash
# Installer la CLI Supabase
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

### 4. Régénérer les types (optionnel)

Si vous modifiez le schema, régénérez les types TypeScript :

```bash
npx supabase gen types typescript --project-id VOTRE_PROJECT_ID > src/lib/database.types.ts
```

## Structure de la base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `tournaments` | Tournois avec configuration |
| `participants` | Joueurs/équipes |
| `matches` | Matchs avec scores |
| `groups` | Groupes (phase de poules) |
| `group_standings` | Classements des groupes |
| `penalties` | Pénalités appliquées |
| `participant_statuses` | Statuts (éliminé, etc.) |

### Tables cashprize

| Table | Description |
|-------|-------------|
| `cashprize_distributions` | Répartition par place |
| `cashprize_ranges` | Répartition par plage |
| `material_prizes` | Lots matériels par place |
| `material_prize_ranges` | Lots matériels par plage |

### Vues

- `tournaments_with_stats` : Tournois avec statistiques
- `group_standings_with_names` : Classements avec noms

### Fonctions

- `recalculate_group_standings(group_id)` : Recalcule les standings d'un groupe

## Sécurité (Row Level Security)

Par défaut, toutes les tables sont accessibles en lecture et écriture.

Pour ajouter l'authentification :

1. Activez l'authentification dans Supabase
2. Modifiez les politiques RLS dans le fichier de migration
3. Ajoutez un système de login dans l'application

## Mode local (sans Supabase)

L'application fonctionne aussi sans Supabase :

- Les données sont stockées en mémoire
- Les données sont perdues au refresh

Pour activer le mode local, ne définissez pas les variables `VITE_SUPABASE_*`.

## Dépannage

### "Supabase not configured"

Vérifiez que :
- Le fichier `.env` existe
- Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies
- Redémarrez le serveur de développement (`npm run dev`)

### Erreurs de permissions

Vérifiez que :
- RLS est configuré correctement
- Les politiques permettent les opérations nécessaires

### Erreurs de types

Régénérez les types avec la CLI Supabase.
