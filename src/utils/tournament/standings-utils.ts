import type { Match, Group, GroupStanding, Participant, Penalty } from '@/types';
import { getHeadToHeadWinner } from './match-utils';

/**
 * Interface pour les standings du système suisse
 */
export interface SwissStanding {
  participantId: string;
  points: number;
  buchholz: number; // Somme des points des adversaires
  wins: number;
  draws: number;
  losses: number;
  opponents: string[]; // Liste des adversaires déjà affrontés
}

/**
 * Crée les standings initiaux pour un groupe ou championnat
 */
export function createInitialStandings(participantIds: string[]): GroupStanding[] {
  return participantIds.map(id => ({
    participantId: id,
    played: 0,
    won: 0,
    lost: 0,
    drawn: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    points: 0
  }));
}

/**
 * Obtient les joueurs à égalité parfaite en tête du classement
 */
export function getTiedParticipants(standings: GroupStanding[]): GroupStanding[] {
  if (standings.length < 2) return standings;
  
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });
  
  const first = sorted[0];
  const firstDiff = first.pointsFor - first.pointsAgainst;
  
  // Trouver tous les joueurs avec les mêmes stats que le premier
  return sorted.filter(s => {
    const diff = s.pointsFor - s.pointsAgainst;
    return s.points === first.points && diff === firstDiff && s.pointsFor === first.pointsFor;
  });
}

/**
 * Détermine le vainqueur d'un tournoi basé sur le format et les résultats
 */
export function determineTournamentWinner(
  format: string,
  matches: Match[],
  groups?: Group[],
  standings?: GroupStanding[],
  useHeadToHead?: boolean
): string | undefined {
  if (format === 'single_elimination' || format === 'double_elimination') {
    // Le vainqueur est celui du dernier match (finale)
    const maxRound = Math.max(...matches.map(m => m.round));
    const finalMatch = matches.find(m => m.round === maxRound);
    return finalMatch?.winnerId;
  }
  
  if (format === 'groups') {
    // Pour les groupes, on prend le meilleur des premiers de chaque groupe
    // (simplifié - normalement il y aurait des playoffs)
    if (!groups) return undefined;
    
    let bestWinner: { id: string; points: number; diff: number } | undefined;
    
    for (const group of groups) {
      if (group.standings && group.standings.length > 0) {
        const sorted = [...group.standings].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const diffA = a.pointsFor - a.pointsAgainst;
          const diffB = b.pointsFor - b.pointsAgainst;
          return diffB - diffA;
        });
        
        const groupWinner = sorted[0];
        const winnerDiff = groupWinner.pointsFor - groupWinner.pointsAgainst;
        
        if (!bestWinner || groupWinner.points > bestWinner.points || 
            (groupWinner.points === bestWinner.points && winnerDiff > bestWinner.diff)) {
          bestWinner = { id: groupWinner.participantId, points: groupWinner.points, diff: winnerDiff };
        }
      }
    }
    
    return bestWinner?.id;
  }
  
  if (format === 'championship') {
    // Le vainqueur est celui avec le plus de points dans le classement
    if (!standings || standings.length === 0) return undefined;
    
    const sorted = [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.pointsFor - a.pointsAgainst;
      const diffB = b.pointsFor - b.pointsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.pointsFor - a.pointsFor;
    });
    
    // Trouver tous les joueurs à égalité parfaite en tête
    const tiedParticipants = getTiedParticipants(standings);
    
    if (tiedParticipants.length >= 2) {
      // S'il y a égalité et que useHeadToHead est activé, regarder la confrontation directe
      if (useHeadToHead && tiedParticipants.length === 2) {
        const winner = getHeadToHeadWinner(
          tiedParticipants[0].participantId,
          tiedParticipants[1].participantId,
          matches
        );
        if (winner) return winner;
      }
      
      // Si plus de 2 joueurs à égalité ou pas de vainqueur en confrontation directe
      // -> pas de vainqueur automatique
      return undefined;
    }
    
    return sorted[0].participantId;
  }
  
  if (format === 'swiss') {
    // Le vainqueur est celui avec le plus de points dans le classement suisse
    if (!standings || standings.length === 0) return undefined;
    
    // Trier par points (desc), puis différence (desc)
    const sorted = [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.pointsFor - a.pointsAgainst;
      const diffB = b.pointsFor - b.pointsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.won - a.won; // Nombre de victoires
    });
    
    // S'il y a égalité parfaite en tête
    const first = sorted[0];
    const tied = sorted.filter(s => s.points === first.points);
    
    if (tied.length >= 2) {
      // En cas d'égalité, pas de vainqueur automatique
      // (normalement il y aurait un tie-breaker ou match décisif)
      return undefined;
    }
    
    return sorted[0].participantId;
  }
  
  return undefined;
}

