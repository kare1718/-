import { useState, useEffect } from 'react';
import { toast } from '../lib/feedback';

// 인앱 브라우저 감지 (카카오톡, 네이버, 인스타, 페이스북 등)
function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || '';
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(ua);
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const ua = navigator.userAgent || '';
  const inApp = isInAppBrowser();
  const isIOS = /iPad|iPhone|iPod/.test(ua);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true);
      return;
    }

    // beforeinstallprompt는 항상 리스닝 (installed 여부와 관계없이)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', '1');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null);
        localStorage.setItem('pwa-installed', '1');
      }
    }
  };

  const openExternalBrowser = () => {
    const url = window.location.href;

    if (/KAKAOTALK/i.test(ua)) {
      if (isIOS) {
        window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
      } else {
        window.location.href = 'intent://' + url.replace(/https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
      }
    } else if (isIOS) {
      navigator.clipboard?.writeText(url);
      toast('링크가 복사되었어요!\nSafari에서 붙여넣기 하세요.');
    } else {
      window.location.href = 'intent://' + url.replace(/https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
    }
  };

  if (isStandalone) return null;

  const bannerStyle = {
    width: '100%', padding: '14px 16px',
    background: '#0B1933',
    color: 'white', border: 'none', borderRadius: 18,
    cursor: 'pointer', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 14,
  };

  // 인앱 브라우저 → 항상 표시
  if (inApp) {
    return (
      <button onClick={openExternalBrowser} style={bannerStyle}>
        <img src="/icons/icon-192.png" alt="팀강인" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>팀강인 브라우저에서 열기</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>앱 설치를 위해 브라우저로 이동해요</div>
        </div>
      </button>
    );
  }

  // Android/Chrome - deferredPrompt가 있으면 항상 설치 버튼 표시
  if (deferredPrompt) {
    return (
      <button onClick={handleInstall} style={bannerStyle}>
        <img src="/icons/icon-192.png" alt="팀강인" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>팀강인 앱 홈 화면에 설치</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>탭하면 바로 설치돼요</div>
        </div>
      </button>
    );
  }

  // 이미 설치했거나 닫았으면 숨김
  if (dismissed || localStorage.getItem('pwa-installed')) return null;

  // iOS Safari - 가이드
  if (isIOS) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, var(--neutral-900) 0%, var(--neutral-700) 100%)',
        color: 'white', borderRadius: 12, padding: '14px 16px',
        marginBottom: 12, position: 'relative'
      }}>
        <button
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute', top: 8, right: 10,
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer'
          }}
        >×</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 24 }}>📲</span>
          <div style={{ fontWeight: 600, fontSize: 14 }}>홈 화면에 설치하기</div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.8, opacity: 0.9 }}>
          ① 하단 <b>공유 버튼</b> (□↑) 탭<br />
          ② <b>"홈 화면에 추가"</b> 선택<br />
          ③ 우측 상단 <b>"추가"</b> 탭
        </div>
      </div>
    );
  }

  return null;
}
