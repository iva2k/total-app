#!/usr/bin/env bash
# shellcheck disable=SC2059

# Merge main branch into all UI branches

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

DEBUG=0
# DEBUG=1
STATE_FILE="./.git-merge-all.state.local"

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
# SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"
# SEP3="$(printf "%100s\r" "" | tr ' ' '-')"

outputs=()
errors=()
branches_done=()
function clear_state() {
  if [ -f "$STATE_FILE" ]; then
    rm "$STATE_FILE"
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: clear_state() deleted file $STATE_FILE."
  else
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: clear_state() no file $STATE_FILE."
  fi
}
function save_state() {
  rc="$1"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: save_state($rc) saving to file \"$STATE_FILE\"."
  declare -p outputs > "$STATE_FILE"
  declare -p errors >> "$STATE_FILE"
  declare -p branches_done >> "$STATE_FILE"
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: save_state($rc) DONE saving to file \"$STATE_FILE\"."
  echo
  exit $((rc))
}
function load_state() {
  outputs=()
  errors=()
  branches_done=()
  if [ -f "$STATE_FILE" ]; then
    source "$STATE_FILE"
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() loaded from file $STATE_FILE."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: outputs=${outputs[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: errors=${errors[*]}."
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: branches_done=${branches_done[*]}."
    clear_state
  else
    [ "$DEBUG" -ne 0 ] && echo "DEBUG: load_state() no file $STATE_FILE."
  fi
}

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
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_one() is_continue=$is_continue i=$i TARGET_BRANCH=$TARGET_BRANCH"

  # $SOURCE_BRANCH should be clean
  # $TARGET_BRANCH should be clean

  # Assume we will succeed
  outputs[i]=""
  errors[i]=0

  if [ "$is_continue" = true ]; then
    echo "${SEP2}"
    echo "CONTINUE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..."
    echo
    res=0
  else
    echo "${SEP2}"
    echo "BEGIN Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..."
    echo
    # Switch to the target branch
    # Checkout target branch
    if ! output=$(git checkout "$TARGET_BRANCH") ; then
      echo
      echo "Error checking out branch \"$TARGET_BRANCH\"."
      outputs[i]="Error checking out branch"
      errors[i]=1
      save_state 1
    fi

    # Merge changes from the source branch, but not commit
    # if ! git merge "$SOURCE_BRANCH" --no-edit ; then
    git merge "$SOURCE_BRANCH" --no-commit
    res=$?
    if [ "$res" -ne 0 ] ; then
      echo "Merge conflict(s) detected in \"$TARGET_BRANCH\" branch."
    fi
  fi

  # Check if package.json file is updated (ignore conflicted)
  (git diff --exit-code "package.json" >/dev/null 2>&1) && pkg_updated=0 || pkg_updated=1
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_one() pkg_updated=$pkg_updated"

  if [ "$res" -ne 0 ] || [ "$is_continue" = true ] ; then

    # Check for conflicts in package.json (which will break rebuilding pnpm-lock.yaml)
    if git diff --name-only --diff-filter=U | grep -q "package.json"; then
      echo
      echo " \"package.json\" file has conflicts, cannot resolve automatically."
      echo
      echo "  Please resolve any remaining Merge conflicts manually, and run this script again with \"-c\" (continue) switch."
      outputs[i]="Merge conflicts in \"package.json\", can't resolve automatically"
      errors[i]=1
      save_state 1
    fi

    if git diff --name-only --diff-filter=U | grep -q "pnpm-lock.yaml"; then
      echo "  Merge conflict(s) in \"pnpm-lock.yaml\", recreating..."
      ( "${COMMAND_MERGE_LOCKFILE[@]}" )
      error=$?
      echo "  DONE Recreating \"pnpm-lock.yaml\", error=$error."
      pkg_updated=0
    fi

    output=$(git diff --name-only --diff-filter=U)
    if echo "$output" | grep -q .; then
      echo
      echo "  There are remaining unresolved Merge conflicts in branch \"$TARGET_BRANCH\":"
      echo "$output"
      echo
      echo "  Please resolve any remaining Merge conflicts manually, and run this script again with \"-c\" (continue) switch."
      outputs[i]="Merge conflicts, can't resolve automatically"
      errors[i]=1
      save_state 1
    else
      echo "  No unresolved Merge conflicts left, continuing..."
      git commit --no-edit
      outputs[i]="Merge conflicts resolved"
      errors[i]=0
    fi
  else
    git commit --no-edit
  fi

  if [ "$pkg_updated" -ne 0 ] ; then
    echo "  Changes to \"package.json\" file were merged, updating \"pnpm-lock.yaml\"..."
    outputs[i]="${outputs[i]}, package.json merged and lockfile updated"

    ( "${COMMAND_UPDATE_LOCKFILE[@]}" )
    error=$?
    echo "  DONE Updating \"pnpm-lock.yaml\", error=$error."
  fi

  # Push the changes to the remote repository
  git push origin "$TARGET_BRANCH"
  branches_done[i]="$TARGET_BRANCH"

  echo
  echo "DONE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"."
  echo
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
    echo "Error: not in any of the target branches"
    save_state 1
  fi

  i=$found_match
  merge_to_one true "$found_match"

  # Now can continue running the merge_to_all:
  merge_to_all "$((i+1))" "$@"
}

