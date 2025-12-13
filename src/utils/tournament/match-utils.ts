import type { Match } from '@/types';

/**
 * Calcule le vainqueur d'un match basé sur les scores
 */
export function calculateWinner(
  participant1Id: string | undefined,
  participant2Id: string | undefined,
  score1: number,
  score2: number,
  highScoreWins: boolean = true
): string | undefined {
  if (!participant1Id || !participant2Id) return undefined;
  
  if (score1 === score2) return undefined; // Égalité, pas de vainqueur automatique
  
  if (highScoreWins) {
    return score1 > score2 ? participant1Id : participant2Id;
  } else {
    return score1 < score2 ? participant1Id : participant2Id;
  }
}

/**
 * Trouve le vainqueur de la confrontation directe entre deux participants
 */
export function getHeadToHeadWinner(
  participant1Id: string,
  participant2Id: string,
  matches: Match[]
): string | undefined {
  // Trouver le(s) match(s) entre ces deux participants
  const headToHeadMatches = matches.filter(m => 
    m.status === 'completed' &&
    ((m.participant1Id === participant1Id && m.participant2Id === participant2Id) ||
     (m.participant1Id === participant2Id && m.participant2Id === participant1Id))
  );
  
  if (headToHeadMatches.length === 0) return undefined;
  
  // Compter les victoires
  let wins1 = 0;
  let wins2 = 0;
  
  for (const match of headToHeadMatches) {
    if (match.winnerId === participant1Id) wins1++;
    else if (match.winnerId === participant2Id) wins2++;
  }
  
  if (wins1 > wins2) return participant1Id;
  if (wins2 > wins1) return participant2Id;
  return undefined; // Égalité dans les confrontations directes
}
