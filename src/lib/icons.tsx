// Hand-drawn line-icon set (stroke=currentColor, 24x24) ported verbatim from
// PRIMETEAM_Goal_Setting_Planner.html's ICON_SVG map — one consistent icon
// language shared by the sidebar nav and every IconBadge in the app, instead
// of raw emoji glyphs. Paths are static, developer-authored constants (never
// user input), so rendering them via dangerouslySetInnerHTML is safe here —
// it's just the least error-prone way to port them without hand-transcribing
// every path into JSX.
import type { SVGProps } from "react";

function svgIcon(inner: string) {
  function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: inner }}
        {...props}
      />
    );
  }
  return Icon;
}

export const ICON_SVG: Record<string, ReturnType<typeof svgIcon>> = {
  "🏠": svgIcon('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h4v-6h3v6h4a1 1 0 0 0 1-1v-9"/>'),
  "🎯": svgIcon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>'),
  "✏️": svgIcon('<path d="M4 20l1-4.6L16.6 4 20 7.4 8.4 19 4 20z"/><path d="M14 6.4 17.6 10"/>'),
  "🧮": svgIcon(
    '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="7.5" y="5.5" width="9" height="4" rx="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="13.3" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="13.3" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="13.3" r="1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="16.8" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="16.8" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="16.8" r="1" fill="currentColor" stroke="none"/>',
  ),
  "🚨": svgIcon('<path d="M12 3a5 5 0 0 0-5 5v3.3L4.8 15h14.4L17 11.3V8a5 5 0 0 0-5-5z"/><path d="M9.6 18a2.4 2.4 0 0 0 4.8 0"/>'),
  "📊": svgIcon(
    '<rect x="4" y="12" width="3.4" height="8" rx="0.8" fill="currentColor" stroke="none"/><rect x="10.3" y="6" width="3.4" height="14" rx="0.8" fill="currentColor" stroke="none"/><rect x="16.6" y="9.5" width="3.4" height="10.5" rx="0.8" fill="currentColor" stroke="none"/>',
  ),
  "🏆": svgIcon(
    '<path d="M7 4h10v4.3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z"/><path d="M7 5H4.3v1.3a4 4 0 0 0 4 4"/><path d="M17 5h2.7v1.3a4 4 0 0 1-4 4"/><path d="M12 13.3v3"/><path d="M8.3 20h7.4"/><path d="M9.3 20v-2.3h5.4V20"/>',
  ),
  "📝": svgIcon('<path d="M6.5 3h7l4 4v14h-11z"/><path d="M13.5 3v4h4"/><path d="M9 13.2h6M9 16.2h4.5"/>'),
  "🗂️": svgIcon(
    '<rect x="9.3" y="3.3" width="5.4" height="4" rx="1"/><rect x="3" y="15.3" width="5.4" height="4" rx="1"/><rect x="15.6" y="15.3" width="5.4" height="4" rx="1"/><path d="M12 7.3v4M12 11.3H5.7v4M12 11.3h6.3v4"/>',
  ),
  "🧑‍🤝‍🧑": svgIcon(
    '<circle cx="8.3" cy="8.3" r="2.6"/><circle cx="16" cy="9.3" r="2.2"/><path d="M3.3 19.6c0-3 2.3-5.2 5-5.2s5 2.2 5 5.2"/><path d="M13.3 19.6c0-2.4 1.6-4.2 3.5-4.2s3.5 1.8 3.5 4.2"/>',
  ),
  "⚙️": svgIcon(
    '<circle cx="12" cy="12" r="3"/><path d="M12 3.3v2.4M12 18.3v2.4M20.7 12h-2.4M5.7 12H3.3M17.9 6.1l-1.7 1.7M7.8 16.2l-1.7 1.7M17.9 17.9l-1.7-1.7M7.8 7.8 6.1 6.1"/>',
  ),
  "📤": svgIcon('<path d="M12 3v11.3"/><path d="M8 7.3 12 3l4 4.3"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>'),
  "📈": svgIcon('<path d="M4 16.3 9 11l4 3 7-8"/><path d="M15.3 6h4.7v4.7"/>'),
  "🩺": svgIcon('<path d="M3.3 12h3.7l2-5 3 10 2-7 1.7 4h4.3"/>'),
  "💡": svgIcon('<path d="M9.3 18h5.4"/><path d="M10.2 21h3.6"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.6.5 1 1.2 1 2.1h4.8c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
  "🧩": svgIcon('<path d="M9 4h4v1.8a1.5 1.5 0 0 0 3 0V4h4v4h-1.8a1.5 1.5 0 0 0 0 3H20v4h-4v-1.8a1.5 1.5 0 0 0-3 0V15H9v-4H7.2a1.5 1.5 0 0 1 0-3H9V4z"/>'),
  "📄": svgIcon('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>'),
  "💰": svgIcon(
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.3v9.4"/><path d="M14.8 9.3a2.6 2.6 0 0 0-2.6-1.3c-1.5 0-2.6.9-2.6 2s1 1.6 2.6 2 2.6.9 2.6 2-1.1 2-2.6 2a2.8 2.8 0 0 1-2.7-1.4"/>',
  ),
  "⚠️": svgIcon('<path d="M12 4 2.6 20h18.8z"/><path d="M12 10.3v4"/><circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none"/>'),
  "👥": svgIcon(
    '<circle cx="7" cy="9" r="2.3"/><circle cx="17" cy="9" r="2.3"/><circle cx="12" cy="7.5" r="2.6"/><path d="M3 19c0-2.7 1.8-4.5 4-4.5M21 19c0-2.7-1.8-4.5-4-4.5"/><path d="M7 19.5c0-3 2.2-5 5-5s5 2 5 5"/>',
  ),
  "🚀": svgIcon(
    '<path d="M12 2.5c3 1.5 5 5 5 9 0 2-1 4-2 5l-1 3-2-2.5-2 2.5-1-3c-1-1-2-3-2-5 0-4 2-7.5 5-9z"/><circle cx="12" cy="10.5" r="1.6" fill="currentColor" stroke="none"/><path d="M8.5 16.5 6 19M15.5 16.5 18 19"/>',
  ),
  "🔐": svgIcon('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>'),
  "🏁": svgIcon('<path d="M6 3v18"/><path d="M6 4h12l-3 3.5L18 11H6"/>'),
  "🛡️": svgIcon('<path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4.5"/>'),
  "⚡": svgIcon('<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>'),
  "📋": svgIcon('<rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2.5" width="6" height="3" rx="1"/><path d="M9 11h6M9 14.3h6M9 17.6h4"/>'),
  "➕": svgIcon('<path d="M12 5v14M5 12h14"/>'),
  "💼": svgIcon('<rect x="3.3" y="8" width="17.4" height="11" rx="2"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3.3 13h17.4"/>'),
  "📶": svgIcon(
    '<rect x="4" y="15" width="3" height="5" rx="0.7" fill="currentColor" stroke="none"/><rect x="9" y="11" width="3" height="9" rx="0.7" fill="currentColor" stroke="none"/><rect x="14" y="7" width="3" height="13" rx="0.7" fill="currentColor" stroke="none"/><rect x="19" y="3.5" width="2.6" height="16.5" rx="0.7" fill="currentColor" stroke="none"/>',
  ),
  "🪜": svgIcon('<path d="M7 2v20M17 2v20M7 6h10M7 11h10M7 16h10"/>'),
  "🔁": svgIcon('<path d="M4 7h11a4 4 0 0 1 4 4v1"/><path d="M8 4 4 7l4 3"/><path d="M20 17H9a4 4 0 0 1-4-4v-1"/><path d="M16 20l4-3-4-3"/>'),
};

export function resolveIcon(icon: string) {
  return ICON_SVG[icon];
}
