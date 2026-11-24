import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout, isLoggedIn, checkTokenExpiry } from './api';
import { TenantProvider, useTenantConfig } from './contexts/TenantContext';
import LoadingScreen from './components/LoadingScreen';
import BrandLogo from './components/BrandLogo';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import FeedbackHost from './components/FeedbackHost';

// Route and shell chunks
const SideNav = lazy(() => import('./components/SideNav'));
const OnboardingChecklist = lazy(() => import('./components/OnboardingChecklist'));
const PlatformNotificationBell = lazy(() => import('./components/PlatformNotificationBell'));
const ParentBottomNav = lazy(() => import('./components/ParentBottomNav'));

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// 일반 페이지 (lazy)
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));

// 정책 페이지 (lazy)
const Terms = lazy(() => import('./pages/legal/Terms'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const Refund = lazy(() => import('./pages/legal/Refund'));
const BusinessInfo = lazy(() => import('./pages/legal/BusinessInfo'));

// 관리자 페이지 (lazy)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const SchoolPage = lazy(() => import('./pages/admin/SchoolPage'));
const GradePage = lazy(() => import('./pages/admin/GradePage'));
const StudentManage = lazy(() => import('./pages/admin/StudentManage'));
const StudentList = lazy(() => import('./pages/admin/StudentList'));
const ScoreInput = lazy(() => import('./pages/admin/ScoreInput'));
const NoticeCreate = lazy(() => import('./pages/admin/NoticeCreate'));
const PendingUsers = lazy(() => import('./pages/admin/PendingUsers'));
const EditRequests = lazy(() => import('./pages/admin/EditRequests'));
const ReviewManage = lazy(() => import('./pages/admin/ReviewManage'));
const QnAManage = lazy(() => import('./pages/admin/QnAManage'));
const AdminStudentView = lazy(() => import('./pages/admin/AdminStudentView'));
const AcademySettings = lazy(() => import('./pages/admin/AcademySettings'));
const RolePermissions = lazy(() => import('./pages/admin/RolePermissions'));
const SubscriptionPage = lazy(() => import('./pages/admin/SubscriptionPage'));
const GamificationManage = lazy(() => import('./pages/admin/GamificationManage'));
const SmsManage = lazy(() => import('./pages/admin/SmsManage'));
const ClinicManage = lazy(() => import('./pages/admin/ClinicManage'));
const ScheduleManage = lazy(() => import('./pages/admin/ScheduleManage'));
const HallOfFameManage = lazy(() => import('./pages/admin/HallOfFameManage'));
const TAScheduleManage = lazy(() => import('./pages/admin/TAScheduleManage'));
const HomeworkManage = lazy(() => import('./pages/admin/HomeworkManage'));
const ReportManage = lazy(() => import('./pages/admin/ReportManage'));
const AttendanceManage = lazy(() => import('./pages/admin/AttendanceManage'));
const TuitionManage = lazy(() => import('./pages/admin/TuitionManage'));
const ConsultationLog = lazy(() => import('./pages/admin/ConsultationLog'));
const LeadManage = lazy(() => import('./pages/admin/LeadManage'));
const PortfolioManage = lazy(() => import('./pages/admin/PortfolioManage'));
const SmsCredits = lazy(() => import('./pages/admin/SmsCredits'));
const AIAssistant = lazy(() => import('./pages/admin/AIAssistant'));
const BackupManage = lazy(() => import('./pages/admin/BackupManage'));
const BackupSecurity = lazy(() => import('./pages/admin/BackupSecurity'));
const ClassManage = lazy(() => import('./pages/admin/ClassManage'));
const PreRegistered = lazy(() => import('./pages/admin/PreRegistered'));
const ParentManage = lazy(() => import('./pages/admin/ParentManage'));
const ProfileManage = lazy(() => import('./pages/admin/ProfileManage'));
const UserGuide = lazy(() => import('./pages/admin/UserGuide'));
const AutomationManage = lazy(() => import('./pages/admin/AutomationManage'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const DataImport = lazy(() => import('./pages/admin/DataImport'));

// 학생 페이지 (lazy)
const MyPage = lazy(() => import('./pages/student/MyPage'));
const Notices = lazy(() => import('./pages/student/Notices'));
const ScoreView = lazy(() => import('./pages/student/ScoreView'));
const Materials = lazy(() => import('./pages/student/Materials'));
const Reviews = lazy(() => import('./pages/student/Reviews'));
const QnA = lazy(() => import('./pages/student/QnA'));
const GameHub = lazy(() => import('./pages/student/GameHub'));
const VocabQuiz = lazy(() => import('./pages/student/VocabQuiz'));
const KnowledgeQuiz = lazy(() => import('./pages/student/KnowledgeQuiz'));
const ReadingQuiz = lazy(() => import('./pages/student/ReadingQuiz'));
const OXQuiz = lazy(() => import('./pages/student/OXQuiz'));
const Rankings = lazy(() => import('./pages/student/Rankings'));
const Shop = lazy(() => import('./pages/student/Shop'));
const AvatarCustomize = lazy(() => import('./pages/student/AvatarCustomize'));
const ClinicApply = lazy(() => import('./pages/student/ClinicApply'));
const AttendanceCheck = lazy(() => import('./pages/student/AttendanceCheck'));
const Portfolio = lazy(() => import('./pages/student/Portfolio'));
const AIHub = lazy(() => import('./pages/student/AIHub'));
const InfoHub = lazy(() => import('./pages/student/InfoHub'));
const StudyTimer = lazy(() => import('./pages/student/StudyTimer'));
const StudyRankings = lazy(() => import('./pages/student/StudyRankings'));

// 보호자 페이지 (lazy)
const ParentHome = lazy(() => import('./pages/parent/ParentHome'));
const ParentAttendance = lazy(() => import('./pages/parent/ParentAttendance'));
const ParentTuition = lazy(() => import('./pages/parent/ParentTuition'));
const ParentNotices = lazy(() => import('./pages/parent/ParentNotices'));
const ParentMore = lazy(() => import('./pages/parent/ParentMore'));

// SuperAdmin (lazy)
const SuperDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const AcademyDetail = lazy(() => import('./pages/superadmin/AcademyDetail'));
const AcademyCreate = lazy(() => import('./pages/superadmin/AcademyCreate'));
const SuperBackupSecurity = lazy(() => import('./pages/superadmin/BackupSecurity'));
const PromotionsPage = lazy(() => import('./pages/superadmin/PromotionsPage'));
const RevenuePage = lazy(() => import('./pages/superadmin/RevenuePage'));
const KPIDashboard = lazy(() => import('./pages/superadmin/KPIDashboard'));
const UsageAnalytics = lazy(() => import('./pages/superadmin/UsageAnalytics'));
const BusinessInfoEdit = lazy(() => import('./pages/superadmin/BusinessInfoEdit'));
const PricingEdit = lazy(() => import('./pages/superadmin/PricingEdit'));

function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const { config } = useTenantConfig();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <h1
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', margin: 0 }}
        onClick={() => navigate(user.role === 'superadmin' ? '/superadmin' : user.role === 'parent' ? '/parent' : (user.role === 'admin' || user.school === '조교' || user.school === '선생님') ? '/admin' : '/student')}
        aria-label={config?.siteTitle || '팀 강인'}
      >
        <BrandLogo variant="dark" height={30} />
      </h1>
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {(user.role === 'admin' || user.school === '조교') && (
          <Suspense fallback={null}>
            <PlatformNotificationBell />
          </Suspense>
        )}
        <span>{user.name}님 ({user.role === 'superadmin' ? '플랫폼 관리자' : user.role === 'admin' ? '관리자' : user.role === 'parent' ? '보호자' : user.school === '조교' ? '조교' : user.school === '선생님' ? '선생님' : '학생'})</span>
        <ThemeToggle />
        <button onClick={handleLogout}>로그아웃</button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, role }) {
  const user = getUser();
  if (!isLoggedIn() || !user) return <Navigate to="/login" />;
  const isAssistant = user.school === '조교';
  if (user.role === 'superadmin') return children;
  if (role && user.role !== role) {
    if (user.role === 'admin' && role === 'student') return children;
    if (isAssistant && (role === 'admin' || role === 'student')) return children;
    if (user.role === 'parent') return <Navigate to="/parent" />;
    return <Navigate to={user.role === 'admin' ? '/admin' : (isAssistant ? '/admin' : '/student')} />;
  }
  return children;
}

function RedirectIfLoggedIn({ children }) {
  const user = getUser();
  if (isLoggedIn() && user) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" />;
    if (user.role === 'parent') return <Navigate to="/parent" />;
    const isAssistant = user.school === '조교';
    return <Navigate to={(user.role === 'admin' || isAssistant) ? '/admin' : '/student'} />;
  }
  return children;
}

function App() {
  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    checkTokenExpiry();
  }, []);

  useEffect(() => {
    const handler = () => setAuthKey(k => k + 1);
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter key={authKey}>
        <TenantProvider>
          <AppLayout />
        </TenantProvider>
      </BrowserRouter>
      <FeedbackHost />
    </ErrorBoundary>
  );
}

