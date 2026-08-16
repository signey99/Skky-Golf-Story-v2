#!/bin/bash

# ==============================================================================
# SKKY Golf 2026 - GitHub Sync Script
# ==============================================================================
# 이 스크립트는 AI Studio 개발 환경에서 수정된 소스 코드를 사용자의 깃허브 레포지토리
# (sigey99/Skky-Golf-Story-v2)로 강제 동기화(Push)하여 Vercel에 실시간 배포되도록 합니다.
# ==============================================================================

# 1. 환경 변수 확인 (Secrets 메뉴 또는 .env 파일에서 로드)
if [ -f .env ]; then
    echo "🔑 .env 파일에서 환경 변수를 로드합니다..."
    export $(grep -v '^#' .env | xargs)
fi

USERNAME="${GITHUB_USERNAME}"
TOKEN="${GITHUB_TOKEN}"
REPO_NAME="Skky-Golf-Story-v2"
USER_EMAIL="${USER_EMAIL:-signey99@gmail.com}"

# 환경 변수가 비어있는 경우 터미널 인자에서 읽거나 입력을 유도합니다.
if [ -z "$USERNAME" ] || [ -z "$TOKEN" ]; then
    echo "⚠️  경고: GITHUB_USERNAME 또는 GITHUB_TOKEN 환경 변수가 설정되지 않았습니다."
    echo "AI Studio의 'Secrets' 또는 'Variables' 탭에서 다음 값을 등록해 주세요:"
    echo "  - GITHUB_USERNAME: 사용자의 GitHub ID (예: signey99)"
    echo "  - GITHUB_TOKEN: GitHub에서 발급받은 Personal Access Token (PAT)"
    echo ""
    echo "임시로 직접 입력하여 실행할 수도 있습니다:"
    read -p "GitHub 사용자 이름 (ID): " INPUT_USER
    read -sp "GitHub 토큰 (Personal Access Token): " INPUT_TOKEN
    echo ""
    USERNAME="${INPUT_USER:-$USERNAME}"
    TOKEN="${INPUT_TOKEN:-$TOKEN}"
fi

if [ -z "$USERNAME" ] || [ -z "$TOKEN" ]; then
    echo "❌ 에러: 사용자 이름과 토큰이 필요합니다. 동기화를 취소합니다."
    exit 1
fi

echo "🔄 깃허브 동기화 작업을 시작합니다..."

# 2. Git 저장소 초기화 및 설정
if [ ! -d ".git" ]; then
    echo "📁 Git 저장소를 초기화합니다..."
    git init
fi

# Git 사용자 설정 (커밋용)
git config user.name "$USERNAME"
git config user.email "$USER_EMAIL"

# 3. 원격(Remote) 저장소 주소 설정
REMOTE_URL="https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/${REPO_NAME}.git"

# 기존 origin이 있으면 삭제하고 재설정
git remote remove origin 2>/dev/null
git remote add origin "$REMOTE_URL"

# 4. 브랜치 설정 및 커밋
echo "📝 변경 사항을 추가하고 커밋을 생성합니다..."

# 먼저 모든 파일을 추가합니다 (로고 이미지 포함)
git add .

# main 브랜치 생성 및 전환
git checkout -B main 2>/dev/null || git checkout -b main 2>/dev/null || true

# 변경 사항이 있는지 확인 후 커밋 (HEAD가 존재하지 않는 신규 저장소 대응)
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    if git diff-index --quiet HEAD --; then
        echo "ℹ️  새로운 변경 사항이 없습니다. 강제로 최신 버전을 푸시합니다."
        # 빈 커밋 생성하여 푸시 트리거
        git commit --allow-empty -m "Trigger deployment update from AI Studio [$(date +'%Y-%m-%d %H:%M:%S')]"
    else
        git commit -m "Update from AI Studio [$(date +'%Y-%m-%d %H:%M:%S')]"
    fi
else
    git commit -m "Initial commit from AI Studio [$(date +'%Y-%m-%d %H:%M:%S')]"
fi

# 5. 깃허브로 푸시 (Vercel 자동 빌드 및 실시간 배포 트리거)
echo "🚀 깃허브 저장소(${USERNAME}/${REPO_NAME})의 main 브랜치로 푸시합니다..."
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo "✅ 성공: 코드가 깃허브에 완벽하게 동기화되었습니다!"
    echo "Vercel 대시보드(https://vercel.com)에서 실시간 빌드 및 배포가 진행됩니다."
    echo "몇 초 내에 https://skky-golf-story-v2.vercel.app 에 반영됩니다."
else
    echo "❌ 실패: 깃허브로 코드를 푸시하는 도중 에러가 발생했습니다."
    echo "GitHub ID와 토큰(Repo 권한 포함 필수)이 올바른지 다시 확인해 주세요."
    exit 1
fi
