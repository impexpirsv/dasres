type HeroGlobeProps = {
  label: string;
};

const nodes = [
  [185, 155], [276, 116], [355, 166], [430, 128], [470, 224],
  [379, 271], [294, 232], [218, 282], [148, 227],
] as const;

export default function HeroGlobe({ label }: HeroGlobeProps) {
  return (
    <div className="relative aspect-square w-full" role="img" aria-label={label}>
      <div className="absolute inset-[7%] rounded-full border border-cyan-300/15 bg-slate-950/50 shadow-[inset_0_0_80px_rgba(14,165,233,0.08),0_0_100px_rgba(37,99,235,0.14)] backdrop-blur-sm" />
      <svg viewBox="0 0 620 620" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="globe-surface" cx="36%" cy="28%" r="72%">
            <stop offset="0" stopColor="#164e63" stopOpacity="0.42" />
            <stop offset="0.52" stopColor="#0f172a" stopOpacity="0.72" />
            <stop offset="1" stopColor="#020617" stopOpacity="0.96" />
          </radialGradient>
          <linearGradient id="globe-ring" x1="0" x2="1">
            <stop stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="#67e8f9" stopOpacity="0.8" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0.12" />
          </linearGradient>
          <filter id="node-glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="globe-clip"><circle cx="310" cy="310" r="238" /></clipPath>
        </defs>

        <circle cx="310" cy="310" r="244" fill="url(#globe-surface)" stroke="url(#globe-ring)" strokeWidth="2" />
        <circle cx="310" cy="310" r="258" fill="none" stroke="#22d3ee" strokeOpacity="0.12" />

        <g className="homepage-globe-grid" clipPath="url(#globe-clip)" fill="none" stroke="#67e8f9" strokeOpacity="0.16" strokeWidth="1.2">
          <ellipse cx="310" cy="310" rx="238" ry="73" />
          <ellipse cx="310" cy="310" rx="238" ry="142" />
          <ellipse cx="310" cy="310" rx="90" ry="238" />
          <ellipse cx="310" cy="310" rx="170" ry="238" />
          <path d="M72 310h476" />
        </g>

        <g className="homepage-globe-routes" clipPath="url(#globe-clip)" fill="none" strokeLinecap="round">
          <path d="M148 227 Q274 63 430 128" stroke="#60a5fa" strokeOpacity="0.72" strokeWidth="2" />
          <path d="M185 155 Q335 225 470 224" stroke="#22d3ee" strokeOpacity="0.7" strokeWidth="2" />
          <path d="M218 282 Q301 106 379 271" stroke="#34d399" strokeOpacity="0.65" strokeWidth="2" />
          <path d="M276 116 Q315 338 470 224" stroke="#60a5fa" strokeOpacity="0.52" strokeWidth="1.6" />
          <path d="M148 227 Q292 375 430 128" stroke="#22d3ee" strokeOpacity="0.46" strokeWidth="1.6" />
        </g>

        <g filter="url(#node-glow)">
          {nodes.map(([cx, cy], index) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="8" fill={index % 3 === 0 ? "#34d399" : "#22d3ee"} opacity="0.14" />
              <circle cx={cx} cy={cy} r="3" fill={index % 3 === 0 ? "#6ee7b7" : "#a5f3fc"} />
            </g>
          ))}
        </g>

        <g className="homepage-globe-orbit" fill="none">
          <ellipse cx="310" cy="310" rx="286" ry="112" transform="rotate(-18 310 310)" stroke="url(#globe-ring)" strokeWidth="1.5" strokeDasharray="4 10" />
          <circle cx="552" cy="210" r="4" fill="#67e8f9" filter="url(#node-glow)" />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-[17%] rounded-full bg-[radial-gradient(circle_at_32%_25%,rgba(255,255,255,0.1),transparent_18%)]" aria-hidden="true" />
    </div>
  );
}
