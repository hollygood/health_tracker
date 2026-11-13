import type { IconType } from 'react-icons';
import { FaChartColumn, FaHouse } from 'react-icons/fa6';
import type { Route } from '../routes';

type Tab = Extract<Route, 'home' | 'reports'>;

const TABS: { route: Tab; label: string; Icon: IconType }[] = [
  { route: 'home', label: 'Home', Icon: FaHouse },
  { route: 'reports', label: 'Reports', Icon: FaChartColumn },
];

interface Props {
  /** The current route; pages opened from Home keep the Home tab lit. */
  route: Route;
  onNavigate: (route: Route) => void;
}

export default function BottomNav({ route, onNavigate }: Props) {
  const activeTab: Tab = route === 'reports' ? 'reports' : 'home';

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-1/2 z-20 flex w-full max-w-[720px] -translate-x-1/2 border-t border-line bg-surface"
      aria-label="Main"
    >
      {TABS.map(({ route: tab, label, Icon }) => (
        <button
          key={tab}
          className={`flex h-[62px] flex-1 flex-col items-center justify-center gap-1 text-xs font-bold ${
            tab === activeTab ? 'text-accent' : 'text-muted'
          }`}
          aria-current={tab === activeTab ? 'page' : undefined}
          onClick={() => onNavigate(tab)}
        >
          <Icon className="text-xl" aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}
