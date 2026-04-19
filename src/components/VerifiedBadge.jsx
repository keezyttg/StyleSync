import React from 'react';
import VerificationCheckSvg from '../../assets/VerificationCheck.svg';

export function isUserVerified(profile) {
  if (!profile) return false;
  if (profile.verified === true) return true;
  return (profile.avgRating ?? 0) >= 3.5 || (profile.outfitCount ?? 0) >= 2;
}

export default function VerifiedBadge({ size = 60 }) {
  return <VerificationCheckSvg width={size} height={size} viewBox="0 0 1024 1024" />;
}
