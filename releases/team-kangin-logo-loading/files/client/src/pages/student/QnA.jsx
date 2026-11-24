import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, apiUpload, authFileUrl } from '../../api';
import BottomTabBar from '../../components/BottomTabBar';
import { useTenantConfig } from '../../contexts/TenantContext';
import { toast } from '../../lib/feedback';

// 간단한 마크다운 볼드(**text**) 처리
function renderAnswer(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function QnA() {
  const { config } = useTenantConfig();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [waitingAnswer, setWaitingAnswer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  const loadQuestions = useCallback(() => {
    return api('/questions/my').then(data => {
      setQuestions(data);
      return data;
    }).catch(err => {
      console.error('질문 로드 오류:', err);
      return null;
    });
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // 스크롤 - questions나 waitingAnswer 변경 시 하단으로
  useEffect(() => {
    requestAnimationFrame(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    });
  }, [questions, waitingAnswer]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast('이미지 크기는 10MB 이하만 가능해요.');
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 답변 올 때까지 질문 목록 주기적 새로고침
  const startAnswerPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const data = await api('/questions/my');
        setQuestions(data);
        // 가장 최근 질문에 답변이 있으면 폴링 중지
        if (data.length > 0 && data[0].answer) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setWaitingAnswer(false);
        }
      } catch {
        // 에러 무시, 계속 시도
      }
      if (attempts >= 20) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setWaitingAnswer(false);
      }
    }, 3000);
  }, []);

  const submitQuestion = async () => {
    if ((!newQuestion.trim() && !selectedImage) || sending) return;
    const questionText = newQuestion.trim();
    const currentImage = imagePreview;

    // 1. 입력창 즉시 초기화
    setSending(true);
    setNewQuestion('');

    // 2. 질문을 questions 배열에 바로 추가 (optimistic update)
    const tempQuestion = {
      id: 'temp-' + Date.now(),
      question: questionText,
      image: currentImage,
      answer: null,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    setQuestions(prev => [tempQuestion, ...prev]);
    setWaitingAnswer(true);

    // 3. 서버에 전송
    try {
      const formData = new FormData();
      formData.append('question', questionText);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      removeImage();

      await apiUpload('/questions', formData);

      // 4. 전송 성공 → 목록 새로고침 (서버 데이터로 교체)
      await loadQuestions();

      // 5. 답변 폴링 시작
      startAnswerPolling();

    } catch (err) {
      console.error('질문 전송 오류:', err);
      // 실패해도 temp 질문은 유지됨 (이미 questions에 추가됨)
      // 5초 후 서버에서 질문 확인 (실패해도 DB에 저장되었을 수 있음)
      setTimeout(async () => {
        await loadQuestions();
        startAnswerPolling();
      }, 5000);
    }
    setSending(false);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
          toast('이미지 크기는 10MB 이하만 가능해요.');
          return;
        }
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // 시간순 정렬 (오래된 것 위, 최신 아래) - questions는 DESC이므로 reverse
  const displayQuestions = [...questions].reverse();

  return (
    <div className="content s-page" style={{ paddingBottom: 96, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      <div className="breadcrumb" style={{ flexShrink: 0 }}><Link to="/student">홈</Link> &gt; <span>질문하기</span></div>

      {/* 채팅 스크롤 영역 */}
      <div
        ref={chatRef}
        className="chat-scroll-area"
        style={{
          flex: 1, overflowY: 'auto', padding: '0 0 12px 0',
          scrollBehavior: 'smooth',
        }}
      >
        {/* 인사말 (항상 맨 위) */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 16, padding: '12px 0'
        }}>
          <img
            src="/icons/icon-192.png"
            alt="팀 강인"
            style={{
              width: 40, height: 40, borderRadius: '12px',
              objectFit: 'cover', flexShrink: 0,
              background: '#0B1933',
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
              {config.academyName || '팀 강인'}
            </div>
            <div style={{
              background: 'var(--muted)',
              padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
              fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap'
            }}>
              {`안녕하세요 ${config.academyName || '팀 강인'} 선생님입니다.\n관련된 모든 질문들을 편하게 물어보세요.\n문제에 대한 질문은 '지문'과 '문제'를 모두 입력해주셔야 합니다.\n사진 캡처할 경우에는 잘 보이도록 찍어서 올려주세요.`}
            </div>
          </div>
        </div>

        {displayQuestions.map((q) => (
          <div key={q.id} style={{ marginBottom: 16 }}>
            {/* 질문 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <div style={{
                background: 'var(--primary)', color: 'white',
                padding: '10px 14px', borderRadius: '16px 16px 4px 16px',
                maxWidth: '80%', fontSize: 14, lineHeight: 1.6,
                wordBreak: 'break-word'
              }}>
                {q.image && (
                  <img
                    src={authFileUrl(q.image)}
                    alt="첨부"
                    style={{
                      maxWidth: '100%', maxHeight: 200, borderRadius: 6,
                      marginBottom: q.question ? 8 : 0, display: 'block'
                    }}
                  />
                )}
                {q.question}
                <div style={{ fontSize: 10, opacity: 0.7, textAlign: 'right', marginTop: 4 }}>
                  {formatDate(q.created_at)}
                </div>
              </div>
            </div>

            {/* 답변 */}
            {q.answer ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <img
                  src="/icons/icon-192.png"
                  alt="팀 강인"
                  style={{
                    width: 36, height: 36, borderRadius: '10px',
                    objectFit: 'cover', flexShrink: 0,
                    background: '#0B1933',
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', marginBottom: 3 }}>
                    {config.academyName || '팀 강인'}
                  </div>
                  <div style={{
                    background: 'var(--muted)',
                    padding: '10px 14px', borderRadius: '4px 16px 16px 16px',
                    maxWidth: '100%', fontSize: 14, lineHeight: 1.7,
                    wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                  }}>
                    {renderAnswer(q.answer)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 3, marginLeft: 2 }}>
                    {formatDate(q.answered_at)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <img
                  src="/icons/icon-192.png"
                  alt="팀 강인"
                  style={{
                    width: 36, height: 36, borderRadius: '10px',
                    objectFit: 'cover', flexShrink: 0,
                    background: '#0B1933',
                  }}
                />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', marginBottom: 3 }}>
                    {config.academyName || '선생님'}
                  </div>
                  <div style={{
                    background: 'var(--muted)', padding: '12px 18px',
                    borderRadius: '4px 16px 16px 16px',
                    display: 'inline-block'
                  }}>
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

      </div>

      {/* 하단 입력 영역 (고정) */}
      <div style={{
        flexShrink: 0, background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        padding: '10px 0 10px 0',
      }}>
        {/* 이미지 미리보기 */}
        {imagePreview && (
          <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
            <img
              src={imagePreview}
              alt="첨부 이미지"
              style={{
                maxWidth: 120, maxHeight: 80, borderRadius: 6,
                border: '1px solid var(--border)', objectFit: 'contain'
              }}
            />
            <button
              onClick={removeImage}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--destructive)', color: 'white', border: 'none',
                cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >×</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 44, minWidth: 40, background: 'var(--muted)',
              border: '1px solid var(--border)', borderRadius: 8,
              cursor: 'pointer', fontSize: 18, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: selectedImage ? 'var(--primary)' : 'var(--muted-foreground)'
            }}
            title="이미지 첨부"
          >📷</button>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="질문을 입력하세요..."
            style={{
              flex: 1, minHeight: 44, maxHeight: 100,
              resize: 'none', fontSize: 14, padding: '10px 12px',
              borderRadius: 8
            }}
          />
          <button
            className="btn btn-primary"
            onClick={submitQuestion}
            disabled={sending || (!newQuestion.trim() && !selectedImage)}
            style={{ height: 44, minWidth: 56, fontSize: 14 }}
          >
            {sending ? '⏳' : '전송'}
          </button>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}
