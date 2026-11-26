import type { ReactNode } from "react";

const drawings = {
  records: <><path d="M4 8h6l2 2h8v10H4zM6 8V4h9l3 3v3" /><path d="M8 14h8m-8 3h5" /></>,
  evaluation: <><path d="M3 19h18M5 16l5-5 4 2 5-7" /><path d="M16 6h3v3M5 16v-3m5 3v-2m4 2v-1" /></>,
  brief: <><path d="M5 3h9l5 5v13H5zM14 3v5h5" /><path d="M8 12h8m-8 4h5" /></>,
  timeline: <><path d="M7 3v18M7 4l2 2-2 2-2-2zm0 6 2 2-2 2-2-2zm0 6 2 2-2 2-2-2zM12 6h7m-7 6h5m-5 6h8" /></>,
  sources: <><path d="M9 3h7l4 4v10H9zM16 3v4h4M6 6H4v15h13v-2" /><path d="M12 11h5m-5 3h3" /></>,
  clinician: <><path d="M6 4H4v6a5 5 0 0 0 10 0V4h-2m-3 1v2m-1-1h2M9 15v1a4 4 0 0 0 8 0v-3" /><circle cx="17" cy="10" r="2" /></>,
  coordinator: <><path d="M3 20v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M14 15h2a4 4 0 0 1 4 4v1" /><circle cx="8" cy="8" r="3" /><path d="M15 5a3 3 0 0 1 0 6" /></>,
  compare: <><path d="M3 4h7v11H3zm11 5h7v11h-7zM5 8h3m-3 3h3m8 2h3m-3 3h3M13 5h5l-2-2M11 19H6l2 2" /></>,
  verify: <><path d="M5 3h9l5 5v13H5zM14 3v5h5M8 14l2.5 2.5L16 11" /></>,
  alert: <><path d="M12 3 22 12 12 21 2 12Z" /><path d="M12 8v5m0 3h.01" /></>,
  clinic: <><path d="m3 10 9-6 9 6M5 9v11h14V9M10 20v-5h4v5M12 8v4m-2-2h4" /></>,
  hospital: <><path d="M5 21V4h14v17M3 21h18M10 21v-4h4v4M8 13h2m4 0h2M12 6v5M9.5 8.5h5" /></>,
  specialist: <><circle cx="9" cy="8" r="3" /><path d="M3 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2m3-10v6m-3-3h6" /></>,
  lab: <><path d="M9 3h6m-5 0v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8" /><path d="M10 18h.01m4-1h.01" /></>,
} satisfies Record<string, ReactNode>;

export type ChartIconName = keyof typeof drawings;

export function ChartIcon({ name, size = 18 }: { name: ChartIconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {drawings[name]}
  </svg>;
}

export function RecordAccessArt() {
  return <svg className="access-art" width="78" height="72" viewBox="0 0 78 72" fill="none" aria-hidden="true" focusable="false">
    <path d="M8 25 33 4h32l8 9v29L48 67H16l-8-9Z" fill="#e2ebe0" />
    <path d="M16 23h22l7 7v30H16z" fill="#bdcdbb" stroke="#224b38" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M24 13h23l10 10v31H24z" fill="#fcfaf0" stroke="#224b38" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M47 13v10h10M30 28h16m-16 6h12m-12 6h8" stroke="#224b38" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M47 44v-4a6 6 0 0 1 12 0v4" stroke="#80392f" strokeWidth="2" />
    <path d="M44 44h18v15H44z" fill="#a44739" stroke="#80392f" strokeWidth="1.5" />
    <path d="M53 49v5" stroke="#fff9ee" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 22h5m-2.5-2.5v5M12 17h4" stroke="#53755b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}
