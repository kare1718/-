import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiPost, apiGet } from '../api';
import { useTenantConfig, getAllGrades } from '../contexts/TenantContext';
import BrandLogo from '../components/BrandLogo';

const FONT = "'Paperlogy', sans-serif";
const C = { accent: 'var(--primary)', accentDark: 'var(--primary-light)', accentLight: 'var(--primary-light)', textPrimary: 'var(--foreground)', textSecondary: 'var(--muted-foreground)', textTertiary: 'var(--neutral-400)', surface: 'var(--muted)', border: 'var(--border)', white: 'var(--card)', error: 'var(--destructive)', errorBg: 'var(--destructive-light)', success: 'var(--success)', successBg: 'var(--success-light)', warning: 'var(--warning)' };

const ANIM_ID = '__registerPageKeyframes';
function injectKeyframes() {
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement('style');
  s.id = ANIM_ID;
  s.textContent = `@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(s);
}
const reveal = (delay = 0) => ({ opacity: 0, animation: `fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards` });

const inputBase = {
  width: '100%', padding: '13px 16px', border: `1.5px solid ${C.border}`,
  borderRadius: 12, fontSize: 15, fontFamily: FONT, outline: 'none',
  color: C.textPrimary, background: C.white, transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 6 };
const primaryBtn = {
  width: '100%', padding: '16px', background: C.accent, color: C.white,
  border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
  fontFamily: FONT, cursor: 'pointer', transition: 'background 0.2s, box-shadow 0.2s',
};

export default function RegisterPage() {
  const { config } = useTenantConfig();
  const SCHOOLS = config.schools || [];
  const STUDENT_SCHOOLS = SCHOOLS.filter(s => s.name !== '조교' && s.name !== '선생님');
  const SITE_TITLE = config.siteTitle || config.academyName || '팀 강인';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const academySlug = searchParams.get('academy');

  const [userType, setUserType] = useState('');
  const [form, setForm] = useState({
    username: '', password: '', passwordConfirm: '', name: '',
    phone: '', school: '', grade: '',
    parentName: '', parentPhone: '', inviteCode: ''
  });
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [academyName, setAcademyName] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const codeTimerRef = useRef(null);

  const isStaff = userType === 'assistant' || userType === 'teacher';

  useEffect(() => { injectKeyframes(); }, []);

  useEffect(() => {
    if (!academySlug) return;
    apiGet(`/academies/config?slug=${academySlug}`)
      .then(data => {
        setAcademyName(data.academyName || data.siteTitle || academySlug);
        setForm(prev => ({ ...prev, inviteCode: academySlug }));
      })
      .catch(() => {
        fetch(`/api/auth/verify-invite-code/${academySlug}`)
          .then(res => res.json())
          .then(data => {
            if (data.academyName) {
              setAcademyName(data.academyName);
              setForm(prev => ({ ...prev, inviteCode: academySlug }));
            }
          })
          .catch(() => {});
      });
  }, [academySlug]);

  useEffect(() => {
    if (academySlug && form.inviteCode === academySlug) return;
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    setAcademyName('');
    setInviteCodeError('');

    if (!form.inviteCode || form.inviteCode.length < 4) return;

    setCheckingCode(true);
    codeTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/verify-invite-code/${form.inviteCode}`);
        const data = await res.json();
        if (res.ok) {
          setAcademyName(data.academyName);
          setInviteCodeError('');
        } else {
          setAcademyName('');
          setInviteCodeError(data.error || '유효하지 않은 코드입니다.');
        }
      } catch {
        setInviteCodeError('코드 확인 중 오류가 발생했습니다.');
      } finally {
        setCheckingCode(false);
      }
    }, 500);

    return () => { if (codeTimerRef.current) clearTimeout(codeTimerRef.current); };
  }, [form.inviteCode, academySlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userType) { setError('가입 유형을 선택해주세요.'); return; }
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (userType === 'student' && !academyName) { setError('유효한 초대 코드를 입력해주세요.'); return; }
    if (!isStaff && (!form.school || !form.grade)) { setError('학교와 학년을 선택해주세요.'); return; }
    if (!form.phone) { setError('연락처를 입력해주세요.'); return; }
    if (!isStaff && (!form.parentName || !form.parentPhone)) { setError('학부모 정보를 입력해주세요.'); return; }
    if (!agreePrivacy) { setError('개인정보 수집 및 이용에 동의해주세요.'); return; }

    const submitData = { ...form, agreePrivacy, agreeMarketing };
    if (userType === 'assistant') { submitData.school = '조교'; submitData.grade = '조교'; }
    else if (userType === 'teacher') { submitData.school = '선생님'; submitData.grade = '선생님'; }

    try {
      await apiPost('/auth/register', submitData);
      setSuccess(true);
    } catch (err) { setError(err.message); }
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const updatePhone = (key) => (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length <= 3) formatted = raw;
    else if (raw.length <= 7) formatted = raw.slice(0, 3) + '-' + raw.slice(3);
    else formatted = raw.slice(0, 3) + '-' + raw.slice(3, 7) + '-' + raw.slice(7, 11);
    setForm({ ...form, [key]: formatted });
  };
  const grades = form.school ? getAllGrades(form.school, config.schools) : [];

  const focusHandler = (e) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}15`; };
  const blurHandler = (e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const userTypes = [
    { key: 'student', emoji: '\u{1F393}', color: C.accent, bg: `${C.accent}0A`, label: '학생', desc: '수업을 듣는 학생' },
    { key: 'assistant', emoji: '\u{1F4CB}', color: C.success, bg: `${C.success}12`, label: '조교', desc: '수업 보조 및 관리 담당' },
    { key: 'teacher', emoji: '\u{1F468}\u{200D}\u{1F3EB}', color: C.warning, bg: `${C.warning}15`, label: '선생님', desc: '강사 및 교육 담당' },
  ];

  /* ── 스텝 인디케이터 ── */
  const StepIndicator = ({ current }) => {
    const steps = ['정보 입력', '완료'];
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
        {steps.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i <= current ? C.accent : C.surface,
                color: i <= current ? C.white : C.textTertiary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, transition: 'all 0.3s',
                border: i <= current ? 'none' : `2px solid ${C.border}`,
              }}>
                {i < current ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                ) : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: i <= current ? C.accent : C.textTertiary }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 48, height: 2, background: i < current ? C.accent : C.border, margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  // 성공 화면
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: FONT }}>
        <div style={{
          maxWidth: 480, width: '100%', background: C.white, borderRadius: 24,
          padding: '48px 32px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.06)',
          border: `1px solid ${C.border}`, textAlign: 'center',
          ...reveal(0),
        }}>
          <StepIndicator current={1} />
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: C.successBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, marginBottom: 10 }}>가입 신청 완료</h2>
          <p style={{ fontSize: 15, color: C.textSecondary, marginBottom: 6, lineHeight: 1.6 }}>
            관리자 승인 후 로그인할 수 있습니다.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, background: `${C.accent}08`,
            fontSize: 13, color: C.accent, fontWeight: 600, marginBottom: 32,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            보통 1일 이내 승인됩니다
          </div>

          <button style={primaryBtn} onClick={() => navigate('/login')}
            onMouseOver={e => { e.currentTarget.style.background = C.accentDark; e.currentTarget.style.boxShadow = '0 4px 12px oklch(55% 0.15 250 / 0.25)'; }}
            onMouseOut={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.boxShadow = 'none'; }}
          >로그인 페이지로 이동</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: FONT }}>
      <div style={{
        maxWidth: 540, width: '100%', background: C.white, borderRadius: 24,
        padding: '36px 32px', boxShadow: '0 8px 32px oklch(0% 0 0 / 0.06)',
        border: `1px solid ${C.border}`,
        ...reveal(0),
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <BrandLogo
              variant="auto"
              height={44}
              showSub
              align="center"
              subText={SITE_TITLE === '팀 강인' ? 'by 강인한 국어' : `by ${SITE_TITLE}`}
            />
          </div>

          {academyName && academySlug ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12, background: `${C.accent}08`,
              marginBottom: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{academyName}에 가입합니다</span>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: C.textSecondary }}>계정을 만드세요</p>
          )}
        </div>

        <StepIndicator current={0} />

        {error && (
          <div style={{
            padding: '12px 16px', background: C.errorBg, color: C.error,
            borderRadius: 12, fontSize: 13, fontWeight: 500, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        {!userType ? (
          <div style={reveal(100)}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, textAlign: 'center', marginBottom: 16 }}>가입 유형을 선택하세요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {userTypes.map((t, i) => (
                <button key={t.key} type="button" onClick={() => setUserType(t.key)} style={{
                  padding: '16px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`,
                  background: C.white, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', fontFamily: FONT,
                  ...reveal(150 + i * 80),
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = '0 4px 12px oklch(55% 0.15 250 / 0.08)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: t.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {t.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.textPrimary }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: C.textTertiary, marginTop: 2 }}>{t.desc}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="m9 18 6-6-6-6"/></svg>
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: C.textSecondary }}>
              이미 계정이 있으신가요? <Link to="/login" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>로그인</Link>
            </p>
          </div>
        ) : (
          <div style={reveal(100)}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              padding: '10px 16px', borderRadius: 12, background: `${C.accent}08`,
            }}>
              <span style={{ fontSize: 18 }}>
                {userType === 'student' ? '\u{1F393}' : userType === 'assistant' ? '\u{1F4CB}' : '\u{1F468}\u{200D}\u{1F3EB}'}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.accent }}>
                {userType === 'student' ? '학생' : userType === 'assistant' ? '조교' : '선생님'} 가입
              </span>
              <button type="button" onClick={() => { setUserType(''); setError(''); }}
                style={{
                  marginLeft: 'auto', background: 'none', border: `1px solid ${C.border}`,
                  borderRadius: 8, cursor: 'pointer', fontSize: 12, color: C.textSecondary,
                  fontFamily: FONT, fontWeight: 500, padding: '4px 12px', transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = C.textTertiary}
                onMouseOut={e => e.currentTarget.style.borderColor = C.border}
              >변경</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>아이디 *</label>
                  <input style={inputBase} value={form.username} onChange={update('username')} placeholder="아이디" required onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label style={labelStyle}>이름 *</label>
                  <input style={inputBase} value={form.name} onChange={update('name')} placeholder="이름" required onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>비밀번호 *</label>
                  <input style={inputBase} type="password" value={form.password} onChange={update('password')} placeholder="비밀번호" required onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label style={labelStyle}>비밀번호 확인 *</label>
                  <input style={{
                    ...inputBase,
                    borderColor: form.passwordConfirm && form.password !== form.passwordConfirm ? C.error : C.border,
                  }} type="password" value={form.passwordConfirm} onChange={update('passwordConfirm')} placeholder="비밀번호 확인" required onFocus={focusHandler} onBlur={blurHandler} />
                  {form.passwordConfirm && form.password !== form.passwordConfirm && (
                    <span style={{ fontSize: 11, color: C.error, marginTop: 4, display: 'block' }}>비밀번호가 일치하지 않습니다</span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>연락처 *</label>
                <input style={inputBase} value={form.phone} onChange={updatePhone('phone')} placeholder="010-0000-0000" maxLength={13} required onFocus={focusHandler} onBlur={blurHandler} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>초대 코드 {userType === 'student' ? '*' : ''}</label>
                <input
                  style={{ ...inputBase, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700 }}
                  value={form.inviteCode}
                  onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                  placeholder="선생님에게 받은 초대 코드"
                  maxLength={10}
                  required={userType === 'student'}
                  onFocus={focusHandler} onBlur={blurHandler}
                />
                <div style={{ marginTop: 6, minHeight: 18 }}>
                  {checkingCode && (
                    <span style={{ fontSize: 12, color: C.textTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      확인 중...
                    </span>
                  )}
                  {academyName && (
                    <span style={{ fontSize: 13, color: C.success, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      {academyName}
                    </span>
                  )}
                  {inviteCodeError && <span style={{ fontSize: 12, color: C.error }}>{inviteCodeError}</span>}
                  {!checkingCode && !academyName && !inviteCodeError && (
                    <span style={{ fontSize: 12, color: C.textTertiary }}>소속 학원의 초대 코드를 선생님에게 문의하세요</span>
                  )}
                </div>
              </div>

              {userType === 'student' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>학교 *</label>
                      <select style={{ ...inputBase, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234E5968' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}
                        value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value, grade: '' })} required onFocus={focusHandler} onBlur={blurHandler}>
                        <option value="">선택하세요</option>
                        {STUDENT_SCHOOLS.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>학년 *</label>
                      <select style={{ ...inputBase, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234E5968' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}
                        value={form.grade} onChange={update('grade')} required disabled={!form.school} onFocus={focusHandler} onBlur={blurHandler}>
                        <option value="">선택하세요</option>
                        {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>학부모 이름 *</label>
                      <input style={inputBase} value={form.parentName} onChange={update('parentName')} placeholder="학부모 이름" onFocus={focusHandler} onBlur={blurHandler} />
                    </div>
                    <div>
                      <label style={labelStyle}>학부모 연락처 *</label>
                      <input style={inputBase} value={form.parentPhone} onChange={updatePhone('parentPhone')} placeholder="010-0000-0000" maxLength={13} onFocus={focusHandler} onBlur={blurHandler} />
                      <span style={{ fontSize: 11, color: C.textTertiary, marginTop: 4, display: 'block' }}>출결 알림 수신</span>
                    </div>
                  </div>
                </>
              )}

              <div style={{ background: C.surface, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                {/* 전체 동의 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
                  <input
                    type="checkbox"
                    checked={agreePrivacy && agreeMarketing}
                    onChange={(e) => { setAgreePrivacy(e.target.checked); setAgreeMarketing(e.target.checked); }}
                    id="agreeAll"
                    style={{ width: 20, height: 20, cursor: 'pointer', accentColor: C.accent }}
                  />
                  <label htmlFor="agreeAll" style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                    전체 동의하기
                  </label>
                </div>

                {/* 개인정보 동의 (필수) */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)}
                    id="agreePrivacy"
                    style={{ marginTop: 2, width: 18, height: 18, cursor: 'pointer', accentColor: C.accent }}
                  />
                  <label htmlFor="agreePrivacy" style={{ cursor: 'pointer', lineHeight: 1.5, fontSize: 13, color: C.textPrimary }}>
                    <b>[필수]</b> 개인정보 수집 및 이용에 동의합니다.
                  </label>
                </div>
                <button type="button" onClick={() => setShowPrivacy(!showPrivacy)}
                  style={{ background: 'none', border: 'none', color: C.accent, fontSize: 12, cursor: 'pointer', marginTop: 6, padding: 0, fontFamily: FONT, marginLeft: 28 }}>
                  {showPrivacy ? '접기' : '내용 보기'}
                </button>
                {showPrivacy && (
                  <div style={{
                    marginTop: 10, padding: '14px 16px', background: C.white,
                    borderRadius: 10, fontSize: 12, lineHeight: 1.8,
                    color: C.textSecondary, maxHeight: 200, overflow: 'auto',
                    border: `1px solid ${C.border}`, marginLeft: 28,
                  }}>
                    <p>'나만의 조교' 서비스 제공을 위해 아래와 같이 개인정보를 수집 및 이용합니다.</p>
                    <p style={{ marginTop: 8 }}><b>수집 항목</b></p>
                    <p>- 성명, 휴대전화 번호</p>
                    <p style={{ marginTop: 8 }}><b>수집 및 이용 목적</b></p>
                    <p>- 서비스 이용에 따른 본인 확인, 학습 관리 서비스 제공, 원활한 상담 및 주요 공지사항 전달</p>
                    <p style={{ marginTop: 8 }}><b>보유 및 이용 기간</b></p>
                    <p>- 서비스 탈퇴 시 또는 이용 목적 달성 시까지</p>
                    <p>- 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관</p>
                    <p style={{ marginTop: 12 }}>
                      자세한 내용은{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 600 }}>개인정보처리방침 전문</a>
                      {' '}및{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 600 }}>이용약관</a>
                      에서 확인할 수 있습니다.
                    </p>
                  </div>
                )}

                {/* 마케팅 동의 (선택) */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                  <input
                    type="checkbox" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)}
                    id="agreeMarketing"
                    style={{ marginTop: 2, width: 18, height: 18, cursor: 'pointer', accentColor: C.accent }}
                  />
                  <div>
                    <label htmlFor="agreeMarketing" style={{ cursor: 'pointer', lineHeight: 1.5, fontSize: 13, color: C.textPrimary }}>
                      <span style={{ color: C.textTertiary }}>[선택]</span> 마케팅 정보 수신 및 광고 활용에 동의합니다.
                    </label>
                    <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4, lineHeight: 1.7, marginLeft: 0 }}>
                      <p style={{ margin: 0 }}>신규 강의 및 커리큘럼 안내, 신규 교재 출시 정보 제공, 이벤트 및 홍보성 메시지 발송</p>
                      <p style={{ margin: '2px 0 0' }}>동의하지 않아도 서비스 이용에 제한이 없습니다. 동의 후 언제든 철회할 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" style={{ ...primaryBtn, opacity: agreePrivacy ? 1 : 0.5 }} disabled={!agreePrivacy}
                onMouseOver={e => { if (agreePrivacy) { e.currentTarget.style.background = C.accentDark; e.currentTarget.style.boxShadow = '0 4px 12px oklch(55% 0.15 250 / 0.25)'; }}}
                onMouseOut={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.boxShadow = 'none'; }}
              >회원가입</button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.textSecondary }}>
              이미 계정이 있으신가요? <Link to="/login" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>로그인</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
