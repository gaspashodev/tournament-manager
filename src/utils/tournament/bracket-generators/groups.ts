import { v4 as uuidv4 } from 'uuid';
import type { Match, Participant, Group } from '@/types';
import { createInitialStandings } from '../standings-utils';

/**
 * Génère les matchs pour un tournoi en phases de groupes (round-robin dans chaque groupe)
 */
export function generateGroupStageMatches(
  participants: Participant[], 
  groupCount: number
): { groups: Group[], matches: Match[] } {
  const groups: Group[] = [];
  const matches: Match[] = [];
  
  // Répartir les participants dans les groupes
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const participantsPerGroup = Math.ceil(shuffled.length / groupCount);
  
  for (let g = 0; g < groupCount; g++) {
    const groupParticipants = shuffled.slice(
      g * participantsPerGroup, 
      (g + 1) * participantsPerGroup
    );
    
    const group: Group = {
      id: uuidv4(),
      name: `Groupe ${String.fromCharCode(65 + g)}`,
      tournamentId: '',
      participantIds: groupParticipants.map(p => p.id),
      standings: createInitialStandings(groupParticipants.map(p => p.id))
    };
    
    groups.push(group);
    
    // Générer les matchs round-robin pour ce groupe
    let matchPosition = 0;
    for (let i = 0; i < groupParticipants.length; i++) {
      for (let j = i + 1; j < groupParticipants.length; j++) {
        matches.push({
          id: uuidv4(),
          tournamentId: '',
          round: 1,
          position: matchPosition++,
          participant1Id: groupParticipants[i].id,
          participant2Id: groupParticipants[j].id,
          status: 'pending',
          groupId: group.id
        });
      }
    }
  }
  
  return { groups, matches };
}
