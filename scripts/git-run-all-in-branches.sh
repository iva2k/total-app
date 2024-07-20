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

# COMMAND_PREP=( do_prep )
# COMMAND=(pnpm run check)
# LOGFILE=".logs/log.runcheck"
# COMMAND=(pnpm run lint)
# LOGFILE=".logs/log.runlint"

STOP_ON_ERROR=0

SOURCE_BRANCH="main"

export GOOD_SKIP_TARGET_BRANCHES=(
)
export TARGET_BRANCHES=(
  "main"
  "storybook"
  "ui-bulma"
  "ui-shoelace"
  "ui-svelteui"
  "ui-tailwindcss"
)
export BROKEN_TARGET_BRANCHES=(
  "histoire"      # `pnpm story:build`: CompileError: The $ name is reserved, and cannot be used for variables and imports
  "ui-agnostic"   # `pnpm build`: CompileError: Declaring or accessing a prop starting with `$$` is illegal ($$props.$$slots)
  "ui-bootstrap"  # `pnpm check`: Error: Argument of type 'typeof Col' is not assignable to parameter of type 'ConstructorOfATypedSvelteComponent'.
  "ui-carbon"     # `pnpm build:base`: "Error: The 'swSrc' file can't be read. ENOENT: no such file or directory"
  "ui-framework7" # `pnpm build:base`: "Error: The 'swSrc' file can't be read. ENOENT: no such file or directory" - service worker build fails, probably due to all components not compatible with Svelte 5, buncho "ARIA role" issues, etc.
  "ui-konsta"     # `pnpm check`: Error: Argument of type 'typeof App' is not assignable to parameter of type 'ConstructorOfATypedSvelteComponent'.
)

# Few Level Heading Separators for Nice Log (carriage return at the end allows
#  echo "${SEP2}SOME HEADER " to print ---> "SOME HEADER ###########")
SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"
# SEP3="$(printf "%100s\r" "" | tr ' ' '-')"

# Use export to make them available to child processes (so we can use sub-processes)
export outputs=()
export errors=()
export tms_real=()
export branches_done=()
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
  { declare -p outputs
    declare -p errors
    declare -p tms_real
    declare -p branches_done
    # declare -p TARGET_BRANCHES
  } | sed "s/^declare -a/declare -ga/" > "$STATE_FILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: save_state() DONE saving to file \"$STATE_FILE\", errors=${errors[*]}."
}
function exit_save_state() {
  rc="$1"
  save_state
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: exit_save_state($rc)."
  exit $((rc))
}
function load_state() {
  local file="${1:-$STATE_FILE}"
  outputs=()
  errors=()
  tms_real=()
  branches_done=()
  # TARGET_BRANCHES_DEFAULT=("${TARGET_BRANCHES[@]}")
  if [ -f "$file" ]; then
    # shellcheck disable=SC1090
    source "$file"
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() loaded from file $file."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: outputs=${outputs[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: tms_real=${tms_real[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: errors=${errors[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: branches_done=${branches_done[*]}."
    # [ "$DEBUG" -ne 0 ] && echo "DEBUG: TARGET_BRANCHES=${TARGET_BRANCHES[*]}."
    # clear_state
  else
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() no file $file."
  fi
}