function merge_to_all() {
  start_i="$1"
  # Check that local repo is clean
  [ "$DEBUG" -ne 0 ] && echo "DEBUG: merge_to_all() start_i=$start_i"
  if ! output=$(git status --untracked-files=no --porcelain 2>&1) || [ -n "$output" ]; then
    # Working directory clean excluding untracked files
    echo
    echo "Working folder is not clean. Please clean working folder and retry."
    echo "$output"
    save_state 1
  else 
    echo "Working folder is clean."
  fi

  if ! output=$(git rev-list "${SOURCE_BRANCH}...origin/${SOURCE_BRANCH}" 2>&1) || [ -n "$output" ]; then
    # Branch is different from origin
    echo
    echo "Branch \"$SOURCE_BRANCH\" in local repo is not synced with remote origin. Please sync local branch and retry."
    # echo "$output"
    save_state 1
  else 
    echo "Local branch is in sync."
  fi

  # Clean logfiles, errors[] and outputs[]
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
    LOGFILE_I="$LOGFILE.$TARGET_BRANCH"
    (rm "$LOGFILE_I" 2>/dev/null)
    errors[i]="--"
    outputs[i]="\033[31m(did not run)\033[36m"
  done

  # Fetch the latest changes from the remote repository
  git fetch origin

  # Switch to the source branch
  git checkout "$SOURCE_BRANCH"

  # Pull the latest changes from the source branch
  git pull origin "$SOURCE_BRANCH"

  # Loop through each target branch and merge changes
  for i in $(seq "$start_i" $((${#TARGET_BRANCHES[@]}-1))); do
    merge_to_one false "$i"
  done

  git checkout "$SOURCE_BRANCH"
}

function print_summary() {
  result=0
  errors_cnt=0
  pass_cnt=0
  total_cnt=0
  FORMAT="| %-20s | %6s | %-100s |"
  HEAD=$(printf "$FORMAT" "Branch" "Error" "Output")
  LINE=$(printf "$FORMAT" "" "")
  LINE="${LINE// /-}"
  echo
  echo "SUMMARY for merge branch \"$SOURCE_BRANCH\" into all target branches:"
  echo "$LINE"
  echo "$HEAD"
  echo "$LINE"
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
    [ "$color_red" -ne 0 ] && echo -n -e "\033[31m"
    printf "$FORMAT\n" "$TARGET_BRANCH" "$error" "${output:0:100}"
    [ "$color_red" -ne 0 ] && echo -n -e "\033[36m"
  done
  echo "$LINE"
  printf "$FORMAT\n" "Total:" "$errors_cnt" ""
  echo "$LINE"
  echo

  echo "DONE Merging branch \"$SOURCE_BRANCH\" into $total_cnt target branches, $pass_cnt passed, $errors_cnt error(s)."
  echo

  return $result
}

main() {
  parse_arguments "$@"
  
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo
    echo "Error: Not a git repository"
    exit 1
  fi

  load_state
  if [ "$continue_merge" -ne 0 ]; then
    continue_merge_to_all "$@"
  else
    merge_to_all 0 "$@"
  fi
  
  print_summary
  rc="$?"
  
  # save_state "$rc"
  if [ "$rc" = 0 ]; then
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
