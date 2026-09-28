import React from 'react';

interface VoiceBarsProps {
  heightClass?: string;
  gapClass?: string;
  bars?: number;
}

export const VoiceBars = React.memo(function VoiceBars({ heightClass = 'h-4', gapClass = 'gap-[3px]', bars = 5 }: VoiceBarsProps) {
  return (
    <span className={`flex items-end ${gapClass} ${heightClass}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => <span key={i} className="voice-bar" />)}
    </span>
  );
});
