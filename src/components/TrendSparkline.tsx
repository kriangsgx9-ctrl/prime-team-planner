// Dependency-free sparkline — pure SVG for the line/fill (scales via CSS, no
// canvas/resize-observer), with the dot markers as separate HTML overlays
// positioned by percentage. Circles drawn directly in a non-uniformly
// scaled SVG (preserveAspectRatio="none", needed so a fixed-height chart
// fills a fluid-width container) come out as ellipses, not circles — the
// HTML overlay sidesteps that entirely since its sizing is in real pixels.
export function TrendSparkline({ values, color = "#0A2A5E" }: { values: number[]; color?: string }) {
  const w = 100;
  const h = 42;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : 0;
  const pts = values.map((v, i) => ({ x: i * stepX, y: h - ((v - min) / range) * h, v }));

  // Smooth the line with a simple Catmull-Rom-to-Bezier conversion instead of
  // straight segments — reads less jagged for month-to-month data.
  const pathD = pts.length
    ? pts.reduce((d, p, i, arr) => {
        if (i === 0) return `M ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        const prev = arr[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `${d} C ${cx.toFixed(2)},${prev.y.toFixed(2)} ${cx.toFixed(2)},${p.y.toFixed(2)} ${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      }, "")
    : "";
  const areaD = pts.length ? `${pathD} L ${w},${h} L 0,${h} Z` : "";
  const gradId = `tg${Math.random().toString(36).slice(2, 8)}`;
  const zeroY = h - ((0 - min) / range) * h;

  return (
    <div className="relative" style={{ height: 150 }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {min < 0 && max > 0 && <line x1={0} y1={zeroY} x2={w} y2={zeroY} stroke="var(--line)" strokeWidth={0.5} strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1;
        return (
          <div
            key={i}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(p.x / w) * 100}%`, top: `${(p.y / h) * 100}%` }}
          >
            <div className="rounded-full" style={{ width: isLast ? 7 : 5, height: isLast ? 7 : 5, background: isLast ? "#FF6A00" : color, boxShadow: isLast ? "0 0 0 3px rgba(255,106,0,0.18)" : undefined }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md bg-[var(--navy)] px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
              {Math.round(p.v).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
