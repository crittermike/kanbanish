let data = null;
let pending = null;

export const getLoadedEmojiSearch = () => data;

export function loadEmojiSearch() {
  if (!pending) {
    pending = import('./emojiSearchData')
      .then(module => {
        data = module;
        return module;
      })
      .catch(error => {
        pending = null;
        console.error('Failed to load emoji search:', error);
        throw error;
      });
  }
  return pending;
}