/**
 * Calcule les standings pour un tournoi au format suisse
 */
export function calculateSwissStandings(
  participants: Participant[],
  matches: Match[],
  pointsConfig?: { pointsWin?: number; pointsDraw?: number; pointsLoss?: number },
  penalties?: Penalty[]
): SwissStanding[] {
  // Valeurs par défaut (système échecs classique si non spécifié)
  const pointsWin = pointsConfig?.pointsWin ?? 1;
  const pointsDraw = pointsConfig?.pointsDraw ?? 0.5;
  const pointsLoss = pointsConfig?.pointsLoss ?? 0;
  
  // Initialiser les standings
  const standings: Map<string, SwissStanding> = new Map();
  
  for (const p of participants) {
    standings.set(p.id, {
      participantId: p.id,
      points: 0,
      buchholz: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      opponents: []
    });
  }
  
  // Calculer les points basés sur les matchs complétés
  for (const match of matches.filter(m => m.status === 'completed')) {
    const p1 = standings.get(match.participant1Id!);
    const p2 = match.participant2Id ? standings.get(match.participant2Id) : null;
    
    // Cas d'un bye (pas d'adversaire)
    if (p1 && !p2 && match.winnerId === match.participant1Id) {
      p1.points += pointsWin;
      p1.wins += 1;
      continue;
    }
    
    if (!p1 || !p2) continue;
    
    // Enregistrer les adversaires
    if (!p1.opponents.includes(match.participant2Id!)) {
      p1.opponents.push(match.participant2Id!);
    }
    if (!p2.opponents.includes(match.participant1Id!)) {
      p2.opponents.push(match.participant1Id!);
    }
    
    // Attribuer les points selon la configuration
    if (match.winnerId === match.participant1Id) {
      p1.points += pointsWin;
      p1.wins += 1;
      p2.points += pointsLoss;
      p2.losses += 1;
    } else if (match.winnerId === match.participant2Id) {
      p2.points += pointsWin;
      p2.wins += 1;
      p1.points += pointsLoss;
      p1.losses += 1;
    } else {
      // Match nul
      p1.points += pointsDraw;
      p2.points += pointsDraw;
      p1.draws += 1;
      p2.draws += 1;
    }
  }
  
  // Calculer le Buchholz (somme des points des adversaires)
  const standingsArray = Array.from(standings.values());
  for (const s of standingsArray) {
    s.buchholz = s.opponents.reduce((sum, oppId) => {
      const opp = standings.get(oppId);
      return sum + (opp?.points || 0);
    }, 0);
  }
  
  // Appliquer les pénalités
  if (penalties && penalties.length > 0) {
    for (const penalty of penalties) {
      const standing = standingsArray.find(s => s.participantId === penalty.participantId);
      if (standing) {
        standing.points -= penalty.points;
      }
    }
  }
  
  return standingsArray;
}

/**
 * Convertit les standings Swiss en GroupStanding pour l'affichage
 */
export function swissStandingsToGroupStandings(swissStandings: SwissStanding[]): GroupStanding[] {
  return swissStandings.map(s => ({
    participantId: s.participantId,
    played: s.wins + s.draws + s.losses,
    won: s.wins,
    drawn: s.draws,
    lost: s.losses,
    pointsFor: Math.round(s.points * 2), // Victoire = 2 points, nul = 1
    pointsAgainst: 0, // Pas utilisé en Swiss
    points: Math.round(s.points * 2)
  }));
}
