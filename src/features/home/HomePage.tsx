import type { IconType } from 'react-icons';
import {
  FaCalculator,
  FaChevronRight,
  FaFloppyDisk,
  FaHeadSideCough,
  FaNotesMedical,
  FaPills,
  FaRulerVertical,
  FaTemperatureHalf,
} from 'react-icons/fa6';
import type { Route } from '../../routes';

interface Block {
  key: string;
  title: string;
  subtitle: string;
  Icon: IconType;
  /** Full class name so Tailwind can see it. Colours are set in styles.css. */
  color: string;
  route: Route;
}

const BLOCKS: Block[] = [
  { key: 'dosage', title: 'Dosage calculator', subtitle: 'Advil and Tylenol by weight', Icon: FaCalculator, color: 'bg-dosage', route: 'calculator' },
  { key: 'medicine', title: 'Medicine', subtitle: 'Log a dose', Icon: FaPills, color: 'bg-medicine', route: 'medicine' },
  { key: 'temperature', title: 'Temperature', subtitle: 'Log a reading', Icon: FaTemperatureHalf, color: 'bg-temperature', route: 'temperature' },
  { key: 'sickness', title: 'Sickness', subtitle: 'Track an illness', Icon: FaHeadSideCough, color: 'bg-sickness', route: 'sickness' },
  { key: 'growth', title: 'Growth', subtitle: 'Height, weight, head', Icon: FaRulerVertical, color: 'bg-growth', route: 'growth' },
  { key: 'history', title: 'Medical history', subtitle: 'Visits, notes, documents', Icon: FaNotesMedical, color: 'bg-history', route: 'history' },
];

export default function HomePage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-3.5">
      {BLOCKS.map(({ key, title, subtitle, Icon, color, route }) => (
        <button
          key={key}
          className={`${color} flex min-h-[88px] w-full items-center gap-4 rounded-3xl py-4 pr-5 pl-4 text-left text-white transition-transform active:scale-[0.985] motion-reduce:transition-none md:min-h-[108px]`}
          onClick={() => onNavigate(route)}
        >
          <span
            className="grid size-[52px] flex-none place-items-center rounded-2xl bg-white/25 text-2xl"
            aria-hidden="true"
          >
            <Icon />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xl font-extrabold">{title}</span>
            <span className="text-[15px] font-semibold">{subtitle}</span>
          </span>
          <FaChevronRight className="flex-none" aria-hidden="true" />
        </button>
      ))}

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 font-bold text-accent md:col-span-2"
        onClick={() => onNavigate('backup')}
      >
        <FaFloppyDisk aria-hidden="true" /> Backup and restore
      </button>
    </div>
  );
}
