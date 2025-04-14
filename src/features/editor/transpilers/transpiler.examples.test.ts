export const JSON_EXAMPLE = {
  interface: {
    name: 'ClassifyEmail',
    service: 'understand',
    method: 'analyze_email_content',
    goal: 'Categorize emails into spam or not spam based on content analysis and sender information',
    params: ['raw_email', 'classification_rules'],
    returns: ['is_spam'],
  },
  steps: [
    {
      name: 'ExtractContent',
      service: 'extract',
      method: 'extract_email_body_subject_sender',
      goal: "Extract the body, subject line, and sender's email address from incoming emails",
      params: ['raw_email'],
      returns: ['email_content', 'subject_line', 'sender_address'],
    },
    {
      name: 'AnalyzeContent',
      service: 'understand',
      method: 'analyze_spam_patterns',
      goal: 'Analyze the extracted content for spam patterns and keywords using machine learning or predefined ruleset',
      params: ['email_content', 'subject_line', 'sender_address'],
      returns: ['spam_score'],
    },
    {
      name: 'ClassifyEmail',
      service: 'logic',
      method: 'classify_email_based_on_spam_score',
      goal: "Categorize the email into 'spam' or 'not spam' based on a predefined threshold for spam score",
      params: ['spam_score', 'classification_rules'],
      returns: ['is_spam'],
    },
  ],
};

export const DSL_EXAMPLE = `
INTERFACE ClassifyEmail {
  SERVICE understand
  METHOD analyze_email_content
  GOAL Categorize emails into spam or not spam based on content analysis and sender information
  PARAMS email_text, classification_rules
  RETURNS classified_as_spam
}

EXTRACT ExtractContent {
  METHOD extract_email_body_subject_sender
  GOAL "Extract the body, subject line, and sender's email address from incoming emails"
  PARAMS raw_email
  RETURNS email_content, subject_line, sender_address
}

UNDERSTAND AnalyzeContent {
  METHOD analyze_spam_patterns
  GOAL Analyze the extracted content for spam patterns and keywords using machine learning or predefined ruleset
  PARAMS email_content, subject_line, sender_address
  RETURNS spam_score
}

LOGIC ClassifyEmail {
  METHOD classify_email_based_on_spam_score
  GOAL Categorize the email into 'spam' or 'not spam' based on a predefined threshold for spam score
  PARAMS spam_score
  RETURNS is_spam
}
`;
