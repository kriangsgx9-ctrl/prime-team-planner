// Dependency-free sparkline — pure SVG, scales via CSS, no canvas/resize-observer.
export function TrendSparkline({ values, color = "#0A2A5E" }: { values: number[]; color?: string }) {
  const w = 100;
  const h = 42;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : 0;
  const pts = values.map((v, i) => ({ x: i * stepX, y: h - ((v - min) / range) * h }));
  const lineStr = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaStr = `0,${h} ${lineStr} ${w},${h}`;
  const gradId = `tg${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 150, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaStr} fill={`url(#${gradId})`} />
      <polyline points={lineStr} fill="none" stroke={color} strokeWidth={1.4} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 2.2 : 1.3} fill={i === pts.length - 1 ? "#FF6A00" : color} />
      ))}
    </svg>
  );
}
