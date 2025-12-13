import { v4 as uuidv4 } from 'uuid';
import type { Match, Participant, GroupStanding, TournamentConfig } from '@/types';
import { createInitialStandings, calculateSwissStandings, SwissStanding } from '../standings-utils';

/**
 * Génère la première ronde d'un tournoi suisse
 */
export function generateSwissFirstRound(
  participants: Participant[],
  seedingType: string
): Match[] {
  const matches: Match[] = [];
  
  // Trier selon le seeding
  let sorted = [...participants];
  if (seedingType === 'manual') {
    sorted.sort((a, b) => (a.seed || 999) - (b.seed || 999));
  } else {
    // Aléatoire
    sorted = sorted.sort(() => Math.random() - 0.5);
  }
  
  // Apparier: 1 vs n/2+1, 2 vs n/2+2, etc. (standard) ou 1 vs 2, 3 vs 4 (accéléré)
  const half = Math.ceil(sorted.length / 2);
  
  for (let i = 0; i < half; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + half];
    
    if (p1 && p2) {
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round: 1,
        position: i,
        participant1Id: p1.id,
        participant2Id: p2.id,
        status: 'pending'
      });
    } else if (p1) {
      // Bye - le joueur gagne automatiquement
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round: 1,
        position: i,
        participant1Id: p1.id,
        participant2Id: undefined, // Bye
        winnerId: p1.id,
        status: 'completed'
      });
    }
  }
  
  return matches;
}

/**
 * Génère la ronde suivante d'un tournoi suisse basé sur les résultats actuels
 * Algorithme amélioré : apparie les joueurs avec les scores les plus proches
 */
export function generateNextSwissRound(
  participants: Participant[],
  existingMatches: Match[],
  roundNumber: number,
  avoidRematches: boolean = true
): Match[] {
  const matches: Match[] = [];
  
  // Calculer les standings actuels
  const standings = calculateSwissStandings(participants, existingMatches);
  
  // Trier par points (desc), puis Buchholz (desc)
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.buchholz - a.buchholz;
  });
  
  // Set des joueurs déjà appariés pour cette ronde
  const paired = new Set<string>();
  
  // Fonction pour trouver le meilleur adversaire pour un joueur
  const findBestOpponent = (player: SwissStanding, allowRematch: boolean): SwissStanding | null => {
    let bestOpponent: SwissStanding | null = null;
    let bestScoreDiff = Infinity;
    
    for (const opponent of standings) {
      // Ignorer si déjà apparié ou c'est le même joueur
      if (paired.has(opponent.participantId) || opponent.participantId === player.participantId) {
        continue;
      }
      
      // Vérifier si déjà affrontés (sauf si allowRematch)
      if (!allowRematch && player.opponents.includes(opponent.participantId)) {
        continue;
      }
      
      // Calculer la différence de score
      const scoreDiff = Math.abs(player.points - opponent.points);
      
      // Prendre l'adversaire avec le score le plus proche
      if (scoreDiff < bestScoreDiff) {
        bestScoreDiff = scoreDiff;
        bestOpponent = opponent;
      }
    }
    
    return bestOpponent;
  };
  
  // Apparier les joueurs par ordre de classement
  for (const player of standings) {
    if (paired.has(player.participantId)) continue;
    
    // Chercher le meilleur adversaire (éviter rematches d'abord)
    let opponent = avoidRematches ? findBestOpponent(player, false) : null;
    
    // Si aucun adversaire trouvé sans rematch, autoriser le rematch
    if (!opponent) {
      opponent = findBestOpponent(player, true);
    }
    
    if (opponent) {
      paired.add(player.participantId);
      paired.add(opponent.participantId);
      
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round: roundNumber,
        position: matches.length,
        participant1Id: player.participantId,
        participant2Id: opponent.participantId,
        status: 'pending'
      });
    } else {
      // Bye pour le joueur restant
      paired.add(player.participantId);
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round: roundNumber,
        position: matches.length,
        participant1Id: player.participantId,
        participant2Id: undefined,
        winnerId: player.participantId,
        status: 'completed'
      });
    }
  }
  
  return matches;
}

/**
 * Génère la première ronde suisse avec les standings initiaux
 */
export function generateSwissInitialRound(
  participants: Participant[],
  config: TournamentConfig
): { matches: Match[], standings: GroupStanding[] } {
  const seedingType = config.seeding || 'random';
  const matches = generateSwissFirstRound(participants, seedingType);
  
  // Créer les standings initiaux (on réutilise GroupStanding pour simplicité)
  const standings = createInitialStandings(participants.map(p => p.id));
  
  return { matches, standings };
}