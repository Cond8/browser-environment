export const DSL_EXAMPLE = `
/**
 * Classifies incoming emails as spam or not spam using content analysis and rule-based classification.
 *
 * @name ClassifyEmailWorkflow
 * @module understand
 * @function classify_email_workflow
 * @param {string} raw_email - The original raw email content
 * @param {object} classification_rules - Rules used to determine spam classification
 * @returns {boolean} is_spam - Whether the email is considered spam
 */
/**
 * Validate the structure and required fields of the raw email input.
 *
 * @name ValidateEmail
 * @module validate
 * @function validate_email_input
 * @param {string} raw_email - The original raw email content
 * @returns {string} validated_email - The validated email content
 */
/**
 * Extract the body, subject, and sender address from the validated email.
 *
 * @name ExtractEmailFields
 * @module extract
 * @function extract_email_fields
 * @param {string} validated_email - The validated email content
 * @returns {string} email_content - The main body of the email
 * @returns {string} subject_line - The subject line of the email
 * @returns {string} sender_address - The sender's email address
 */
/**
 * Retrieve known sender reputation or blacklist data from storage.
 *
 * @name FetchSenderReputation
 * @module storage
 * @function get_sender_reputation
 * @param {string} sender_address - The sender's email address
 * @returns {boolean} is_sender_blacklisted - Whether the sender is blacklisted
 */
/**
 * Analyze email content and metadata to assign a spam score.
 *
 * @name AnalyzeSpamScore
 * @module understand
 * @function compute_spam_score
 * @param {string} email_content - The email body content
 * @param {string} subject_line - The subject line
 * @param {boolean} is_sender_blacklisted - Whether the sender is blacklisted
 * @returns {number} spam_score - A number between 0 and 1 indicating likelihood of spam
 */
/**
 * Apply classification rules to decide whether the email is spam.
 *
 * @name ClassifyWithRules
 * @module logic
 * @function apply_spam_rules
 * @param {number} spam_score - The spam score from the analysis
 * @param {object} classification_rules - The classification rules
 * @returns {boolean} is_spam - Final classification decision
 */
/**
 * Format the final result as a flat return value.
 *
 * @name FormatClassificationResult
 * @module format
 * @function format_spam_result
 * @param {boolean} is_spam - The classification result
 * @returns {boolean} is_spam - Whether the email is spam
 */
`;
