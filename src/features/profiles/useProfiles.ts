import { useCallback, useEffect, useState } from 'react';
import { loadData, saveData, type AppData, type Profile } from './profileStorage';

export interface ProfilesApi {
  profiles: Profile[];
  activeProfile: Profile | null;
  /** Adds or updates a profile and makes it the active one. */
  saveProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  selectProfile: (id: string) => void;
}

/** Profiles and the active profile, kept in sync with on-device storage. */
export function useProfiles(): ProfilesApi {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => saveData(data), [data]);

  const saveProfile = useCallback((profile: Profile) => {
    setData((d) => ({
      profiles: d.profiles.some((p) => p.id === profile.id)
        ? d.profiles.map((p) => (p.id === profile.id ? profile : p))
        : [...d.profiles, profile],
      activeProfileId: profile.id,
    }));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setData((d) => {
      const profiles = d.profiles.filter((p) => p.id !== id);
      return {
        profiles,
        activeProfileId: d.activeProfileId === id ? (profiles[0]?.id ?? null) : d.activeProfileId,
      };
    });
  }, []);

  const selectProfile = useCallback((id: string) => {
    setData((d) => ({ ...d, activeProfileId: id }));
  }, []);

  return {
    profiles: data.profiles,
    activeProfile: data.profiles.find((p) => p.id === data.activeProfileId) ?? null,
    saveProfile,
    deleteProfile,
    selectProfile,
  };
}
