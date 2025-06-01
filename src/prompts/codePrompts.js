/**
 * AI code generation prompt templates
 */

/**
 * Format a prompt template with variables
 * @param {string} template - Prompt template with {variable} placeholders
 * @param {Object} variables - Object with variable values
 * @returns {string} - Formatted prompt
 */
function formatPrompt(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

// Code completion prompt
export const CODE_COMPLETION = {
  id: 'code-completion',
  name: 'Code Completion',
  description: 'Complete the code based on context',
  template: `
Complete the following code:

LANGUAGE: {language}
CONTEXT: {context}

CODE:
{code}

COMPLETION:
`,
  variables: ['language', 'context', 'code']
};

// Code refactoring prompt
export const CODE_REFACTOR = {
  id: 'code-refactor',
  name: 'Code Refactoring',
  description: 'Refactor code for better quality',
  template: `
Refactor the following code to improve:
- Readability
- Performance
- Best practices

LANGUAGE: {language}
CODE:
{code}

REFACTORED CODE:
`,
  variables: ['language', 'code']
};

// Bug fixing prompt
export const FIX_BUG = {
  id: 'fix-bug',
  name: 'Fix Bug',
  description: 'Identify and fix bugs in code',
  template: `
Fix bugs in the following code:

LANGUAGE: {language}
ISSUE DESCRIPTION: {issue}
CODE:
{code}

FIXED CODE:
`,
  variables: ['language', 'issue', 'code']
};

// Documentation generation prompt
export const GENERATE_DOCS = {
  id: 'generate-docs',
  name: 'Generate Documentation',
  description: 'Generate documentation for code',
  template: `
Generate documentation for the following code:

LANGUAGE: {language}
CODE:
{code}

DOCUMENTATION:
`,
  variables: ['language', 'code']
};

// Export all prompts
export const CODE_PROMPTS = [
  CODE_COMPLETION,
  CODE_REFACTOR,
  FIX_BUG,
  GENERATE_DOCS
];

// Export the formatter
export { formatPrompt };