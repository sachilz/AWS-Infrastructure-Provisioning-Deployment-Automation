#!/usr/bin/env bash
# ==============================================================================
# setup_local_env.sh
# Verifies that required local tools are installed on the Ubuntu control node.
# ==============================================================================

set -euo pipefail

echo "=========================================="
echo "Checking Local DevOps Environment Tools..."
echo "=========================================="

check_cmd() {
  local tool="$1"
  if command -v "$tool" >/dev/null 2>&1; then
    echo "[✓] $tool is installed: $($tool --version 2>&1 | head -n 1)"
  else
    echo "[✗] $tool is NOT installed. Please install it before proceeding."
  fi
}

check_cmd "git"
check_cmd "aws"
check_cmd "terraform"
check_cmd "ansible"
check_cmd "ssh"

echo "=========================================="
echo "Environment check completed."
echo "=========================================="
