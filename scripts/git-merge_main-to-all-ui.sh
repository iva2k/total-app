#!/usr/bin/env bash
# shellcheck disable=SC2059

# Merge main branch into all UI branches

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

DEBUG=0
# DEBUG=1
STATE_FILE="./.git-merge-all.state.local"
STATE_FILE_BACKUP="./.git-merge-all.backup.local"

function rebuild_lockfile() {
  git checkout HEAD -- pnpm-lock.yaml && pnpm install && git add pnpm-lock.yaml
}
function rebuild_lockfile_and_commit() {
  rebuild_lockfile && git commit -m "Update pnpm-lock.yaml"
}

COMMAND_MERGE_LOCKFILE=( "rebuild_lockfile" )
COMMAND_UPDATE_LOCKFILE=( "rebuild_lockfile_and_commit" )

LOGFILE=log.merge-all

SOURCE_BRANCH="main"

TARGET_BRANCHES=(
  "histoire"
  "storybook"
  "ui-agnostic"
  "ui-bootstrap"
  "ui-bulma"
  "ui-carbon"
  "ui-framework7"
  "ui-konsta"
  "ui-shoelace"
  "ui-svelteui"
  "ui-tailwindcss"
)

# Few Level Heading Separators for Nice Log (carriage return at the end allows
#  echo "${SEP2}SOME HEADER " to print ---> "SOME HEADER ###########")
SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"
# SEP3="$(printf "%100s\r" "" | tr ' ' '-')"

outputs=()
errors=()
tms_real=()
branches_done=()
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
  declare -p outputs > "$STATE_FILE"
  declare -p errors >> "$STATE_FILE"
  declare -p tms_real >> "$STATE_FILE"
  declare -p branches_done >> "$STATE_FILE"
  # declare -p TARGET_BRANCHES >> "$STATE_FILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: save_state() DONE saving to file \"$STATE_FILE\"."
}
function exit_save_state() {
  rc="$1"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: exit_save_state($rc) saving to file \"$STATE_FILE\"."
  save_state
  echo
  exit $((rc))
}
function load_state() {
  outputs=()
  errors=()
  tms_real=()
  branches_done=()
  # TARGET_BRANCHES_DEFAULT=("${TARGET_BRANCHES[@]}")
  if [ -f "$STATE_FILE" ]; then
    # shellcheck disable=SC1090
    source "$STATE_FILE"
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() loaded from file $STATE_FILE."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: outputs=${outputs[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: tms_real=${tms_real[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: errors=${errors[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: branches_done=${branches_done[*]}."
    # [ "$DEBUG" -ne 0 ] && echo "DEBUG: TARGET_BRANCHES=${TARGET_BRANCHES[*]}."
    clear_state
  else
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() no file $STATE_FILE."
  fi
}

function time_it() {
  # Function to execute and time another function
  local i="$1"
  local func_name="$2"
  shift 2  # Remove the first two arguments, leaving only the function arguments

  # Use time command to measure execution time of func_name
  # - collect it's real/user/system times (in seconds) using `time` with `TIMEFORMAT`
  # The format string ensures we get real, user, and sys times separately
  TIMEFORMAT="%3R %3U %3S"
  local time_output
  time_output=$( { time "$func_name" "$@" 1>&3 2>&4; } 2>&1 )

  # Extract the return value of the executed function
  local return_value="$?"
  if [ $return_value -ne 0 ]; then
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: '$func_name' exited with status $return_value" >&2
    exit "$return_value"
  fi
  # Parse the time output and store in arrays
  # shellcheck disable=SC2034
  IFS=' ' read -r t_real t_user t_system <<< "$time_output"
  tms_real[i]="0$t_real"
  # tms_user[i]="0$t_user"
  # tms_sys[i]="0$t_system"

  # Another way to parse:
  # tms_real[i]=$(echo "$time_output" | grep real | awk '{print $2}')
  # tms_user[i]=$(echo "$time_output" | grep user | awk '{print $2}')
  # tms_sys[i]=$(echo "$time_output" | grep sys | awk '{print $2}')

  [ "$DEBUG" -ne 0 ] && echo "DEBUG: time_it() func=$func_name real=$t_real user=$t_user system=$t_system tms_real[$i]=${tms_real[$i]}"

  # Return the result of the executed function
  return $return_value
} 3>&1 4>&2

# Function to display usage information
function usage() {
  # echo "Usage: $0 [-h] [-v] -n <name> [-a <age>]"
  echo "Usage: $0 [-h] [-v] "
  echo "  -h: Display this help message"
  # echo "  -v: Enable verbose mode"
  echo "  -c: Continue merge after resolving conflicts"
  # echo "  -n <name>: Specify a name (required)"
  # echo "  -a <age>: Specify an age (optional)"
}

