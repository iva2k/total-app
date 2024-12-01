#!/usr/bin/env bash
# shellcheck disable=SC2059

# Run "pnpm i && pnpm outdated" in all branches, starting with main, and report list of outdated packages.

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

DEBUG=0
# DEBUG=1

[ -z "$EPOCHREALTIME" ] && { echo "$0 needs bash>5.0(2019-01) for EPOCHREALTIME"; exit 1; }

#COMMAND_PREP=(pnpm install)
COMMAND_PREP=(pnpm install --lockfile-only)
COMMAND=(pnpm outdated --format list)
# COMMAND=(pnpm outdated --format list --compatible) ;# TODO: (when needed) Implement args to check pinned vs. compatible
COMMAND_POST=(git reset --hard)
LOGFILE=".logs/log.outdated"
# Attention!                ^- If changing LOGFILE and quote is past this mark, then adjust FORMAT in print_summary()

STOP_ON_ERROR=0

MAIN_BRANCH="main"

export TARGET_BRANCHES=(
  "storybook"
  "ui-bulma"
  "ui-carbon"
  "ui-flowbite"
  "ui-shoelace"
  "ui-svelteui"
  "ui-svelteux"
  "ui-tailwindcss"
  "histoire"
  "ui-agnostic"
  "ui-bootstrap"
  "ui-framework7"
  "ui-konsta"
  # Attention!    ^-- if adding a branch name and quote is past this mark, (longer than 15), adjust FORMAT in print_summary()
)

# Few Level Heading Separators for Nice Log (carriage return at the end allows
#  echo "${SEP2}SOME HEADER " to print ---> "SOME HEADER ###########")
SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"
# SEP3="$(printf "%100s\r" "" | tr ' ' '-')"

declare -A BRANCH_OUTDATED_PACKAGES

function exit_save_state() {
  local rc="$1"
  # save_state
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: exit_save_state($rc)."
  exit $((rc))
}

function retry_it() {
  # Function to retry a command
  local max_retries="$1"
  local command_name="$2"
  shift 2
  local command_args=("$@")

  # Check if file descriptor 3 is open, if not, redirect it to stderr
  if ! { true >&3; } 2>/dev/null; then
    exec 3>&2
  fi
    
  local rc
  local retry_count=0

  while true; do
      # Call the function with its arguments
      $command_name "${command_args[@]}"; rc="$?"

      if [ $rc -eq 0 ]; then
          return 0
      fi

      retry_count=$((retry_count + 1))
      if [ "$retry_count" -ge "$max_retries" ]; then
        echo "Command $command_name error code $rc, tried $max_retries times, giving up." >&3
        break
      fi
      echo "Command $command_name error code $rc, try $retry_count of $max_retries" >&3
  done

  # If we reach here, all retries failed
  return "$rc"
}

function time_it() {
  # Function to execute and time another function
  # Captures start time, executes $2 with the rest args, captures end time, calculates time difference into st_times[$1]
  # If function $2 returns non-0 code, exits with that code.
  # Args:
  local i="$1"
  local func_name="$2"
  shift 2  # Remove the first two arguments, leaving only the function arguments

  local res t t_real TIMESTART TIMEEND TIMEDIFF
  # For measuring time, Since bash 5.0 (2019) use EPOCHREALTIME:
  # remove the decimal separator (s → µs), remove last 3 digits (µs → ms)
  t=${EPOCHREALTIME/[^0-9]/}; TIMESTART=${t%???}
  "$func_name" "$@"; res="$?"
  if [ "$res" -ne 0 ]; then
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: '$func_name' exited with status $res" >&2
    exit "$res"
  fi
  t=${EPOCHREALTIME/[^0-9]/}; TIMEEND=${t%???}

  TIMEDIFF=$(( TIMEEND < TIMESTART ? TIMEEND - TIMESTART + 1000000000 : TIMEEND - TIMESTART ))
  t_real=$(printf "%s.%s" $(( TIMEDIFF / 1000 )) $(( TIMEDIFF % 1000 )))
  st_times[i]="$t_real"

  [ "$DEBUG" -ne 0 ] && echo "DEBUG: time_it() func=$func_name status=$res TIMESTART=$TIMESTART TIMEEND=$TIMEEND TIMEDIFF=$TIMEDIFF t_real=$t_real st_times[$i]=${st_times[i]}"
  # [ "$DEBUG" -ne 0 ] && echo "DEBUG: time_it() func=$func_name status=$res real=$t_real user=$t_user system=$t_system st_times[$i]=${st_times[i]}"

  return $res
}

function parse_outdated() {
  local outdated="$1"
  local branch="$2"

  local parsed=""
  local line

  # Parse each line of the outdated list
  while IFS= read -r line; do
    # Expected format: packageName current latest
    # Example: svelte 3.44.0 3.49.0
    if [[ $line =~ ([^[:space:]]+)[[:space:]]+([^[:space:]]+)[[:space:]]+([^[:space:]]+) ]]; then
      local name="${BASH_REMATCH[1]}"
      local current="${BASH_REMATCH[2]}"
      local latest="${BASH_REMATCH[3]}"
      parsed+="$name (current: $current, latest: $latest)\n"
    fi
  done <<< "$outdated"

  # Save parsed data for summary
  BRANCH_OUTDATED_PACKAGES["$branch"]="$parsed"
}

