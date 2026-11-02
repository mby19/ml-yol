#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="$(git -C "$ROOT" remote get-url origin)"
REPO="$(basename -s .git "$REMOTE")"
OWNER="$(printf '%s' "$REMOTE" | sed -E 's#(git@github.com:|https://github.com/)##; s#/.*##')"

BASE_PATH="${BASE_PATH:-/$REPO}"
SITE_URL="${SITE_URL:-https://${OWNER}.github.io/${REPO}}"

echo "Derleniyor: BASE_PATH=$BASE_PATH SITE_URL=$SITE_URL"
(
  cd "$ROOT"
  BASE_PATH="$BASE_PATH" SITE_URL="$SITE_URL" npm run build
)

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R "$ROOT/dist/." "$TMP/"

NAME="$(git -C "$ROOT" config user.name || true)"
EMAIL="$(git -C "$ROOT" config user.email || true)"
NAME="${NAME:-ml-yol}"
EMAIL="${EMAIL:-ml-yol@users.noreply.github.com}"

(
  cd "$TMP"
  git init -q -b gh-pages
  git add -A
  git -c user.name="$NAME" -c user.email="$EMAIL" commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git remote add origin "$REMOTE"
  git push -f origin gh-pages
)

echo "Yayınlandı: $SITE_URL"
