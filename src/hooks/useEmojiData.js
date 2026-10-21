import { useEffect, useState } from 'react';
import { getLoadedEmojiSearch, loadEmojiSearch } from '../utils/emojiSearch';

export default function useEmojiData(enabled) {
  const [data, setData] = useState(getLoadedEmojiSearch);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || data) return;
    let active = true;
    loadEmojiSearch().then(
      loaded => {
        if (active) {
          setData(loaded);
          setError(null);
        }
      },
      failure => { if (active) setError(failure); }
    );
    return () => { active = false; };
  }, [enabled, data]);

  return { data, loading: enabled && !data && !error, error };
}
