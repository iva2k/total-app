#!/usr/bin/env bash
# shellcheck disable=SC2059

# Merge main branch into all UI branches

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

DEBUG=0
# DEBUG=1

[ -z "$EPOCHREALTIME" ] && { echo "$0 needs bash>5.0(2019-01) for EPOCHREALTIME"; exit 1; }

STATE_FILE=".logs/.git-merge-all.state.local"
STATE_FILE_BACKUP=".logs/.git-merge-all.backup.local"

function rebuild_lockfile() {
  git checkout HEAD -- pnpm-lock.yaml && pnpm install && git add pnpm-lock.yaml
}
function rebuild_lockfile_and_commit() {
  rebuild_lockfile && git commit -m "Update pnpm-lock.yaml"
}

COMMAND_MERGE_LOCKFILE=( "rebuild_lockfile" )
COMMAND_UPDATE_LOCKFILE=( "rebuild_lockfile_and_commit" )

LOGFILE=".logs/log.merge-all"
# Attention!                ^- If changing LOGFILE and quote is past this mark, then adjust FORMAT in print_summary()

SOURCE_BRANCH="main"

TARGET_BRANCHES=(
  "histoire"
  "storybook"
  "ui-agnostic"
  "ui-bootstrap"
  "ui-bulma"
  "ui-carbon"
  "ui-flowbite"
  "ui-framework7"
  "ui-konsta"
  "ui-shoelace"
  "ui-svelteui"
  "ui-svelteux"
  "ui-tailwindcss"
  # Attention!    ^-- if adding a branch name and quote is past this mark, (longer than 15), adjust FORMAT in print_summary()
)

# Few Level Heading Separators for Nice Log (carriage return at the end allows
#  echo "${SEP2}SOME HEADER " to print ---> "SOME HEADER ###########")
SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"
# SEP3="$(printf "%100s\r" "" | tr ' ' '-')"

# Use export to make them available to child processes (so we can use sub-processes)
export st_outputs=()
export st_errors=()
export st_times=()
export st_branches=()
export st_logfiles=()
function backup_state() {
  if [ -f "$STATE_FILE" ]; then
    [ -f "$STATE_FILE_BACKUP" ] && rm "$STATE_FILE_BACKUP"
    cp "$STATE_FILE" "$STATE_FILE_BACKUP"
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: backup_state() created backup file $STATE_FILE_BACKUP."
  fi
}
function clear_state() {
  if [ -f "$STATE_FILE" ]; then
    rm "$STATE_FILE"
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: clear_state() deleted file $STATE_FILE."
  else
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: clear_state() no file $STATE_FILE."
  fi
}
function save_state() {
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: save_state() saving to file \"$STATE_FILE\"."
  # Insert "-g" option into declare written to the $STATE_FILE, so load_state() makes variables in global scope.
  { declare -p st_outputs
    declare -p st_errors
    declare -p st_times
    declare -p st_branches
    declare -p st_logfiles
    # declare -p TARGET_BRANCHES
  } | sed "s/^declare -a/declare -ga/" > "$STATE_FILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: save_state() DONE saving to file \"$STATE_FILE\", st_errors=${st_errors[*]}."
}
function exit_save_state() {
  local rc="$1"
  save_state
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: exit_save_state($rc)."
  exit $((rc))
}
function load_state() {
  local file="${1:-$STATE_FILE}"
  st_outputs=()
  st_errors=()
  st_times=()
  st_branches=()
  st_logfiles=()
  # TARGET_BRANCHES_DEFAULT=("${TARGET_BRANCHES[@]}")
  if [ -f "$file" ]; then
    # shellcheck disable=SC1090
    source "$file"
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() loaded from file $file."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: st_outputs=${st_outputs[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: st_times=${st_times[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: st_errors=${st_errors[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: st_branches=${st_branches[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: st_logfiles=${st_logfiles[*]}."
    # [ "$DEBUG" -ne 0 ] && echo "DEBUG: TARGET_BRANCHES=${TARGET_BRANCHES[*]}."
    # clear_state
  else
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() no file $file."
  fi
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

# Function to display usage information
function usage() {
  # echo "Usage: $0 [-h] [-v] -n <name> [-a <age>]"
  echo "Usage: $0 [-h] [-c] [-p]"
  echo "  -h: Display this help message"
  # echo "  -v: Enable verbose mode"
  echo "  -c: Continue merge after resolving conflicts"
  echo "  -p: Print last run summary only"
  # echo "  -n <name>: Specify a name (required)"
  # echo "  -a <age>: Specify an age (optional)"
}

# Function to parse command-line arguments
function parse_arguments() {
  # Global return values:
  print_last=0
  continue_merge=0

  local opt OPTIND OPTARG
  OPTIND=1
  # while getopts "hvcn:a:" opt; do
  while getopts "hcp" opt; do
    case $opt in
      h)
        usage
        exit 0
        ;;
      c)
        continue_merge=1
        ;;
      p)
        print_last=1
        ;;
      # v)
      #   verbose=true
      #   ;;
      # n)
      #   name=$OPTARG
      #   ;;
      # a)
      #   age=$OPTARG
      #   ;;
      \?)
        echo "Invalid option: -$OPTARG" >&2
        usage
        exit 1
        ;;
      :)
        echo "Option -$OPTARG requires an argument." >&2
        usage
        exit 1
        ;;
    esac
  done

  # Check if required arguments are provided
  # if [ -z "$name" ]; then
  #   echo "Error: Name is required" >&2
  #   usage
  #   exit 1
  # fi

  # The rest are positional arguments (shift the processed options)
  # shift $((OPTIND-1))
  # positional_args=("$@")  
}

