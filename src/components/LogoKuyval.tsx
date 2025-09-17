export default function LogoKuyval({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 64" aria-label="Kuyval · Fragancias"
      className={className} role="img"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" transform="translate(10,8)">
        <path d="M18 6a14 14 0 1 0 10 24A16 16 0 1 1 18 6z" />
        <path d="M0 40c8 0 8-6 16-6s8 6 16 6" />
      </g>
      <text x="80" y="30" fontSize="50" fill="currentColor"
            style={{fontFamily:`"Times New Roman", Georgia, serif`, fontWeight:600, letterSpacing:".06em"}}>
        KUYVAL
      </text>
      <text x="80" y="50" fontSize="20" fill="currentColor"
            style={{fontFamily:`ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`, letterSpacing:".24em"}}>
        FRAGANCIAS
      </text>
    </svg>
  );
}
