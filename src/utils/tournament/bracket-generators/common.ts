/**
 * Génère l'ordre des seeds pour un bracket
 * Pour un bracket de 8, renvoie [1, 8, 4, 5, 2, 7, 3, 6]
 */
export function generateBracketOrder(size: number): number[] {
  if (size < 1) return [];
  if (size === 1) return [1];
  if (size === 2) return [1, 2];
  
  const smaller = generateBracketOrder(size / 2);
  const half = smaller.length / 2;
  const result: number[] = [];
  
  // Première moitié du petit bracket → moitié haute du grand bracket
  for (let i = 0; i < half; i++) {
    const seed = smaller[i];
    result.push(seed);
    result.push(size + 1 - seed);
  }
  
  // Deuxième moitié du petit bracket (inversée) → moitié basse du grand bracket
  for (let i = smaller.length - 1; i >= half; i--) {
    const seed = smaller[i];
    result.push(seed);
    result.push(size + 1 - seed);
  }
  
  return result;
}

/**
 * Génère les positions de bracket pour un placement optimal des seeds
 * Pour 8 joueurs: 1v8, 4v5, 3v6, 2v7 (seeding standard)
 */
export function generateBracketPositions(totalSlots: number): number[] {
  const bracketOrder = generateBracketOrder(totalSlots);
  const positions = new Array(totalSlots);
  
  // Inverser: bracketOrder[slot] = seed → positions[seed-1] = slot
  for (let slot = 0; slot < totalSlots; slot++) {
    const seed = bracketOrder[slot]; // seed 1-indexé
    positions[seed - 1] = slot; // index 0-indexé
  }
  
  return positions;
}

/**
 * Calcule la prochaine puissance de 2 supérieure ou égale à n
 */
export function nextPowerOfTwo(n: number): number {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Calcule le nombre de rounds nécessaires pour un bracket
 */
export function calculateRoundsCount(participantCount: number): number {
  return Math.ceil(Math.log2(participantCount));
}
