#!/usr/bin/env bash
# shellcheck disable=SC2059

# Run command "pnpm run all" in all UI branches (can be patched to other commands)

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

DEBUG=0
# DEBUG=1

[ -z "$EPOCHREALTIME" ] && { echo "$0 needs bash>5.0(2019-01) for EPOCHREALTIME"; exit 1; }

STATE_FILE=".logs/.git-run-all.state.local"
STATE_FILE_BACKUP=".logs/.git-run-all.backup.local"

function no_prep() {
  echo > /dev/null
}

function do_prep() {
  pnpm install
}

COMMAND_PREP=( no_prep )
COMMAND=(pnpm run all)
LOGFILE=".logs/log.runallall"
# Attention!                ^- If changing LOGFILE and quote is past this mark, then adjust FORMAT in print_summary()

# COMMAND_PREP=( do_prep )
# COMMAND=(pnpm run check)
# LOGFILE=".logs/log.runcheck"
# COMMAND=(pnpm run lint)
# LOGFILE=".logs/log.runlint"

STOP_ON_ERROR=0

MAIN_BRANCH="main"

export GOOD_SKIP_TARGET_BRANCHES=(
)
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
  # Attention!    ^-- if adding a branch name and quote is past this mark, (longer than 15), adjust FORMAT in print_summary()
)
export BROKEN_TARGET_BRANCHES=(
  "histoire"      # `pnpm story:build`: CompileError: The $ name is reserved, and cannot be used for variables and imports
  "ui-agnostic"   # `pnpm build`: CompileError: Declaring or accessing a prop starting with `$$` is illegal ($$props.$$slots)
  "ui-bootstrap"  # `pnpm check`: Error: Argument of type 'typeof Col' is not assignable to parameter of type 'ConstructorOfATypedSvelteComponent'.
  "ui-framework7" # `pnpm build:base`: "Error: The 'swSrc' file can't be read. ENOENT: no such file or directory" - service worker build fails, probably due to all components not compatible with Svelte 5, buncho "ARIA role" issues, etc.
  "ui-konsta"     # `pnpm check`: Error: Argument of type 'typeof App' is not assignable to parameter of type 'ConstructorOfATypedSvelteComponent'.
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
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: st_outputs=$(decolor "${st_outputs[*]}")."
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
  echo "Usage: $0 [-h] [-p]"
  echo "  -h: Display this help message"
  # echo "  -v: Enable verbose mode"
  # echo "  -c: Continue merge after resolving conflicts"
  echo "  -p: Print last run summary only"
  # echo "  -n <name>: Specify a name (required)"
  # echo "  -a <age>: Specify an age (optional)"
}

# Function to parse command-line arguments
function parse_arguments() {
  # Global return values:
  print_last=0

  local opt OPTIND OPTARG
  OPTIND=1
  # while getopts "hvcn:a:" opt; do
  while getopts "hp" opt; do
    case $opt in
      h)
        usage
        exit 0
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

