import { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, isLoggedIn } from '../api';

const TenantContext = createContext(null);

// ─────────────────────────────────────────────────────────
// 요금제 4단 구조 — server/middleware/subscription.js 와 동기화
// Free / Starter / Pro / First Class
// 레거시 매핑: trial→free, basic→starter, standard|growth→pro, premium→first_class
// ─────────────────────────────────────────────────────────
const FREE_FEATURES = ['scores', 'attendance', 'notices', 'materials', 'qna'];
const STARTER_EXTRA = ['students', 'tuition_basic', 'sms', 'parent_app', 'reviews', 'consultation_basic', 'consultation'];
const PRO_EXTRA = [
  'automation', 'consultation_crm', 'advanced_reports', 'messaging_policy',
  'leads_pipeline', 'tuition_exceptions', 'ai_reports',
  'attendance_alert', 'clinic', 'homework', 'study_timer', 'omr', 'detailed_reports', 'notice_reads',
];
const FIRST_CLASS_EXTRA = [
  'gamification', 'rankings', 'shop', 'titles',
  'quiz_vocab', 'quiz_knowledge', 'quiz_reading', 'ox_quiz',
  'avatar', 'ai_quiz_generation', 'portfolio',
  'branding', 'branding_logo', 'hall_of_fame',
  'quiz', 'knowledge_quiz', 'reading_quiz',
];

const _FREE = [...FREE_FEATURES];
const _STARTER = [..._FREE, ...STARTER_EXTRA];
const _PRO = [..._STARTER, ...PRO_EXTRA];
const _FIRST_CLASS = [..._PRO, ...FIRST_CLASS_EXTRA];

export const TIER_FEATURES = {
  free: _FREE,
  starter: _STARTER,
  pro: _PRO,
  first_class: _FIRST_CLASS,
  // 레거시 호환 매핑 (기존 DB 데이터 보호)
  trial: _FREE,
  basic: _STARTER,
  standard: _PRO,
  growth: _PRO,
  premium: _FIRST_CLASS,
};

export const TIER_LABELS = {
  free:        'Free',
  starter:     'Starter',
  pro:         'Pro',
  first_class: 'First Class',
};

export function tierHasFeature(tier, feature) {
  if (!feature) return false;
  const feats = TIER_FEATURES[tier] || TIER_FEATURES.starter;
  return feats.includes('all') || feats.includes(feature);
}

export function TenantProvider({ children }) {
  const [config, setConfig] = useState(getDefaultConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      apiGet('/academies/my')
        .then(data => {
          const settings = typeof data.settings === 'string' ? JSON.parse(data.settings) : (data.settings || {});
          setConfig(buildConfig(data));
          setLoading(false);
        })
        .catch(() => {
          setConfig(getDefaultConfig());
          setLoading(false);
        });
    } else {
      setConfig(getDefaultConfig());
      setLoading(false);
    }

    const handler = () => {
      if (isLoggedIn()) {
        apiGet('/academies/my')
          .then(data => {
            setConfig(buildConfig(data));
          })
          .catch(() => {});
      } else {
        setConfig(getDefaultConfig());
      }
    };
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  const hasFeature = (feature) => tierHasFeature(config?.tier, feature);

  return (
    <TenantContext.Provider value={{ config, loading, setConfig, hasFeature }}>
      {children}
    </TenantContext.Provider>
  );
}

function buildConfig(data) {
  const settings = typeof data.settings === 'string' ? JSON.parse(data.settings) : (data.settings || {});
  return {
    academyId: data.id,
    academyName: data.name,
    slug: data.slug,
    tier: data.subscription_tier,
    schools: settings.schools || [],
    examTypes: settings.examTypes || [],
    siteTitle: settings.siteTitle || data.name || '팀 강인',
    mainTitle: settings.mainTitle || '',
    branding: settings.branding || {},
    academyInfo: settings.academyInfo || {},
    subject: settings.subject || null,
    clinicSettings: settings.clinicSettings || {},
    dashboard_config: settings.dashboard_config || {},
  };
}

function getDefaultConfig() {
  return {
    academyId: null,
    academyName: '팀 강인',
    slug: '',
    tier: 'free',
    schools: [],
    examTypes: [],
    siteTitle: '팀 강인',
    mainTitle: '혼자 하지 않는 국어, 끝까지 함께 — TEAM KANG:IN',
    branding: {},
    academyInfo: {},
    subject: null,
    clinicSettings: {},
    dashboard_config: {},
  };
}

export function useTenantConfig() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    const defaultConfig = getDefaultConfig();
    return {
      config: defaultConfig,
      loading: false,
      hasFeature: (feature) => tierHasFeature(defaultConfig.tier, feature),
    };
  }
  return ctx;
}

export function getAllGrades(schoolName, schools) {
  if (!schools || !schoolName) return [];
  const school = schools.find(s => s.name === schoolName);
  return school ? school.grades : [];
}
