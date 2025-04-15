// src/features/editor/transpilers-dsl-source/example.json.example.ts
export const JSON_EXAMPLE = {
  blocks: [
    {
      name: 'ClassifyEmailWorkflow',
      service: 'understand',
      method: 'classify_email_workflow',
      goal: 'Classifies incoming emails as spam or not spam using content analysis and rule-based classification.',
      params: {
        raw_email: {
          type: 'string',
          description: 'The original raw email content',
        },
        classification_rules: {
          type: 'object',
          description: 'Rules used to determine spam classification',
        },
      },
      returns: {
        is_spam: {
          type: 'boolean',
          description: 'Whether the email is considered spam',
        },
      },
    },
    {
      name: 'ValidateEmail',
      service: 'validate',
      method: 'validate_email_input',
      goal: 'Validate the structure and required fields of the raw email input.',
      params: {
        raw_email: {
          type: 'string',
          description: 'The original raw email content',
        },
      },
      returns: {
        validated_email: {
          type: 'string',
          description: 'The validated email content',
        },
      },
    },
    {
      name: 'ExtractEmailFields',
      service: 'extract',
      method: 'extract_email_fields',
      goal: 'Extract the body, subject, and sender address from the validated email.',
      params: {
        validated_email: {
          type: 'string',
          description: 'The validated email content',
        },
      },
      returns: {
        email_content: {
          type: 'string',
          description: 'The main body of the email',
        },
        subject_line: {
          type: 'string',
          description: 'The subject line of the email',
        },
        sender_address: {
          type: 'string',
          description: "The sender's email address",
        },
      },
    },
    {
      name: 'FetchSenderReputation',
      service: 'storage',
      method: 'get_sender_reputation',
      goal: 'Retrieve known sender reputation or blacklist data from storage.',
      params: {
        sender_address: {
          type: 'string',
          description: "The sender's email address",
        },
      },
      returns: {
        is_sender_blacklisted: {
          type: 'boolean',
          description: 'Whether the sender is blacklisted',
        },
      },
    },
    {
      name: 'AnalyzeSpamScore',
      service: 'understand',
      method: 'compute_spam_score',
      goal: 'Analyze email content and metadata to assign a spam score.',
      params: {
        email_content: {
          type: 'string',
          description: 'The email body content',
        },
        subject_line: {
          type: 'string',
          description: 'The subject line',
        },
        is_sender_blacklisted: {
          type: 'boolean',
          description: 'Whether the sender is blacklisted',
        },
      },
      returns: {
        spam_score: {
          type: 'number',
          description: 'A number between 0 and 1 indicating likelihood of spam',
        },
      },
    },
    {
      name: 'ClassifyWithRules',
      service: 'logic',
      method: 'apply_spam_rules',
      goal: 'Apply classification rules to decide whether the email is spam.',
      params: {
        spam_score: {
          type: 'number',
          description: 'The spam score from the analysis',
        },
        classification_rules: {
          type: 'object',
          description: 'The classification rules',
        },
      },
      returns: {
        is_spam: {
          type: 'boolean',
          description: 'Final classification decision',
        },
      },
    },
    {
      name: 'FormatClassificationResult',
      service: 'format',
      method: 'format_spam_result',
      goal: 'Format the final result as a flat return value.',
      params: {
        is_spam: {
          type: 'boolean',
          description: 'The classification result',
        },
      },
      returns: {
        is_spam: {
          type: 'boolean',
          description: 'Whether the email is spam',
        },
      },
    },
  ],
};
