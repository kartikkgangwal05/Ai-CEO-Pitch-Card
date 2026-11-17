export function BackgroundArtwork() {
  return (
    <div
      aria-hidden="true"
      className="no-print fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Top-Left Subtle Robo-Cat & Cyber Circuit Motif */}
      <svg
        viewBox="0 0 240 240"
        className="absolute -top-6 -left-8 w-64 h-64 text-sky-400 opacity-[0.09]"
        fill="none"
      >
        <circle cx="110" cy="110" r="68" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="110" cy="110" r="46" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="98" cy="96" rx="8" ry="10" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="122" cy="96" rx="8" ry="10" stroke="currentColor" strokeWidth="2" />
        <path d="M90 120 Q110 136 130 120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M178 110 L230 110" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="230" cy="110" r="4" fill="currentColor" />
      </svg>

      {/* Top-Right Spark & Starburst Texture */}
      <svg
        viewBox="0 0 260 260"
        className="absolute top-12 -right-10 w-72 h-72 text-cyan-300 opacity-[0.08]"
        fill="none"
      >
        <polygon
          points="130,18 152,96 232,96 168,142 192,220 130,174 68,220 92,142 28,96 108,96"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="130" cy="130" r="102" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 8" />
      </svg>

      {/* Bottom-Left Diagonal Data Waves */}
      <svg
        viewBox="0 0 320 200"
        className="hidden sm:block absolute bottom-4 left-4 w-80 h-48 text-sky-400 opacity-[0.08]"
        fill="none"
      >
        <path d="M10 150 Q85 90 160 140 T310 100" stroke="currentColor" strokeWidth="2" />
        <path d="M10 175 Q85 115 160 165 T310 125" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
        <circle cx="160" cy="140" r="5" fill="currentColor" />
      </svg>

      {/* Bottom-Right Executive Crest & Cartoon Orbit */}
      <svg
        viewBox="0 0 240 240"
        className="hidden sm:block absolute -bottom-8 -right-6 w-64 h-64 text-blue-400 opacity-[0.09]"
        fill="none"
      >
        <polygon points="120,24 210,120 120,216 30,120" stroke="currentColor" strokeWidth="2" />
        <polygon points="120,52 184,120 120,188 56,120" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 4" />
        <circle cx="120" cy="120" r="16" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}
