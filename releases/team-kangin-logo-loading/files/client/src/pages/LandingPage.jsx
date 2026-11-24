import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, getUser } from '../api';
import LegalFooter from '../components/LegalFooter';
import BrandLogo from '../components/BrandLogo';

const C = {
  accent: 'var(--primary)', accentLight: 'var(--primary-light)', accentBg: 'oklch(55% 0.15 250 / 0.05)',
  textPrimary: 'var(--foreground)', textSecondary: 'var(--muted-foreground)', textTertiary: 'var(--neutral-400)',
  surfaceCard: 'var(--muted)', border: 'var(--border)', white: 'var(--card)',
};

function useScrolled() {
  const [s, setS] = useState(false);
  useEffect(() => {
    const h = () => setS(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return s;
}

function useReveal() {
  const refs = useRef([]);
  const [visible, setVisible] = useState(new Set());
  const addRef = useCallback((el) => { if (el && !refs.current.includes(el)) refs.current.push(el); }, []);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(prev => new Set(prev).add(e.target));
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    refs.current.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return { addRef, isVisible: (el) => visible.has(el) };
}

function useCountUp(target, decimals = 0, suffix = '', duration = 2000) {
  const [value, setValue] = useState('0' + suffix);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const st = performance.now();
      function anim(now) {
        const p = Math.min((now - st) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const c = eased * target;
        if (p < 1) {
          setValue(decimals > 0 ? c.toFixed(decimals) + suffix : Math.floor(c).toLocaleString() + suffix);
          requestAnimationFrame(anim);
        } else {
          setValue(decimals > 0 ? target.toFixed(decimals) + suffix : target.toLocaleString() + '+' + suffix);
        }
      }
      requestAnimationFrame(anim);
      obs.unobserve(ref.current);
    }, { threshold: 0.5 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, value };
}

// SVG Icons
const ArrowRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const Shield = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>;
const ChevronDown = ({ open }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}><path d="M6 9l6 6 6-6"/></svg>;
const Clock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const Heart = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const Menu = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>;
const X = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;

// Phone Mockup wrapper
function PhoneMockup({ headerColor, headerTitle, headerSub, children }) {
  return (
    <div style={{ background: 'oklch(13% 0.02 250)', borderRadius: '2.5rem', padding: 12, boxShadow: '0 25px 60px -15px oklch(0% 0 0 / 0.15), 0 0 0 1px oklch(0% 0 0 / 0.05)', width: 280, maxWidth: '100%' }}>
      <div style={{ background: C.white, borderRadius: '2rem', overflow: 'hidden' }}>
        <div style={{ background: headerColor, padding: '12px 20px 16px', color: C.white }}>
          <p style={{ fontSize: 10, opacity: 0.6, marginBottom: 4 }}>{headerSub}</p>
          <p style={{ fontSize: 16, fontWeight: 700 }}>{headerTitle}</p>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--muted)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function MockCard({ children, style }) {
  return <div style={{ background: C.white, borderRadius: 12, padding: 16, border: `1px solid var(--neutral-100)`, ...style }}>{children}</div>;
}

// Data
const problems = [
  { icon: '🕒', title: '출결 누락', time: '결석 대응이 늦습니다', desc: '등원 확인과 결석 대응이 여전히 사람 손에 의존하고 있지 않나요?', color: 'var(--destructive)', bg: 'var(--destructive-light)' },
  { icon: '💸', title: '수납 혼선', time: '미납을 뒤늦게 발견합니다', desc: '청구, 입금 확인, 미납 안내가 엑셀과 메시지로 따로 움직이고 있지 않나요?', color: 'oklch(60% 0.18 50)', bg: 'oklch(95% 0.03 75)' },
  { icon: '🗂️', title: '상담 비효율', time: '이력이 흩어져 있습니다', desc: '학생 이력이 여기저기 흩어져 상담 전마다 다시 정리하고 있지 않나요?', color: 'oklch(55% 0.20 290)', bg: 'oklch(94% 0.04 300)' },
  { icon: '⚖️', title: '운영 인력 부담', time: '원장 부재 시 흔들립니다', desc: '원장이나 실장이 빠지면 운영이 바로 흔들리고 있지 않나요?', color: 'var(--warning)', bg: 'var(--warning-light)' },
  { icon: '📨', title: '학부모 소통 과부하', time: '퇴근 후에도 카톡이 옵니다', desc: '개인 번호로 공지와 문의가 쏟아져, 퇴근 후에도 학부모 연락에서 벗어날 수 없지 않나요?', color: 'oklch(55% 0.15 250)', bg: 'oklch(55% 0.15 250 / 0.08)' },
  { icon: '📉', title: '재원 이탈 징후', time: '이탈을 뒤늦게 알아챕니다', desc: '결석·성적 하락·상담 공백 같은 이탈 신호를 데이터로 보지 못하고 감으로 대응하고 있지 않나요?', color: 'oklch(60% 0.20 20)', bg: 'oklch(95% 0.03 20)' },
];

const solutionSteps = [
  { step: '01', title: '학생이 들어오면', desc: '학생, 반, 보호자 정보를 한 번 등록합니다.' },
  { step: '02', title: '수업이 진행되면', desc: '출결과 일정이 자동 기록되고 보호자와 연결됩니다.' },
  { step: '03', title: '문제가 생기면', desc: '결석, 미납, 상담 필요 상황을 놓치지 않습니다.' },
  { step: '04', title: '반복 업무는', desc: '공지, 안내, 후속 메시지를 자동화합니다.' },
  { step: '05', title: '학생 관리는', desc: '상담 이력과 학습 흐름, 리워드 구조까지 연결됩니다.' },
];

const differentiators = [
  { icon: '👤', title: '학생 중심 타임라인', desc: '학생 한 명의 출결·상담·납부·학습 흐름을 한 화면에서 확인합니다.' },
  { icon: '⚙️', title: '운영 자동화', desc: '결석, 미납, 후속 안내를 시스템이 먼저 챙깁니다.' },
  { icon: '🏫', title: '학원·수업 운영을 더 편하게', desc: '시간표, 반 편성, 클리닉, 조교 배정까지 한 곳에서 관리하며 현장의 손길을 줄입니다.' },
  { icon: '💬', title: '학생과의 적극적인 소통', desc: '공지, 숙제 피드백, 상담 요청, 리워드까지. 학생이 먼저 움직이도록 양방향으로 연결합니다.' },
  { icon: '🤝', title: '보호자 신뢰 경험', desc: '출결, 납부, 공지, 상담 요청이 자연스럽게 연결됩니다.' },
  { icon: '🚀', title: '프리미엄 확장성', desc: '기본 운영부터 리텐션 강화까지, 성장 단계에 맞춰 사용합니다.' },
];

const testimonials1 = [
  { text: '수납 누락이 0건이 됐습니다. 자동 청구 알림 세팅하고 3개월째 미납 0건. 연간 수백만 원 차이예요.', who: '김○진 · 국어학원 원장 · 학생 35명 · 경기 분당' },
  { text: '학부모 카톡이 80% 줄었어요. 밤 10시 카톡이 안 오니까 퇴근이 생겼습니다.', who: '박○현 · 영어학원 원장 · 학생 28명 · 서울 목동' },
  { text: '학생들이 먼저 포인트 확인해요. "선생님 오늘 퀴즈 없어요?" 라고 먼저 물어보는 게 신기합니다.', who: '이○수 · 입시국어 강사 · 학생 22명 · 인천 부평' },
  { text: '상담할 때 자신감이 생겼습니다. 성적 추이 그래프를 보여주면서 설명하니까 학부모 반응이 확 달라요.', who: '최○영 · 수학학원 원장 · 학생 40명 · 대전 둔산' },
  { text: '엑셀 10개 파일이 앱 하나로. 학생 현황 파악이 10분에서 1분으로 줄었습니다.', who: '한○미 · 과학학원 원장 · 학생 18명 · 대구 수성' },
  { text: '조교 관리가 제일 큰 변화예요. 앱에서 배정하면 체크리스트로 확인하니까 빠지는 학생이 없어졌습니다.', who: '정○혁 · 종합학원 원장 · 학생 60명 · 서울 대치' },
  { text: '클리닉 예약부터 출결까지 한 번에 보여서, 보충이 진짜 보충이 됩니다.', who: '서○은 · 수학학원 강사 · 학생 45명 · 경기 일산' },
  { text: '하루에 2시간은 벌었어요, 진짜로. 그 시간에 교재 연구를 합니다.', who: '윤○라 · 국어학원 강사 · 학생 32명 · 부산 해운대' },
];

const testimonials2 = [
  { text: '결석 알림이 바로 오니까 학부모한테 먼저 연락할 수 있어요. 신뢰가 확 올라갑니다.', who: '강○희 · 영어학원 강사 · 학생 20명 · 서울 강남' },
  { text: '게이미피케이션 도입 후 숙제 이행률이 2배가 됐어요. 애들이 포인트 모으려고 난리입니다.', who: '오○준 · 수학학원 원장 · 학생 55명 · 경기 수원' },
  { text: '수납 문자 자동 발송 덕분에 어색한 독촉 전화를 안 해도 됩니다. 학부모 관계도 좋아졌어요.', who: '문○정 · 국어학원 원장 · 학생 25명 · 충남 천안' },
  { text: 'AI 문항 출제가 대박이에요. 시험지 만드는 데 주말을 쓰고 있었는데, 이제 10분이면 끝나요.', who: '임○호 · 입시국어 강사 · 학생 30명 · 서울 노원' },
  { text: '조교가 4명인데, 이전에는 누가 뭘 하는지 파악이 안 됐어요. 지금은 한 화면에서 다 보입니다.', who: '배○진 · 종합학원 원장 · 학생 80명 · 대구 달서' },
  { text: '학부모 전용 페이지 보내드리면 "이런 학원 처음이에요"라고 하십니다. 학원 이미지가 올라가요.', who: '양○서 · 영어학원 원장 · 학생 38명 · 경기 용인' },
  { text: '성적 분석 대시보드 보여주면서 상담하면 학부모가 재등록 고민을 안 합니다. 데이터의 힘이에요.', who: '조○현 · 수학학원 원장 · 학생 42명 · 광주 남구' },
];

// 요금제는 슈퍼관리자가 /superadmin/pricing 에서 실시간 수정 가능
// 랜딩은 /api/tiers/public 에서 동적 로드. 네트워크 실패 시 아래 fallback 사용
const FALLBACK_PLANS = [
  { id: 'free', name: 'Free', price: 0, yearlyPrice: 0, students: '15명', aiCredits: 30, features: ['성적 관리', '출결 (기본)', '공지', '수업 자료', 'Q&A', '월 AI 크레딧 30'], desc: '1인 과외, 소규모 체험' },
  { id: 'basic', name: 'Basic', price: 99000, yearlyPrice: 84150, students: '50명', aiCredits: 700, features: ['Free 기능 전체', 'SMS·보호자 앱·수납 관리', '상담 CRM 기본', '월 AI 크레딧 700', '엑셀 Import/Export'], desc: '체계적인 학원 운영', popular: false },
  { id: 'pro', name: 'Pro', price: 199000, yearlyPrice: 169150, students: '100명', aiCredits: 1500, features: ['Basic 기능 전체', '자동화 엔진 무제한', '월 AI 크레딧 1,500', 'AI 학습 리포트', '고급 분석 대시보드', '우선 기술지원'], desc: '자동화와 AI로 시간 확보', popular: true },
  { id: 'first_class', name: 'First Class', price: 0, yearlyPrice: 0, students: '무제한', aiCredits: 10000, features: ['Pro 기능 전체', '월 AI 크레딧 10,000+', 'AI 문항 자동 생성', '게이미피케이션 고도화', '화이트라벨/브랜딩', '전담 매니저'], desc: '대형 학원·프랜차이즈', inquiry: true },
];

const comparisonRows = [
  ['만든 사람', '개발사', '현직 강사가 매일 쓰면서 고쳐나간 결과물'],
  ['조교 관리', '없음', '업무 배정 · 클리닉 · 스케줄 · 대타'],
  ['게이미피케이션', '없음', '포인트 · 레벨 · 아바타 · 퀴즈'],
  ['AI 문항 출제', '없음', '수능형 맞춤 문항 자동 생성'],
  ['성적 분석', '단순 점수 기록', '영역별 취약점 · 추이 자동 분석'],
  ['학부모 페이지', '일방향 알림', '출결 · 성적 · 숙제 실시간 확인'],
];

const faqCategories = [
  { label: '자주 묻는 질문', items: [
    { q: '무료로 어디까지 사용할 수 있나요?', a: 'Free 플랜은 학생 15명까지 기간 제한 없이 사용할 수 있습니다. 성적, 출결, 공지, 수업 자료, Q&A 기능을 제공하며, 1인 과외나 소규모 운영에 충분합니다. 더 많은 학생과 운영 기능이 필요하면 언제든 Starter 이상으로 업그레이드할 수 있습니다.' },
    { q: '문자 비용은 별도인가요?', a: '네, 문자와 알림톡 비용은 구독료와 완전히 분리되어 사용량 기준으로 별도 과금됩니다. SMS는 9.9원, 알림톡은 7.5원 수준으로 투명하게 제공하며, 선충전 후 차감 방식입니다.' },
    { q: '기존 엑셀 데이터를 옮길 수 있나요?', a: '네, 학생 명단/수강생 명단/출결 기록 엑셀 파일을 간편하게 Import할 수 있습니다. 컬럼 매핑과 검증 과정을 거쳐 안전하게 일괄 등록됩니다. 초기 도입 시 전담 지원도 제공합니다.' },
    { q: '공부방이나 1:1 과외도 사용할 수 있나요?', a: '네, 1인 과외부터 대형 학원까지 모두 사용 가능합니다. Free 플랜은 개인 과외 선생님에게 적합하고, Starter는 소형 학원, Pro는 중형 학원, First Class는 관리형 입시학원에 최적화되어 있습니다.' },
    { q: '보호자도 바로 사용할 수 있나요?', a: '네, Starter 플랜부터 보호자 전용 앱이 제공됩니다. 보호자는 자녀의 출결, 공지, 수납 내역을 확인하고 상담 요청과 결제를 모바일에서 바로 진행할 수 있습니다.' },
    { q: 'AI 기능은 무엇을 해주나요?', a: 'AI 기능은 상담 준비 시간 단축(학생 이력 요약), 리포트 코멘트 자동 생성, 퀴즈 문제 자동 생성, Q&A 답변 제안 등 실무 보조에 집중되어 있습니다. Pro 플랜은 AI 리포트, First Class는 AI 문제 생성까지 포함합니다.' },
  ]},
];

export default function LandingPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [landingYearly, setLandingYearly] = useState(true);
  const scrolled = useScrolled();
  const { addRef, isVisible } = useReveal();

  // 요금제 동적 로딩 (슈퍼관리자가 수정하면 랜딩에 즉시 반영)
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  useEffect(() => {
    fetch('/api/tiers/public')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        setPlans(data.map(t => ({
          id: t.tier_key,
          name: t.display_name,
          price: t.monthly_price || 0,
          yearlyPrice: t.yearly_price || Math.round((t.monthly_price || 0) * 0.85),
          students: t.max_students ? `${t.max_students}명` : '무제한',
          aiCredits: t.ai_credits_monthly,
          features: Array.isArray(t.features) ? t.features : [],
          desc: t.description,
          popular: t.highlighted,
          inquiry: t.cta_type === 'contact',
          ctaLabel: t.cta_label,
        })));
      })
      .catch(() => { /* fallback 유지 */ });
  }, []);

  const m1 = useCountUp(120, 0, '');
  const m2 = useCountUp(98.7, 1, '%');
  const m3 = useCountUp(9.7, 1, '/10');
  const m4 = useCountUp(90, 0, '%');

  useEffect(() => {
    if (isLoggedIn() && user) {
      const isAssistant = user.school === '조교';
      navigate((user.role === 'admin' || isAssistant) ? '/admin' : '/student', { replace: true });
    }
  }, [user, navigate]);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const revealStyle = (el) => ({
    opacity: isVisible(el) ? 1 : 0,
    transform: isVisible(el) ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
  });

  const navLinks = [
    { label: '이야기', id: 'problem' },
    { label: '기능', id: 'features' },
    { label: '후기', id: 'testimonials' },
    { label: '가격', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.white, fontFamily: "'Paperlogy', system-ui, sans-serif", color: C.textPrimary }}>
      <style>{`
        @keyframes lp-scrollLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes lp-scrollRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .lp-marquee-1 { animation: lp-scrollLeft 60s linear infinite; }
        .lp-marquee-1:hover { animation-play-state: paused; }
        .lp-marquee-2 { animation: lp-scrollRight 65s linear infinite; }
        .lp-marquee-2:hover { animation-play-state: paused; }
        @media (max-width: 768px) {
          .lp-hero-grid { grid-template-columns: 1fr !important; }
          .lp-feature-grid { grid-template-columns: 1fr !important; }
          .lp-feature-reverse { direction: ltr !important; }
          .lp-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-diff-grid { grid-template-columns: 1fr !important; }
          .lp-nav-links { display: none !important; }
          .lp-mobile-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .lp-mobile-menu { display: none !important; }
          .lp-mobile-btn { display: none !important; }
        }
      `}</style>

      {/* === NAV === */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'oklch(100% 0 0 / 0.8)' : 'oklch(100% 0 0 / 0.8)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`, transition: 'all 0.2s',
      }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label="팀 강인">
            <BrandLogo variant="light" height={34} />
          </a>
          <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, color: C.textSecondary }}>
            {navLinks.map(l => (
              <a key={l.id} href={`#${l.id}`} onClick={e => { e.preventDefault(); scrollTo(l.id); }} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = C.textPrimary} onMouseOut={e => e.currentTarget.style.color = C.textSecondary}>{l.label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/login')} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
              background: 'transparent', color: C.textSecondary, border: `1px solid ${C.border}`, transition: 'all 0.2s',
            }} onMouseOver={e => { e.currentTarget.style.background = C.surfaceCard; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>로그인</button>
            <button onClick={() => navigate('/onboarding')} style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
              background: C.accent, color: C.white, border: 'none', transition: 'all 0.2s',
            }} onMouseOver={e => { e.currentTarget.style.background = C.accentLight; }} onMouseOut={e => { e.currentTarget.style.background = C.accent; }}>무료 체험</button>
            <button className="lp-mobile-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
              display: 'none', width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
            }}>{mobileMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lp-mobile-menu" style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: 16 }}>
            {navLinks.map(l => (
              <a key={l.id} href={`#${l.id}`} onClick={e => { e.preventDefault(); scrollTo(l.id); }} style={{
                display: 'block', padding: '12px 16px', borderRadius: 12, fontSize: 14, color: C.textSecondary,
                textDecoration: 'none', transition: 'background 0.2s',
              }} onMouseOver={e => { e.currentTarget.style.background = C.surfaceCard; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>{l.label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* === HERO === */}
      <section style={{ paddingTop: 128, paddingBottom: 80 }}>
        <div className="lp-hero-grid" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <p ref={addRef} style={{ fontSize: 15, fontWeight: 600, color: C.textSecondary, marginBottom: 12, letterSpacing: '-0.01em' }}>
              학부모 카톡, 출결 체크, 수납 확인, 조교 지시, 성적 정리…
            </p>
            <h1 ref={addRef} style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, color: C.textPrimary, marginBottom: 24 }}>
              저는 하루 3시간을<br/>돌려받았습니다.
            </h1>
            <p ref={addRef} style={{ fontSize: 18, color: C.textSecondary, lineHeight: 1.7, maxWidth: '48ch', marginBottom: 16 }}>
              현직 강사로서 매일 같은 잡무에 시간을 빼앗겼습니다. 그래서 다른 원장님들의 힘듦에 깊이 공감하며, 이 프로그램을 직접 개발하게 되었습니다.
            </p>
            <p ref={addRef} style={{ fontSize: 14, color: C.textTertiary, marginBottom: 28 }}>
              결석·미납·상담, 필수 요소들을 놓치지 않고 반복 업무는 자동화합니다.
            </p>
            <div ref={addRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
              <button onClick={() => navigate('/onboarding')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accent, color: C.white,
                fontWeight: 700, fontSize: 16, padding: '16px 28px', borderRadius: 16, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 12px oklch(55% 0.15 250 / 0.2)',
              }} onMouseOver={e => { e.currentTarget.style.background = C.accentLight; e.currentTarget.style.boxShadow = '0 8px 24px oklch(55% 0.15 250 / 0.25)'; }}
                 onMouseOut={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.boxShadow = '0 4px 12px oklch(55% 0.15 250 / 0.2)'; }}>
                30일 무료 체험 시작하기 <ArrowRight />
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.textTertiary }}>
                <Shield /> 카드 등록 없이 · 30일 전체 기능 체험
              </span>
            </div>
          </div>
          <div ref={addRef} style={{ display: 'flex', justifyContent: 'center' }}>
            <PhoneMockup headerColor={C.accent} headerTitle="대시보드" headerSub="나만의 조교">
              {/* 초대코드 */}
              <MockCard style={{ padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--muted)' }}>
                <div>
                  <p style={{ fontSize: 9, color: C.textTertiary }}>학원 초대 코드</p>
                  <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: C.accent, fontFamily: 'monospace' }}>A7K2M9</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.accent, padding: '4px 10px', borderRadius: 6, background: C.accentBg, cursor: 'pointer' }}>복사</span>
              </MockCard>
              {/* 조치 필요 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{ label: '가입 승인', val: 2, c: 'var(--destructive)', bg: 'var(--destructive-light)' }, { label: '미납', val: 3, c: 'var(--warning)', bg: 'var(--warning-light)' }, { label: '수정 요청', val: 1, c: C.accent, bg: C.accentBg }].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: item.bg, border: `1px solid ${item.c}20` }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: item.c }}>{item.val}</span>
                    <span style={{ fontSize: 9, color: item.c, fontWeight: 600 }}>{item.label}</span>
                  </div>
                ))}
              </div>
              {/* KPI 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[{ label: '재원생', val: '47', unit: '명', c: C.accent }, { label: '오늘 클리닉', val: '3', unit: '건', c: 'oklch(55% 0.20 290)' }, { label: '이번 주 수업', val: '12', unit: '회', c: 'var(--success)' }, { label: '다음 시험', val: 'D-5', unit: '', c: 'var(--warning)' }].map((item, i) => (
                  <MockCard key={i} style={{ padding: 10 }}>
                    <p style={{ fontSize: 8, fontWeight: 600, color: C.textTertiary, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: item.c }}>{item.val}<span style={{ fontSize: 10, fontWeight: 500, color: C.textTertiary }}>{item.unit}</span></p>
                  </MockCard>
                ))}
              </div>
              {/* 학교별 현황 */}
              <MockCard style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>학교별 현황</span>
                  <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>47명</span>
                </div>
                {[['A고등학교', 15], ['B고등학교', 12], ['C고등학교', 10], ['중3', 10]].map(([name, cnt], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: i === 0 ? C.accentBg : 'transparent', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: C.textSecondary }}>{name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>{cnt}명</span>
                  </div>
                ))}
              </MockCard>
            </PhoneMockup>
          </div>
        </div>
      </section>

      {/* === METRICS === */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '48px 0' }}>
        <div className="lp-metrics-grid" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
          {[m1, m2, m3, m4].map((m, i) => (
            <div key={i} ref={m.ref}>
              <p style={{ fontSize: 30, fontWeight: 700, color: C.textPrimary }}>{m.value}</p>
              <p style={{ fontSize: 14, color: C.textTertiary, marginTop: 4 }}>
                {['학원·강사가 매일 사용 중', '수납을 놓치지 않습니다', '선생님 만족도', '잡무가 줄었습니다'][i]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* === PROBLEM === */}
      <section id="problem" style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 12 }}>현직 강사가 매일 겪은 문제</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 }}>
              이런 문제 겪고 계신가요?
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {problems.map((p, i) => (
              <div key={i} ref={addRef} style={{
                background: C.surfaceCard, borderRadius: 16, padding: 28, border: `1px solid ${C.border}`,
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }} onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px oklch(0% 0 0 / 0.06)'; e.currentTarget.style.borderColor = 'oklch(92% 0.01 260 / 0.6)'; }}
                 onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.icon}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: C.textPrimary, fontSize: 15 }}>{p.title}</h3>
                    <p style={{ fontSize: 12, color: p.color, fontWeight: 500 }}>{p.time}</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <div ref={addRef} style={{ marginTop: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accentBg, color: C.accent, fontWeight: 700, fontSize: 16, padding: '16px 32px', borderRadius: 16 }}>
              <Clock /> 흩어진 운영 흐름을 하나로 연결하면, 재원 유지가 달라집니다.
            </div>
          </div>
        </div>
      </section>

      {/* === SOLUTION FLOW === */}
      <section style={{ padding: '96px 0', background: C.surfaceCard }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 12 }}>운영 자동화 흐름</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 }}>
              학원 운영의 끊어진 흐름을 하나로 연결합니다
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {solutionSteps.map((s, i) => (
              <div key={i} ref={addRef} style={{
                background: C.white, borderRadius: 16, padding: 24, border: `1px solid var(--neutral-100)`,
                boxShadow: '0 1px 3px oklch(0% 0 0 / 0.04)', position: 'relative',
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 2, marginBottom: 12 }}>STEP {s.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, marginBottom: 8, letterSpacing: '-0.01em' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === VALUE BUNDLES (기능 묶음 소개) === */}
      <section id="value-bundles" style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>VALUE BUNDLES</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.025em', lineHeight: 1.3, marginBottom: 12 }}>학원 운영의 모든 업무를 하나로</h2>
            <p style={{ color: C.textTertiary, fontSize: 16 }}>기능이 아닌 가치로 묶었습니다</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: '✅', title: '운영 기본', sub: '출결과 수납을 더 정확하게', desc: '출결 등록, 청구, 납부 확인, 미납 관리까지 일상 운영을 한 곳에서 처리합니다.', badge: '모든 플랜', badgeBg: '#e0f2fe', badgeColor: '#0369a1' },
              { icon: '👤', title: '학생 관리', sub: '학생 상태를 한눈에', desc: '상담, 출결, 수납, 학습 흐름을 학생 단위로 연결해 더 정교하게 관리합니다.', badge: 'Starter 이상', badgeBg: '#dbeafe', badgeColor: '#1e40af' },
              { icon: '👨‍👩‍👧', title: '보호자 소통', sub: '신뢰를 만드는 소통', desc: '공지, 출결, 납부, 상담 요청을 깔끔하게 연결해 보호자 소통 부담을 줄입니다.', badge: 'Starter 이상', badgeBg: '#dbeafe', badgeColor: '#1e40af' },
              { icon: '⚡', title: '자동화', sub: '반복 업무를 줄이는 규칙', desc: '결석, 미납, 후속 안내처럼 놓치기 쉬운 운영을 자동으로 관리합니다.', badge: 'Pro 이상', badgeBg: '#ede9fe', badgeColor: '#5b21b6' },
              { icon: '✨', title: '프리미엄 기능', sub: '학생 참여와 유지율까지', desc: '리워드, 과제 참여, AI 요약 기능으로 학원 운영의 차별화를 만듭니다.', badge: 'First Class', badgeBg: '#fef3c7', badgeColor: '#92400e' },
            ].map((v, i) => (
              <div key={i} ref={addRef} style={{
                background: '#ffffff', borderRadius: 16, padding: 32,
                border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.25s', display: 'flex', flexDirection: 'column',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,75,240,0.2)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{v.icon}</div>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--cta)', fontWeight: 600 }}>"{v.sub}"</p>
                </div>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.65, flex: 1, marginBottom: 16 }}>{v.desc}</p>
                <span style={{
                  alignSelf: 'flex-start', borderRadius: 999, padding: '4px 12px',
                  fontSize: 11, fontWeight: 700, background: v.badgeBg, color: v.badgeColor,
                }}>{v.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === DIFFERENTIATORS === */}
      <section style={{ padding: '96px 0', background: C.surfaceCard }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 12 }}>왜 나만의 조교인가요?</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 }}>
              운영 자동화부터 재원 유지까지, 한 번에
            </h2>
          </div>
          <div className="lp-diff-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {differentiators.map((d, i) => (
              <div key={i} ref={addRef} style={{
                background: C.white, borderRadius: 16, padding: 28, border: `1px solid var(--neutral-100)`,
                boxShadow: '0 1px 3px oklch(0% 0 0 / 0.04)', transition: 'box-shadow 0.2s, transform 0.2s',
              }} onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px oklch(0% 0 0 / 0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                 onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px oklch(0% 0 0 / 0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{d.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary, marginBottom: 8, letterSpacing: '-0.01em' }}>{d.title}</h3>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.65 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" style={{ padding: '96px 0', background: C.surfaceCard }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 12 }}>그래서 이렇게 만들었습니다</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 }}>직접 써보면서 필요했던 것들</h2>
          </div>

          {/* Feature 1: Parent Page */}
          <div className="lp-feature-grid" ref={addRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 96 }}>
            <div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>👨‍👩‍👧</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>학부모 전용 페이지</h3>
              <p style={{ color: C.accent, fontWeight: 500, fontSize: 14, marginBottom: 16 }}>카톡 90% 감소</p>
              <p style={{ color: C.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>출결, 성적, 숙제 현황을 학부모가 직접 확인합니다. 선생님 개인번호 대신 시스템이 소통하니까, 퇴근 후 카톡이 사라집니다.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['출결 현황', '성적 추이', '포트폴리오', '수납 / 결제'].map((t, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: i === 0 ? C.accentBg : 'var(--neutral-100)', color: i === 0 ? C.accent : C.textSecondary, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneMockup headerColor={C.accent} headerTitle="김하윤 학생" headerSub="학부모 페이지">
                {/* 출결 현황 - 캘린더 스타일 */}
                <MockCard>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>4월 출결 현황</p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    {['월','화','수','목','금'].map((d, i) => (
                      <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: C.textTertiary, fontWeight: 600 }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                    {[1,1,1,1,1, 1,1,0,1,1].map((v, i) => (
                      <span key={i} style={{ height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, background: v ? C.accent : 'var(--destructive-light)', color: v ? C.white : 'var(--destructive)' }}>{v ? '✓' : '결'}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 9, color: C.accent, fontWeight: 600, marginTop: 6, textAlign: 'right' }}>출석률 90% (9/10회)</p>
                </MockCard>
                {/* 성적 추이 - 실제 시험명 포함 */}
                <MockCard>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>성적 추이</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52 }}>
                    {[{ h: 45, label: '1차', score: '62' }, { h: 58, label: '2차', score: '71' }, { h: 52, label: '3차', score: '68' }, { h: 72, label: '4차', score: '80' }, { h: 88, label: '5차', score: '92' }].map((d, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: i === 4 ? C.accent : C.textTertiary }}>{d.score}</span>
                        <div style={{ width: '100%', height: `${d.h}%`, borderRadius: '4px 4px 0 0', background: i === 4 ? C.accent : i === 3 ? 'oklch(55% 0.15 250 / 0.3)' : 'var(--neutral-200)', transition: 'height 0.3s' }} />
                        <span style={{ fontSize: 7, color: i === 4 ? C.accent : C.textTertiary, fontWeight: i === 4 ? 700 : 400 }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 9, color: 'var(--destructive)', marginTop: 6 }}>⚠️ 오답률 높은 영역: 비문학 추론</p>
                </MockCard>
                {/* 과제 현황 - 진행률 바 추가 */}
                <MockCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>과제 현황</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--success)', padding: '2px 6px', background: 'var(--success-light)', borderRadius: 4 }}>2/3 완료</span>
                  </div>
                  {[['독서록 제출', '완료', C.accent], ['어휘 테스트 복습', '진행중', 'var(--warning)'], ['비문학 풀이 5지문', '미제출', C.textTertiary]].map(([t, s, c], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < 2 ? '1px solid var(--neutral-100)' : 'none' }}>
                      <span style={{ fontSize: 10, color: C.textSecondary }}>{t}</span>
                      <span style={{ fontSize: 9, color: c, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: i === 0 ? C.accentBg : i === 1 ? 'var(--warning-light)' : 'var(--neutral-100)' }}>{s}</span>
                    </div>
                  ))}
                </MockCard>
                {/* 포트폴리오 */}
                <MockCard style={{ padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>포트폴리오</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: C.textSecondary }}>누적 포트폴리오</span>
                    <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>3건</span>
                  </div>
                  <div style={{ padding: '6px 10px', borderRadius: 6, background: C.accentBg, textAlign: 'center', fontSize: 10, color: C.accent, fontWeight: 600, cursor: 'pointer' }}>포트폴리오 열람 →</div>
                </MockCard>
              </PhoneMockup>
            </div>
          </div>

          {/* Feature 2: TA Management */}
          <div className="lp-feature-grid lp-feature-reverse" ref={addRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 96, direction: 'rtl' }}>
            <div style={{ direction: 'ltr' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'oklch(94% 0.04 300)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>📋</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>조교 관리 시스템</h3>
              <p style={{ color: 'oklch(55% 0.20 290)', fontWeight: 500, fontSize: 14, marginBottom: 16 }}>카톡 지시 대신 체크리스트로</p>
              <p style={{ color: C.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>조교별 업무 배정, 클리닉 스케줄, 숙제 추적, 시간표와 대타 배정까지 한 화면에서. 빠지는 학생 없이, 조교도 명확하게.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['업무 배정', '클리닉 관리', '숙제 추적', '대타 배정'].map((t, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: i === 0 ? 'oklch(94% 0.04 300)' : 'var(--neutral-100)', color: i === 0 ? 'oklch(55% 0.20 290)' : C.textSecondary, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', direction: 'ltr' }}>
              <PhoneMockup headerColor="oklch(48% 0.22 295)" headerTitle="조교 근무표" headerSub="수업 및 운영">
                {/* 이번 주 근무 현황 */}
                <MockCard style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>이번 주 근무</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(48% 0.22 295)' }}>4월 2주차</span>
                  </div>
                  {[{ name: '박지은 조교', hours: '12/20h', pct: 60, color: 'oklch(48% 0.22 295)' }, { name: '김현수 조교', hours: '16/20h', pct: 80, color: C.accent }, { name: '이수아 조교', hours: '8/15h', pct: 53, color: 'var(--success)' }].map((ta, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: C.textSecondary, fontWeight: 500 }}>{ta.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ta.color }}>{ta.hours}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--neutral-100)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ta.pct}%`, background: ta.color, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ))}
                </MockCard>
                {/* 오늘 클리닉 일정 */}
                <MockCard style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>오늘 클리닉</span>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'var(--info-light)', color: 'var(--info)', fontWeight: 600 }}>3건</span>
                  </div>
                  {[{ name: '김하윤', topic: '비문학 추론', time: '15:00', status: '승인', sc: 'var(--success)' }, { name: '박도현', topic: '문학 감상', time: '16:00', status: '승인', sc: 'var(--success)' }, { name: '이서윤', topic: '어휘', time: '17:30', status: '대기', sc: 'var(--warning)' }].map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: i === 0 ? 'var(--info-light)' : 'transparent', marginBottom: 4, border: i === 0 ? '1px solid var(--info)20' : '1px solid transparent' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'oklch(94% 0.04 300)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, flexShrink: 0 }}>👤</div>
                      <div style={{ flex: 1, marginLeft: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.textPrimary }}>{c.name}</span>
                        <span style={{ fontSize: 9, color: C.textTertiary, marginLeft: 4 }}>{c.topic}</span>
                      </div>
                      <span style={{ fontSize: 9, color: C.textTertiary, marginRight: 6 }}>{c.time}</span>
                      <span style={{ fontSize: 8, fontWeight: 600, color: c.sc, padding: '1px 6px', borderRadius: 4, background: c.sc === 'var(--success)' ? 'var(--success-light)' : 'var(--warning-light)' }}>{c.status}</span>
                    </div>
                  ))}
                </MockCard>
                {/* 과제 관리 요약 */}
                <MockCard style={{ padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>과제 채점 현황</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>28</p>
                        <p style={{ fontSize: 8, color: C.textTertiary }}>채점 완료</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)' }}>7</p>
                        <p style={{ fontSize: 8, color: C.textTertiary }}>채점 대기</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--destructive)' }}>3</p>
                        <p style={{ fontSize: 8, color: C.textTertiary }}>미제출</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--neutral-100)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ height: '100%', width: '74%', background: 'var(--success)', borderRadius: '3px 0 0 3px' }} />
                    <div style={{ height: '100%', width: '18%', background: 'var(--warning)' }} />
                    <div style={{ height: '100%', width: '8%', background: 'var(--destructive)', borderRadius: '0 3px 3px 0' }} />
                  </div>
                </MockCard>
              </PhoneMockup>
            </div>
          </div>

          {/* Feature 3: Gamification */}
          <div className="lp-feature-grid" ref={addRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 64 }}>
            <div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>🎮</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>게이미피케이션 시스템</h3>
              <p style={{ color: 'oklch(55% 0.14 70)', fontWeight: 500, fontSize: 14, marginBottom: 16 }}>숙제 이행률 40% 상승</p>
              <p style={{ color: C.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>XP와 레벨 100단계, 아바타 커스터마이징, 퀴즈 4종(3,000+ 문제), 포인트 상점, 올림픽 시상대 랭킹까지. 학생이 스스로 경쟁하고 성장하는 구조를 만듭니다.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['XP / 레벨', '아바타', '퀴즈 4종', '포인트 상점'].map((t, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: i === 0 ? 'var(--warning-light)' : 'var(--neutral-100)', color: i === 0 ? 'oklch(55% 0.14 70)' : C.textSecondary, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneMockup headerColor="var(--warning)" headerTitle="게임 홈" headerSub="게이미피케이션">
                {/* 캐릭터 카드 - 실제 GameHub 반영 */}
                <MockCard style={{ textAlign: 'center', padding: 16 }}>
                  {/* 아바타 */}
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--warning), oklch(55% 0.20 35))', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 22, fontWeight: 700, boxShadow: '0 4px 12px oklch(55% 0.20 70 / 0.3)' }}>🧙</div>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>별빛마법사</p>
                  <p style={{ fontSize: 10, color: C.textTertiary }}>김하윤</p>
                  <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, var(--warning-light), var(--warning))', padding: '2px 10px', borderRadius: 12, fontSize: 9, fontWeight: 600, color: 'oklch(35% 0.12 75)', marginTop: 4 }}>🔮 어휘 마스터</div>
                  {/* XP 프로그레스 바 */}
                  <div style={{ margin: '12px auto 0', maxWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--warning)' }}>Lv.12</span>
                      <span style={{ fontSize: 9, color: C.textTertiary }}>320 / 500 XP</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--neutral-100)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '64%', background: 'linear-gradient(90deg, var(--warning), oklch(65% 0.18 60))', borderRadius: 4 }} />
                    </div>
                  </div>
                  {/* XP & 포인트 */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>4,230</p>
                      <p style={{ fontSize: 9, color: C.textTertiary }}>누적 XP</p>
                    </div>
                    <div style={{ width: 1, background: 'var(--neutral-200)' }} />
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--warning)' }}>1,250</p>
                      <p style={{ fontSize: 9, color: C.textTertiary }}>보유 포인트</p>
                    </div>
                  </div>
                </MockCard>
                {/* 메뉴 그리드 - 실제 GameHub 2x3 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[{ icon: '📝', label: '어휘', sub: '퀴즈' }, { icon: '🧠', label: '지식', sub: '퀴즈' }, { icon: '📖', label: '비문학', sub: '독해' }, { icon: '🏆', label: '랭킹', sub: '' }, { icon: '🛒', label: '상점', sub: '' }, { icon: '🎖️', label: '칭호', sub: '' }].map((m, i) => (
                    <MockCard key={i} style={{ padding: 10, textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: C.textPrimary }}>{m.label}</p>
                      {m.sub && <p style={{ fontSize: 8, color: C.textTertiary }}>{m.sub}</p>}
                    </MockCard>
                  ))}
                </div>
                {/* 출석 보너스 */}
                <MockCard style={{ padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600 }}>🎁 수업 출석 보너스</p>
                    <p style={{ fontSize: 8, color: C.textTertiary }}>오늘 출석 시 +50 XP</p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.white, padding: '4px 10px', borderRadius: 6, background: C.accent }}>받기</span>
                </MockCard>
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* === COMPARISON === */}
      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 12 }}>직접 써봤기 때문에</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 }}>다른 앱은 왜 불편했을까요?</h2>
          </div>
          <div ref={addRef} style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '16px', borderBottom: `2px solid ${C.border}`, color: C.textTertiary, fontWeight: 500, width: '33%' }}></th>
                  <th style={{ textAlign: 'center', padding: '16px', borderBottom: `2px solid ${C.border}`, color: C.textTertiary, fontWeight: 500, width: '33%' }}>일반 학원 관리 앱</th>
                  <th style={{ textAlign: 'center', padding: '16px', borderBottom: `2px solid ${C.accent}`, background: C.accentBg, color: C.accent, fontWeight: 700, width: '33%', borderRadius: '12px 12px 0 0' }}>나만의 조교</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, other, ours], i) => (
                  <tr key={i} style={{ borderBottom: i < comparisonRows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: 16, fontWeight: 500, color: C.textPrimary }}>{label}</td>
                    <td style={{ padding: 16, textAlign: 'center', color: other === '없음' ? C.textTertiary : C.textSecondary }}>{other}</td>
                    <td style={{ padding: 16, textAlign: 'center', background: C.accentBg, color: C.accent, fontWeight: 500 }}>{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* === TESTIMONIALS === */}
      <section id="testimonials" style={{ padding: '96px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', marginBottom: 48 }}>
          <div ref={addRef} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 12 }}>같은 고민을 했던 선생님들</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 }}>쓰고 나서 달라진 것들</h2>
          </div>
        </div>
        {[testimonials1, testimonials2].map((row, ri) => (
          <div key={ri} style={{ overflow: 'hidden', marginBottom: ri === 0 ? 20 : 0 }}>
            <div className={ri === 0 ? 'lp-marquee-1' : 'lp-marquee-2'} style={{ display: 'flex', gap: 20, width: 'max-content' }}>
              {[...row, ...row].map((t, i) => (
                <div key={i} style={{ width: 340, flexShrink: 0, background: C.surfaceCard, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>"{t.text}"</p>
                  <p style={{ fontSize: 12, color: C.textTertiary }}>{t.who}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* === PRICING === */}
      <section id="pricing" style={{ padding: '96px 0', background: C.surfaceCard }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 12 }}>30일 무료 체험으로 시작</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3, marginBottom: 12 }}>학원 규모와 운영 방식에 맞게 선택하세요</h2>
            <p style={{ color: C.textTertiary, marginBottom: 24 }}>무료 체험부터 운영 자동화, 학생 참여 설계까지 필요한 수준에 맞춰 시작할 수 있습니다.</p>
            {/* 월간/연간 토글 */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: C.white, borderRadius: 12, padding: 4, border: `1px solid ${C.border}` }}>
              <button onClick={() => setLandingYearly(false)} style={{
                padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: !landingYearly ? C.accent : 'transparent', color: !landingYearly ? C.white : C.textTertiary,
              }}>월간 결제</button>
              <button onClick={() => setLandingYearly(true)} style={{
                padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s', position: 'relative',
                background: landingYearly ? C.accent : 'transparent', color: landingYearly ? C.white : C.textTertiary,
              }}>연간 결제
                <span style={{ position: 'absolute', top: -10, right: -10, background: 'oklch(55% 0.18 25)', color: 'white', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>15% OFF</span>
              </button>
            </div>
          </div>

          {landingYearly && (
            <p ref={addRef} style={{ textAlign: 'center', marginBottom: 24, padding: '8px 20px', background: 'oklch(95% 0.04 140)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'oklch(45% 0.14 140)', maxWidth: 500, margin: '0 auto 24px' }}>
              연간 결제 시 매달 15% 할인된 가격으로 이용하세요
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
            {plans.map((p, i) => {
              const price = landingYearly ? p.yearlyPrice : p.price;
              const showDiscount = landingYearly && p.price > 0 && !p.inquiry;
              const yearlySaving = p.price > 0 ? (p.price - p.yearlyPrice) * 12 : 0;
              return (
                <div key={i} ref={addRef} style={{
                  padding: 28, borderRadius: 16, background: C.white,
                  border: p.popular ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column',
                }}>
                  {p.popular && (
                    <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.accent, color: C.white, padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>가장 많이 선택</span>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary, marginBottom: 4, marginTop: p.popular ? 8 : 0 }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: C.textTertiary, marginBottom: 16 }}>{p.desc}</p>

                  {/* 가격 */}
                  <div style={{ minHeight: 64, marginBottom: 8 }}>
                    {p.inquiry ? (
                      <p style={{ fontSize: 26, fontWeight: 900, color: C.textPrimary }}>별도 문의</p>
                    ) : price === 0 ? (
                      <p style={{ fontSize: 30, fontWeight: 900, color: C.textPrimary }}>무료</p>
                    ) : (
                      <>
                        {showDiscount && (
                          <p style={{ fontSize: 13, color: C.textTertiary, textDecoration: 'line-through', marginBottom: 2 }}>{p.price.toLocaleString()}원</p>
                        )}
                        <p style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary, lineHeight: 1.1 }}>
                          {price.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 600 }}>원</span>
                        </p>
                        <p style={{ fontSize: 12, color: C.textTertiary, marginTop: 4 }}>/월 (VAT 별도)</p>
                      </>
                    )}
                  </div>

                  {showDiscount && yearlySaving > 0 && (
                    <div style={{ margin: '0 0 8px', padding: '4px 10px', borderRadius: 8, background: 'oklch(95% 0.05 25)', fontSize: 11, fontWeight: 700, color: 'oklch(50% 0.18 25)' }}>
                      연 {yearlySaving.toLocaleString()}원 절약
                    </div>
                  )}

                  <p style={{ fontSize: 13, color: C.textTertiary, fontWeight: 700, marginBottom: 12 }}>최대 {p.students}</p>

                  <div style={{ height: 1, background: C.border, margin: '0 0 12px' }} />

                  <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', flex: 1 }}>
                    {p.features.map((f, j) => (
                      <li key={j} style={{ padding: '5px 0', fontSize: 14, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Check /> {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => navigate('/onboarding')} style={{
                    marginTop: 16, width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                    background: p.popular ? C.accent : p.inquiry ? 'linear-gradient(135deg, oklch(55% 0.14 75), oklch(50% 0.14 55))' : 'transparent',
                    color: p.popular || p.inquiry ? C.white : C.textSecondary,
                    border: !p.popular && !p.inquiry ? `1px solid ${C.border}` : 'none',
                    boxShadow: p.popular ? '0 2px 8px oklch(48% 0.18 260 / 0.3)' : 'none',
                  }} onMouseOver={e => { if (!p.inquiry) e.currentTarget.style.opacity = '0.85'; }}
                     onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}>
                    {p.inquiry ? '상담 요청' : price === 0 ? '무료로 시작' : '지금 시작하기'}
                  </button>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, color: C.textTertiary, fontSize: 13 }}>모든 가격 VAT 별도 · 연간 결제 시 15% 할인 · 문자·알림 비용은 사용량 기준 별도 안내 · 언제든 해지 가능</p>
        </div>
      </section>

      {/* === TRUST === */}
      <section id="trust" style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>TRUST</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.025em', lineHeight: 1.3 }}>안심하고 도입하세요</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔒', title: '보안', items: ['역할별 권한 관리 (RBAC)', '전 데이터 암호화 (HTTPS)', '감사 로그 자동 기록', '테넌트 데이터 완전 격리'] },
              { icon: '🔄', title: '운영', items: ['자동 백업 (매일)', '데이터 이전 지원 (엑셀 Import)', '30일 무료 체험 (카드 등록 없음)', '1일 내 첫 세팅 완료'] },
              { icon: '⚖️', title: '법규 준수', items: ['개인정보처리방침 공개', '광고성 메시지 동의 관리', '사업자 정보 투명 공개', '환불 정책 명시'] },
            ].map((t, i) => (
              <div key={i} ref={addRef} style={{
                background: '#ffffff', borderRadius: 16, padding: 32,
                border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{t.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>{t.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {t.items.map((it, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', fontSize: 14, color: C.textSecondary }}>
                      <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>✓</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section id="faq" style={{ padding: '96px 0', background: C.surfaceCard }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 24px' }}>
          <div ref={addRef} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 12 }}>궁금하신 점이 있으신가요?</h2>
            <p style={{ color: C.textTertiary }}>시작하기 전에 선생님들이 가장 많이 물어보신 것들입니다.</p>
          </div>
          {faqCategories.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 40 }}>
              <span style={{ display: 'inline-flex', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 500, background: C.surfaceCard, color: C.textTertiary, border: `1px solid ${C.border}`, marginBottom: 16 }}>{cat.label}</span>
              {cat.items.map((item, ii) => {
                const faqKey = `${ci}-${ii}`;
                const isOpen = activeFaq === faqKey;
                return (
                  <div key={ii} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <button onClick={() => setActiveFaq(isOpen ? null : faqKey)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '20px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, paddingRight: 16 }}>{item.q}</span>
                      <ChevronDown open={isOpen} />
                    </button>
                    <div style={{
                      maxHeight: isOpen ? 600 : 0, overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                      <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, paddingBottom: 20 }}>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* === CTA === */}
      <section id="cta" style={{ padding: '96px 0', background: 'linear-gradient(135deg, var(--primary) 0%, #1e2a5e 100%)' }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 ref={addRef} style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.3, marginBottom: 20, color: '#ffffff' }}>
            학원 운영, 이제 바꿀 때입니다
          </h2>
          <p ref={addRef} style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 36 }}>
            지금 쓰고 계신 엑셀과 단톡방에서 꺼내보세요.<br/>30일 무료 체험, 카드 등록 없이 시작할 수 있습니다.
          </p>
          <div ref={addRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={() => navigate('/onboarding')} style={{
              background: '#ffffff', color: 'var(--primary)',
              fontWeight: 800, fontSize: 16, padding: '16px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }} onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; }}
               onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}>
              무료로 시작하기
            </button>
            <button onClick={() => scrollTo('pricing')} style={{
              background: 'transparent', color: '#ffffff',
              fontWeight: 800, fontSize: 16, padding: '16px 32px', borderRadius: 12,
              border: '2px solid #ffffff', cursor: 'pointer', transition: 'all 0.2s',
            }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
               onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
              데모 요청하기
            </button>
            <a href="#pricing" onClick={e => { e.preventDefault(); scrollTo('pricing'); }} style={{
              color: '#ffffff', fontWeight: 700, fontSize: 16,
              textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 4,
            }}>도입 상담</a>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '48px 0' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <p style={{ fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>나만의 조교</p>
              <p style={{ fontSize: 14, color: C.textTertiary }}>현직 강사가 학원 운영하면서 직접 만든 관리 솔루션.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 14, color: C.textTertiary }}>
              <a href="/terms" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = C.textPrimary} onMouseOut={e => e.currentTarget.style.color = C.textTertiary}>이용약관</a>
              <a href="/privacy" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = C.textPrimary} onMouseOut={e => e.currentTarget.style.color = C.textTertiary}>개인정보처리방침</a>
              <a href="/business-info" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = C.textPrimary} onMouseOut={e => e.currentTarget.style.color = C.textTertiary}>문의하기</a>
            </div>
          </div>
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: C.textTertiary }}>&copy; 2026 나만의 조교. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <LegalFooter />
    </div>
  );
}