function time_it() {
  # Function to execute and time another function
  # Captures start time, executes $2 with the rest args, captures end time, calculates time difference into tms_real[$1]
  # If function $2 returns non-0 code, exits with that code.
  # Args:
  local i="$1"
  local func_name="$2"
  shift 2  # Remove the first two arguments, leaving only the function arguments

  local t t_real TIMESTART TIMEEND TIMEDIFF
  # For measuring time, Since bash 5.0 (2019) use EPOCHREALTIME:
  # remove the decimal separator (s → µs), remove last 3 digits (µs → ms)
  t=${EPOCHREALTIME/[^0-9]/}; TIMESTART=${t%???}
  "$func_name" "$@"
  local return_value="$?"
  if [ $return_value -ne 0 ]; then
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: '$func_name' exited with status $return_value" >&2
    exit "$return_value"
  fi
  t=${EPOCHREALTIME/[^0-9]/}; TIMEEND=${t%???}

  TIMEDIFF=$(( TIMEEND < TIMESTART ? TIMEEND - TIMESTART + 1000000000 : TIMEEND - TIMESTART ))
  t_real=$(printf "%s.%s" $(( TIMEDIFF / 1000 )) $(( TIMEDIFF % 1000 )))
  tms_real[i]="$t_real"

  [ "$DEBUG" -ne 0 ] && echo "DEBUG: time_it() func=$func_name status=$return_value TIMESTART=$TIMESTART TIMEEND=$TIMEEND TIMEDIFF=$TIMEDIFF t_real=$t_real tms_real[$i]=${tms_real[$i]}"
  # [ "$DEBUG" -ne 0 ] && echo "DEBUG: time_it() func=$func_name status=$return_value real=$t_real user=$t_user system=$t_system tms_real[$i]=${tms_real[$i]}"

  return $return_value
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
  local opt OPTIND OPTARG
  OPTIND=1
  print_last=0
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
}

# alias decolor='sed "s/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g"'
function decolor() {
  local input
  input="$1"
  echo -e "$input" | sed 's/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g'
}

