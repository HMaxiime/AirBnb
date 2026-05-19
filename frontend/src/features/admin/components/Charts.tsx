import { useState } from "react";

// ── Pie Chart with external pointer labels ────────────────────────────────────

export interface PieSlice { label: string; value: number; color: string }

function PieChart({ slices, title, total, cx = 160, cy = 160, R = 110 }: {
  slices: PieSlice[]; title: string; total: number; cx?: number; cy?: number; R?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const sum = slices.reduce((s, d) => s + d.value, 0) || 1;

  function toXY(angle: number, r: number) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  let cumAngle = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const pct   = s.value / sum;
    const sweep = pct * 2 * Math.PI;
    const start = cumAngle;
    cumAngle   += sweep;
    const end   = cumAngle;
    const mid   = start + sweep / 2;
    const isH   = hovered === i;
    const rr    = isH ? R + 6 : R;

    const s1 = toXY(start, rr); const s2 = toXY(end, rr);
    const lg = sweep > Math.PI ? 1 : 0;

    // Label positioning
    const labelR   = R + 28;
    const lp       = toXY(mid, labelR);
    const anchor   = lp.x > cx ? "start" : "end";
    const lineEnd  = toXY(mid, R + 6);
    const lineKnee = toXY(mid, R + 18);
    const lineOut  = { x: lp.x + (lp.x > cx ? 8 : -8), y: lp.y };

    // For large slices (> 15%) put label inside the slice
    const isLarge = pct > 0.18;
    const innerLP = toXY(mid, R * 0.62);

    return { s1, s2, lg, rr, pct, mid, lp, lineEnd, lineKnee, lineOut, anchor, isLarge, innerLP, isH, i, s };
  });

  return (
    <g>
      {/* Title */}
      <text x={cx} y={cy + R + 52} textAnchor="middle" fontSize="13" fontWeight="600"
        style={{ fill: "var(--text-muted)" }}>{title}</text>

      {/* Slices */}
      {paths.map(({ s1, s2, lg, rr, isH, i, s, pct }) => {
        const start2 = paths.slice(0, i).reduce((a, p) => a + p.pct, 0) * 2 * Math.PI - Math.PI / 2;
        const end2   = start2 + pct * 2 * Math.PI;
        const a1 = toXY(start2, rr); const a2 = toXY(end2, rr);
        return (
          <path key={i}
            d={`M ${cx} ${cy} L ${a1.x} ${a1.y} A ${rr} ${rr} 0 ${lg} 1 ${a2.x} ${a2.y} Z`}
            fill={s.color}
            opacity={hovered === null || isH ? 1 : 0.75}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer", transition: "opacity 0.15s" }}
          />
        );
      })}

      {/* Labels */}
      {paths.map(({ pct, mid, lp, lineEnd, lineKnee, lineOut, anchor, isLarge, innerLP, i, s }) => {
        if (pct < 0.005) return null;
        const labelText  = s.label;
        const pctText    = `${Math.round(pct * 100)}%`;

        if (isLarge) {
          return (
            <g key={`lbl-${i}`} pointerEvents="none">
              <text x={innerLP.x} y={innerLP.y - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                {labelText}
              </text>
              <text x={innerLP.x} y={innerLP.y + 10} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)">
                {pctText}
              </text>
            </g>
          );
        }

        return (
          <g key={`lbl-${i}`} pointerEvents="none">
            {/* Pointer line */}
            <polyline
              points={`${lineEnd.x},${lineEnd.y} ${lineKnee.x},${lineKnee.y} ${lineOut.x},${lineOut.y}`}
              fill="none" stroke="var(--text-light)" strokeWidth="1"
            />
            <text x={lineOut.x + (anchor === "start" ? 4 : -4)} y={lineOut.y + 4}
              textAnchor={anchor} fontSize="11" fontWeight="600"
              style={{ fill: "var(--text)" }}>
              {labelText}
            </text>
          </g>
        );
      })}

      {/* Hover tooltip in centre */}
      {hovered !== null && (
        <g pointerEvents="none">
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fontWeight="800"
            style={{ fill: "var(--text)" }}>
            {slices[hovered].value.toLocaleString()}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11"
            style={{ fill: "var(--text-muted)" }}>
            {slices[hovered].label}
          </text>
          <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fontWeight="700"
            style={{ fill: slices[hovered].color }}>
            {Math.round((slices[hovered].value / sum) * 100)}%
          </text>
        </g>
      )}

      {/* Total */}
      {hovered === null && (
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="12"
          style={{ fill: "var(--text-muted)" }}>
          {total.toLocaleString()}
        </text>
      )}
    </g>
  );
}

// ── Dual Pie + Comparison Table ───────────────────────────────────────────────

export interface PieComparisonProps {
  leftTitle:   string;
  leftSlices:  PieSlice[];
  rightTitle:  string;
  rightSlices: PieSlice[];
  tableRows:   {
    label:    string;
    leftCols:  { label: string; value: number; total: number; color: string }[];
    rightCols: { label: string; value: number; total: number; color: string }[];
  }[];
}

