#!/usr/bin/env bash
# shellcheck disable=SC2059

# Merge main branch into all UI branches

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

COMMAND=(pnpm run all)
# COMMAND=(pnpm run check)

LOGFILE=log.runallall
STOP_ON_ERROR=0

SOURCE_BRANCH="main"

export GOOD_SKIP_TARGET_BRANCHES=(
)
TARGET_BRANCHES=(
  "main"
  "histoire"
  "storybook"
  "ui-agnostic"
  "ui-bulma"
  "ui-carbon"
  "ui-shoelace"
  "ui-svelteui"
  "ui-tailwindcss"
)
export BROKEN_TARGET_BRANCHES=(
  "ui-bootstrap" # `pnpm check`: Error: Argument of type 'typeof Col' is not assignable to parameter of type 'ConstructorOfATypedSvelteComponent'.
  "ui-framework7" # `pnpm build:base`: "Error: The 'swSrc' file can't be read. ENOENT: no such file or directory" - service worker build fails, probably due to all components not compatible with Svelte 5, buncho "ARIA role" issues, etc.
  "ui-konsta" # `pnpm check`: Error: Argument of type 'typeof App' is not assignable to parameter of type 'ConstructorOfATypedSvelteComponent'.
)

# alias decolor='sed "s/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g"'
function decolor() {
  local input
  input="$1"
  echo -e "$input" | sed 's/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g'
}

function main() {
  # Check that local repo is clean
  if ! output=$(git status --untracked-files=no --porcelain 2>&1) || [ -n "$output" ]; then
    # Working directory clean excluding untracked files
    echo "Working folder is not clean. Please clean working folder and retry."
    echo "$output"
    return 1
  else 
    echo "Working folder is clean."
  fi

  outputs=()
  errors=()
  for i in "${!TARGET_BRANCHES[@]}"; do 
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
    LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
    (rm "$LOGFILE_I" 2>/dev/null)
    errors[i]="--"
    outputs[i]="\033[31m(did not run)\033[36m"
  done
  # errors[0]=0 ;# for DEBUG only
  # errors[1]=1 ;# for DEBUG only
  echo "" >"$LOGFILE"

  # Fetch the latest changes from the remote repository
  git fetch origin

  # Loop through each target branch and run command
  # tms_user=()
  # tms_system=()
  tms_real=()
  for i in "${!TARGET_BRANCHES[@]}"; do
    # break ;# for DEBUG only
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
    LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
    # Switch to the target branch
    echo "CHECKOUT $TARGET_BRANCH" | tee -a "$LOGFILE" | tee "$LOGFILE_I"
    git checkout "$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2)

    echo "BEGIN command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\"..." | tee -a "$LOGFILE"
    # output=$("${COMMAND[@]}" >>"$LOGFILE_I" 2>&1)
    # tm "${COMMAND[@]}" >>"$LOGFILE_I" 2>&1
    # output=$(tm "${COMMAND[@]}" >>"$LOGFILE_I" 2>&1)

    # Run command and collect it's real/user/system times (in seconds), using `time` with `TIMEFORMAT`
    TIMEFORMAT="%3R %3U %3S"
    t=$( { time "${COMMAND[@]}" >>"$LOGFILE_I" 2>&1; } 2>&1 )  # Captures time output into t.
    error=$?
    # echo "DEBUG: error=$error, t=$t"
    IFS=' ' read -r real user system <<< "$t"
    tms_real[i]=$real
    # tms_user[i]=$user
    # tms_system[i]=$system
    # echo "DEBUG: real=$real user=$user system: $system"
    outputs[i]=""
    errors[i]="$error"
    # TODO: (now) Check for errors and stop if any.
    if [ "$error" -ne 0 ] ; then
      [ "$output" == "" ] && output=$(grep -i "error" "$LOGFILE_I" | tail -n1)
      outputs[i]="$output"
      if [ $STOP_ON_ERROR -ne 0 ]; then
        echo "ERROR $error in branch \"$TARGET_BRANCH\", stopping." | tee -a "$LOGFILE"
        break
      else
        echo "ERROR $error in branch \"$TARGET_BRANCH\", cleaning up and continuing." | tee -a "$LOGFILE"
        git reset --hard "origin/$TARGET_BRANCH" 1> >(tee -a "$LOGFILE_I") 2> >(tee -a "$LOGFILE_I" >&2)
      fi
    fi

    echo "DONE  command \"${COMMAND[*]}\" in branch \"$TARGET_BRANCH\", error=$error" | tee -a "$LOGFILE"
    echo | tee -a "$LOGFILE"
  done

  (git checkout "$SOURCE_BRANCH")

  result=0
  errors_cnt=0
  pass_cnt=0
  total_cnt=0
  total_time=0
  FORMAT="| %-20s | %6s | %-30s | %9s | %-100s |"
  HEAD=$(printf "$FORMAT" "Branch" "Error" "Log File" "Time (s)" "Output")
  LINE=$(printf "$FORMAT" "" "" "" "")
  LINE="${LINE// /-}"
  echo | tee -a "$LOGFILE"
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
    total_time=$(awk "BEGIN {print ($total_time+${tms_real[$i]})}")
    [ "$color_red" -ne 0 ] && echo -n -e "\033[31m"
    printf "$FORMAT\n" "$TARGET_BRANCH" "$error" "$LOGFILE_I" "${tms_real[$i]}" "${output:0:100}" | tee -a "$LOGFILE"
    [ "$color_red" -ne 0 ] && echo -n -e "\033[36m"
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
  
  echo "DONE command \"${COMMAND[*]}\" in $total_cnt target branches, $pass_cnt passed, $errors_cnt error(s), $total_time_h:$total_time_m:$total_time_s elapsed time." | tee -a "$LOGFILE"
  echo | tee -a "$LOGFILE"

  return $result
}

main "@$"
