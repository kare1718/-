# -*- coding: utf-8 -*-
"""국어 내신 자료 검수기 — 학년 혼입 · 무결성 · 문어체 톤 점검 (학교 무관 공통 기준).
사용:  python3 검수.py [--학교 이름] [파일...]    (파일 생략 시 현재 폴더의 build*.js 자동 검사)
학교·학년은 파일 내용으로 자동 판별한다. 배정표 상세·출처 주의 목록은 references/<학교>.md 참조."""
import sys, os, glob, subprocess

# ── 학교별 배정표 (references/<학교>.md와 반드시 함께 고칠 것) ──
SCHOOLS = {
  "계성고": {
    "마커": ["계성"],  # 파일 내용에서 학교를 판별하는 문자열
    "학년마커": {1: ["공통국어1","1학년"], 2: ["문학 연계","2학년"]},
    "작품": {
      1: ["어부단가","만흥","오륜가","저곡전가팔곡","강호사시가","도산십이곡","고산구곡가",
          "훈민가","단심가","하여가","상춘곡","사미인곡","속미인곡","관동별곡","성산별곡","누항사",
          "규원가","농가월령가","내가 사랑하는 사람","슬픔이 기쁨에게","수선화에게","선우사",
          "사건의 지평선","가난한 사랑 노래","저문 강에 삽을 씻고","동짓달 기나긴"],
      2: ["참회록","서시","별 헤는 밤","고궁을 나오면서","누가 하늘을 보았다","통영 오광대",
          "봉산탈춤","주옹설","공방전","국순전","국선생전","죽부인전","엄마의 말뚝","부용전"],
    },
    "허용": ["어부사시사","어부가"],  # 학년 무관 허용(2학년 중간고사 실제 사례)
  },
}
# '길'(김소월)·'회고가'·'십자가'처럼 짧거나 일반 단어와 겹치는 제목은 오탐이 많아 목록에서 뺀다

# ── 공통 기준: 문어체 톤(모든 학교 동일) ──
TONE = ["습니다","세요","십시오"]
TONE_OK = ["여보세요","하십시오체","나오셨습니다","버리었습니다","가십니다","가십니까",
  "가십시오","갑니다","갑니까","합니다체","가나이다","하나이다"]

def detect_school(t):
    hits = [n for n,s in SCHOOLS.items() if any(m in t for m in s["마커"])]
    if len(hits)==1: return hits[0]
    if not hits and len(SCHOOLS)==1: return next(iter(SCHOOLS))  # 등록 학교가 하나면 그 학교로 간주
    return None

def detect_grade(t, school):
    for g, marks in SCHOOLS[school]["학년마커"].items():
        if any(m in t for m in marks): return g
    return 0

def check(path, force_school=None):
    print(f"\n── {path}")
    raw = open(path,"rb").read()
    txt = raw.decode("utf-8","replace")
    lines = txt.splitlines()
    bad=0
    school = force_school or detect_school(txt)
    if school:
        g = detect_grade(txt, school)
        print(f"   판별: {school} · {g or '?'}학년")
        cfg = SCHOOLS[school]
        banned = [(w,og) for og,ws in cfg["작품"].items() if og!=g for w in ws] if g else []
        allow = cfg.get("허용",[])
        for i,l in enumerate(lines,1):
            if any(a in l for a in allow): continue
            for w,og in banned:
                if w in l:
                    print(f"   ⚠ 학년혼입 {i}행 '{w}'({og}학년 작품): {l.strip()[:60]}"); bad+=1
        if not g: print("   · 학년 판별 실패 — 혼입 검사 건너뜀(파일에 학년·과목 표기 필요)")
    else:
        print("   판별: 학교 미상 — 혼입 검사 건너뜀(--학교 이름 지정 또는 SCHOOLS 마커 확인)")
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

args = sys.argv[1:]
force = None
if "--학교" in args:
    i = args.index("--학교")
    if i+1 >= len(args): sys.exit("--학교 뒤에 학교 이름을 적어야 한다")
    force = args[i+1]; del args[i:i+2]
    if force not in SCHOOLS: sys.exit(f"등록되지 않은 학교: {force} (등록: {', '.join(SCHOOLS)})")
files = args or [f for f in ("build6.js","build7.js") if os.path.exists(f)] or sorted(glob.glob("build*.js"))
if not files:
    print("검사할 파일 없음"); sys.exit(0)
print("="*58,"\n국어 내신 자료 검수\n","="*58)
ok = all([check(f, force) for f in files])
print("\n"+"="*58+f"\n종합: {'통과 ✓' if ok else '검토 필요 ⚠'}")
sys.exit(0 if ok else 1)
