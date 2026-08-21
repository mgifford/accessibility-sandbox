#!/usr/bin/env bash
set -euo pipefail

echo "Opening VoiceOver Utility and relevant privacy settings..."

# Open VoiceOver Utility where the AppleScript control checkbox lives.
open -a "VoiceOver Utility"

# Open System Settings privacy panes commonly needed for Guidepup.
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility" || true
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation" || true

echo ""
echo "In VoiceOver Utility:"
echo "1) Go to General"
echo "2) Enable 'Allow VoiceOver to be controlled with AppleScript'"
echo ""
echo "In System Settings -> Privacy & Security:"
echo "- Accessibility: allow your terminal app (iTerm2/VS Code)"
echo "- Automation: allow VoiceOver and System Events"
