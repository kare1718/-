#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-}"
if [ -z "$TARGET_DIR" ]; then
  echo "사용법: bash apply.sh <my-teaching-assistant 경로>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PATCH_FILE="$SCRIPT_DIR/0001-team-kangin-logo-loading.patch"

if git -C "$TARGET_DIR" apply --check "$PATCH_FILE" 2>/dev/null; then
  git -C "$TARGET_DIR" apply "$PATCH_FILE"
  echo "✅ 패치 적용 완료 (23개 파일): $TARGET_DIR"
else
  cp -R "$SCRIPT_DIR/files/." "$TARGET_DIR/"
  echo "✅ 최신 브랜치 차이로 인해 파일 직접 덮어쓰기로 적용 완료 (23개 파일): $TARGET_DIR"
fi

echo "다음 단계: $TARGET_DIR/client 에서 npm run build 후 커밋·배포하세요."
