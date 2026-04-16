import React, { useId } from 'react';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const VIEWBOX_WIDTH = 500;
const VIEWBOX_HEIGHT = 450;
const HANGER_PATH = 'M 210,100 C 210,40 290,40 290,100 C 290,130 270,150 250,170 L 90,320 C 60,350 80,380 120,380 L 380,380 C 420,380 440,350 410,320 L 285,205';

export default function GeminiHangerIcon({
  size = 24,
  width = size,
  height = size * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH),
  tone = 'gradient',
  color = '#FFFFFF',
  opacity = 1,
  style,
}) {
  const baseId = useId().replace(/:/g, '');
  const mainGradId = `gemini-main-${baseId}`;
  const highlightGradId = `gemini-highlight-${baseId}`;
  const bottomShadowId = `gemini-bottom-${baseId}`;
  const isGradient = tone === 'gradient';

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      style={style}
    >
      {isGradient && (
        <Defs>
          <LinearGradient id={mainGradId} x1="10%" y1="0%" x2="90%" y2="100%">
            <Stop offset="0%" stopColor="#DF65FF" />
            <Stop offset="50%" stopColor="#A820D3" />
            <Stop offset="100%" stopColor="#59057A" />
          </LinearGradient>
          <LinearGradient id={highlightGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={bottomShadowId} x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#2D0642" stopOpacity="0.7" />
            <Stop offset="25%" stopColor="#2D0642" stopOpacity="0" />
          </LinearGradient>
        </Defs>
      )}

      <G transform="translate(0 10)">
        {isGradient && (
          <Path
            d={HANGER_PATH}
            fill="none"
            stroke="#3A0D54"
            strokeOpacity={0.18 * opacity}
            strokeWidth={46}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0 12)"
          />
        )}

        <Path
          d={HANGER_PATH}
          fill="none"
          stroke={isGradient ? `url(#${mainGradId})` : color}
          strokeOpacity={opacity}
          strokeWidth={42}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {isGradient && (
          <>
            <Path
              d={HANGER_PATH}
              fill="none"
              stroke={`url(#${bottomShadowId})`}
              strokeOpacity={opacity}
              strokeWidth={42}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={HANGER_PATH}
              fill="none"
              stroke={`url(#${highlightGradId})`}
              strokeOpacity={opacity}
              strokeWidth={20}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={HANGER_PATH}
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity={0.65 * opacity}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(0 -9)"
            />
          </>
        )}
      </G>
    </Svg>
  );
}
