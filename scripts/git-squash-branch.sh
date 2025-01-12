#!/bin/bash

# Define the array of all branches to process if needed
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
)

# Few Level Heading Separators for Nice Log (carriage return at the end allows
#  echo "${SEP2}SOME HEADER " to print ---> "SOME HEADER ###########")
SEP1="$(printf "%100s\r" "" | tr ' ' '#')"
SEP2="$(printf "%100s\r" "" | tr ' ' '=')"
# SEP3="$(printf "%100s\r" "" | tr ' ' '-')"

# Function to process a single branch
process_branch() {
  local MAIN_BRANCH=$1
  local FEATURE_BRANCH=$2
  local DELETE_OLD=$3
  local SQUASH_BRANCH="squash-$FEATURE_BRANCH"

  echo "${SEP2}Processing branch '$FEATURE_BRANCH'"

  # Create and switch to the new squashed branch
  git checkout -b "$SQUASH_BRANCH" "$FEATURE_BRANCH"
  git reset "$(git merge-base "$MAIN_BRANCH" HEAD)"
  git add .
  git commit -m "Squashed commits from branch 'old-$FEATURE_BRANCH'"
  
  # Push the new squashed branch to remote
  git push -u origin "$SQUASH_BRANCH"
    
  if [ "$DELETE_OLD" = "delete-old" ]; then
    # Delete the old feature branch
    git branch -D "$FEATURE_BRANCH"
    git push origin --delete "$FEATURE_BRANCH"
    echo "Deleted old branch '$FEATURE_BRANCH' locally and remotely."
    OLD_BRANCH_OP="'$FEATURE_BRANCH' deleted"
  else
    # Rename the old feature branch 
    git branch -m "$FEATURE_BRANCH" "old-$FEATURE_BRANCH"

    # Rename the old feature branch on remote
    git push origin ":$FEATURE_BRANCH"
    git push -u origin "old-$FEATURE_BRANCH"
    echo "Renamed old branch to 'old-$FEATURE_BRANCH'."
    OLD_BRANCH_OP="renamed to 'old-$FEATURE_BRANCH'"

    # Remove the old feature branch locally
    git branch -d "old-$FEATURE_BRANCH"
  fi
  
  # Rename the squashed branch to replace the old feature branch
  git branch -m "$SQUASH_BRANCH" "$FEATURE_BRANCH"
  git push origin ":$SQUASH_BRANCH"
  git push -u origin "$FEATURE_BRANCH"
  
  echo "Created new branch '$FEATURE_BRANCH' with squashed commits, old branch $OLD_BRANCH_OP."
  echo
}

# Check if correct number of arguments are provided
if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "Replaces the feature branch with a new branch with all commits squashed."
  echo "Usage: $0 <main-branch-name> <feature-branch-name|all> [delete-old]"
  echo "Use 'all' as the second argument to process all branches."
  echo "Optional 'delete-old' third argument will delete the old feature branches instead of renaming them."
  exit 1
fi

# Assign arguments to variables
MAIN_BRANCH=$1
FEATURE_BRANCH=$2
DELETE_OLD=${3:-false}

if [ "$FEATURE_BRANCH" = "all" ]; then
  for branch in "${TARGET_BRANCHES[@]}"; do
    process_branch "$MAIN_BRANCH" "$branch" "$DELETE_OLD"
  done
else
  process_branch "$MAIN_BRANCH" "$FEATURE_BRANCH" "$DELETE_OLD"
fi

echo "${SEP1}"
echo "DONE. All operations completed."
echo
