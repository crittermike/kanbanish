import emojis from 'emojibase-data/en/compact.json';
import shortcodes from 'emojibase-data/en/shortcodes/emojibase.json';
import githubShortcodes from 'emojibase-data/en/shortcodes/github.json';

const normalize = value => value.toLowerCase().replace(/[_\s-]+/g, ' ').trim();

const entries = emojis
  .filter(emoji => emoji.group !== undefined)
  .map(({ unicode, hexcode, label, tags = [] }) => {
    const aliases = [
      ...[githubShortcodes[hexcode] || []].flat(),
      ...[shortcodes[hexcode] || []].flat(),
    ];
    return {
      emoji: unicode,
      label,
      shortcode: aliases[0] || label.replace(/\s+/g, '_'),
      aliases,
      terms: [...new Set([label, ...aliases, ...tags].map(normalize))],
      names: [label, ...aliases].map(normalize),
      tags: tags.map(normalize),
    };
  });

const labels = new Map(entries.map(entry => [entry.emoji, entry.label]));
export const getLabel = emoji => labels.get(emoji) || emoji;

function score(term, query) {
  if (term === query) return 0;
  if (term.startsWith(query)) return 1;
  if (term.split(' ').some(word => word.startsWith(query))) return 2;
  return term.includes(query) ? 3 : Infinity;
}

export function search(query, limit = Infinity) {
  const normalized = normalize(query || '');
  if (!normalized || limit <= 0) return [];
  const words = normalized.split(' ');

  return entries
    .map(entry => {
      // Names/shortcodes outrank tags; matches spread across words come last.
      const rank = entry.emoji === query.trim()
        ? 0
        : Math.min(
          ...entry.names.map(term => score(term, normalized)),
          ...entry.tags.map(term => 4 + score(term, normalized))
        );
      const matches = Number.isFinite(rank) || words.every(word =>
        entry.terms.some(term => term.includes(word))
      );
      if (!matches) return null;
      const alias = entry.aliases
        .map(shortcode => ({ shortcode, rank: score(normalize(shortcode), normalized) }))
        .sort((a, b) => a.rank - b.rank)[0];
      return {
        emoji: entry.emoji,
        label: entry.label,
        rank,
        shortcode: Number.isFinite(alias?.rank) ? alias.shortcode : entry.shortcode,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit);
}
