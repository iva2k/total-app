#!/usr/bin/env bash
# shellcheck disable=SC2059

# Run "pnpm i && pnpm outdated" in all branches, starting with main.

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

DEBUG=0
# DEBUG=1

[ -z "$EPOCHREALTIME" ] && { echo "$0 needs bash>5.0(2019-01) for EPOCHREALTIME"; exit 1; }

STATE_FILE=".logs/.git-run-all.state.local"
STATE_FILE_BACKUP=".logs/.git-run-all.backup.local"

COMMAND_PREP=(pnpm install)
COMMAND=(pnpm outdated)
LOGFILE=".logs/log.outdated"

STOP_ON_ERROR=0

SOURCE_BRANCH="main"

export TARGET_BRANCHES=(
  "main"
  "storybook"
  "ui-bulma"
  "ui-carbon"
  "ui-flowbite"
  "ui-shoelace"
  "ui-svelteui"
  "ui-svelteux"
  "ui-tailwindcss"
)

SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"

function check_main_clean() {
  local main_branch="main"
  local res LOGFILE_MAIN
  LOGFILE_MAIN="$LOGFILE.$main_branch"

  echo "Checking for outdated packages in the main branch..." | tee -a "$LOGFILE"

  git checkout "$main_branch" 2>&1 | tee -a "$LOGFILE_MAIN"
  "${COMMAND_PREP[@]}" >>"$LOGFILE_MAIN" 2>&1 || { echo "Error preparing main branch."; return 1; }
  
  local outdated
  outdated=$("${COMMAND[@]}" 2>&1 | tee -a "$LOGFILE_MAIN"); res="$?"

  if [ "$res" -ne 0 ]; then
    echo "Outdated packages found in main branch:" | tee -a "$LOGFILE"
    echo "$outdated" | tee -a "$LOGFILE"
    return 1
  fi

  echo "Main branch is clean. Proceeding with other branches." | tee -a "$LOGFILE"
  return 0
}

function run_one_branch() {
  local branch="$1"
  local res LOGFILE_BRANCH
  LOGFILE_BRANCH="$LOGFILE.$branch"

  echo "${SEP2}$branch " | tee -a "$LOGFILE"

  git checkout "$branch" 2>&1 | tee -a "$LOGFILE_BRANCH"
  "${COMMAND_PREP[@]}" >>"$LOGFILE_BRANCH" 2>&1 || { echo "Error preparing branch $branch."; return 1; }
  
  local outdated
  outdated=$("${COMMAND[@]}" 2>&1 | tee -a "$LOGFILE_BRANCH"); res="$?"

  if [ "$res" -eq 0 ]; then
    echo "No outdated packages in branch $branch." | tee -a "$LOGFILE"
  else
    echo "Outdated packages found in branch $branch:" | tee -a "$LOGFILE"
    echo "$outdated" | tee -a "$LOGFILE"
  fi

  return "$res"
}

function run_all() {
  local res
  check_main_clean || return 1

  for branch in "${TARGET_BRANCHES[@]}"; do
    run_one_branch "$branch"; res="$?"

    if [ "$STOP_ON_ERROR" -ne 0 ] && [ "$res" -ne 0 ]; then
      echo "Stopping due to error in branch $branch." | tee -a "$LOGFILE"
      return "$res"
    fi
  done

  git checkout "$SOURCE_BRANCH" 2>&1 | tee -a "$LOGFILE"
}

function main() {
  mkdir -p "$(dirname "$LOGFILE")" >/dev/null
  echo "" >"$LOGFILE"  # Clear Previous Logfile

  run_all; res="$?"
  if [ "$res" -eq 0 ]; then
    echo "All branches processed successfully." | tee -a "$LOGFILE"
  else
    echo "Errors encountered during processing. Check log for details." | tee -a "$LOGFILE"
  fi
  return "$res"
}

(return 0 2>/dev/null) && sourced=1 || sourced=0
if [ "$sourced" -eq 0 ]; then
  main "$@"
fi
