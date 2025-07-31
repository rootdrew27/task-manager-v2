#!/bin/bash

# Get the staged changes information
STAGED_DETAILS=$(git diff --cached --stat)
FULL_DIFF=$(git diff --cached)

# Create a prompt for Claude Code to update CLAUDE.md
# NOTE: The last paragraph of the prompt may be redundant.
CLAUDE_PROMPT="Based on the following staged changes, please review and update the CLAUDE.md file, if necessary, to reflect any architectural changes, large feature changes, or any other information relevant to development within the current workspace:

Staged Details:
$STAGED_DETAILS

Complete diff with before-and-after changes:
$FULL_DIFF

Please analyze these staged changes, as well as any relevant files in the current workspace, and update CLAUDE.md only if the changes introduce new features, modify existing architecture, or change any information that should be documented for future development."

echo "Running claude command to check if CLAUDE.md needs updates based on latest commit..."

# Create a temporary script file with the claude command and prompt
TEMP_SCRIPT="/tmp/claude_update_$(date +%s).sh"
cat > "$TEMP_SCRIPT" << EOF
#!/bin/bash
echo "Analyzing latest commit for CLAUDE.md updates..."
claude '$CLAUDE_PROMPT'
echo ""
echo "Analysis complete. Press Enter to close this terminal..."
read
EOF

chmod +x "$TEMP_SCRIPT"

# Execute the script in a new terminal window
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "$TEMP_SCRIPT"
elif command -v xterm &> /dev/null; then
    xterm -e "bash -c '$TEMP_SCRIPT'"
else
    # Fallback: run in background and output to a file
    echo "No suitable terminal found. Running claude command in background..."
    "$TEMP_SCRIPT" > "/tmp/claude_output_$(date +%s).log" 2>&1 &
fi

# Clean up the temporary script after a delay
(sleep 60 && rm -f "$TEMP_SCRIPT") &