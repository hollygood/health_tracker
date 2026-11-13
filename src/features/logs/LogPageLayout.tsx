import type { ReactNode } from 'react';
import { FaChevronLeft } from 'react-icons/fa6';
import type { Profile } from '../profiles/profileStorage';
import type { EditRequest } from './useEntryEditor';

/** Props every log page receives from App. */
export interface LogPageProps extends EditRequest {
  profile: Profile | null;
  onBack: () => void;
  onOpenProfiles: () => void;
}

interface Props {
  title: string;
  profile: Profile | null;
  onBack: () => void;
  onOpenProfiles: () => void;
  /** Where the back link goes. Defaults to "Home". */
  backLabel?: string;
  /** Rendered only when there is an active profile. */
  children: ReactNode;
}

/** Shared frame for the log pages: back link, title, and a prompt when no profile exists. */
export default function LogPageLayout({
  title,
  profile,
  onBack,
  onOpenProfiles,
  backLabel = 'Home',
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <button
        className="inline-flex min-h-11 items-center gap-1.5 self-start pr-2 font-bold text-accent"
        onClick={onBack}
      >
        <FaChevronLeft aria-hidden="true" /> {backLabel}
      </button>
      <h1 className="text-[26px] font-extrabold tracking-tight">{title}</h1>

      {profile ? (
        children
      ) : (
        <div className="card items-center py-8 text-center">
          <p className="font-bold">Add a profile to start logging</p>
          <p className="text-sm text-muted">Entries are saved to the profile you choose.</p>
          <button className="btn" onClick={onOpenProfiles}>
            Add profile
          </button>
        </div>
      )}
    </div>
  );
}
