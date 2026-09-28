'use client';

import React from 'react';

interface AwardBadgeProps {
  className?: string;
  size?: number;
  fill?: boolean;
}

/**
 * Signature NUGGET Award Ribbon Badge icon, matching media_1790350139101.png
 * Features the upper medal circle and classic dual ribbon tails with an inverted-V cutout.
 */
export default function AwardBadge({ className = 'h-4 w-4', size, fill = false }: AwardBadgeProps) {
  return (
    <svg
      viewBox="0 0 24 28"
      fill={fill ? 'currentColor' : 'none'}
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={size ? { width: size, height: size * (28 / 24) } : undefined}
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Upper medal circle */}
      <circle cx="12" cy="9.5" r="6.5" />
      {/* Lower ribbon tails with inverted V notch */}
      <path d="M7.8 14.8L5.5 24.5L12 21L18.5 24.5L16.2 14.8" />
    </svg>
  );
}