function ParentLayout() {
  const location = useLocation();
  return (
    <>
      <div style={{ paddingBottom: 60 }}>
        <Suspense fallback={<LoadingScreen />}>
          <RouteErrorBoundary key={location.pathname} pathname={location.pathname}>
            <Routes>
              <Route index element={<ParentHome />} />
              <Route path="attendance" element={<ParentAttendance />} />
              <Route path="tuition" element={<ParentTuition />} />
              <Route path="notices" element={<ParentNotices />} />
              <Route path="more" element={<ParentMore />} />
            </Routes>
          </RouteErrorBoundary>
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <ParentBottomNav />
      </Suspense>
    </>
  );
}

function AppLayout() {
  const location = useLocation();
  const user = getUser();
  const isPublicPayment = location.pathname.startsWith('/pay/');
  const isParentRoute = location.pathname.startsWith('/parent');
  const showMainShell = !isPublicPayment && !isParentRoute && Boolean(user);
  // usePageTracking(); // 임시 비활성화 — 런타임 안정성 확인 후 재활성화

  return (
    <div className="app">
      {!isPublicPayment && !isParentRoute && <Navbar />}
      {showMainShell && (
        <Suspense fallback={null}>
          <SideNav />
          <OnboardingChecklist />
        </Suspense>
      )}
      {isParentRoute && <Navbar />}
      {/* 라우트 콘텐츠 단일 래퍼 — SideNav가 #route-content에 margin-left를 주입해 밀어냄
          (페이지별 .content/.main-content 클래스 의존 제거) */}
      <div id="route-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Suspense fallback={<LoadingScreen />}>
      <RouteErrorBoundary key={location.pathname} pathname={location.pathname}>
      <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<RedirectIfLoggedIn><LoginPage /></RedirectIfLoggedIn>} />
            <Route path="/register" element={<RedirectIfLoggedIn><RegisterPage /></RedirectIfLoggedIn>} />
            <Route path="/pay/:token" element={<PaymentPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/business-info" element={<BusinessInfo />} />

            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/school/:school" element={<ProtectedRoute role="admin"><SchoolPage /></ProtectedRoute>} />
            <Route path="/admin/school/:school/grade/:grade" element={<ProtectedRoute role="admin"><GradePage /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute role="admin"><StudentList /></ProtectedRoute>} />
            <Route path="/admin/student/:id" element={<ProtectedRoute role="admin"><StudentManage /></ProtectedRoute>} />
            <Route path="/admin/scores" element={<ProtectedRoute role="admin"><ScoreInput /></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute role="admin"><NoticeCreate /></ProtectedRoute>} />
            <Route path="/admin/pending" element={<ProtectedRoute role="admin"><PendingUsers /></ProtectedRoute>} />
            <Route path="/admin/edit-requests" element={<ProtectedRoute role="admin"><EditRequests /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute role="admin"><ReviewManage /></ProtectedRoute>} />
            <Route path="/admin/qna" element={<ProtectedRoute role="admin"><QnAManage /></ProtectedRoute>} />
            <Route path="/admin/student-view/:id" element={<ProtectedRoute role="admin"><AdminStudentView /></ProtectedRoute>} />
            <Route path="/admin/gamification" element={<ProtectedRoute role="admin"><GamificationManage /></ProtectedRoute>} />
            <Route path="/admin/sms" element={<ProtectedRoute role="admin"><SmsManage /></ProtectedRoute>} />
            <Route path="/admin/clinic" element={<ProtectedRoute role="admin"><ClinicManage /></ProtectedRoute>} />
            <Route path="/admin/schedules" element={<ProtectedRoute role="admin"><ScheduleManage /></ProtectedRoute>} />
            <Route path="/admin/hall-of-fame" element={<ProtectedRoute role="admin"><HallOfFameManage /></ProtectedRoute>} />
            <Route path="/admin/ta-schedule" element={<ProtectedRoute role="admin"><TAScheduleManage /></ProtectedRoute>} />
            <Route path="/admin/homework" element={<ProtectedRoute role="admin"><HomeworkManage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute role="admin"><ReportManage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AcademySettings /></ProtectedRoute>} />
            <Route path="/admin/settings/roles" element={<ProtectedRoute role="admin"><RolePermissions /></ProtectedRoute>} />
            <Route path="/admin/subscription" element={<ProtectedRoute role="admin"><SubscriptionPage /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><AttendanceManage /></ProtectedRoute>} />
            <Route path="/admin/tuition" element={<ProtectedRoute role="admin"><TuitionManage /></ProtectedRoute>} />
            <Route path="/admin/parents" element={<ProtectedRoute role="admin"><ParentManage /></ProtectedRoute>} />
            <Route path="/admin/consultations" element={<ProtectedRoute role="admin"><ConsultationLog /></ProtectedRoute>} />
            <Route path="/admin/leads" element={<ProtectedRoute role="admin"><LeadManage /></ProtectedRoute>} />
            <Route path="/admin/portfolios" element={<ProtectedRoute role="admin"><PortfolioManage /></ProtectedRoute>} />
            <Route path="/admin/sms-credits" element={<ProtectedRoute role="admin"><SmsCredits /></ProtectedRoute>} />
            <Route path="/admin/ai" element={<ProtectedRoute role="admin"><AIAssistant /></ProtectedRoute>} />
            <Route path="/admin/backup" element={<ProtectedRoute role="admin"><BackupManage /></ProtectedRoute>} />
            <Route path="/admin/backup-security" element={<ProtectedRoute role="admin"><BackupSecurity /></ProtectedRoute>} />
            <Route path="/admin/pre-registered" element={<ProtectedRoute role="admin"><PreRegistered /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute role="admin"><ProfileManage /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute role="admin"><ClassManage /></ProtectedRoute>} />
            <Route path="/admin/guide" element={<ProtectedRoute role="admin"><UserGuide /></ProtectedRoute>} />
            <Route path="/admin/automation" element={<ProtectedRoute role="admin"><AutomationManage /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute role="admin"><AuditLogs /></ProtectedRoute>} />
            <Route path="/admin/data-import" element={<ProtectedRoute role="admin"><DataImport /></ProtectedRoute>} />

            <Route path="/student" element={<ProtectedRoute role="student"><MyPage /></ProtectedRoute>} />
            <Route path="/student/notices" element={<ProtectedRoute role="student"><Notices /></ProtectedRoute>} />
            <Route path="/student/scores" element={<ProtectedRoute role="student"><ScoreView /></ProtectedRoute>} />
            <Route path="/student/materials" element={<ProtectedRoute role="student"><Materials /></ProtectedRoute>} />
            <Route path="/student/reviews" element={<ProtectedRoute role="student"><Reviews /></ProtectedRoute>} />
            <Route path="/student/qna" element={<ProtectedRoute role="student"><QnA /></ProtectedRoute>} />
            <Route path="/student/game" element={<ProtectedRoute role="student"><GameHub /></ProtectedRoute>} />
            <Route path="/student/quiz" element={<ProtectedRoute role="student"><VocabQuiz /></ProtectedRoute>} />
            <Route path="/student/knowledge-quiz" element={<ProtectedRoute role="student"><KnowledgeQuiz /></ProtectedRoute>} />
            <Route path="/student/reading-quiz" element={<ProtectedRoute role="student"><ReadingQuiz /></ProtectedRoute>} />
            <Route path="/student/ox-quiz" element={<ProtectedRoute role="student"><OXQuiz /></ProtectedRoute>} />
            <Route path="/student/rankings" element={<ProtectedRoute role="student"><Rankings /></ProtectedRoute>} />
            <Route path="/student/shop" element={<ProtectedRoute role="student"><Shop /></ProtectedRoute>} />
            <Route path="/student/avatar" element={<ProtectedRoute role="student"><AvatarCustomize /></ProtectedRoute>} />
            <Route path="/student/clinic" element={<ProtectedRoute role="student"><ClinicApply /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute role="student"><AttendanceCheck /></ProtectedRoute>} />
            <Route path="/student/portfolio" element={<ProtectedRoute role="student"><Portfolio /></ProtectedRoute>} />
            <Route path="/student/ai" element={<ProtectedRoute role="student"><AIHub /></ProtectedRoute>} />
            <Route path="/student/info" element={<ProtectedRoute role="student"><InfoHub /></ProtectedRoute>} />
            <Route path="/student/timer" element={<ProtectedRoute role="student"><StudyTimer /></ProtectedRoute>} />
            <Route path="/student/study-rankings" element={<ProtectedRoute role="student"><StudyRankings /></ProtectedRoute>} />

            <Route path="/parent/*" element={<ProtectedRoute role="parent"><ParentLayout /></ProtectedRoute>} />

            <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SuperDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/academies" element={<ProtectedRoute role="superadmin"><SuperDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/academy/new" element={<ProtectedRoute role="superadmin"><AcademyCreate /></ProtectedRoute>} />
            <Route path="/superadmin/academy/:id" element={<ProtectedRoute role="superadmin"><AcademyDetail /></ProtectedRoute>} />
            <Route path="/superadmin/promotions" element={<ProtectedRoute role="superadmin"><PromotionsPage /></ProtectedRoute>} />
            <Route path="/superadmin/revenue" element={<ProtectedRoute role="superadmin"><RevenuePage /></ProtectedRoute>} />
            <Route path="/superadmin/kpi" element={<ProtectedRoute role="superadmin"><KPIDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/usage" element={<ProtectedRoute role="superadmin"><UsageAnalytics /></ProtectedRoute>} />
            <Route path="/superadmin/backup-security" element={<ProtectedRoute role="superadmin"><SuperBackupSecurity /></ProtectedRoute>} />
            <Route path="/superadmin/business-info" element={<ProtectedRoute role="superadmin"><BusinessInfoEdit /></ProtectedRoute>} />
            <Route path="/superadmin/pricing" element={<ProtectedRoute role="superadmin"><PricingEdit /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
      </RouteErrorBoundary>
      </Suspense>
      </div>
    </div>
  );
}

export default App;
