#!/usr/bin/env bash
set -euo pipefail

# Usage examples:
#   npm run test:all
#   HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:all:headed
#   SKIP_VOICEOVER=1 npm run test:all
#   OPEN_VOICEOVER_SETUP_UI=1 npm run test:all

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

HEADED="${HEADED:-1}"
SKIP_VOICEOVER="${SKIP_VOICEOVER:-0}"
SKIP_ELEMENTS="${SKIP_ELEMENTS:-0}"
SKIP_VALIDATE="${SKIP_VALIDATE:-0}"

echo "Running full accessibility suite"
echo "Repo: $ROOT_DIR"
echo "HEADED=$HEADED SKIP_VALIDATE=$SKIP_VALIDATE SKIP_ELEMENTS=$SKIP_ELEMENTS SKIP_VOICEOVER=$SKIP_VOICEOVER"
if [[ -n "${HIDDEN_TEST_URL:-}" ]]; then
  echo "HIDDEN_TEST_URL=$HIDDEN_TEST_URL"
fi
echo

run_cmd() {
  echo "> $*"
  "$@"
  echo
}

if [[ "$SKIP_VALIDATE" != "1" ]]; then
  run_cmd npm run test:validate
fi

if [[ "$SKIP_ELEMENTS" != "1" ]]; then
  if [[ "$HEADED" == "1" ]]; then
    run_cmd npm run test:elements:headed
  else
    run_cmd npm run test:elements
  fi
  run_cmd npm run test:elements:summary
fi

if [[ "$SKIP_VOICEOVER" != "1" ]]; then
  if [[ "${OPEN_VOICEOVER_SETUP_UI:-0}" == "1" ]]; then
    run_cmd npm run setup:voiceover:open-ui
  fi
  run_cmd npm run test:voiceover:diagnose
  if [[ "$HEADED" == "1" ]]; then
    run_cmd npm run test:voiceover:preflight:headed
    run_cmd npm run test:voiceover:headed:long
  else
    run_cmd npm run test:voiceover:preflight
    run_cmd npm run test:voiceover
  fi
fi

echo "All selected tests completed."
