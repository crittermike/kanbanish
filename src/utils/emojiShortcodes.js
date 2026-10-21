import { getLoadedEmojiSearch } from './emojiSearch';

// Call after loadEmojiSearch() resolves; picker and autocomplete share the same index.
export function searchEmojiShortcodes(query, limit = 8) {
  return getLoadedEmojiSearch()?.search(query, limit)
    .map(({ shortcode, emoji }) => ({ shortcode, emoji })) || [];
}
