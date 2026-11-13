import { FaChevronDown, FaPlus } from 'react-icons/fa6';
import type { Profile } from '../features/profiles/profileStorage';

interface Props {
  activeProfile: Profile | null;
  onOpenProfiles: () => void;
}

/** Top bar with the profile switcher on the left. */
export default function AppHeader({ activeProfile, onOpenProfiles }: Props) {
  return (
    <header className="topbar sticky top-0 z-10 flex items-center bg-page px-4 pb-2.5">
      <button
        className="inline-flex min-h-[46px] max-w-full items-center gap-2.5 rounded-full border border-line bg-surface py-1 pr-4 pl-[5px]"
        onClick={onOpenProfiles}
        aria-haspopup="dialog"
      >
        <span
          className="grid size-9 flex-none place-items-center rounded-full bg-accent font-extrabold text-white"
          aria-hidden="true"
        >
          {activeProfile ? activeProfile.name.trim().charAt(0).toUpperCase() : <FaPlus />}
        </span>
        <span className="truncate font-bold">
          {activeProfile ? activeProfile.name : 'Add profile'}
        </span>
        <FaChevronDown className="flex-none text-xs text-muted" aria-hidden="true" />
      </button>
    </header>
  );
}
