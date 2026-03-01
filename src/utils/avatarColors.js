/**
 * Predefined avatar colors for user display names.
 * Each color has good contrast against both dark and light backgrounds.
 */
export const AVATAR_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#a3e635', // lime
  '#34d399', // emerald
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
  '#e879f9', // fuchsia
];

/**
 * Generate a random display name from adjective + animal combinations.
 */
const ADJECTIVES = [
  'Happy', 'Brave', 'Clever', 'Swift', 'Gentle',
  'Mighty', 'Calm', 'Bold', 'Bright', 'Kind',
  'Witty', 'Lucky', 'Noble', 'Jolly', 'Keen',
];

const ANIMALS = [
  'Panda', 'Fox', 'Owl', 'Wolf', 'Bear',
  'Hawk', 'Dolphin', 'Tiger', 'Koala', 'Eagle',
  'Otter', 'Falcon', 'Lynx', 'Raven', 'Seal',
];

export const generateRandomName = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
};

export const getRandomColor = () => {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};

/**
 * Get initials from a display name (up to 2 characters).
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};
