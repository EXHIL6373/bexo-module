import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface RouterContextType {
  path: string;
  queryParams: URLSearchParams;
  navigate: (to: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

function parseHashLocation(): { path: string; query: string } {
  let raw = window.location.hash.slice(1);
  if (!raw) {
    const pathname = window.location.pathname;
    if (
      pathname.startsWith('/activate-account') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/college')
    ) {
      raw = pathname + window.location.search;
    } else {
      raw = '/college/dashboard';
    }
  }

  const [pathPart, queryPart] = raw.split('?');
  const normalizedPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;

  // Combine query part with window.location.search if any
  let finalQuery = queryPart || '';
  if (window.location.search && !finalQuery.includes(window.location.search.slice(1))) {
    finalQuery = finalQuery
      ? `${finalQuery}&${window.location.search.slice(1)}`
      : window.location.search.slice(1);
  }

  return { path: normalizedPath, query: finalQuery };
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loc, setLoc] = useState(parseHashLocation);

  useEffect(() => {
    const handleHashChange = () => {
      setLoc(parseHashLocation());
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = (to: string) => {
    const cleanTo = to.startsWith('#') ? to.slice(1) : to;
    window.location.hash = cleanTo;
    setLoc(parseHashLocation());
  };

  const queryParams = useMemo(() => new URLSearchParams(loc.query), [loc.query]);

  // Extract route parameters (e.g. /college/students/:id)
  const params = useMemo(() => {
    const segments = loc.path.split('/').filter(Boolean);
    const p: Record<string, string> = {};
    if (segments[0] === 'college' && segments[1] === 'students' && segments[2] && segments[2] !== 'import') {
      p.id = segments[2];
    }
    return p;
  }, [loc.path]);

  return (
    <RouterContext.Provider value={{ path: loc.path, queryParams, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
};