function run_one() {
  i="$1"
  TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
  LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
  echo "${SEP2}" | tee -a "$LOGFILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: run_one() i=$i TARGET_BRANCH=$TARGET_BRANCH LOGFILE_I=$LOGFILE_I"
  save_state  ;# checkpoint

  # Switch to the target branch
  echo "CHECKOUT $TARGET_BRANCH" | tee -a "$LOGFILE" | tee "$LOGFILE_I"
  # git checkout "$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2)
  git checkout "$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  # res=$?  ;# won't work due to ` | tee ...`
  res=${PIPESTATUS[0]}
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in checkout to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
    errors[i]="$res"
    exit_save_state "$res"
  fi

  echo "PREP $TARGET_BRANCH" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  "${COMMAND_PREP[@]}" >>"$LOGFILE_I" 2>&1
  prep_error=$?
  outputs[i]=""
  errors[i]="$prep_error"

  if [ "$prep_error" -ne 0 ] ; then
    [ "$output" == "" ] && output=$(grep -i "error" "$LOGFILE_I" | tail -n1)
    outputs[i]="$output"
    if [ $STOP_ON_ERROR -ne 0 ]; then
      echo "PREP ERROR $prep_error in branch \"$TARGET_BRANCH\", stopping." | tee -a "$LOGFILE"
      return
    else
      echo "PREP ERROR $prep_error in branch \"$TARGET_BRANCH\", cleaning up and continuing." | (tee -a "$LOGFILE" >&2)
      # git reset --hard "origin/$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2)
      git reset --hard "origin/$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      # res=$?  ;# won't work due to ` | tee ...`
      res=${PIPESTATUS[0]}
      if [ "$res" -ne 0 ] ; then
        echo "Error $res in checkout to \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
        errors[i]="$res"
        exit_save_state "$res"
      fi
    fi
  fi

  echo "BEGIN command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"

  # Run command
  "${COMMAND[@]}" >>"$LOGFILE_I" 2>&1
  error=$?
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: error=$error"
  outputs[i]=""
  errors[i]="$error"
  if [ "$error" -ne 0 ] ; then
    [ "$output" == "" ] && output=$(grep -i "error" "$LOGFILE_I" | tail -n1)
    outputs[i]="$output"
    if [ $STOP_ON_ERROR -ne 0 ]; then
      echo "ERROR $error in branch \"$TARGET_BRANCH\", stopping." | (tee -a "$LOGFILE" >&2)
      return
    else
      echo "ERROR $error in branch \"$TARGET_BRANCH\", cleaning up and continuing." | tee -a "$LOGFILE"
      # git reset --hard "origin/$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2)
      git reset --hard "origin/$TARGET_BRANCH" 2>&1 | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
      # res=$?  ;# won't work due to ` | tee ...`
      res=${PIPESTATUS[0]}
      if [ "$res" -ne 0 ] ; then
        echo "Error $res in resetting \"$TARGET_BRANCH\" branch." | tee -a "$LOGFILE"
        errors[i]="$res"
        exit_save_state "$res"
      fi
    fi
  fi

  # echo "DONE  command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\", run time=${real}s error=$error" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo "DONE  command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\", error=$error" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
  echo | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
}
function run_all() {
  start_i="$1"
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
  git fetch origin 2>&1 | tee -a "$LOGFILE"
  # res=$?  ;# won't work due to ` | tee ...`
  res=${PIPESTATUS[0]}
  if [ "$res" -ne 0 ] ; then
    echo "Error $res in git fetch." | tee -a "$LOGFILE"
    exit_save_state "$res"
  fi

  # Loop through each target branch and execute one
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    # break ;# for DEBUG only
    time_it "$i" run_one "$i"
    echo "  run time=${tms_real[$i]}s" | tee -a "$LOGFILE" | tee -a "$LOGFILE_I"
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
  result=0
  errors_cnt=0
  pass_cnt=0
  total_cnt=0
  total_time=0
  logdir="$(dirname "$LOGFILE")"; logdir="$([ "$logdir" = "." ] && echo "" || echo "${logdir:+($logdir/)}")"
  FORMAT="| %-20s | %6s | %-30s | %9s | %-100s |"
  HEAD=$(printf "$FORMAT" "Branch" "Error" "Log File ${logdir}" "Time (s)" "Output")
  LINE=$(printf "$FORMAT" "" "" "" "" "")
  LINE="${LINE// /-}"
  echo | tee -a "$LOGFILE"
  echo "${SEP1}" | tee -a "$LOGFILE"
  echo "SUMMARY for command \"${COMMAND[*]}\" in all target branches:" | tee -a "$LOGFILE"
  echo "$LINE" | tee -a "$LOGFILE"
  echo "$HEAD" | tee -a "$LOGFILE"
  echo "$LINE" | tee -a "$LOGFILE"
  for i in "${!TARGET_BRANCHES[@]}"; do 
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
    LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
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
    total_time=$(awk "BEGIN {print ($total_time+0${tms_real[$i]})}")
    [ "$color_red" -ne 0 ] && echo -n -e "\033[31m"
    printf "$FORMAT\n" "$TARGET_BRANCH" "$error" "$(basename "$LOGFILE_I")" "$(format_float "${tms_real[$i]}")" "${output:0:102}" | tee -a "$LOGFILE"
    [ "$color_red" -ne 0 ] && echo -n -e "\033[39m"
  done
  echo "$LINE" | tee -a "$LOGFILE"
  printf "$FORMAT\n" "Total:" "$errors_cnt" "$total_cnt" "$total_time" "" | tee -a "$LOGFILE"
  echo "$LINE" | tee -a "$LOGFILE"
  echo | tee -a "$LOGFILE"
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

main() {
  parse_arguments "$@"
  
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo >&2
    echo "Error: Not a git repository" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$LOGFILE")" >/dev/null
  if [ "$print_last" -ne 0 ]; then
    file="$STATE_FILE"
    [ ! -f "$file" ] && { file="$STATE_FILE_BACKUP"; }
    [ ! -f "$file" ] && { echo "No current run file \"$STATE_FILE\" found and no last run file \"$STATE_FILE_BACKUP\" found."; exit 1; }
    load_state "$file"
    print_summary
    return 0
  else
    echo "" >"$LOGFILE"
    load_state
    run_all 0 "$@"
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
