import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const getMatches = () => window.matchMedia(query).matches;
  const [matches, setMatches] = useState<boolean>(() => getMatches());

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
