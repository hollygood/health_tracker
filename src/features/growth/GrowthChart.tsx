import { useState } from 'react';
import { formatDate } from '../logs/formatters';
import {
  ageLabel,
  percentileText,
  type AgeWindow,
  type GrowthPoint,
  type ReferenceCurve,
} from './growthStats';

interface Props {
  /** Name of what is plotted, e.g. "Weight". */
  label: string;
  unit: string;
  /** WHO percentile lines; empty when the reference data is not available. */
  curves: ReferenceCurve[];
  /** The child's measurements, oldest first. */
  points: GrowthPoint[];
  /** The span of ages on the x-axis. */
  ageRange: AgeWindow;
  selectedId: string | null;
  onSelect: (entryId: string) => void;
}

const WIDTH = 360;
const HEIGHT = 260;
const PAD = { left: 38, right: 28, top: 12, bottom: 26 };
const PLOT_WIDTH = WIDTH - PAD.left - PAD.right;
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom;

const TOOLTIP_HEIGHT = 34;
/** Rough width of 10px text, enough to size the tooltip box. */
const CHAR_WIDTH = 5.6;

/** Round tick values (1, 2 or 5 times a power of ten apart), about `target` of them. */
export function niceTicks(min: number, max: number, target = 5): number[] {
  if (!(max > min)) return [min];
  const range = max - min;
  const power = 10 ** Math.floor(Math.log10(range / target));
  // Of the round steps near the ideal spacing, take the one that gives closest to `target` ticks.
  const step = [1, 2, 5, 10]
    .map((m) => m * power)
    .reduce((best, s) => (Math.abs(range / s - target) < Math.abs(range / best - target) ? s : best));
  const ticks = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-9; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

/** A child's measurements over the WHO percentile lines, by age. */
export default function GrowthChart({
  label,
  unit,
  curves,
  points,
  ageRange,
  selectedId,
  onSelect,
}: Props) {
  // Hovering or focusing a point shows its tooltip; otherwise the selected point's is shown.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visible = points.filter((p) => p.ageDays >= ageRange.fromDays && p.ageDays <= ageRange.toDays);
  const values = [...curves.flatMap((c) => c.points.map((p) => p.value)), ...visible.map((p) => p.value)];
  const low = values.length ? Math.min(...values) : 0;
  const high = values.length ? Math.max(...values) : 1;
  const margin = (high - low || high || 1) * 0.06;
  const yMin = Math.max(0, low - margin);
  const yMax = high + margin;
  const yTicks = niceTicks(yMin, yMax);

  const x = (ageDays: number) =>
    PAD.left + ((ageDays - ageRange.fromDays) / (ageRange.toDays - ageRange.fromDays)) * PLOT_WIDTH;
  const y = (value: number) => PAD.top + (1 - (value - yMin) / (yMax - yMin)) * PLOT_HEIGHT;
  const path = (pts: { ageDays: number; value: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.ageDays).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

  const describe = (p: GrowthPoint) =>
    `${formatDate(p.time)}: ${p.value} ${unit}${p.percentile === null ? '' : `, ${percentileText(p.percentile)}`}`;

  const active = visible.find((p) => p.entryId === (hoveredId ?? selectedId)) ?? null;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="group"
      aria-label={`${label} by age${curves.length ? ', with WHO percentile lines' : ''}`}
    >
      {/* Grid and axes: quiet, behind the data */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-line" />
          <text x={PAD.left - 6} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px]">
            {tick}
          </text>
        </g>
      ))}
      {ageRange.ticks
        .filter((t) => t.ageDays <= ageRange.toDays + 1)
        .map((tick) => (
          <text
            key={tick.label}
            x={x(tick.ageDays)}
            y={HEIGHT - 8}
            textAnchor={tick.ageDays === ageRange.fromDays ? 'start' : 'middle'}
            className="fill-muted text-[10px]"
          >
            {tick.label}
          </text>
        ))}

      {/* WHO percentile lines, each labelled at its right end */}
      {curves.map((curve) => {
        const last = curve.points[curve.points.length - 1];
        const isMedian = curve.percentile === 50;
        return (
          <g key={curve.percentile} data-testid={`curve-${curve.percentile}`}>
            <path
              d={path(curve.points)}
              fill="none"
              className="stroke-muted"
              strokeWidth={isMedian ? 1.5 : 1}
              strokeOpacity={isMedian ? 0.9 : 0.45}
            />
            {last && (
              <text
                x={x(last.ageDays) + 4}
                y={y(last.value)}
                dy="0.32em"
                className={`fill-muted text-[10px] ${isMedian ? 'font-bold' : ''}`}
              >
                {curve.percentile}
              </text>
            )}
          </g>
        );
      })}

      {/* The child's measurements */}
      {visible.length > 1 && (
        <path
          d={path(visible)}
          fill="none"
          className="stroke-accent"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {visible.map((p) => {
        const selected = p.entryId === selectedId;
        return (
          <g
            key={p.entryId}
            role="button"
            tabIndex={0}
            aria-label={describe(p)}
            aria-pressed={selected}
            className="cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => onSelect(p.entryId)}
            onPointerEnter={() => setHoveredId(p.entryId)}
            onPointerLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(p.entryId)}
            onBlur={() => setHoveredId(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(p.entryId);
              }
            }}
          >
            {/* Larger invisible target so the point is easy to tap */}
            <circle cx={x(p.ageDays)} cy={y(p.value)} r={14} fill="transparent" />
            <circle
              cx={x(p.ageDays)}
              cy={y(p.value)}
              r={selected ? 6.5 : 4.5}
              className="fill-accent stroke-surface"
              strokeWidth={2}
            />
          </g>
        );
      })}

      {active && <PointTooltip point={active} unit={unit} cx={x(active.ageDays)} cy={y(active.value)} />}
    </svg>
  );
}

interface TooltipProps {
  point: GrowthPoint;
  unit: string;
  cx: number;
  cy: number;
}

/** Small label beside a point: its value and percentile, then the date and age. */
function PointTooltip({ point, unit, cx, cy }: TooltipProps) {
  const headline = `${point.value} ${unit}, ${
    point.percentile === null ? 'no percentile' : percentileText(point.percentile)
  }`;
  const detail = `${formatDate(point.time)}, age ${ageLabel(point.ageDays)}`;
  const width = Math.max(headline.length, detail.length) * CHAR_WIDTH + 16;

  // Centre above the point, kept inside the chart; drop below if there is no room above.
  const left = Math.min(Math.max(cx - width / 2, 2), WIDTH - width - 2);
  const above = cy - TOOLTIP_HEIGHT - 12;
  const top = above >= 2 ? above : cy + 12;

  return (
    <g data-testid="point-tooltip" pointerEvents="none">
      <rect x={left} y={top} width={width} height={TOOLTIP_HEIGHT} rx={8} className="fill-ink" />
      <text x={left + 8} y={top + 14} className="fill-white text-[10px] font-bold">
        {headline}
      </text>
      <text x={left + 8} y={top + 27} className="fill-white text-[10px]">
        {detail}
      </text>
    </g>
  );
}
