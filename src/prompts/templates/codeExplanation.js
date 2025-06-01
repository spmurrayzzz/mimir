/**
 * Template for code explanation prompts
 */

module.exports = `
# Code Explanation Task

## Code to Explain
\`\`\`{language}
{code}
\`\`\`

## Explanation Type
{explanationType}

## Context
{context}

Please provide a clear explanation of the code above. Focus on:

1. The overall purpose and functionality
2. The key components or sections
3. Important variables, functions, or logic
4. Design patterns or techniques being used
5. Potential edge cases or limitations

Tailor the explanation to be {explanationLevel} (e.g., beginner, intermediate, advanced).
`;