#!/usr/bin/env bash

# Merge main branch into all UI branches

git config user.email "iva2k@yahoo.com"
git config user.name "IVA2K"
  
SOURCE_BRANCH="main"
TARGET_BRANCHES=(
  "histoire"
)
TARGET_BRANCHES_FUTURE=(
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

# Fetch the latest changes from the remote repository
git fetch origin

# Switch to the source branch
git checkout "$SOURCE_BRANCH"

# Pull the latest changes from the source branch
git pull origin "$SOURCE_BRANCH"

# Loop through each target branch and merge changes
for TARGET_BRANCH in "${TARGET_BRANCHES[@]}"; do
    echo "BEGIN Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\"..."
    # Switch to the target branch, Merge changes from the source branch
    git checkout "$TARGET_BRANCH" && git merge "$SOURCE_BRANCH" --no-edit

    # Check for merge conflicts
    if [ $? -ne 0 ]; then
        echo "Merge conflict detected in \"$TARGET_BRANCH\" branch. Please resolve conflicts manually, push changes, and run the script again."
        exit 1
    fi

    # Push the changes to the remote repository
    git push origin "$TARGET_BRANCH"

    # # Switch back to the source branch for the next iteration
    # git checkout "$SOURCE_BRANCH"

    echo "DONE Merging branch \"$SOURCE_BRANCH\" into branch \"$TARGET_BRANCH\".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gi"
    echo
done

echo "DONE Merging branch \"$SOURCE_BRANCH\" into all target branches."
echo

git checkout "$SOURCE_BRANCH"
