import type { ReactNode } from "react";

const drawings = {
  records: <><path d="M4 8h6l2 2h8v10H4zM6 8V4h9l3 3v3" /><path d="M8 14h8m-8 3h5" /></>,
  evaluation: <><path d="M3 19h18M5 16l5-5 4 2 5-7" /><path d="M16 6h3v3M5 16v-3m5 3v-2m4 2v-1" /></>,
  brief: <><path d="M5 3h9l5 5v13H5zM14 3v5h5" /><path d="M8 12h8m-8 4h5" /></>,
  timeline: <><path d="M7 3v18M7 4l2 2-2 2-2-2zm0 6 2 2-2 2-2-2zm0 6 2 2-2 2-2-2zM12 6h7m-7 6h5m-5 6h8" /></>,
  sources: <><path d="M9 3h7l4 4v10H9zM16 3v4h4M6 6H4v15h13v-2" /><path d="M12 11h5m-5 3h3" /></>,
  clinician: <><path d="M6 4H4v5a5 5 0 0 0 10 0V4h-2M9 14v2a4 4 0 0 0 8 0v-2" /><circle cx="17" cy="11.5" r="2.5" /></>,
  coordinator: <><path d="M3 20v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M14 15h2a4 4 0 0 1 4 4v1" /><circle cx="8" cy="8" r="3" /><path d="M15 5a3 3 0 0 1 0 6" /></>,
  compare: <><path d="M3 4h7v11H3zm11 5h7v11h-7zM5 8h3m-3 3h3m8 2h3m-3 3h3M13 5h5l-2-2M11 19H6l2 2" /></>,
  verify: <><path d="M5 3h9l5 5v13H5zM14 3v5h5M8 14l2.5 2.5L16 11" /></>,
  evidence: <><path d="M14 21H5V3h9l4 4v4M14 3v4h4M8 10h6m-6 4h3" /><circle cx="16" cy="16" r="3.5" /><path d="m18.5 18.5 2.5 2.5" /></>,
  review: <><path d="M5 21V4h14l-2.5 4 2.5 4H5M11 6v2.5m0 1.8h.01" /></>,
  pending: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  verified: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.3 2.3 4.7-4.8" /></>,
  confirm: <path d="m5 12 4.5 4.5L19 7" />,
  undo: <path d="M9 4 5 8l4 4M5 8h9a5 5 0 0 1 0 10H9" />,
  benchmark: <><path d="M4 20h16M6 17v-5h4v5m4 0V7h4v10M6 5h4" /></>,
  table: <><path d="M4 5h16v14H4zM4 10h16m-16 4.5h16M10 10v9" /></>,
  scan: <><path d="M8 4H4v4m12-4h4v4m0 8v4h-4m-8 0H4v-4M8 9h8m-8 3h8m-8 3h5" /></>,
  access: <><path d="M13 21H5V3h10l4 4v4M15 3v4h4M8 10h5m-5 4h3m2 1h8v6h-8zm2 0v-2a2 2 0 0 1 4 0v2" /></>,
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
