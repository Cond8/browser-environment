// src/features/editor/transpilers/transpiler.examples.test.ts
export const JSON_EXAMPLE = {
  interface: {
    name: 'ClassifyEmail',
    service: 'understand',
    method: 'analyze_email_content',
    goal: 'Categorize emails into spam or not spam based on content analysis and sender information',
    params: {
      raw_email: {
        type: 'string',
        description: 'The complete raw email content including headers and body',
      },
      classification_rules: {
        type: 'object',
        description: 'Rules and thresholds for spam classification',
      },
    },
    returns: {
      is_spam: { type: 'boolean', description: 'Whether the email is classified as spam' },
    },
  },
  steps: [
    {
      name: 'ExtractContent',
      service: 'extract',
      method: 'extract_email_body_subject_sender',
      goal: "Extract the body, subject line, and sender's email address from incoming emails",
      params: {
        raw_email: {
          type: 'string',
          description: 'The complete raw email content including headers and body',
        },
      },
      returns: {
        email_content: { type: 'string', description: 'The extracted email body content' },
        subject_line: { type: 'string', description: 'The extracted email subject line' },
        sender_address: { type: 'string', description: "The extracted sender's email address" },
      },
    },
    {
      name: 'AnalyzeContent',
      service: 'understand',
      method: 'analyze_spam_patterns',
      goal: 'Analyze the extracted content for spam patterns and keywords using machine learning or predefined ruleset',
      params: {
        email_content: { type: 'string', description: 'The email body content to analyze' },
        subject_line: { type: 'string', description: 'The email subject line to analyze' },
        sender_address: { type: 'string', description: "The sender's email address to analyze" },
      },
      returns: {
        spam_score: {
          type: 'number',
          description: 'A score between 0 and 1 indicating spam likelihood',
        },
      },
    },
    {
      name: 'ClassifyEmail',
      service: 'logic',
      method: 'classify_email_based_on_spam_score',
      goal: "Categorize the email into 'spam' or 'not spam' based on a predefined threshold for spam score",
      params: {
        spam_score: {
          type: 'number',
          description: 'A score between 0 and 1 indicating spam likelihood',
        },
        classification_rules: {
          type: 'object',
          description: 'Rules and thresholds for spam classification',
        },
      },
      returns: {
        is_spam: { type: 'boolean', description: 'Whether the email is classified as spam' },
      },
    },
  ],
};

export const DSL_EXAMPLE = `
/**
 * Categorize emails into spam or not spam based on content analysis and sender information.
 *
 * @name ClassifyEmail
 * @service understand
 * @method analyze_email_content
 * @param {string} raw_email - The full raw email
 * @param {object} classification_rules - Rules for spam classification
 * @returns {boolean} classified_as_spam - Whether the email is classified as spam
 */

/**
 * Extract the body, subject line, and sender's email address from incoming emails.
 *
 * @name ExtractContent
 * @service extract
 * @method extract_email_body_subject_sender
 * @param {string} raw_email - The full raw email
 * @returns {string} email_content - The email body content
 * @returns {string} subject_line - The email subject line
 * @returns {string} sender_address - The sender's email address
 */

/**
 * Analyze the extracted content for spam patterns and keywords using machine learning or predefined ruleset.
 *
 * @name AnalyzeContent
 * @service understand
 * @method analyze_spam_patterns
 * @param {string} email_content - The email body content
 * @param {string} subject_line - The email subject line
 * @param {string} sender_address - The sender's email address
 * @returns {number} spam_score - Score between 0-1 indicating spam likelihood
 */

/**
 * Categorize the email into 'spam' or 'not spam' based on a predefined threshold for spam score.
 *
 * @name ClassifyEmail
 * @service logic
 * @method classify_email_based_on_spam_score
 * @param {number} spam_score - Score between 0-1 indicating spam likelihood
 * @param {object} classification_rules - Rules for spam classification
 * @returns {boolean} is_spam - True if classified as spam
 */
`;