function run_one() {
  local i="$1"
  local res error TARGET_BRANCH LOGFILE_I
  TARGET_BRANCH="${TARGET_BRANCHES[i]}"
  st_branches[i]="$TARGET_BRANCH"
  # LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
  LOGFILE_I="$LOGFILE{${TARGET_BRANCH}}.$(date +%Y%m%d-%H%M%S).txt"
  # Attention! If changing LOGFILE_I and quote is past this mark  ^ , then adjust FORMAT in print_summary()

  mkdir -p "$(dirname "$LOGFILE_I")" >/dev/null
  touch "$LOGFILE_I"
  st_logfiles[i]="$LOGFILE_I"
  echo "${SEP2}$TARGET_BRANCH " | tee -a "$LOGFILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: run_one() i=$i TARGET_BRANCH=$TARGET_BRANCH LOGFILE_I=$LOGFILE_I"
  save_state  ;# checkpoint

  # Fetch the repo
  echo "FETCH repo" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  git fetch 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="$?"
  # git fetch 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res fetching the repo." | tee -a "$LOGFILE"
    st_errors[i]="$res"
    exit_save_state "$res"
  fi

  # Switch to the target branch
  echo "CHECKOUT $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  git checkout "$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2);  res="$?"
  # git checkout "$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in checkout to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
    st_outputs[i]="Error checking out branch"
    st_errors[i]="$res"
    exit_save_state "$res"
  fi

  # Pull the target branch
  echo "PULL $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  # There are sporadic fails in `git pull` (due to background `git fetch`), retry few times
  retry_it 3 git pull 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2);  res="$?"
  # git pull 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
  if [ "$res" -ne 0 ] ; then
    echo "Error $res pulling \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
    st_outputs[i]="Error pulling out branch"
    st_errors[i]="$res"
    exit_save_state "$res"
  fi

  echo "PREP $TARGET_BRANCH - ${COMMAND_PREP[*]}" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  # "${COMMAND_PREP[@]}" >>"$LOGFILE_I" 2>&1; res="$?"
  "${COMMAND_PREP[@]}" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="${PIPESTATUS[0]}"
  st_outputs[i]=""
  st_errors[i]="$res"

  if [ "$res" -ne 0 ] ; then
    output=$(grep -i "error" "$LOGFILE_I" | tail -n1)
    st_outputs[i]="$output"
    if [ $STOP_ON_ERROR -ne 0 ]; then
      echo "PREP ERROR $res in branch \"$TARGET_BRANCH\", stopping." | tee -a "$LOGFILE"
      return
    else
      echo "PREP ERROR $res in branch \"$TARGET_BRANCH\", cleaning up and continuing." | (tee -a "$LOGFILE" >&2)
      # git reset --hard "origin/$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="$?"
      git reset --hard "origin/$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
      if [ "$res" -ne 0 ] ; then
        echo "Error $res in checkout to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
        st_outputs[i]="Error in checkout of branch"
        st_errors[i]="$res"
        exit_save_state "$res"
      fi
    fi
  fi

  echo "BEGIN command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"

  # Run command
  "${COMMAND[@]}" >>"$LOGFILE_I" 2>&1; error="$?"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: error=$error"
  st_outputs[i]=""
  st_errors[i]="$error"
  if [ "$error" -ne 0 ] ; then
    output=$(grep -i "error" "$LOGFILE_I" | tail -n1)
    st_outputs[i]="$output"
    if [ $STOP_ON_ERROR -ne 0 ]; then
      echo "ERROR $error in branch \"$TARGET_BRANCH\", stopping." | (tee -a "$LOGFILE" >&2)
      return
    else
      echo "ERROR $error in branch \"$TARGET_BRANCH\", cleaning up and continuing." | tee -a "$LOGFILE"
      # git reset --hard "origin/$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2); res="$?"
      git reset --hard "origin/$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"; res="${PIPESTATUS[0]}"
      if [ "$res" -ne 0 ] ; then
        echo "Error $res in resetting \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
        st_outputs[i]="${st_outputs[i]}, error resetting branch"
        st_errors[i]="$res"
        exit_save_state "$res"
      fi
    fi
  fi

  # echo "DONE  command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\", run time=${real}s error=$error" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo "DONE  command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\", error=$error" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
}

function run_all() {
  local start_i="$1"
  local res i output TARGET_BRANCH LOGFILE_I

  # Check that local repo is clean
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: run_all() start_i=$start_i"
  if ! output=$(git status --untracked-files=no --porcelain 2>&1) || [ -n "$output" ]; then
    # Working directory clean excluding untracked files
    echo >&2
    echo "Working folder is not clean. Please clean working folder and retry." >&2
    echo "$output" >&2
    exit_save_state 1
  else 
    echo "Working folder is clean." | tee -a "$LOGFILE"
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

  # Loop through each target branch and execute one
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    time_it "$i" run_one "$i"; res="$?"
    LOGFILE_I="${st_logfiles[i]}"
    echo "  run time=${st_times[i]}s" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  done

  git checkout "$MAIN_BRANCH" 2>&1 | tee -a "$LOGFILE"
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

  FORMAT="| %-20s | %6s | %-50s | %9s | %-99s |" # width=200 =20+6+49+9+100 +16
  # Attention: if adjusting last field length (output), adjust also {output:0:...} below

  HEAD=$(printf "$FORMAT" "Branch" "Error" "Log File ${logdir}" "Time (s)" "Output")
  LINE=$(printf "$FORMAT" "" "" "" "" "")
  LINE2="${LINE// /=}"
  LINE="${LINE// /-}"
  echo | tee -a "$LOGFILE"
  echo "${SEP1}" | tee -a "$LOGFILE"
  echo "SUMMARY for command \"${COMMAND[*]}\" in all target branches:" | tee -a "$LOGFILE"
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
    printf "$FORMAT\n" "$TARGET_BRANCH" "$error" "$(basename "$LOGFILE_I")" "$(format_float "${st_times[i]}")" "${output:0:99}" | tee -a "$LOGFILE"
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
  echo "DONE command \"${COMMAND[*]}\" in $total_cnt target branches, $pass_cnt passed, $errors_cnt error(s), $total_time_h:$total_time_m:$total_time_s elapsed time." | tee -a "$LOGFILE"
  echo | tee -a "$LOGFILE"

  return $result
}

function main() {
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
  else
    echo "" >"$LOGFILE"  ;# Clear Previous $LOGFILE
    load_state
    run_all 0 "$@"
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
