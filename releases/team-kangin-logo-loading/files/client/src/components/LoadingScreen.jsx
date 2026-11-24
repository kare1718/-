import BrandLogo from './BrandLogo';

/**
 * 토스(Toss) 스타일 팀 강인(TEAM KANG:IN) 풀스크린 로딩 화면
 * - index.html 초기 스플래시와 시각적으로 100% 연속되도록 설계
 * - 라이트(#F2F4F6) / 다크(#0B1424) 자동 대응
 */
export default function LoadingScreen({ message = '잠시만 기다려 주세요' }) {
  return (
    <div
      className="tk-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="팀 강인 불러오는 중"
    >
      <style>{`
        .tk-loading-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: 24px;
          background: #F2F4F6;
          color: #191F28;
        }
        :root[data-theme="dark"] .tk-loading-screen {
          background: #0B1424;
          color: #F8FAFC;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .tk-loading-screen {
            background: #0B1424;
            color: #F8FAFC;
          }
        }
        .tk-loading-logo-wrap {
          animation: tkLoadFade 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .tk-loading-bar {
          width: 132px;
          height: 3.5px;
          border-radius: 999px;
          background: #E5E8EB;
          overflow: hidden;
          position: relative;
        }
        :root[data-theme="dark"] .tk-loading-bar {
          background: #1D2E4D;
        }
        .tk-loading-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 44%;
          border-radius: 999px;
          background: #3182F6;
          animation: tkLoadSlide 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .tk-loading-msg {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: #6B7684;
        }
        :root[data-theme="dark"] .tk-loading-msg {
          color: #94A3B8;
        }
        @keyframes tkLoadFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tkLoadSlide {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }
      `}</style>

      <div className="tk-loading-logo-wrap">
        <BrandLogo variant="auto" height={58} showSub align="center" />
      </div>
      <div className="tk-loading-bar" />
      {message && <p className="tk-loading-msg">{message}</p>}
    </div>
  );
}
