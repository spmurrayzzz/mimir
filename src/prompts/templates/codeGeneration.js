/**
 * Template for code generation prompts
 */

module.exports = `
# Code Generation Task

## Task Description
Generate code based on the following requirements:

## Language/Framework
{language}

## Requirements
{requirements}

## Project Context
{projectContext}

## Additional Notes
{additionalNotes}

Please provide well-structured, efficient code that follows best practices for {language}. Include appropriate error handling, comments, and any necessary imports or dependencies.

If multiple implementation approaches are possible, explain the tradeoffs briefly and implement the most appropriate solution for this context.
`;