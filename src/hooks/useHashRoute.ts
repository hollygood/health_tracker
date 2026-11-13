import { useCallback, useEffect, useState } from 'react';
import { ROUTES, type Route } from '../routes';

function routeFromHash(hash: string): Route {
  const name = hash.replace(/^#\/?/, '');
  return ROUTES.find((r) => r === name) ?? 'home';
}

/** Minimal hash router: `#/calculator`, `#/reports`, anything else is home. */
export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => routeFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = next === 'home' ? '/' : `/${next}`;
    window.scrollTo(0, 0);
  }, []);

  return [route, navigate];
}
