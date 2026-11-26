import Link from "next/link";

export function Brand() {
  return <Link href="/" className="brand" aria-label="MedNexus AI home">
    <svg className="brand-symbol" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path d="M11 2h8v8h9v9h-8v9h-9v-8H2v-9h9z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="bevel" />
      <path d="m15 9 6 6-6 6-6-6Z" fill="#a94536" />
    </svg>
    <span>MedNexus <small>AI</small></span>
  </Link>;
}
