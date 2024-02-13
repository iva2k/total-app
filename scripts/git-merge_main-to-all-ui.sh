#!/usr/bin/env bash
# shellcheck disable=SC2059

# Merge main branch into all UI branches

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"

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

# alias decolor='sed "s/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g"'
function decolor() {
  local input
  input="$1"
  echo -e "$input" | sed 's/\x1B\[\([0-9]\{1,2\}\(;[0-9]\{1,2\}\)\?\)\?[mGK]//g'
}

function merge_to_all() {
  # Check that local repo is clean
  if ! output=$(git status --untracked-files=no --porcelain 2>&1) || [ -n "$output" ]; then
    # Working directory clean excluding untracked files
    echo "Working folder is not clean. Please clean working folder and retry."
    echo "$output"
    return 1
  else 
    echo "Working folder is clean."
  fi

  if ! output=$(git rev-list "${SOURCE_BRANCH}...origin/${SOURCE_BRANCH}" 2>&1) || [ -n "$output" ]; then
    # Branch is different from origin
    echo "Branch \"$SOURCE_BRANCH\" in local repo is not synced with remote origin. Please sync local branch and retry."
    # echo "$output"
    return 1
  else 
    echo "Local branch is in sync."
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

  # Fetch the latest changes from the remote repository
  git fetch origin

  # Switch to the source branch
  git checkout "$SOURCE_BRANCH"

  # Pull the latest changes from the source branch
  git pull origin "$SOURCE_BRANCH"

  # Loop through each target branch and merge changes
  for i in "${!TARGET_BRANCHES[@]}"; do
    TARGET_BRANCH="${TARGET_BRANCHES[$i]}"
    echo "BEGIN Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..."
    # Switch to the target branch, Merge changes from the source branch

    # Assume we will succeed
    outputs[i]=""
    errors[i]=0

    # Checkout target branch
    if ! output=$(git checkout "$TARGET_BRANCH") ; then
      echo "Error checking out branch \"$TARGET_BRANCH\"."
      outputs[i]="Error checking out branch"
      errors[i]=1
      continue
    fi

    # Merge but not commit
    # if ! git merge "$SOURCE_BRANCH" --no-edit ; then
    git merge "$SOURCE_BRANCH" --no-commit
    res=$?
    # Check if package.json file is updated (ignore conflicted)
    (git diff --exit-code "package.json" >/dev/null 2>&1) && pkg_updated=0 || pkg_updated=1

    if [ "$res" -ne 0 ] ; then
      echo "Merge conflict(s) detected in \"$TARGET_BRANCH\" branch."

      # Check for conflicts in package.json (which will break rebuilding pnpm-lock.yaml)
      if git diff --name-only --diff-filter=U | grep -q "package.json"; then
        echo " \"package.json\" file has conflicts, cannot resolve automatically."
        echo "  Please resolve any remaining Merge conflicts manually, commit and push changes, and run this script again."
        outputs[i]="Merge conflicts in \"package.json\", can't resolve automatically"
        errors[i]=1
        return 1
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
        echo "  There are remaining unresolved Merge conflicts in branch \"$TARGET_BRANCH\":"
        echo "$output"
        echo "  Please resolve any remaining Merge conflicts manually, commit and push changes, and run this script again."
        outputs[i]="Merge conflicts, can't resolve automatically"
        errors[i]=1
        return 1
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

    echo "DONE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"."
    echo
  done

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

  git checkout "$SOURCE_BRANCH"

  return $result
}

(return 0 2>/dev/null) && sourced=1 || sourced=0
[ "$sourced" -eq 0 ] && merge_to_all "@$"
