import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ScanFrameIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function ScanFrameIcon({
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2.5,
}: ScanFrameIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M 4 8 V 6 C 4 4.9 4.9 4 6 4 H 8 M 16 4 H 18 C 19.1 4 20 4.9 20 6 V 8 M 4 16 V 18 C 4 19.1 4.9 20 6 20 H 8 M 16 20 H 18 C 19.1 20 20 19.1 20 18 V 16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
