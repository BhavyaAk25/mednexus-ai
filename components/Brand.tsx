import Link from "next/link";

export function Brand() {
  return <Link href="/" className="brand" aria-label="MedNexus AI home">
    <span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /><i /></span>
    <span>MedNexus<sup>AI</sup></span>
  </Link>;
}