# Function to parse command-line arguments
function parse_arguments() {
  local opt OPTIND OPTARG
  OPTIND=1
  continue_merge=0
  # while getopts "hvcn:a:" opt; do
  while getopts "hc" opt; do
    case $opt in
      h)
        usage
        exit 0
        ;;
      c)
        continue_merge=1
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
}

# alias decolor='sed "s/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g"'
function decolor() {
  local input
  input="$1"
  echo -e "$input" | sed 's/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g'
}

function merge_to_one() {
  is_continue="$1"
  i="$2"
  TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
  echo "${SEP2}" | tee -a "$LOGFILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_one() is_continue=$is_continue i=$i TARGET_BRANCH=$TARGET_BRANCH"
  save_state  ;# checkpoint

  # $SOURCE_BRANCH should be clean
  # $TARGET_BRANCH should be clean

  # Assume we will succeed
  outputs[i]=""
  errors[i]=0

  if [ "$is_continue" = true ]; then
    echo "CONTINUE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE"
    echo | tee -a "$LOGFILE"
    res=0
  else
    echo "BEGIN Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE"
    echo | tee -a "$LOGFILE"
    # Switch to the target branch
    # Checkout target branch
    if ! output=$(git checkout "$TARGET_BRANCH") ; then
      echo | tee -a "$LOGFILE"
      echo "Error checking out branch \"$TARGET_BRANCH\"." | tee -a "$LOGFILE"
      outputs[i]="Error checking out branch"
      errors[i]=1
      exit_save_state 1
    fi

    # Merge changes from the source branch, but not commit
    # if ! git merge "$SOURCE_BRANCH" --no-edit ; then
    git merge "$SOURCE_BRANCH" --no-commit
    res=$?
    if [ "$res" -ne 0 ] ; then
      echo "Merge conflict(s) detected in \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
    fi
  fi

  # Check if package.json file is updated (ignore conflicted)
  (git diff --exit-code "package.json" >/dev/null 2>&1) && pkg_updated=0 || pkg_updated=1
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_one() pkg_updated=$pkg_updated"

  if [ "$res" -ne 0 ] || [ "$is_continue" = true ] ; then

    # Check for conflicts in package.json (which will break rebuilding pnpm-lock.yaml)
    if git diff --name-only --diff-filter=U | grep -q "package.json"; then
      echo | tee -a "$LOGFILE"
      echo " \"package.json\" file has conflicts, cannot resolve automatically." | tee -a "$LOGFILE"
      echo | tee -a "$LOGFILE"
      echo "  Please resolve any remaining Merge conflicts manually, and run this script again with \"-c\" (continue) switch." | tee -a "$LOGFILE"
      outputs[i]="Merge conflicts in \"package.json\", can't resolve automatically"
      errors[i]=1
      exit_save_state 1
    fi

    if git diff --name-only --diff-filter=U | grep -q "pnpm-lock.yaml"; then
      echo "  Merge conflict(s) in \"pnpm-lock.yaml\", recreating..." | tee -a "$LOGFILE"
      ( "${COMMAND_MERGE_LOCKFILE[@]}" )
      error=$?
      echo "  DONE Recreating \"pnpm-lock.yaml\", error=$error." | tee -a "$LOGFILE"
      pkg_updated=0
    fi

    output=$(git diff --name-only --diff-filter=U)
    if echo "$output" | grep -q .; then
      echo | tee -a "$LOGFILE"
      echo "  There are remaining unresolved Merge conflicts in branch \"$TARGET_BRANCH\":" | tee -a "$LOGFILE"
      echo "$output" | tee -a "$LOGFILE"
      echo | tee -a "$LOGFILE"
      echo "  Please resolve any remaining Merge conflicts manually, and run this script again with \"-c\" (continue) switch." | tee -a "$LOGFILE"
      outputs[i]="Merge conflicts, can't resolve automatically"
      errors[i]=1
      exit_save_state 1
    else
      echo "  No unresolved Merge conflicts left, continuing..." | tee -a "$LOGFILE"
      git commit --no-edit
      outputs[i]="Merge conflicts resolved"
      errors[i]=0
    fi
  else
    git commit --no-edit
  fi

  if [ "$pkg_updated" -ne 0 ] ; then
    echo "  Changes to \"package.json\" file were merged, updating \"pnpm-lock.yaml\"..." | tee -a "$LOGFILE"
    outputs[i]="${outputs[i]}, package.json merged and lockfile updated"

    ( "${COMMAND_UPDATE_LOCKFILE[@]}" )
    error=$?
    echo "  DONE Updating \"pnpm-lock.yaml\", error=$error." | tee -a "$LOGFILE"
  fi

  # Push the changes to the remote repository
  git push origin "$TARGET_BRANCH"
  branches_done[i]="$TARGET_BRANCH"

  echo | tee -a "$LOGFILE"
  echo "DONE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"." | tee -a "$LOGFILE"
  echo | tee -a "$LOGFILE"
}

