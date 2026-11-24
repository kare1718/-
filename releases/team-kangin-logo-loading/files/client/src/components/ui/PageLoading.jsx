// 토스(Toss) 스타일 표준 페이지 로딩 스켈레톤
// 사용: if (loading) return <PageLoading wrap="main-content" />;
// wrap: 원래 페이지가 쓰던 레이아웃 클래스 유지용 (main-content / content / 생략)
export function PageLoading({ wrap }) {
  return (
    <div
      className={wrap}
      role="status"
      aria-label="불러오는 중"
      style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div
        className="skeleton"
        style={{ width: 148, height: 22, borderRadius: 10 }}
      />
      <div
        style={{
          background: 'var(--card, #FFFFFF)',
          borderRadius: 22,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div className="skeleton" style={{ width: '42%', height: 14, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: '78%', height: 24, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: '100%', height: 8, borderRadius: 999 }} />
      </div>
      <div
        style={{
          background: 'var(--card, #FFFFFF)',
          borderRadius: 22,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 999, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ width: '58%', height: 14, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: '36%', height: 12, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageLoading;
