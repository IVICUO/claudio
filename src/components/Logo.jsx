import React from "react";

// IVICUO wordmark, recreated as React/SVG so the brand stays sharp at any size.
// The "u" carries two short magenta poles on top, representing the magnet.
export function Logo({ size = "md", showProductTag = true }) {
  const dims = {
    sm: { letterSize: 22, magnetWidth: 4, magnetHeight: 1.5, gap: 1.5, tagSize: 8 },
    md: { letterSize: 32, magnetWidth: 5, magnetHeight: 2, gap: 2, tagSize: 9 },
    lg: { letterSize: 56, magnetWidth: 9, magnetHeight: 3.5, gap: 3, tagSize: 12 },
  }[size];

  return (
    <div className="inline-flex flex-col items-start select-none">
      <div className="relative inline-flex items-baseline" style={{ lineHeight: 1 }}>
        <span
          className="font-extrabold text-cloud tracking-wordmark"
          style={{ fontSize: dims.letterSize, fontWeight: 800 }}
        >
          ivic
        </span>
        <span
          className="relative font-extrabold text-cloud tracking-wordmark"
          style={{ fontSize: dims.letterSize, fontWeight: 800 }}
        >
          {/* Two magnet poles above the u, in magenta. */}
          <span
            aria-hidden
            className="absolute bg-magenta"
            style={{
              top: -dims.magnetHeight - dims.gap,
              left: dims.letterSize * 0.18,
              width: dims.magnetWidth,
              height: dims.magnetHeight,
              borderRadius: 0.5,
            }}
          />
          <span
            aria-hidden
            className="absolute bg-magenta"
            style={{
              top: -dims.magnetHeight - dims.gap,
              left: dims.letterSize * 0.42,
              width: dims.magnetWidth,
              height: dims.magnetHeight,
              borderRadius: 0.5,
            }}
          />
          u
        </span>
        <span
          className="font-extrabold text-cloud tracking-wordmark"
          style={{ fontSize: dims.letterSize, fontWeight: 800 }}
        >
          o
        </span>
      </div>
      {showProductTag && (
        <span
          className="text-teal font-bold uppercase tracking-tag mt-1"
          style={{ fontSize: dims.tagSize }}
        >
          claudio
        </span>
      )}
    </div>
  );
}