function continue_merge_to_all() {
  branch_name=$(git rev-parse --abbrev-ref HEAD)
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: continue_merge_to_all() branch_name=$branch_name"
  found_match=false
  for i in "${!TARGET_BRANCHES[@]}"; do
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
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
  echo "  run time=${tms_real[$i]}s" | tee -a "$LOGFILE"  ;# | tee -a "$LOGFILE_I"

  # Now can continue running the merge_to_all:
  merge_to_all "$((i+1))" "$@"
}

function merge_to_all() {
  start_i="$1"
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

  # Clean logfiles, errors[] and outputs[]
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
    LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
    (rm "$LOGFILE_I" 2>/dev/null)
    errors[i]="--"
    outputs[i]="\033[31m(did not run)\033[36m"
    tms_real[i]=0
  done

  # Fetch the latest changes from the remote repository
  git fetch origin

  # Switch to the source branch
  git checkout "$SOURCE_BRANCH"

  # Pull the latest changes from the source branch
  git pull origin "$SOURCE_BRANCH"

  # Loop through each target branch and execute one
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    time_it "$i" merge_to_one false "$i"
    echo "  run time=${tms_real[$i]}s" | tee -a "$LOGFILE"  ;# | tee -a "$LOGFILE_I"
  done

  git checkout "$SOURCE_BRANCH"
}

function print_summary() {
  result=0
  errors_cnt=0
  pass_cnt=0
  total_cnt=0
  total_time=0
  FORMAT="| %-20s | %6s | %-100s |"
  # FORMAT="| %-20s | %6s | %-30s | %9s | %-100s |"
  HEAD=$(printf "$FORMAT" "Branch" "Error" "Output")
  LINE=$(printf "$FORMAT" "" "")
  LINE="${LINE// /-}"
  echo | tee -a "$LOGFILE"
  echo "${SEP1}" | tee -a "$LOGFILE"
  echo "SUMMARY for merge branch \"$SOURCE_BRANCH\" into all target branches:" | tee -a "$LOGFILE"
  echo "$LINE" | tee -a "$LOGFILE"
  echo "$HEAD" | tee -a "$LOGFILE"
  echo "$LINE" | tee -a "$LOGFILE"
  for i in "${!TARGET_BRANCHES[@]}"; do 
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
    error="${errors[$i]}"
    output=$(decolor "${outputs[$i]}")
    total_cnt=$((total_cnt+1))
    color_red=0
    if [ "$error" == "0" ]; then
      pass_cnt=$((pass_cnt+1))
    elif [ "$error" != "--" ]; then
      result=1
      color_red=1
      errors_cnt=$((errors_cnt+1))
    fi
    total_time=$(awk "BEGIN {print ($total_time+${tms_real[$i]})}")
    [ "$color_red" -ne 0 ] && echo -n -e "\033[31m"
    printf "$FORMAT\n" "$TARGET_BRANCH" "$error" "${output:0:100}" | tee -a "$LOGFILE"
    # printf "$FORMAT\n" "$TARGET_BRANCH" "$error" "$LOGFILE_I" "${tms_real[$i]}" "${output:0:100}" | tee -a "$LOGFILE"
    [ "$color_red" -ne 0 ] && echo -n -e "\033[36m"
  done
  echo "$LINE" | tee -a "$LOGFILE"
  printf "$FORMAT\n" "Total:" "$errors_cnt" "" | tee -a "$LOGFILE"
  # printf "$FORMAT\n" "Total:" "$errors_cnt" "$total_cnt" "$total_time" "" | tee -a "$LOGFILE"
  echo "$LINE" | tee -a "$LOGFILE"
  echo | tee -a "$LOGFILE"
  total_time_m=$(awk "BEGIN {print ($total_time / 60)}")
  total_time_m="${total_time_m%%.*}"
  total_time_h=$(awk "BEGIN {print ($total_time_m / 60)}")
  total_time_h="${total_time_h%%.*}"
  total_time_s=$(awk "BEGIN {print ($total_time - 60 * $total_time_m - 60 * 60 * $total_time_h )}")
  
  echo | tee -a "$LOGFILE"
  echo "DONE Merging branch \"$SOURCE_BRANCH\" into $total_cnt target branches, $pass_cnt passed, $errors_cnt error(s), $total_time_h:$total_time_m:$total_time_s elapsed time." | tee -a "$LOGFILE"
  # echo "DONE command \"${COMMAND[*]}\" in $total_cnt target branches, $pass_cnt passed, $errors_cnt error(s), $total_time_h:$total_time_m:$total_time_s elapsed time." | tee -a "$LOGFILE"
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

  load_state
  echo "" >"$LOGFILE"
  if [ "$continue_merge" -ne 0 ]; then
    continue_merge_to_all "$@"
  else
    merge_to_all 0 "$@"
  fi
  
  print_summary
  rc="$?"
  
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
  main "$@"
  rc="$?"
  if [ "$rc" -ne 0 ]; then 
    exit "$rc"
  fi
fi