export function PieComparison({ leftTitle, leftSlices, rightTitle, rightSlices, tableRows }: PieComparisonProps) {
  const leftTotal  = leftSlices.reduce((s, d)  => s + d.value, 0);
  const rightTotal = rightSlices.reduce((s, d) => s + d.value, 0);
  const isSingle   = rightSlices.length === 0;
  const leftCols   = tableRows[0]?.leftCols.map((c)  => c.label) ?? [];
  const rightCols  = tableRows[0]?.rightCols.map((c) => c.label) ?? [];

  // ── Single pie: pie LEFT, compact table RIGHT ──────────────────────────────
  if (isSingle) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        {/* Pie */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 320 300" style={{ width: 240, height: 240 }} preserveAspectRatio="xMidYMid meet">
            <PieChart slices={leftSlices} title={leftTitle} total={leftTotal} cx={160} cy={140} R={125} />
          </svg>
        </div>

        {/* Compact table */}
        <div className="flex-1 min-w-0">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th className="text-left pb-2 pr-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-light)" }} />
                {tableRows[0]?.leftCols.map((c) => (
                  <th key={c.label} className="pb-2 px-3 text-center text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--text)", borderLeft: "1px solid var(--border)" }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-2.5 pr-3 font-semibold text-xs" style={{ color: "var(--text)" }}>
                    {row.label}
                  </td>
                  {row.leftCols.map((c, ci) => (
                    <td key={ci} className="py-2.5 px-3 text-center"
                      style={{ borderLeft: "1px solid var(--border)" }}>
                      <span className="text-base font-bold" style={{ color: c.color }}>
                        {c.value.toLocaleString()}
                      </span>
                      {c.total > 0 && (
                        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
                          ({Math.round((c.value / c.total) * 100)}%)
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td className="pt-2.5 pr-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Total
                </td>
                <td className="pt-2.5 px-3 text-center font-bold" style={{ color: "var(--text)", borderLeft: "1px solid var(--border)" }}
                  colSpan={tableRows[0]?.leftCols.length ?? 1}>
                  {leftTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Dual pie: stacked layout ───────────────────────────────────────────────
  return (
    <div className="w-full space-y-0">
      <div className="w-full overflow-x-auto">
        <svg viewBox="0 0 900 420" className="w-full" style={{ maxHeight: 380 }} preserveAspectRatio="xMidYMid meet">
          <PieChart slices={leftSlices}  title={leftTitle}  total={leftTotal}  cx={220} cy={180} R={110} />
          <PieChart slices={rightSlices} title={rightTitle} total={rightTotal} cx={680} cy={180} R={110} />
        </svg>
      </div>
      <div className="overflow-x-auto" style={{ borderTop: "1px solid var(--border)" }}>
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)", width: "28%" }}>
                <span className="font-bold" style={{ color: "var(--text)" }}>{leftTotal.toLocaleString()}</span> {leftTitle}
                {rightTotal > 0 && <><br /><span className="font-bold" style={{ color: "var(--text)" }}>{rightTotal.toLocaleString()}</span> {rightTitle}</>}
              </th>
              {leftCols.map((lbl) => (
                <th key={lbl} className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wide"
                  style={{ color: "var(--text)", borderLeft: "1px solid var(--border)" }}>{lbl}</th>
              ))}
              {rightCols.map((lbl) => (
                <th key={lbl} className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wide"
                  style={{ color: "var(--text)", borderLeft: "1px solid var(--border)" }}>{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>{row.label}</td>
                {row.leftCols.map((c, ci) => (
                  <td key={ci} className="px-4 py-3 text-center text-sm" style={{ borderLeft: "1px solid var(--border)" }}>
                    <span className="font-bold" style={{ color: c.color }}>{c.value.toLocaleString()}</span>
                    {c.total > 0 && <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>({Math.round((c.value / c.total) * 100)}%)</span>}
                  </td>
                ))}
                {row.rightCols.map((c, ci) => (
                  <td key={ci} className="px-4 py-3 text-center text-sm" style={{ borderLeft: "1px solid var(--border)" }}>
                    <span className="font-bold" style={{ color: c.color }}>{c.value.toLocaleString()}</span>
                    {c.total > 0 && <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>({Math.round((c.value / c.total) * 100)}%)</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Stacked Horizontal Bar Chart ─────────────────────────────────────────────
// Each row = one label (e.g. month). Each bar = multiple stacked segments.

export interface StackedBarSeries { label: string; color: string }

export interface StackedBarRow {
  label:  string;                 // row label (e.g. "January")
  values: number[];               // one value per series, in order
}

interface StackedHBarChartProps {
  series:    StackedBarSeries[];  // defines colours & legend labels
  rows:      StackedBarRow[];
  barHeight?: number;             // px height of each bar
  showXAxis?: boolean;
}

export function StackedHBarChart({
  series, rows, barHeight = 28, showXAxis = true,
}: StackedHBarChartProps) {
  const [hovered, setHovered] = useState<{ row: number; seg: number } | null>(null);

  const rowTotals = rows.map((r) => r.values.reduce((s, v) => s + v, 0));
  const maxTotal  = Math.max(...rowTotals, 1);

  // Nice round integer axis ticks (avoids floating-point artefacts)
  const tickCount = 5;
  const rawStep   = maxTotal / tickCount;
  const mag       = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const niceStep  = Math.round(Math.ceil(rawStep / mag) * mag) || 1;
  const niceMax   = niceStep * tickCount;
  const ticks     = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(i * niceStep));

  const labelW  = 80;   // px left column for row labels
  const valueW  = 48;   // px right column for total
  const gapY    = 14;   // gap between bars

  return (
    <div className="w-full select-none">

      {/* X-axis ticks */}
      {showXAxis && (
        <div className="flex mb-2" style={{ paddingLeft: labelW, paddingRight: valueW }}>
          {ticks.map((t, i) => (
            <div key={i} className="flex-1 text-center text-[10px]" style={{ color: "var(--text-light)" }}>
              {t}
            </div>
          ))}
        </div>
      )}

      {/* Grid + bars */}
      <div className="space-y-0">
        {rows.map((row, ri) => {
          const rowTotal = rowTotals[ri];
          return (
            <div key={ri} className="flex items-center" style={{ marginBottom: gapY }}>

              {/* Row label */}
              <div className="flex-shrink-0 text-right pr-3 text-xs font-semibold"
                style={{ width: labelW, color: "var(--text-muted)" }}>
                {row.label}
              </div>

              {/* Bar track */}
              <div className="relative flex-1 rounded-full overflow-hidden"
                style={{ height: barHeight, background: "var(--surface-2)" }}>

                {/* Grid lines (vertical) */}
                {showXAxis && ticks.slice(1, -1).map((t, i) => (
                  <div key={i} className="absolute top-0 bottom-0 w-px pointer-events-none"
                    style={{ left: `${(t / niceMax) * 100}%`, background: "var(--border)", opacity: 0.6 }} />
                ))}

                {/* Stacked segments */}
                <div className="absolute inset-0 flex">
                  {row.values.map((val, si) => {
                    const widthPct = (val / niceMax) * 100;
                    const isH      = hovered?.row === ri && hovered.seg === si;
                    if (widthPct < 0.1) return null;
                    return (
                      <div
                        key={si}
                        className="h-full transition-all duration-300 relative"
                        style={{
                          width:      `${widthPct}%`,
                          background: series[si]?.color ?? "#ccc",
                          opacity:    hovered && !isH ? 0.65 : 1,
                          // first segment: round left; last visible: round right
                          borderRadius: si === 0 ? "9999px 0 0 9999px" : "0",
                        }}
                        onMouseEnter={() => setHovered({ row: ri, seg: si })}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {/* Inline label when wide enough */}
                        {widthPct > 12 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white pointer-events-none">
                            {val.toLocaleString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tooltip */}
                {hovered?.row === ri && hovered.seg !== undefined && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 pointer-events-none z-10
                    px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-lg whitespace-nowrap"
                    style={{ background: "#111827" }}>
                    {series[hovered.seg]?.label}: {row.values[hovered.seg].toLocaleString()}
                    {rowTotal > 0 && ` (${Math.round((row.values[hovered.seg] / rowTotal) * 100)}%)`}
                  </div>
                )}
              </div>

              {/* Row total */}
              <div className="flex-shrink-0 pl-3 text-xs font-bold tabular-nums"
                style={{ width: valueW, color: "var(--text-muted)" }}>
                {rowTotal}
              </div>

            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-4 pt-3 flex-wrap"
        style={{ borderTop: "1px solid var(--border)" }}>
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cumulative Revenue Growth Chart ───────────────────────────────────────────

interface CumulativeLineProps {
  data:      { label: string; value: number }[];  // monthly values (will be cumulated internally)
  color?:    string;
  height?:   number;
  title?:    string;
  subtitle?: string;
  formatVal?: (v: number) => string;
}

export function CumulativeLineChart({
  data,
  color     = "#4ade80",
  height    = 320,
  title     = "Revenue Growth Over Time",
  subtitle,
  formatVal = (v) => `$${v.toLocaleString()}`,
}: CumulativeLineProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Build cumulative running total
  const cumulative = data.reduce<number[]>((acc, d) => {
    acc.push((acc[acc.length - 1] ?? 0) + d.value);
    return acc;
  }, []);

  const W   = 700;
  const H   = height;
  const pad = { top: 48, right: 28, bottom: 52, left: 80 };
  const iW  = W - pad.left - pad.right;
  const iH  = H - pad.top  - pad.bottom;

  const maxVal = Math.max(...cumulative, 1);

  // Nice round Y-axis ticks
  const tickCount  = 5;
  const rawStep    = maxVal / tickCount;
  const magnitude  = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep   = Math.ceil(rawStep / magnitude) * magnitude;
  const niceMax    = niceStep * tickCount;
  const yTicks     = Array.from({ length: tickCount + 1 }, (_, i) => i * niceStep);

  const toY = (v: number) => pad.top + iH * (1 - v / niceMax);

  const n    = data.length;
  const step = iW / Math.max(n - 1, 1);

  const pts = cumulative.map((v, i) => ({
    x: pad.left + i * step,
    y: toY(v),
  }));

  // Smooth bezier line
  let linePath = "";
  if (pts.length >= 2) {
    linePath = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      const cpx = (p.x + c.x) / 2;
      linePath += ` C ${cpx} ${p.y}, ${cpx} ${c.y}, ${c.x} ${c.y}`;
    }
  }

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">

        {/* Title */}
        <text x={W / 2} y={20} textAnchor="middle" fontSize="17" fontWeight="800"
          style={{ fill: "var(--text)" }}>
          {title}
        </text>
        {subtitle && (
          <text x={W / 2} y={38} textAnchor="middle" fontSize="11" fontWeight="600"
            style={{ fill: "var(--text-muted)" }}>
            {subtitle}
          </text>
        )}

        {/* Y-axis ticks + horizontal dashed lines */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + iW} y2={y}
                stroke="var(--border)" strokeWidth="0.8"
                strokeDasharray={i === 0 ? undefined : "5 5"} />
              <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="11"
                style={{ fill: "var(--text-muted)" }}>
                {tick === 0 ? "0" : formatVal(tick)}
              </text>
            </g>
          );
        })}

        {/* Vertical dashed grid lines + X labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <line x1={p.x} y1={pad.top} x2={p.x} y2={pad.top + iH}
              stroke="var(--border)" strokeWidth="0.8" strokeDasharray="5 5" />
            <text x={p.x} y={pad.top + iH + 18} textAnchor="middle" fontSize="11"
              style={{ fill: hovered === i ? color : "var(--text-muted)" }}
              fontWeight={hovered === i ? "700" : "400"}>
              {data[i].label}
            </text>
          </g>
        ))}

        {/* Chart border bottom */}
        <line x1={pad.left} y1={pad.top + iH} x2={pad.left + iW} y2={pad.top + iH}
          stroke="var(--border)" strokeWidth="1" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + iH}
          stroke="var(--border)" strokeWidth="1" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + hover zones */}
        {pts.map((p, i) => {
          const isH = hovered === i;
          return (
            <g key={i}>
              {/* Hover zone */}
              <rect
                x={p.x - step / 2} y={pad.top} width={step} height={iH}
                fill="transparent" style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Outer ring on hover */}
              {isH && <circle cx={p.x} cy={p.y} r={10} fill={color} opacity="0.15" pointerEvents="none" />}
              {/* Open circle dot */}
              <circle cx={p.x} cy={p.y} r={isH ? 6 : 4}
                fill="var(--surface)" stroke={color} strokeWidth={isH ? 2.5 : 2}
                style={{ transition: "r 0.15s" }} pointerEvents="none" />
              {/* Inner filled dot */}
              <circle cx={p.x} cy={p.y} r={isH ? 3 : 2}
                fill={color} pointerEvents="none" />
            </g>
          );
        })}

        {/* Tooltip */}
        {hovered !== null && pts[hovered] && (() => {
          const p   = pts[hovered];
          const val = formatVal(cumulative[hovered]);
          const tw  = Math.max(val.length * 7.5 + 20, 100);
          const tx  = Math.min(Math.max(p.x, pad.left + tw / 2 + 4), W - pad.right - tw / 2 - 4);
          const ty  = Math.max(p.y - 44, pad.top + 2);
          return (
            <g pointerEvents="none">
              <rect x={tx - tw / 2} y={ty} width={tw} height={28} rx={7} fill="#111827" opacity="0.93" />
              <text x={tx} y={ty + 12} textAnchor="middle" fontSize="10" fill={color} fontWeight="700">
                {data[hovered].label}
              </text>
              <text x={tx} y={ty + 23} textAnchor="middle" fontSize="11" fill="white" fontWeight="800">
                {val}
              </text>
            </g>
          );
        })()}

        {/* Legend */}
        <rect x={W / 2 - 52} y={H - 18} width={12} height={12} rx={2} fill={color} />
        <text x={W / 2 - 36} y={H - 8} fontSize="11" fontWeight="600" style={{ fill: "var(--text-muted)" }}>
          Revenue ($)
        </text>
      </svg>
    </div>
  );
}

// ── Moving Average helper ─────────────────────────────────────────────────────

function movingAvg(values: number[], window = 3): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end   = Math.min(values.length, start + window);
    const slice = values.slice(start, end);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

// ── Moving Average Chart (one metric, actual line + MA trend) ─────────────────

interface MovingAverageChartProps {
  labels:      string[];
  values:      number[];
  color:       string;           // main line colour
  maColor?:    string;           // moving-average line colour (defaults to lighter version)
  gradId:      string;
  title:       string;
  formatVal?:  (v: number) => string;
  maWindow?:   number;
  height?:     number;
}

export function MovingAverageChart({
  labels, values, color, maColor, gradId, title,
  formatVal = String, maWindow = 3, height = 220,
}: MovingAverageChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const ma    = movingAvg(values, maWindow);
  const _maColor = maColor ?? color;

  const W   = 640;
  const H   = height;
  const pad = { top: 36, right: 20, bottom: 36, left: 52 };
  const iW  = W - pad.left - pad.right;
  const iH  = H - pad.top  - pad.bottom;

  const allVals = [...values, ...ma];
  const maxVal  = Math.max(...allVals, 1);
  const minVal  = 0;
  const range   = maxVal - minVal || 1;

  const n    = labels.length;
  const step = iW / Math.max(n - 1, 1);

  function toY(v: number) {
    return pad.top + iH * (1 - (v - minVal) / range);
  }

  function makePts(vals: number[]) {
    return vals.map((v, i) => ({ x: pad.left + i * step, y: toY(v) }));
  }

  function buildPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      const cpx = (p.x + c.x) / 2;
      d += ` C ${cpx} ${p.y}, ${cpx} ${c.y}, ${c.x} ${c.y}`;
    }
    return d;
  }

  const ptsActual = makePts(values);
  const ptsMa     = makePts(ma);
  const pathActual = buildPath(ptsActual);
  const pathMa     = buildPath(ptsMa);

  // Area fill under actual line
  const areaPath = ptsActual.length > 0
    ? `${pathActual} L ${ptsActual[ptsActual.length - 1].x} ${pad.top + iH} L ${ptsActual[0].x} ${pad.top + iH} Z`
    : "";

  // Y-axis grid
  const yTicks = [0, 0.5, 1].map((pct) => ({
    y:   pad.top + iH * pct,
    val: minVal + range * (1 - pct),
  }));

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
          <filter id={`${gradId}-glow`}>
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text x={W / 2} y={16} textAnchor="middle" fontSize="12" fontWeight="700"
          style={{ fill: "var(--text)" }}>
          {title}
        </text>

        {/* Grid lines */}
        {yTicks.map(({ y, val }, i) => (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={pad.left + iW} y2={y}
              stroke="var(--border)" strokeWidth="0.6"
              strokeDasharray={i > 0 ? "4 4" : undefined} />
            {val > 0 && (
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9"
                style={{ fill: "var(--text-light)" }}>
                {formatVal(Math.round(val))}
              </text>
            )}
          </g>
        ))}

        {/* X labels */}
        {labels.map((lb, i) => (
          <text key={i} x={pad.left + i * step} y={H - 6} textAnchor="middle" fontSize="9"
            style={{ fill: hovered === i ? color : "var(--text-light)" }}
            fontWeight={hovered === i ? "700" : "400"}>
            {lb}
          </text>
        ))}

        {/* Axes */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + iH} stroke="var(--border)" strokeWidth="1" />
        <line x1={pad.left} y1={pad.top + iH} x2={pad.left + iW} y2={pad.top + iH} stroke="var(--border)" strokeWidth="1" />

        {/* Area */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Actual line */}
        <path d={pathActual} fill="none" stroke={color} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

        {/* Moving average line */}
        <path d={pathMa} fill="none" stroke={_maColor} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          filter={`url(#${gradId}-glow)`} />

        {/* Hover zones */}
        {labels.map((_, i) => (
          <rect key={i}
            x={pad.left + i * step - step / 2} y={pad.top}
            width={step} height={iH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Dots + tooltip on hover */}
        {hovered !== null && (() => {
          const pA  = ptsActual[hovered];
          const pM  = ptsMa[hovered];
          const raw = formatVal(values[hovered]);
          const avg = formatVal(Math.round(ma[hovered]));
          const tw  = 120;
          const tx  = Math.min(Math.max(pA.x - tw / 2, pad.left + 4), W - pad.right - tw - 4);
          const ty  = Math.max(Math.min(pA.y, pM.y) - 52, pad.top + 2);
          return (
            <g pointerEvents="none">
              {/* Vertical guide */}
              <line x1={pA.x} y1={pad.top} x2={pA.x} y2={pad.top + iH}
                stroke="var(--border-2)" strokeWidth="1" />
              {/* Actual dot */}
              <circle cx={pA.x} cy={pA.y} r={5} fill="var(--surface)" stroke={color} strokeWidth="2" />
              <circle cx={pA.x} cy={pA.y} r={2.5} fill={color} />
              {/* MA dot */}
              <circle cx={pM.x} cy={pM.y} r={6} fill="var(--surface)" stroke={_maColor} strokeWidth="2.5" />
              <circle cx={pM.x} cy={pM.y} r={3} fill={_maColor} />
              {/* Tooltip */}
              <rect x={tx} y={ty} width={tw} height={46} rx={7} fill="#111827" opacity="0.93" />
              <text x={tx + tw / 2} y={ty + 12} textAnchor="middle" fontSize="9" fill="#9ca3af" fontWeight="600">
                {labels[hovered]}
              </text>
              <text x={tx + 10} y={ty + 26} fontSize="9" fill={color} opacity="0.8">Actual:</text>
              <text x={tx + tw - 8} y={ty + 26} textAnchor="end" fontSize="9" fill="white" fontWeight="700">{raw}</text>
              <text x={tx + 10} y={ty + 40} fontSize="9" fill={_maColor}>Avg:</text>
              <text x={tx + tw - 8} y={ty + 40} textAnchor="end" fontSize="9" fill="white" fontWeight="700">{avg}</text>
            </g>
          );
        })()}

        {/* Resting dots on MA line */}
        {hovered === null && ptsMa.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5}
            fill="var(--surface)" stroke={_maColor} strokeWidth="1.5" pointerEvents="none" />
        ))}

        {/* Legend */}
        <g>
          <line x1={pad.left} y1={H - 2} x2={pad.left + 16} y2={H - 2}
            stroke={color} strokeWidth="1.5" opacity="0.5" />
          <text x={pad.left + 20} y={H} fontSize="8" style={{ fill: "var(--text-light)" }}>Actual</text>
          <line x1={pad.left + 56} y1={H - 2} x2={pad.left + 72} y2={H - 2}
            stroke={_maColor} strokeWidth="2.5" />
          <circle cx={pad.left + 64} cy={H - 2} r={2} fill={_maColor} />
          <text x={pad.left + 76} y={H} fontSize="8" style={{ fill: "var(--text-light)" }}>
            {maWindow}-mo avg
          </text>
        </g>
      </svg>
    </div>
  );
}

// ── Multi-Line Chart (4 series, normalized, with shared hover tooltip) ───────

export interface MultiLineSeries {
  key:       string;
  label:     string;
  values:    number[];
  color:     string;
  dashed?:   boolean;
  formatVal: (v: number) => string;
}

interface MultiLineChartProps {
  labels:    string[];
  series:    MultiLineSeries[];
  height?:   number;
  title?:    string;
  subtitle?: string;
}

export function MultiLineChart({
  labels, series, height = 380, title, subtitle,
}: MultiLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W   = 720;
  const H   = height;
  const pad = { top: subtitle ? 64 : 48, right: 28, bottom: 52, left: 54 };
  const iW  = W - pad.left - pad.right;
  const iH  = H - pad.top  - pad.bottom;

  const n    = labels.length;
  const step = iW / Math.max(n - 1, 1);

  // Normalize each series independently to 0–100
  const normalized = series.map((s) => {
    const max = Math.max(...s.values, 1);
    return s.values.map((v) => (v / max) * 100);
  });

  function toY(pct: number) {
    return pad.top + iH * (1 - pct / 100);
  }

  function makePath(values: number[]) {
    const pts = values.map((v, i) => ({ x: pad.left + i * step, y: toY(v) }));
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      const cpx = (p.x + c.x) / 2;
      d += ` C ${cpx} ${p.y}, ${cpx} ${c.y}, ${c.x} ${c.y}`;
    }
    return d;
  }

  // Y-axis ticks (0, 25, 50, 75, 100)
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">

        {/* Title */}
        {title && (
          <text x={W / 2} y={20} textAnchor="middle" fontSize="15" fontWeight="800"
            style={{ fill: "var(--text)" }}>
            {title}
          </text>
        )}
        {subtitle && (
          <text x={W / 2} y={36} textAnchor="middle" fontSize="10" fontWeight="500"
            style={{ fill: "var(--text-muted)" }}>
            {subtitle}
          </text>
        )}

        {/* Legend row */}
        {(() => {
          const legendY = (subtitle ? 50 : 36);
          let offsetX   = pad.left;
          return series.map((s, i) => {
            const el = (
              <g key={s.key}>
                {s.dashed
                  ? <line x1={offsetX} y1={legendY + 4} x2={offsetX + 14} y2={legendY + 4}
                      stroke={s.color} strokeWidth="2" strokeDasharray="4 3" />
                  : <line x1={offsetX} y1={legendY + 4} x2={offsetX + 14} y2={legendY + 4}
                      stroke={s.color} strokeWidth="2.5" />
                }
                <circle cx={offsetX + 7} cy={legendY + 4} r={3} fill={s.color} />
                <text x={offsetX + 18} y={legendY + 8} fontSize="10" fontWeight="600"
                  style={{ fill: "var(--text-muted)" }}>
                  {s.label}
                </text>
              </g>
            );
            offsetX += s.label.length * 6.5 + 38;
            return el;
          });
        })()}

        {/* Horizontal grid lines + Y-axis labels */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + iW} y2={y}
                stroke="var(--border)" strokeWidth="0.7"
                strokeDasharray={tick > 0 ? "5 5" : undefined} />
              {tick > 0 && (
                <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9"
                  style={{ fill: "var(--text-light)" }}>
                  {tick}%
                </text>
              )}
            </g>
          );
        })}

        {/* Vertical grid lines + X labels */}
        {labels.map((lb, i) => {
          const x = pad.left + i * step;
          return (
            <g key={i}>
              <line x1={x} y1={pad.top} x2={x} y2={pad.top + iH}
                stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
              <text x={x} y={pad.top + iH + 16} textAnchor="middle" fontSize="10"
                style={{ fill: hovered === i ? "var(--accent)" : "var(--text-muted)" }}
                fontWeight={hovered === i ? "700" : "400"}>
                {lb}
              </text>
            </g>
          );
        })}

        {/* Chart border */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + iH} stroke="var(--border)" strokeWidth="1" />
        <line x1={pad.left} y1={pad.top + iH} x2={pad.left + iW} y2={pad.top + iH} stroke="var(--border)" strokeWidth="1" />

        {/* Lines */}
        {series.map((s, si) => (
          <path key={s.key}
            d={makePath(normalized[si])}
            fill="none"
            stroke={s.color}
            strokeWidth={s.dashed ? 2 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? "6 4" : undefined}
            opacity={hovered !== null ? 0.35 : 1}
            style={{ transition: "opacity 0.15s" }}
          />
        ))}

        {/* Highlighted column on hover */}
        {hovered !== null && (
          <>
            <line
              x1={pad.left + hovered * step} y1={pad.top}
              x2={pad.left + hovered * step} y2={pad.top + iH}
              stroke="var(--border-2)" strokeWidth="1.5"
            />
            {series.map((s, si) => {
              const x = pad.left + hovered * step;
              const y = toY(normalized[si][hovered]);
              return (
                <g key={s.key}>
                  <circle cx={x} cy={y} r={10} fill={s.color} opacity="0.15" />
                  <circle cx={x} cy={y} r={6} fill="var(--surface)" stroke={s.color} strokeWidth="2.5" />
                  <circle cx={x} cy={y} r={3} fill={s.color} />
                  {/* Bright lines on hover */}
                  <path d={makePath(normalized[si])} fill="none" stroke={s.color}
                    strokeWidth={s.dashed ? 2 : 2.5} strokeLinecap="round"
                    strokeDasharray={s.dashed ? "6 4" : undefined} opacity="1" />
                </g>
              );
            })}
          </>
        )}

        {/* Invisible hover zones */}
        {labels.map((_, i) => (
          <rect key={i}
            x={pad.left + i * step - step / 2} y={pad.top}
            width={step} height={iH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Combined tooltip */}
        {hovered !== null && (() => {
          const x      = pad.left + hovered * step;
          const rows   = series.length;
          const tw     = 160;
          const th     = 18 + rows * 18 + 8;
          const tx     = Math.min(Math.max(x - tw / 2, pad.left + 4), W - pad.right - tw - 4);
          const minY   = Math.min(...series.map((s, si) => toY(normalized[si][hovered])));
          const ty     = Math.max(minY - th - 14, pad.top + 2);
          return (
            <g pointerEvents="none">
              <rect x={tx} y={ty} width={tw} height={th} rx={8} fill="#111827" opacity="0.95" />
              <text x={tx + tw / 2} y={ty + 13} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">
                {labels[hovered]}
              </text>
              {series.map((s, si) => (
                <g key={s.key}>
                  <circle cx={tx + 14} cy={ty + 22 + si * 18} r={4} fill={s.color} />
                  <text x={tx + 22} y={ty + 26 + si * 18} fontSize="10" fill="#9ca3af">{s.label}:</text>
                  <text x={tx + tw - 8} y={ty + 26 + si * 18} textAnchor="end" fontSize="10" fill="white" fontWeight="700">
                    {s.formatVal(s.values[hovered])}
                  </text>
                </g>
              ))}
            </g>
          );
        })()}

        {/* Dots when not hovered */}
        {hovered === null && series.map((s, si) =>
          normalized[si].map((pct, i) => (
            <circle key={`${si}-${i}`}
              cx={pad.left + i * step} cy={toY(pct)}
              r={3} fill="var(--surface)" stroke={s.color} strokeWidth="1.5"
              pointerEvents="none"
            />
          ))
        )}

      </svg>
    </div>
  );
}

// ── Smooth bezier path ────────────────────────────────────────────────────────

export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return pts[0] ? `M ${pts[0].x} ${pts[0].y}` : "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const cpx = (p.x + c.x) / 2;
    d += ` C ${cpx} ${p.y}, ${cpx} ${c.y}, ${c.x} ${c.y}`;
  }
  return d;
}

const C = {
  grid:  "var(--border)",
  label: "var(--text-light)",
  text:  "var(--text-muted)",
};

// ── Dual-line Area Chart (TailAdmin-style) ───────────────────────────────────

interface DualLineProps {
  labels:     string[];
  seriesA:    { label: string; values: number[]; color: string; gradId: string };
  seriesB:    { label: string; values: number[]; color: string; gradId: string };
  height?:    number;
  formatA?:   (v: number) => string;
  formatB?:   (v: number) => string;
}

export function DualLineChart({ labels, seriesA, seriesB, height = 260, formatA = String, formatB = String }: DualLineProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 700; const H = height;
  const pad = { top: 24, right: 20, bottom: 36, left: 56 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top  - pad.bottom;

  const maxA = Math.max(...seriesA.values, 1);
  const maxB = Math.max(...seriesB.values, 1);
  const n    = labels.length;
  const step = iW / Math.max(n - 1, 1);

  function toPts(values: number[], max: number) {
    return values.map((v, i) => ({ x: pad.left + i * step, y: pad.top + iH * (1 - v / max) }));
  }

  const ptsA = toPts(seriesA.values, maxA);
  const ptsB = toPts(seriesB.values, maxB);
  const lineA = smoothPath(ptsA);
  const lineB = smoothPath(ptsB);
  const areaA = `${lineA} L ${ptsA[ptsA.length-1]?.x} ${pad.top+iH} L ${ptsA[0]?.x} ${pad.top+iH} Z`;
  const areaB = `${lineB} L ${ptsB[ptsB.length-1]?.x} ${pad.top+iH} L ${ptsB[0]?.x} ${pad.top+iH} Z`;

  const gridYs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={seriesA.gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={seriesA.color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={seriesA.color} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={seriesB.gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={seriesB.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={seriesB.color} stopOpacity="0.02" />
          </linearGradient>
          <filter id="glowA">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glowB">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {gridYs.map((pct, i) => {
          const y = pad.top + iH * pct;
          const v = maxA * (1 - pct);
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W-pad.right} y2={y}
                stroke={C.grid} strokeWidth="0.6"
                strokeDasharray={i > 0 && i < 4 ? "4 4" : undefined} />
              {v > 0 && <text x={pad.left-8} y={y+4} textAnchor="end" fontSize="10" style={{ fill: C.label }}>
                {formatA(Math.round(v))}
              </text>}
            </g>
          );
        })}

        {/* X labels */}
        {labels.map((lb, i) => (
          <text key={i} x={pad.left + i*step} y={H-8} textAnchor="middle" fontSize="10"
            style={{ fill: hovered===i ? seriesA.color : C.label }}
            fontWeight={hovered===i ? "700" : "400"}>
            {lb}
          </text>
        ))}

        {/* Area fills */}
        <path d={areaB} fill={`url(#${seriesB.gradId})`} />
        <path d={areaA} fill={`url(#${seriesA.gradId})`} />

        {/* Lines */}
        <path d={lineB} fill="none" stroke={seriesB.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowB)" />
        <path d={lineA} fill="none" stroke={seriesA.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowA)" />

        {/* Hover zones + dots */}
        {ptsA.map((pA, i) => {
          const pB  = ptsB[i];
          const isH = hovered === i;
          return (
            <g key={i}>
              <rect x={pA.x - step/2} y={pad.top} width={step} height={iH} fill="transparent"
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{ cursor: "crosshair" }} />
              {isH && <line x1={pA.x} y1={pad.top} x2={pA.x} y2={pad.top+iH} stroke={C.grid} strokeWidth="1" strokeDasharray="4 3" />}
              {/* Series B dot */}
              <circle cx={pB.x} cy={pB.y} r={isH ? 5 : 3} fill={isH ? seriesB.color : "var(--surface)"} stroke={seriesB.color} strokeWidth="2" style={{ transition: "r 0.15s" }} pointerEvents="none" />
              {isH && <circle cx={pB.x} cy={pB.y} r={9} fill={seriesB.color} opacity="0.15" pointerEvents="none" />}
              {/* Series A dot */}
              <circle cx={pA.x} cy={pA.y} r={isH ? 6 : 3.5} fill={isH ? seriesA.color : "var(--surface)"} stroke={seriesA.color} strokeWidth="2" style={{ transition: "r 0.15s" }} pointerEvents="none" />
              {isH && <circle cx={pA.x} cy={pA.y} r={11} fill={seriesA.color} opacity="0.15" pointerEvents="none" />}
              {/* Tooltip */}
              {isH && (() => {
                const tx = Math.min(Math.max(pA.x, pad.left+55), W-pad.right-55);
                const ty = Math.min(pA.y, pB.y) - 44;
                return (
                  <g pointerEvents="none">
                    <rect x={tx-54} y={Math.max(ty, pad.top)} width={108} height={38} rx={7} fill="#111827" opacity="0.93" />
                    <text x={tx-6} y={Math.max(ty,pad.top)+14} textAnchor="end" fontSize="10" fill={seriesA.color} fontWeight="700">{formatA(seriesA.values[i])}</text>
                    <text x={tx-2} y={Math.max(ty,pad.top)+14} textAnchor="start" fontSize="9" fill="#6b7280"> {seriesA.label}</text>
                    <text x={tx-6} y={Math.max(ty,pad.top)+28} textAnchor="end" fontSize="10" fill={seriesB.color} fontWeight="700">{formatB(seriesB.values[i])}</text>
                    <text x={tx-2} y={Math.max(ty,pad.top)+28} textAnchor="start" fontSize="9" fill="#6b7280"> {seriesB.label}</text>
                  </g>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Area Chart ────────────────────────────────────────────────────────────────

interface AreaChartProps {
  data: { label: string; value: number }[];
  color: string; gradId: string; height?: number; formatVal?: (v: number) => string;
}

export function AreaChart({ data, color, gradId, height = 220, formatVal = String }: AreaChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 640; const H = height;
  const pad = { top: 32, right: 20, bottom: 36, left: 56 };
  const iW = W-pad.left-pad.right; const iH = H-pad.top-pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = iW / Math.max(data.length-1, 1);
  const pts = data.map((d, i) => ({ x: pad.left+i*step, y: pad.top+iH*(1-d.value/max) }));
  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length-1]?.x} ${pad.top+iH} L ${pts[0]?.x} ${pad.top+iH} Z`;

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.45" />
            <stop offset="70%"  stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
          <filter id={`${gradId}-g`}><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {[0,0.25,0.5,0.75,1].map((pct,i) => {
          const y=pad.top+iH*pct; const v=max*(1-pct);
          return <g key={i}>
            <line x1={pad.left} y1={y} x2={W-pad.right} y2={y} stroke={C.grid} strokeWidth="0.6" strokeDasharray={i>0&&i<4?"4 4":undefined}/>
            {v>0&&<text x={pad.left-8} y={y+4} textAnchor="end" fontSize="10" style={{fill:C.label}}>{formatVal(Math.round(v))}</text>}
          </g>;
        })}
        {data.map((d,i)=><text key={i} x={pts[i]?.x??0} y={H-8} textAnchor="middle" fontSize="10" style={{fill:hovered===i?color:C.label}} fontWeight={hovered===i?"700":"400"}>{d.label}</text>)}
        <path d={areaPath} fill={`url(#${gradId})`}/>
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${gradId}-g)`}/>
        {pts.map((p,i)=>{
          const isH=hovered===i;
          return <g key={i}>
            <rect x={p.x-step/2} y={pad.top} width={step} height={iH} fill="transparent" onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:"crosshair"}}/>
            {isH&&<line x1={p.x} y1={p.y+8} x2={p.x} y2={pad.top+iH} stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>}
            <circle cx={p.x} cy={p.y} r={isH?6:3.5} fill={isH?color:"var(--surface)"} stroke={color} strokeWidth="2" style={{transition:"r 0.15s"}} pointerEvents="none"/>
            {isH&&<circle cx={p.x} cy={p.y} r={11} fill={color} opacity="0.18" pointerEvents="none"/>}
            {isH&&(()=>{
              const raw=formatVal(data[i].value);
              const tw=Math.max(raw.length*7+16,64);
              const tx=Math.min(Math.max(p.x,pad.left+tw/2+4),W-pad.right-tw/2-4);
              const ty=Math.max(p.y-36,pad.top+2);
              return <g pointerEvents="none">
                <rect x={tx-tw/2} y={ty} width={tw} height={24} rx={6} fill="#111827" opacity="0.92"/>
                <text x={tx} y={ty+15.5} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">{raw}</text>
              </g>;
            })()}
          </g>;
        })}
      </svg>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number }[];
  color: string; gradId: string; height?: number; formatVal?: (v: number) => string;
}

export function BarChart({ data, color, gradId, height=200, formatVal=String }: BarChartProps) {
  const [hovered, setHovered] = useState<number|null>(null);
  const W=600; const H=height;
  const pad={top:28,right:16,bottom:32,left:48};
  const iW=W-pad.left-pad.right; const iH=H-pad.top-pad.bottom;
  const max=Math.max(...data.map((d)=>d.value),1);
  const bW=Math.max(iW/data.length-10,8);
  const step=iW/data.length;
  return (
    <div className="relative w-full" style={{height}}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="1"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.55"/>
          </linearGradient>
        </defs>
        {[0,0.5,1].map((pct,i)=><line key={i} x1={pad.left} y1={pad.top+iH*pct} x2={W-pad.right} y2={pad.top+iH*pct} stroke={C.grid} strokeWidth="0.6" strokeDasharray={pct===0.5?"4 4":undefined}/>)}
        {data.map((d,i)=>{
          const bH=Math.max((d.value/max)*iH,d.value>0?4:0);
          const bX=pad.left+i*step+(step-bW)/2;
          const bY=pad.top+iH-bH;
          const isH=hovered===i;
          return <g key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:"pointer"}}>
            <rect x={bX} y={bY} width={bW} height={bH} rx={5} fill={`url(#${gradId})`} opacity={isH?1:0.82} style={{transition:"opacity 0.15s"}}/>
            {isH&&<rect x={bX-2} y={bY-2} width={bW+4} height={bH+4} rx={6} fill={color} opacity="0.12"/>}
            {isH&&d.value>0&&<><rect x={bX+bW/2-28} y={bY-24} width={56} height={18} rx={4} fill="#111827" opacity="0.9"/><text x={bX+bW/2} y={bY-11} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">{formatVal(d.value)}</text></>}
            <text x={bX+bW/2} y={H-8} textAnchor="middle" fontSize="10" style={{fill:isH?color:C.label}} fontWeight={isH?"700":"400"}>{d.label}</text>
          </g>;
        })}
      </svg>
    </div>
  );
}

// ── Grouped Bar Chart ─────────────────────────────────────────────────────────

interface GroupedBarChartProps {
  data: { label: string; a: number; b: number }[];
  colorA: string; colorB: string; labelA: string; labelB: string; height?: number;
}

export function GroupedBarChart({ data, colorA, colorB, labelA, labelB, height=220 }: GroupedBarChartProps) {
  const [hovered, setHovered] = useState<{i:number;which:"a"|"b"}|null>(null);
  const W=600;const H=height;
  const pad={top:36,right:16,bottom:32,left:32};
  const iW=W-pad.left-pad.right;const iH=H-pad.top-pad.bottom;
  const max=Math.max(...data.flatMap((d)=>[d.a,d.b]),1);
  const gW=iW/data.length;const bW=Math.max((gW-12)/2,4);
  return (
    <div className="w-full" style={{height}}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gbarA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colorA} stopOpacity="1"/><stop offset="100%" stopColor={colorA} stopOpacity="0.6"/></linearGradient>
          <linearGradient id="gbarB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colorB} stopOpacity="1"/><stop offset="100%" stopColor={colorB} stopOpacity="0.6"/></linearGradient>
        </defs>
        <rect x={pad.left} y={2} width={10} height={10} rx={2} fill={colorA}/>
        <text x={pad.left+14} y={11} fontSize="10" style={{fill:C.text}}>{labelA}</text>
        <rect x={pad.left+72} y={2} width={10} height={10} rx={2} fill={colorB}/>
        <text x={pad.left+86} y={11} fontSize="10" style={{fill:C.text}}>{labelB}</text>
        {[0,0.5,1].map((pct,i)=><line key={i} x1={pad.left} y1={pad.top+iH*pct} x2={W-pad.right} y2={pad.top+iH*pct} stroke={C.grid} strokeWidth="0.6" strokeDasharray={pct===0.5?"4 4":undefined}/>)}
        {data.map((d,i)=>{
          const gX=pad.left+i*gW;const ax=gX+(gW-bW*2-4)/2;const bx=ax+bW+4;
          const aH=Math.max((d.a/max)*iH,d.a>0?4:0);const bH=Math.max((d.b/max)*iH,d.b>0?4:0);
          const haA=hovered?.i===i&&hovered.which==="a";const haB=hovered?.i===i&&hovered.which==="b";
          return <g key={i}>
            <rect x={ax} y={pad.top+iH-aH} width={bW} height={aH} rx={3} fill="url(#gbarA)" opacity={haA?1:0.8} onMouseEnter={()=>setHovered({i,which:"a"})} onMouseLeave={()=>setHovered(null)} style={{cursor:"pointer",transition:"opacity 0.15s"}}/>
            <rect x={bx} y={pad.top+iH-bH} width={bW} height={bH} rx={3} fill="url(#gbarB)" opacity={haB?1:0.8} onMouseEnter={()=>setHovered({i,which:"b"})} onMouseLeave={()=>setHovered(null)} style={{cursor:"pointer",transition:"opacity 0.15s"}}/>
            {(haA||haB)&&<g><rect x={gX+gW/2-32} y={pad.top-28} width={64} height={22} rx={5} fill="#111827" opacity="0.9"/><text x={gX+gW/2} y={pad.top-13} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">{(haA?labelA:labelB)}: {haA?d.a:d.b}</text></g>}
            <text x={gX+gW/2} y={H-8} textAnchor="middle" fontSize="10" style={{fill:C.label}}>{d.label}</text>
          </g>;
        })}
      </svg>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

interface DonutSlice { label: string; value: number; color: string }
export function DonutChart({ slices }: { slices: DonutSlice[] }) {
  const [hovered, setHovered] = useState<number|null>(null);
  const total=slices.reduce((s,d)=>s+d.value,0)||1;
  const R=82;const r=52;const cx=100;const cy=100;
  function toXY(pct:number,radius:number){const a=pct*2*Math.PI-Math.PI/2;return{x:cx+radius*Math.cos(a),y:cy+radius*Math.sin(a)};}
  function arc(s:number,e:number,expand=false){const rr=expand?R+6:R;const s1=toXY(s,rr);const s2=toXY(e,rr);const e1=toXY(e,r);const e2=toXY(s,r);const lg=(e-s)>0.5?1:0;return `M ${s1.x} ${s1.y} A ${rr} ${rr} 0 ${lg} 1 ${s2.x} ${s2.y} L ${e1.x} ${e1.y} A ${r} ${r} 0 ${lg} 0 ${e2.x} ${e2.y} Z`;}
  let cum=0;
  return (
    <div className="flex items-center gap-8">
      <div className="flex-shrink-0" style={{width:200,height:200}}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {slices.map((s,i)=>{const pct=s.value/total;if(pct<0.001){cum+=pct;return null;}const start=cum;cum+=pct;const isH=hovered===i;return <path key={i} d={arc(start,cum,isH)} fill={s.color} opacity={hovered===null||isH?1:0.65} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:"pointer",transition:"opacity 0.2s"}}/>;})}
          <circle cx={cx} cy={cy} r={r-2} fill="var(--surface)"/>
          <text x={cx} y={cy-6} textAnchor="middle" fontSize="20" fontWeight="800" style={{fill:"var(--text)"}}>{hovered!==null?`${Math.round((slices[hovered].value/total)*100)}%`:total}</text>
          <text x={cx} y={cy+12} textAnchor="middle" fontSize="10" style={{fill:C.text}}>{hovered!==null?slices[hovered].label:"total"}</text>
        </svg>
      </div>
      <div className="space-y-3 flex-1">
        {slices.map((s,i)=>(
          <div key={i} className="flex items-center gap-3 cursor-pointer" onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background:s.color}}/>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm mb-1"><span className="font-medium" style={{color:"var(--text)"}}>{s.label}</span><span className="font-bold" style={{color:"var(--text)"}}>{s.value} <span style={{color:C.label,fontWeight:400}}>({Math.round((s.value/total)*100)}%)</span></span></div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{background:"var(--surface-2)"}}><div className="h-full rounded-full" style={{width:`${(s.value/total)*100}%`,background:s.color}}/></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W=120;const H=36;
  const max=Math.max(...values,1);
  const step=W/Math.max(values.length-1,1);
  const pts=values.map((v,i)=>({x:i*step,y:H-4-(v/max)*(H-8)}));
  const line=smoothPath(pts);
  const fill=`${line} L ${pts[pts.length-1]?.x} ${H} L 0 ${H} Z`;
  const id=`sp${color.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height:36}} preserveAspectRatio="none">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={fill} fill={`url(#${id})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {pts[pts.length-1]&&<circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={2.5} fill={color}/>}
    </svg>
  );
}
