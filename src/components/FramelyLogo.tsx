import React from 'react';

interface FramelyLogoProps {
  className?: string;
  size?: number;
}

/**
 * Pure Framely Logo: An iconic multi-color pinwheel / camera aperture mark
 * inspired by Google Photos desktop.
 * STRICT REQUIREMENT: Only the pure logo mark itself — NO enclosing box, rectangle, or squircle container.
 */
export const FramelyLogo: React.FC<FramelyLogoProps> = ({ className = 'w-8 h-8', size }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Vibrant Google Photos inspired palette with high-contrast gradients */}
        <linearGradient id="flRed" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF5252" />
          <stop offset="1" stopColor="#E53935" />
        </linearGradient>
        <linearGradient id="flYellow" x1="24" y1="4" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD54F" />
          <stop offset="1" stopColor="#F57F17" />
        </linearGradient>
        <linearGradient id="flGreen" x1="24" y1="24" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66BB6A" />
          <stop offset="1" stopColor="#2E7D32" />
        </linearGradient>
        <linearGradient id="flBlue" x1="4" y1="24" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#42A5F5" />
          <stop offset="1" stopColor="#1565C0" />
        </linearGradient>
      </defs>

      {/* Top Left Petal (Red / Crimson) */}
      <path
        d="M24 13.5C24 7.7 19.3 3 13.5 3S3 7.7 3 13.5 7.7 24 13.5 24H24V13.5Z"
        fill="url(#flRed)"
      />

      {/* Top Right Petal (Yellow / Golden) */}
      <path
        d="M34.5 24C40.3 24 45 19.3 45 13.5S40.3 3 34.5 3 24 7.7 24 13.5V24H34.5Z"
        fill="url(#flYellow)"
      />

      {/* Bottom Right Petal (Green / Emerald) */}
      <path
        d="M24 34.5C24 40.3 28.7 45 34.5 45S45 40.3 45 34.5 40.3 24 34.5 24H24V34.5Z"
        fill="url(#flGreen)"
      />

      {/* Bottom Left Petal (Telegram Blue / Sky) */}
      <path
        d="M13.5 24C7.7 24 3 28.7 3 34.5S7.7 45 13.5 45 24 40.3 24 34.5V24H13.5Z"
        fill="url(#flBlue)"
      />

      {/* Central Aperture Shutter Core */}
      <circle cx="24" cy="24" r="3.2" fill="#FFFFFF" fillOpacity="0.9" />
    </svg>
  );
};
