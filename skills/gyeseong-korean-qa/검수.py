# -*- coding: utf-8 -*-
"""계성고 국어 자료 검수기 — 학년 혼입 · 인용 · 무결성 · 오타 후보 점검.
사용:  python3 검수.py [파일...]      (생략 시 현재 폴더의 build*.js 자동 검사)
학년은 파일 내용(1학년/공통국어1 · 2학년/문학)으로 자동 판별한다."""
import sys, os, glob, subprocess

G1_ONLY = ["어부단가","만흥","오륜가","저곡전가팔곡","강호사시가","도산십이곡","고산구곡가",
  "훈민가","단심가","하여가","상춘곡","사미인곡","속미인곡","관동별곡","성산별곡","누항사",
  "규원가","농가월령가","내가 사랑하는 사람","슬픔이 기쁨에게","수선화에게","선우사",
  "사건의 지평선","가난한 사랑 노래","저문 강에 삽을 씻고","동짓달 기나긴"]
G2_ONLY = ["참회록","서시","별 헤는 밤","고궁을 나오면서","누가 하늘을 보았다","통영 오광대",
  "봉산탈춤","주옹설","공방전","국순전","국선생전","죽부인전","엄마의 말뚝","부용전"]
# '길'(김소월)·'회고가'·'십자가'처럼 짧거나 일반 단어와 겹치는 제목은 오탐이 많아 목록에서 뺀다
ALLOW = ["어부사시사","어부가"]        # 2학년 중간고사 실제 사례(허용)
# 문어체 문서라 아래 종결형은 '원문 인용/문법 예시'가 아니면 오류 후보
TONE = ["습니다","세요","십시오"]
TONE_OK = ["여보세요","하십시오체","나오셨습니다","버리었습니다","가십니다","가십니까",
  "가십시오","갑니다","갑니까","합니다체","가나이다","하나이다"]

def grade(t):
    if "공통국어1" in t or "1학년" in t: return 1
    if "문학 연계" in t or "2학년" in t: return 2
    return 0

def check(path):
    print(f"\n── {path}")
    raw = open(path,"rb").read()
    txt = raw.decode("utf-8","replace")
    lines = txt.splitlines()
    g = grade(txt); print(f"   학년 판별: {g or '?'}학년")
    banned = G2_ONLY if g==1 else (G1_ONLY if g==2 else [])
    bad=0
    for i,l in enumerate(lines,1):
        if any(a in l for a in ALLOW): continue
        for w in banned:
            if w in l:
                print(f"   ⚠ 학년혼입 {i}행 '{w}': {l.strip()[:64]}"); bad+=1
    # 무결성
    nul = raw.count(b"\x00")
    syn = subprocess.run(["node","-c",path],capture_output=True).returncode==0 if path.endswith(".js") else True
    if nul: print(f"   ⚠ 널바이트 {nul}개"); bad+=1
    if not syn: print("   ⚠ 구문 오류(node -c 실패)"); bad+=1
    # 톤/오타 후보(정보성)
    review=[]
    for i,l in enumerate(lines,1):
        if any(t in l for t in TONE) and not any(ok in l for ok in TONE_OK):
            review.append((i,"톤(습니다/세요)",l))
        if l.count("「")!=l.count("」"): review.append((i,"「」 짝 불일치",l))
    for i,tag,l in review[:40]:
        print(f"   · 검토 {i}행 [{tag}]: {l.strip()[:60]}")
    print(f"   → {'문제 없음 ✓' if bad==0 else f'학년/무결성 문제 {bad}건 ⚠'}"
          f"{' · 검토후보 '+str(len(review))+'건' if review else ''}")
    return bad==0

files = sys.argv[1:] or [f for f in ("build6.js","build7.js") if os.path.exists(f)] or sorted(glob.glob("build*.js"))
if not files:
    print("검사할 파일 없음"); sys.exit(0)
print("="*58,"\n계성고 국어 자료 검수\n","="*58)
ok = all([check(f) for f in files])
print("\n"+"="*58+f"\n종합: {'통과 ✓' if ok else '검토 필요 ⚠'}")
sys.exit(0 if ok else 1)