function print_summary() {
  echo "${SEP1}All Branches With Outdated Packages " | tee -a "$LOGFILE"

  if [ ${#BRANCH_OUTDATED_PACKAGES[@]} -eq 0 ]; then
    echo "  All branches are up to date." | tee -a "$LOGFILE"
  else
    for branch in "${!BRANCH_OUTDATED_PACKAGES[@]}"; do
      echo "Branch: $branch" | tee -a "$LOGFILE"
      if [ -n "${BRANCH_OUTDATED_PACKAGES[$branch]}" ]; then
        echo -e "${BRANCH_OUTDATED_PACKAGES[$branch]}" | tee -a "$LOGFILE"
      else
        echo "  All packages are up to date" | tee -a "$LOGFILE"
      fi
      echo | tee -a "$LOGFILE"
    done
  fi

  echo | tee -a "$LOGFILE"
  echo "DONE command \"${COMMAND[*]}\"" | tee -a "$LOGFILE"
  echo | tee -a "$LOGFILE"
}

function run_one() {
  local TARGET_BRANCH="$1"

  local res LOGFILE_I outdated
  LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
  # Attention! If changing LOGFILE_I and quote is past this mark  ^ , then adjust FORMAT in print_summary()

  mkdir -p "$(dirname "$LOGFILE_I")" >/dev/null
  touch "$LOGFILE_I"

  echo "${SEP2}$TARGET_BRANCH " | tee -a "$LOGFILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: run_one() TARGET_BRANCH=$TARGET_BRANCH LOGFILE_I=$LOGFILE_I"

  # Switch to the target branch
  echo "CHECKOUT $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  git checkout "$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="$?"
  # git checkout "$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in checkout to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
    exit_save_state "$res"
  fi

  # Pull the target branch
  echo "PULL $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  # There are sporadic fails in `git pull` (due to background `git fetch`), retry few times
  retry_it 3 git pull 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="$?"
  # git pull 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res pulling \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
    exit_save_state "$res"
  fi

  echo "PREP $TARGET_BRANCH - ${COMMAND_PREP[*]}" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  # "${COMMAND_PREP[@]}" >>"$LOGFILE_I" 2>&1; res="$?"
  "${COMMAND_PREP[@]}" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    output=$(grep -i "error" "$LOGFILE_I" | tail -n1)
    if [ $STOP_ON_ERROR -ne 0 ]; then
      echo "PREP ERROR $res in branch \"$TARGET_BRANCH\", stopping." | tee -a "$LOGFILE"
      return
    else
      echo "PREP ERROR $res in branch \"$TARGET_BRANCH\", cleaning up and continuing." | (tee -a "$LOGFILE" >&2)
      # git reset --hard "origin/$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="$?"
      git reset --hard "origin/$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
      if [ "$res" -ne 0 ] ; then
        echo "Error $res in checkout to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
        exit_save_state "$res"
      fi
    fi
  fi

  echo "BEGIN command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"

  # Run command
  outdated=$("${COMMAND[@]}" 2>&1 | tee -a "$LOGFILE_I"); res="$?"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: res=$res"
  if [ "$res" -eq 0 ]; then
    echo "No outdated packages in branch $TARGET_BRANCH." | tee -a "$LOGFILE"
  else
    echo "Outdated packages found in branch $TARGET_BRANCH:" | tee -a "$LOGFILE"
    echo "$outdated" | tee -a "$LOGFILE"
    parse_outdated "$outdated" "$TARGET_BRANCH"
  fi

  echo "POST command \"${COMMAND_POST[*]}\" in branch $TARGET_BRANCH..." | tee -a "$LOGFILE"
  "${COMMAND_POST[@]}" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="$?"
  [ "$res" -ne 0 ] && { echo "Error in post command for branch $TARGET_BRANCH." | tee -a "$LOGFILE"; return "$res"; }

  # echo "DONE  command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\", run time=${real}s result=$res" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo "DONE  command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\", result=$rez" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"

  return "$res"
}

function run_all() {
  local res

  # Check that local repo is clean
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: run_all()"
  if ! output=$(git status --untracked-files=no --porcelain 2>&1) || [ -n "$output" ]; then
    # Working directory clean excluding untracked files
    echo >&2
    echo "Working folder is not clean. Please clean working folder and retry." >&2
    echo "$output" >&2
    exit_save_state 1
  else 
    echo "Working folder is clean." | tee -a "$LOGFILE"
  fi

  # Fetch the latest changes from the remote repository
  echo "Fetching latest changes..." | tee -a "$LOGFILE"
  git fetch origin >>"$LOGFILE" 2>&1; res="$?"
  # git fetch origin 2>&1 | tee -a "$LOGFILE"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in git fetch." | tee -a "$LOGFILE"
    exit_save_state "$res"
  fi

  # Main branch is special: if it has outdated packages, do not process TARGET_BRANCHES.
  run_one "$MAIN_BRANCH" || return 1

  # Loop through each target branch and execute one
  for branch in "${TARGET_BRANCHES[@]}"; do
    run_one "$branch"; res="$?"

    if [ "$STOP_ON_ERROR" -ne 0 ] && [ "$res" -ne 0 ]; then
      echo "Stopping due to error in branch $branch." | tee -a "$LOGFILE"
      return "$res"
    fi
  done

  git checkout "$MAIN_BRANCH" 2>&1 | tee -a "$LOGFILE"
  # Ignore errors
}

function main() {

  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo >&2
    echo "Error: Not a git repository" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$LOGFILE")" >/dev/null
  echo "" >"$LOGFILE"  # Clear Previous Logfile

  run_all; rc="$?"
  if [ "$rc" -eq 0 ]; then
    echo "All branches processed successfully." | tee -a "$LOGFILE"
  else
    echo "Errors encountered during processing. Check log for details." | tee -a "$LOGFILE"
  fi

  print_summary
  return "$rc"
}

(return 0 2>/dev/null) && sourced=1 || sourced=0 ;# bash only
if [ "$sourced" -eq 0 ]; then
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: top-level, sourced=$sourced."
  main "$@"; rc="$?"
  if [ "$rc" -ne 0 ]; then 
    exit "$rc"
  fi
fi
