import type { ReactNode } from "react";

const accent = "var(--glyph-accent, #8ec746)";

const drawings = {
  brief: <>
    <path fill={accent} d="M4 8h14l4 4v16H4z" />
    <path fill="currentColor" d="M9 3h13l5 5v16H9z" />
    <path fill={accent} d="M21 3v6h6z" />
    <path d="M13 13h9m-9 4h7" stroke="#fff" strokeWidth="1.7" />
  </>,
  review: <>
    <path fill="currentColor" d="M5 3h3v26H5z" />
    <path fill={accent} d="M8 5h20l-4 6 4 6H8z" />
    <path fill="currentColor" d="M8 5h16l-4 6 4 6H8z" />
    <path d="M14 8v4m0 2.4v.5" stroke="#fff" strokeWidth="1.8" />
  </>,
  benchmark: <>
    <path fill={accent} d="M4 16h5v10H4zM15 4h5v22h-5z" />
    <path fill="currentColor" d="M9 12h5v14H9zM20 8h5v18h-5zM3 27h26v2H3z" />
    <path d="M13 6H5m0 0 3-3M5 6l3 3" stroke="currentColor" strokeWidth="1.6" />
  </>,
  sources: <>
    <path fill={accent} d="M3 11h20v17H3z" />
    <path fill="currentColor" d="M7 7h20v17H7z" />
    <path fill="#fff" stroke="currentColor" strokeWidth="1.8" d="M11 3h13l5 5v12H11z" />
    <path fill={accent} d="M23 4v5h5z" />
    <path d="M15 11h9m-9 4h7" stroke="currentColor" strokeWidth="1.6" />
  </>,
  document: <>
    <path fill="currentColor" d="M7 3h13l6 6v20H7z" />
    <path fill={accent} d="M19 3v7h7z" />
    <path d="M12 14h9m-9 4h9m-9 4h6" stroke="#fff" strokeWidth="1.6" />
  </>,
  scan: <>
    <path fill="currentColor" d="M4 4h8v2H6v6H4zm16 0h8v8h-2V6h-6zM4 20h2v6h6v2H4zm22 0h2v8h-8v-2h6z" />
    <path fill={accent} d="M9 9h14v14H9z" />
    <path d="M12 13h8m-8 3h8m-8 3h5" stroke="currentColor" strokeWidth="1.7" />
  </>,
  table: <>
    <path fill="currentColor" d="M3 6h26v21H3z" />
    <path fill={accent} d="M5 8h22v5H5z" />
    <path d="M6 17h20m-20 4h20m-13-6v9m7-9v9" stroke="#fff" strokeWidth="1.5" />
  </>,
  clinician: <>
    <path fill={accent} d="M20 10h8v8h-8z" />
    <path d="M7 5H4v7a6 6 0 0 0 12 0V5h-3M10 18v2a6 6 0 0 0 12 0v-3" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="square" />
    <path fill="currentColor" d="M22 12h4v4h-4z" />
  </>,
  coordinator: <>
    <path fill={accent} d="M22 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-3 13 3-2 7 4v7h-8v-5z" />
    <path fill="currentColor" d="M10 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12 8 4v6H2v-6z" />
    <path d="M6 23h8" stroke="#fff" strokeWidth="1.6" />
  </>,
  access: <>
    <path fill={accent} d="M3 9h16v19H3z" />
    <path fill="currentColor" d="M8 3h13l6 6v14H8z" />
    <path fill={accent} d="M20 3v7h7z" />
    <path d="M12 12h6m-6 4h4m4 4v-2a3 3 0 0 1 6 0v2" stroke="#fff" strokeWidth="1.7" fill="none" />
    <path fill={accent} stroke="currentColor" strokeWidth="1.4" d="M18 20h10v8H18z" />
  </>,
  verified: <>
    <path fill="currentColor" d="M9 3h14l7 13-7 13H9L2 16z" />
    <path d="m9 16 4.5 4.5L23 11" stroke={accent} strokeWidth="3" strokeLinecap="square" fill="none" />
  </>,
  pending: <>
    <path fill="none" stroke="currentColor" strokeWidth="2.1" d="M9 4h14l6 12-6 12H9L3 16z" />
    <path d="M16 10v6l5 3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" fill="none" />
  </>,
} satisfies Record<string, ReactNode>;

export type WorkspaceGlyphName = keyof typeof drawings;

export function WorkspaceGlyph({ name, size = 24 }: { name: WorkspaceGlyphName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">{drawings[name]}</svg>;
}