# alias decolor='sed "s/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g"'
function decolor() {
  local input="$1"
  echo -e "$input" | sed 's/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g'
}
function remove_utf() {
  local input="$1"
  echo -e "$input" | LC_ALL=C tr -cd '[:print:][:space:]'
}
function trim() {
  local input="$1"
  echo -e "$input" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

function git_push_with_log() {
  local branch="$1"
  local LOGFILE_I="$2"
  mkdir -p "$(dirname "$LOGFILE_I")" >/dev/null
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: git_push_with_log() branch=$branch LOGFILE_I=$LOGFILE_I"

  { echo "Push log for branch: $branch"
    echo "Date: $(date +%Y%m%d-%H%M%S)"
    echo ""
    } >> "$LOGFILE_I"

  # Get the range of commits being pushed
  local range
  range=$(git rev-parse "$branch@{push}..$branch")

  local local_sha
  local remote_sha
  local_sha=$(git rev-parse "$branch")
  remote_sha=$(git rev-parse "origin/$branch" 2>/dev/null || echo "")

  if [ -z "$remote_sha" ]; then
    echo "New branch, comparing with initial commit" >> "$LOGFILE_I"
    range="$(git rev-list --max-parents=0 HEAD)...$local_sha"
  else
    range="$remote_sha...$local_sha"
  fi

  {
    # List of modified files
    echo "Modified files:"
    git diff --name-status "$range"
    echo ""

    # List of commits being pushed
    echo "Commits being pushed:"
    git log --oneline "$range"
    echo ""

    # List of merged branches
    echo "Merged branches:"
    git branch --merged "$branch" | grep -v "^\*"
    echo ""

    # Additional information
    echo "Additional information:"
    echo "Current user: $(git config user.name)"
    echo "Current email: $(git config user.email)"
    echo "Remote URL: $(git remote get-url origin)"
  } >> "$LOGFILE_I"

  # Perform the actual push
  echo "PUSH $branch" | tee -a "$LOGFILE_I"
  git push origin "$branch" >>"$LOGFILE_I" 2>&1; rc="$?"
  echo "DONE 'git push', result=$rc" | tee -a "$LOGFILE_I"
  return "$rc"
}

function merge_to_one() {
  local is_continue="$1"
  local i="$2"
  local res output TARGET_BRANCH LOGFILE_I
  TARGET_BRANCH="${TARGET_BRANCHES[i]}"
  st_branches[i]="$TARGET_BRANCH"
  echo "${SEP2}$TARGET_BRANCH " | tee -a "$LOGFILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_one() is_continue=$is_continue i=$i TARGET_BRANCH=$TARGET_BRANCH"
  save_state  ;# checkpoint

  # $SOURCE_BRANCH should be clean
  # $TARGET_BRANCH should be clean

  # Assume we will succeed
  st_outputs[i]="(started)"
  st_errors[i]=0

  if [ "$is_continue" = true ]; then
    LOGFILE_I="${st_logfiles[i]}"
    # touch "$LOGFILE_I"
    echo "CONTINUE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    echo | tee -a "$LOGFILE"
    res=0
  else
    LOGFILE_I=".logs/log.merge{${SOURCE_BRANCH}}-{${TARGET_BRANCH}}.$(date +%Y%m%d-%H%M%S).txt"
    # Attention! If changing LOGFILE_I and quote is past this mark  --------------------------^ , then adjust FORMAT in print_summary()
    mkdir -p "$(dirname "$LOGFILE_I")" >/dev/null
    touch "$LOGFILE_I"; res="$?"
    if [ "$res" -ne 0 ]; then
      echo "Failed creating log file \"$LOGFILE_I\""
      st_errors[i]="$res"
      exit_save_state "$res";
    fi
    st_logfiles[i]="$LOGFILE_I"
    echo "BEGIN Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    echo | tee -a "$LOGFILE"

    # Switch to / Checkout target branch
    echo "CHECKOUT $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    git checkout "$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
    if [ "$res" -ne 0 ] ; then
      echo | tee -a "$LOGFILE"  | tee -a "$LOGFILE_I"
      echo "Error $res checking out branch \"$TARGET_BRANCH\"." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      st_outputs[i]="Error checking out branch"
      st_errors[i]="$res"
      exit_save_state 1
    fi

    # Pull the target branch
    echo "PULL $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    # There are sporadic fails in `git pull` (due to background `git fetch`), retry few times
    retry_it 3 git pull 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
    if [ "$res" -ne 0 ] ; then
      echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo "Error $res pulling branch \"$TARGET_BRANCH\"." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      st_outputs[i]="Error pulling out branch"
      st_errors[i]="$res"
      exit_save_state 1
    fi

    # Merge changes from the source branch, but not commit
    echo "MERGE $SOURCE_BRANCH to $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    git merge "$SOURCE_BRANCH" --no-commit 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
    if [ "$res" -ne 0 ] ; then
      echo "Merge conflict(s) detected in \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    fi
    # Use $res below
  fi

  # Check if package.json file is updated (ignore conflicted)
  (git diff --exit-code "package.json" >/dev/null 2>&1) && pkg_updated=0 || pkg_updated=1
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_one() pkg_updated=$pkg_updated"

  if [ "$res" -ne 0 ] || [ "$is_continue" = true ] ; then

    # Check for conflicts in package.json (which will break rebuilding pnpm-lock.yaml)
    if git diff --name-only --diff-filter=U | grep -q "package.json"; then
      echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo " \"package.json\" file has conflicts, cannot resolve automatically." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo "  Please resolve any remaining Merge conflicts manually, and run this script again with \"-c\" (continue) switch." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      st_outputs[i]="Merge conflicts in \"package.json\", can't resolve automatically"
      st_errors[i]=1
      exit_save_state 1
    fi

    if git diff --name-only --diff-filter=U | grep -q "pnpm-lock.yaml"; then
      echo "  Merge conflict(s) in \"pnpm-lock.yaml\", recreating..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      ( "${COMMAND_MERGE_LOCKFILE[@]}" ) | tee -a "$LOGFILE"; error="${PIPESTATUS[0]}"
      # error="$?"  ;# won't work due to ` | tee ...`
      echo "  DONE Recreating \"pnpm-lock.yaml\", error=$error." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      pkg_updated=0
    fi

    output=$(git diff --name-only --diff-filter=U)
    if echo "$output" | grep -q .; then
      echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo "  There are remaining unresolved Merge conflicts in branch \"$TARGET_BRANCH\":" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo "$output" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo "  Please resolve any remaining Merge conflicts manually, and run this script again with \"-c\" (continue) switch." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      st_outputs[i]="Merge conflicts, can't resolve automatically"
      st_errors[i]=1
      exit_save_state 1
    else
      echo "  No unresolved Merge conflicts left, continuing..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      echo "COMMIT $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      git commit --no-edit 2>&1 | tee -a "$LOGFILE"; res="${PIPESTATUS[0]}"
      if [ "$res" -ne 0 ] ; then
        echo "Error $res in commit to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
        st_outputs[i]="Error in commit to branch"
        st_errors[i]="$res"
        exit_save_state "$res"
      fi
      st_outputs[i]="Merge conflicts resolved"
      st_errors[i]=0
    fi
  else
    echo "  No Merge conflicts, continuing..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    st_outputs[i]="(merged)"
    st_errors[i]=0
    # No "-m" as merge sets up a commit message for us to use.
    echo "COMMIT $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    git commit --no-edit 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  fi

  if [ "$pkg_updated" -ne 0 ] ; then
    echo "  Changes to \"package.json\" file were merged, updating \"pnpm-lock.yaml\"..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    st_outputs[i]="${st_outputs[i]}, package.json merged and lockfile updated"

    ( "${COMMAND_UPDATE_LOCKFILE[@]}" ) | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; error="${PIPESTATUS[0]}"
    # error="$?"  ;# won't work due to ` | tee ...`
    echo "  DONE Updating \"pnpm-lock.yaml\", error=$error." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  fi

  # Push the changes to the remote repository
  git_push_with_log "$TARGET_BRANCH" "$LOGFILE_I" | tee -a "$LOGFILE";  res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in push to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
    st_outputs[i]="${st_outputs[i]}, error pushing to git"
    st_errors[i]="$res"
    exit_save_state "$res"
  fi

  echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo "DONE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
}

function continue_merge_to_all() {
  branch_name=$(git rev-parse --abbrev-ref HEAD)
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: continue_merge_to_all() branch_name=$branch_name"
  found_match=false
  for i in "${!TARGET_BRANCHES[@]}"; do
    TARGET_BRANCH="${TARGET_BRANCHES[i]}"
    if [ "$TARGET_BRANCH" = "$branch_name" ]; then
      found_match=$i
      [ "$DEBUG" -ne 0 ] && echo "DEBUG: continue_merge_to_all() found_match=$i"
      break
    fi
  done
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: continue_merge_to_all() found_match=$found_match i=$i"
  if [ "$found_match" = false ]; then
    echo "Error: not in any of the target branches" >&2
    exit_save_state 1
  fi

  i=$found_match
  time_it "$i" merge_to_one true "$found_match"
  echo "  run time=${st_times[i]}s" | tee -a "$LOGFILE"  ;# | tee -a "$LOGFILE_I"

  # Now can continue running the merge_to_all:
  merge_to_all "$((i+1))" "$@"
}

function merge_to_all() {
  local start_i="$1"
  local res i output TARGET_BRANCH LOGFILE_I

  # Check that local repo is clean
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_all() start_i=$start_i"
  if ! output=$(git status --untracked-files=no --porcelain 2>&1) || [ -n "$output" ]; then
    # Working directory clean excluding untracked files
    echo >&2
    echo "Working folder is not clean. Please clean working folder and retry." >&2
    echo "$output" >&2
    exit_save_state 1
  else 
    echo "Working folder is clean." | tee -a "$LOGFILE"
  fi

  if ! output=$(git rev-list "${SOURCE_BRANCH}...origin/${SOURCE_BRANCH}" 2>&1) || [ -n "$output" ]; then
    # Branch is different from origin
    echo >&2
    echo "Branch \"$SOURCE_BRANCH\" in local repo is not synced with remote origin. Please sync local branch and retry." >&2
    # echo "$output"
    exit_save_state 1
  else 
    echo "Local branch is in sync." | tee -a "$LOGFILE"
  fi

  # Clean state vars: st_errors[], st_outputs[], etc.
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    st_errors[i]="--"
    st_outputs[i]="(did not run)"
    st_times[i]=0
    st_branches[i]=""
    st_logfiles[i]=""
  done

  # Fetch the latest changes from the remote repository
  git fetch origin >>"$LOGFILE" 2>&1; res="$?"
  # git fetch origin 2>&1 | tee -a "$LOGFILE"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in git fetch." | tee -a "$LOGFILE"
    exit_save_state "$res"
  fi

  # Switch to the source branch
  git checkout "$SOURCE_BRANCH" 2>&1 | tee -a "$LOGFILE"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in git checkout $SOURCE_BRANCH." | tee -a "$LOGFILE"
    exit_save_state "$res"
  fi

  # Pull the latest changes from the source branch
  retry_it 3 git pull origin "$SOURCE_BRANCH" 2>&1 | tee -a "$LOGFILE"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in git pull origin $SOURCE_BRANCH." | tee -a "$LOGFILE"
    exit_save_state "$res"
  fi

  # Loop through each target branch and execute one
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    time_it "$i" merge_to_one false "$i"; res="$?"
    LOGFILE_I="${st_logfiles[i]}"
    echo "  run time=${st_times[i]}s" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  done

  git checkout "$SOURCE_BRANCH" 2>&1 | tee -a "$LOGFILE"
  # Ignore errors
}

function format_float() {
  local number="$1"
  local decimal_places="${2:-3}"  # Default to 3 decimal places if not specified
  printf "%.*f" "$decimal_places" "$number"
}

function print_summary() {
  local result errors_cnt pass_cnt total_cnt total_time logdir color_red
  local FORMAT HEAD LINE LINE2 TARGET_BRANCH LOGFILE_I i result output

  # Choose colors
  local C_RED="\033[31m" C_CYAN="\033[36m" C_DEFAULT="\033[39m"
  local T_ERR="$C_RED" # Red-colored errors
  local T_C="$C_CYAN" # Cyan-colored table
  # local T_ERR="" # Not-colored errors
  # local T_C="$C_DEFAULT" # Not-colored table

  result=0
  errors_cnt=0
  pass_cnt=0
  total_cnt=0
  total_time=0
  logdir="$(dirname "$LOGFILE")"; logdir="$([ "$logdir" = "." ] && echo "" || echo "${logdir:+($logdir/)}")"

  FORMAT="| %-20s | %6s | %-53s | %9s | %-96s |" # width=200 =20+6+53+9+96 +16
  # Attention: if adjusting last field length (output), adjust also {output:0:...} below

  HEAD=$(printf "$FORMAT" "Branch" "Error" "Log File ${logdir}" "Time (s)" "Output")
  LINE=$(printf "$FORMAT" "" "" "" "" "")
  LINE2="${LINE// /=}"
  LINE="${LINE// /-}"
  echo | tee -a "$LOGFILE"
  echo "${SEP1}" | tee -a "$LOGFILE"
  echo "SUMMARY for merge branch \"$SOURCE_BRANCH\" into all target branches:" | tee -a "$LOGFILE"
  echo -n -e "$T_C"
  echo "$LINE"  | tee -a "$LOGFILE"
  echo "$HEAD"  | tee -a "$LOGFILE"
  echo "$LINE2" | tee -a "$LOGFILE"
  for i in "${!TARGET_BRANCHES[@]}"; do 
    TARGET_BRANCH="${st_branches[i]}"
    LOGFILE_I="${st_logfiles[i]}"
    error="${st_errors[i]}"
    output=$(decolor "${st_outputs[i]}")
    output=$(remove_utf "$output")
    output=$(trim "$output")
    total_cnt=$((total_cnt+1))
    color_red=0
    if [ "$error" == "0" ]; then
      pass_cnt=$((pass_cnt+1))
    elif [ "$error" != "--" ]; then
      result=1
      color_red=1
      errors_cnt=$((errors_cnt+1))
    fi
    total_time=$(awk "BEGIN {print ($total_time+0${st_times[i]})}")
    [ "$color_red" -ne 0 ] && echo -n -e "$T_ERR"
    printf "$FORMAT\n" "$TARGET_BRANCH" "$error" "$(basename "$LOGFILE_I")" "$(format_float "${st_times[i]}")" "${output:0:97}" | tee -a "$LOGFILE"
    [ "$color_red" -ne 0 ] && echo -n -e "$T_C"
  done
  echo "$LINE" | tee -a "$LOGFILE"
  printf "$FORMAT\n" "Total:" "$errors_cnt" "$total_cnt" "$total_time" "" | tee -a "$LOGFILE"
  echo "$LINE" | tee -a "$LOGFILE"
  echo -n -e "$C_DEFAULT"
  echo | tee -a "$LOGFILE"

  local total_time_m total_time_h total_time_s
  total_time_m=$(awk "BEGIN {print ($total_time / 60)}")
  total_time_m="${total_time_m%%.*}"
  total_time_h=$(awk "BEGIN {print ($total_time_m / 60)}")
  total_time_h="${total_time_h%%.*}"
  total_time_s=$(awk "BEGIN {print ($total_time - 60 * $total_time_m - 60 * 60 * $total_time_h )}")
  
  echo | tee -a "$LOGFILE"
  echo "DONE Merging branch \"$SOURCE_BRANCH\" into $total_cnt target branches, $pass_cnt passed, $errors_cnt error(s), $total_time_h:$total_time_m:$total_time_s elapsed time." | tee -a "$LOGFILE"
  echo | tee -a "$LOGFILE"

  return $result
}

main() {
  parse_arguments "$@"

  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo >&2
    echo "Error: Not a git repository" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$LOGFILE")" >/dev/null
  if [ "$print_last" -ne 0 ]; then
    local file="$STATE_FILE"
    [ ! -f "$file" ] && { file="$STATE_FILE_BACKUP"; }
    [ ! -f "$file" ] && { echo "No current run file \"$STATE_FILE\" found and no last run file \"$STATE_FILE_BACKUP\" found."; exit 1; }
    load_state "$file"
    print_summary; rc="$?"
    return "$rc"
  elif [ "$continue_merge" -ne 0 ]; then
    # Previous $LOGFILE is continued
    load_state
    continue_merge_to_all "$@"
  else
    echo "" >"$LOGFILE"  ;# Clear Previous $LOGFILE
    load_state
    merge_to_all 0 "$@"
  fi
  
  print_summary; rc="$?"
  
  save_state
  if [ "$rc" = 0 ]; then
    backup_state
    clear_state
  fi
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
