import { v4 as uuidv4 } from 'uuid';
import type { Match, Participant, GroupStanding } from '@/types';
import { createInitialStandings } from '../standings-utils';

/**
 * Génère les matchs pour un championnat (round-robin complet)
 */
export function generateChampionshipMatches(
  participants: Participant[], 
  homeAndAway: boolean
): { matches: Match[], standings: GroupStanding[] } {
  const matches: Match[] = [];
  let round = 1;
  
  // Round-robin: chaque participant joue contre tous les autres
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round,
        position: matches.length,
        participant1Id: participants[i].id,
        participant2Id: participants[j].id,
        status: 'pending'
      });
      
      // Match retour si home and away
      if (homeAndAway) {
        matches.push({
          id: uuidv4(),
          tournamentId: '',
          round: round + 1,
          position: matches.length,
          participant1Id: participants[j].id,
          participant2Id: participants[i].id,
          status: 'pending'
        });
      }
    }
  }
  
  // Créer les standings pour le championnat
  const standings = createInitialStandings(participants.map(p => p.id));
  
  return { matches, standings };
}
