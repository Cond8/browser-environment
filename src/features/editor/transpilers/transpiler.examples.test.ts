export const JSON_EXAMPLE = {
  interface: {
    name: 'ClassifyEmail',
    service: 'understand',
    method: 'analyze_email_content',
    goal: 'Categorize emails into spam or not spam based on content analysis and sender information',
    params: {
      raw_email: 'text - The complete raw email content including headers and body',
      classification_rules: 'object - Rules and thresholds for spam classification',
    },
    returns: {
      is_spam: 'boolean - Whether the email is classified as spam',
    },
  },
  steps: [
    {
      name: 'ExtractContent',
      service: 'extract',
      method: 'extract_email_body_subject_sender',
      goal: "Extract the body, subject line, and sender's email address from incoming emails",
      params: {
        raw_email: 'text - The complete raw email content including headers and body',
      },
      returns: {
        email_content: 'text - The extracted email body content',
        subject_line: 'text - The extracted email subject line',
        sender_address: "text - The extracted sender's email address",
      },
    },
    {
      name: 'AnalyzeContent',
      service: 'understand',
      method: 'analyze_spam_patterns',
      goal: 'Analyze the extracted content for spam patterns and keywords using machine learning or predefined ruleset',
      params: {
        email_content: 'text - The email body content to analyze',
        subject_line: 'text - The email subject line to analyze',
        sender_address: "text - The sender's email address to analyze",
      },
      returns: {
        spam_score: 'number - A score between 0 and 1 indicating spam likelihood',
      },
    },
    {
      name: 'ClassifyEmail',
      service: 'logic',
      method: 'classify_email_based_on_spam_score',
      goal: "Categorize the email into 'spam' or 'not spam' based on a predefined threshold for spam score",
      params: {
        spam_score: 'number - A score between 0 and 1 indicating spam likelihood',
        classification_rules: 'object - Rules and thresholds for spam classification',
      },
      returns: {
        is_spam: 'boolean - Whether the email is classified as spam',
      },
    },
  ],
};

export const DSL_EXAMPLE = `
INTERFACE ClassifyEmail {
  SERVICE understand
  METHOD analyze_email_content
  GOAL Categorize emails into spam or not spam based on content analysis and sender information
  PARAMS {
    email_text: "text - Raw email content to analyze"
    classification_rules: "object - Rules for spam classification"
  }
  RETURNS {
    classified_as_spam: "boolean - Whether the email is classified as spam"
  }
}

EXTRACT ExtractContent {
  METHOD extract_email_body_subject_sender
  GOAL "Extract the body, subject line, and sender's email address from incoming emails"
  PARAMS {
    raw_email: "text - Complete raw email content"
  }
  RETURNS {
    email_content: "text - The email body content"
    subject_line: "text - The email subject line"
    sender_address: "text - The sender's email address"
  }
}

UNDERSTAND AnalyzeContent {
  METHOD analyze_spam_patterns
  GOAL Analyze the extracted content for spam patterns and keywords using machine learning or predefined ruleset
  PARAMS {
    email_content: "text - Email body content"
    subject_line: "text - Email subject line"
    sender_address: "text - Sender's email address"
  }
  RETURNS {
    spam_score: "number - Score between 0-1 indicating spam likelihood"
  }
}

LOGIC ClassifyEmail {
  METHOD classify_email_based_on_spam_score
  GOAL Categorize the email into 'spam' or 'not spam' based on a predefined threshold for spam score
  PARAMS {
    spam_score: "number - Score between 0-1 indicating spam likelihood"
    classification_rules: "object - Rules for spam classification"
  }
  RETURNS {
    is_spam: "boolean - True if classified as spam"
  }
}
`;
