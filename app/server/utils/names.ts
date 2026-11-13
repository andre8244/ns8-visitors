// Lowercase, no accents, single spaces: "Nicolò  D'Amico" -> "nicolo d'amico".
// Used for the searches from the tablet, which match any part of the name
export function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchNameOf(person: { firstName: string; lastName: string }) {
  return normalizeName(`${person.firstName} ${person.lastName}`)
}
