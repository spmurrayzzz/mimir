/**
 * Template for bug fixing prompts
 */

module.exports = `
# Bug Fix Task

## Issue Description
{issueDescription}

## Problematic Code
\`\`\`{language}
{code}
\`\`\`

## Error Messages (if any)
{errorMessages}

## Expected Behavior
{expectedBehavior}

## Actual Behavior
{actualBehavior}

## Project Context
{projectContext}

Please identify the cause of the bug and provide a corrected version of the code. Explain your reasoning for the fix and any important considerations or potential side effects of the changes.
`;