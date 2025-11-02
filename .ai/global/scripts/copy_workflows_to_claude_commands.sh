#!/bin/bash

# Script to copy workflow files to .claude/commands/
# This allows workflows to be used as slash commands in Claude Code

set -e

# Get the project root directory (assuming script is in .ai/global/scripts/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Source and destination directories
GLOBAL_WORKFLOWS_DIR="${PROJECT_ROOT}/.ai/global/workflows"
PROJECT_WORKFLOWS_DIR="${PROJECT_ROOT}/.ai/project/workflows"
COMMANDS_DIR="${PROJECT_ROOT}/.claude/commands"

# Ensure destination directory exists
mkdir -p "${COMMANDS_DIR}"

# Function to copy workflows from a directory
copy_workflows() {
  local source_dir="$1"

  if [ ! -d "${source_dir}" ]; then
    echo "Warning: Directory ${source_dir} does not exist, skipping..."
    return
  fi

  # Copy all .md files from the source directory
  if ls "${source_dir}"/*.md 1> /dev/null 2>&1; then
    for file in "${source_dir}"/*.md; do
      local filename=$(basename "${file}")
      cp "${file}" "${COMMANDS_DIR}/${filename}"
      echo "Copied: ${filename}"
    done
  else
    echo "No .md files found in ${source_dir}"
  fi
}

echo "Copying workflow files to .claude/commands/..."
echo ""

# Copy from global workflows
echo "Processing global workflows:"
copy_workflows "${GLOBAL_WORKFLOWS_DIR}"
echo ""

# Copy from project workflows
echo "Processing project workflows:"
copy_workflows "${PROJECT_WORKFLOWS_DIR}"
echo ""

echo "✓ Workflow copy complete!"
