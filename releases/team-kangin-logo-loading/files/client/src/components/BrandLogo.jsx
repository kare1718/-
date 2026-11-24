import { useEffect, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';

function useResolvedDark(variant) {
  const theme = useUIStore((s) => s.theme);
  const [sysDark, setSysDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (variant !== 'auto' || theme !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSysDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [variant, theme]);

  if (variant === 'dark') return true;
  if (variant === 'light') return false;
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return sysDark;
}

/**
 * 팀 강인 (TEAM KANG:IN) 공용 브랜드 로고 컴포넌트
 * - variant="auto": 현재 테마(라이트/다크)에 맞춰 투명 PNG 자동 전환
 * - variant="dark": 딥 네이비 상단바·어두운 배경용 (화이트 + 블루 :IN)
 * - variant="light": 화이트·밝은 배경용 (딥 네이비 + 블루 :IN)
 */
export default function BrandLogo({
  variant = 'auto',
  height = 36,
  showSub = false,
  subText = 'by 강인한 국어',
  align = 'left',
  style = {},
  className = '',
}) {
  const isDark = useResolvedDark(variant);
  const src = isDark ? '/brand/team-kangin-dark.png' : '/brand/team-kangin-light.png';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      <img
        src={src}
        alt="TEAM KANG:IN"
        draggable={false}
        style={{
          height,
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
      {showSub && (
        <span
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: isDark ? '#94A3B8' : '#8B95A1',
          }}
        >
          {subText}
        </span>
      )}
    </span>
  );
}
