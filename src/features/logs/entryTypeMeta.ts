import type { IconType } from 'react-icons';
import {
  FaHeadSideCough,
  FaNotesMedical,
  FaPills,
  FaRulerVertical,
  FaTemperatureHalf,
} from 'react-icons/fa6';
import type { EntryType } from './entryTypes';

interface EntryTypeMeta {
  label: string;
  Icon: IconType;
  /** Full Tailwind class names (so Tailwind can see them); colours live in styles.css. */
  bgClass: string;
}

/** Label, icon and colour for each kind of entry, shared by Home and Reports. */
export const ENTRY_TYPE_META: Record<EntryType, EntryTypeMeta> = {
  medicine: { label: 'Medicine', Icon: FaPills, bgClass: 'bg-medicine' },
  temperature: { label: 'Temperature', Icon: FaTemperatureHalf, bgClass: 'bg-temperature' },
  sickness: { label: 'Sickness', Icon: FaHeadSideCough, bgClass: 'bg-sickness' },
  growth: { label: 'Growth', Icon: FaRulerVertical, bgClass: 'bg-growth' },
  history: { label: 'Medical history', Icon: FaNotesMedical, bgClass: 'bg-history' },
};

/** Order the types appear in on Home and in filters. */
export const ENTRY_TYPES: readonly EntryType[] = [
  'medicine',
  'temperature',
  'sickness',
  'growth',
  'history',
];
