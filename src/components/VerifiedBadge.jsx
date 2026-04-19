import React, { useId } from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export function isUserVerified(profile) {
  if (!profile) return false;
  if (profile.verified === true) return true;
  return (profile.avgRating ?? 0) >= 4.2 && (profile.outfitCount ?? 0) >= 5;
}

export default function VerifiedBadge({ size = 16 }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={`vg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%"   stopColor="#FFE566" />
          <Stop offset="45%"  stopColor="#D4900A" />
          <Stop offset="100%" stopColor="#8B6200" />
        </LinearGradient>
        <LinearGradient id={`vsh-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor="#fff" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="12" fill={`url(#vg-${id})`} />
      <Circle cx="12" cy="12" r="12" fill={`url(#vsh-${id})`} />
      <Path
        d="M 6.5 12.2 L 10.2 15.8 L 17.8 8.2"
        stroke="white"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
