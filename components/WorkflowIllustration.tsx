const pine = "#123d2e";
const leaf = "#c9f26d";
const cream = "#fffdf2";
const red = "#ac3e30";

const illustrations = {
  find: <>
    <path d="M19 37h102v31H19z" fill={pine} />
    <path d="M26 23h70l11 11v28H26z" fill="#92bb9f" stroke={pine} strokeWidth="2" />
    <path d="M36 12h57l13 13v33H36z" fill={cream} stroke={pine} strokeWidth="2" />
    <path d="M91 12v15h15" fill={leaf} stroke={pine} strokeWidth="2" />
    <path d="M45 23h19v11H45z" fill={leaf} />
    <path d="M46 41h44m-44 7h33" stroke={pine} strokeWidth="2" />
    <path d="M19 54h29l7 6h66v8H19z" fill={pine} />
    <path d="M26 60h15" stroke={leaf} strokeWidth="2" />
  </>,
  compare: <>
    <path d="M12 15h54v49H12z" fill="#e4f5e6" stroke={pine} strokeWidth="2" />
    <path d="M74 15h54v49H74z" fill="#f9e3dc" stroke={red} strokeWidth="2" />
    <path d="M12 15h54v8H12z" fill={pine} />
    <path d="M74 15h54v8H74z" fill={red} />
    <path d="M21 53h27m35 0h26" stroke={pine} strokeWidth="2" />
    <text x="20" y="43" fill={pine} fontSize="16" fontWeight="700">10 mg</text>
    <text x="82" y="43" fill={red} fontSize="16" fontWeight="700">20 mg</text>
    <path d="M67 32h6m-6 9h6" stroke={pine} strokeWidth="2" />
  </>,
  verify: <>
    <path d="M27 12h57l13 13v44H27z" fill={cream} stroke={pine} strokeWidth="2" />
    <path d="M82 12v15h15" fill={leaf} stroke={pine} strokeWidth="2" />
    <path d="M38 24h29M38 36h38M38 44h28M38 58h25" stroke={pine} strokeWidth="2" />
    <path d="M84 41h29l13 14-13 14H84L71 55z" fill={pine} stroke={cream} strokeWidth="2" />
    <path d="m88 55 8 7 13-15" fill="none" stroke={leaf} strokeWidth="3.5" strokeLinejoin="bevel" />
  </>,
} as const;

export function WorkflowIllustration({ step }: { step: keyof typeof illustrations }) {
  return <svg className="workflow-art" width="140" height="80" viewBox="0 0 140 80" fill="none" aria-hidden="true" focusable="false">
    {illustrations[step]}
  </svg>;
}
