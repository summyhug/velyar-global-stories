/**
 * Content Moderation Utilities
 * Basic content filtering and validation for user-generated content
 */

// Basic list of prohibited words and phrases
export const bannedWords = [
  // Violence and threats
  'kill', 'murder', 'death', 'suicide', 'bomb', 'weapon', 'gun', 'knife',
  'violence', 'attack', 'hurt', 'harm', 'threat', 'dangerous',
  
  // Hate speech and discrimination
  'hate', 'racist', 'nazi', 'fascist', 'terrorist', 'supremacist',
  'slur', 'bigot', 'discrimination', 'prejudice',
  
  // Adult content
  'sexual', 'porn', 'nude', 'naked', 'sex', 'adult', 'explicit',
  'nsfw', 'erotic', 'fetish', 'xxx',
  
  // Illegal activities
  'illegal', 'drug', 'cocaine', 'heroin', 'meth', 'cannabis', 'weed',
  'steal', 'robbery', 'fraud', 'scam', 'hack', 'piracy',
  
  // Spam and commercial
  'spam', 'advertising', 'promotion', 'sale', 'buy now', 'click here',
  'make money', 'get rich', 'free money', 'earn cash',
  
  // Copyright and trademark
  'copyright', 'trademark', 'registered', 'intellectual property',
  'unauthorized', 'pirated', 'bootleg'
];

// Patterns that might indicate sensitive information
export const suspiciousPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card pattern
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
  /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/, // Phone number pattern
  /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/g // URL pattern
];

export interface ContentModerationResult {
  isAllowed: boolean;
  reason?: string;
  flaggedWords?: string[];
  flaggedPatterns?: string[];
  confidence: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Basic content filtering function
 * @param text - Text content to moderate
 * @returns ContentModerationResult
 */
export const basicContentFilter = (text: string): ContentModerationResult => {
  if (!text || typeof text !== 'string') {
    return {
      isAllowed: true,
      confidence: 1.0,
      severity: 'low'
    };
  }

  const lowerText = text.toLowerCase();
  const flaggedWords: string[] = [];
  const flaggedPatterns: string[] = [];

  // Check for banned words
  for (const word of bannedWords) {
    if (lowerText.includes(word.toLowerCase())) {
      flaggedWords.push(word);
    }
  }

  // Check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      flaggedPatterns.push(pattern.toString());
    }
  }

  // Determine severity based on flagged content
  let severity: 'low' | 'medium' | 'high' = 'low';
  if (flaggedWords.some(word => ['kill', 'murder', 'bomb', 'terrorist'].includes(word))) {
    severity = 'high';
  } else if (flaggedWords.length > 2 || flaggedPatterns.length > 0) {
    severity = 'medium';
  }

  // Block high severity content
  if (severity === 'high') {
    return {
      isAllowed: false,
      reason: `Contains high-risk content: ${flaggedWords.join(', ')}`,
      flaggedWords,
      flaggedPatterns,
      confidence: 0.95,
      severity
    };
  }

  // Flag medium severity content for review
  if (flaggedWords.length > 0) {
    return {
      isAllowed: false,
      reason: `Contains prohibited words: ${flaggedWords.join(', ')}`,
      flaggedWords,
      flaggedPatterns,
      confidence: 0.8,
      severity
    };
  }

  // Flag suspicious patterns
  if (flaggedPatterns.length > 0) {
    return {
      isAllowed: false,
      reason: 'Contains potentially sensitive information (email, phone, etc.)',
      flaggedWords,
      flaggedPatterns,
      confidence: 0.7,
      severity
    };
  }

  return {
    isAllowed: true,
    confidence: 0.9,
    severity: 'low'
  };
};

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) return 0;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Verify age compliance
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Verification result with account type
 */
export const verifyAge = (dateOfBirth: string): { 
  isValid: boolean; 
  accountType: 'full' | 'restricted' | 'blocked'; 
  reason?: string;
  age: number;
} => {
  const age = calculateAge(dateOfBirth);
  
  if (age < 13) {
    return {
      isValid: false,
      accountType: 'blocked',
      reason: 'Must be 13 or older to use this platform',
      age
    };
  }
  
  if (age < 16) {
    return {
      isValid: true,
      accountType: 'restricted',
      reason: 'Limited features due to age restrictions (under 16)',
      age
    };
  }
  
  return {
    isValid: true,
    accountType: 'full',
    age
  };
};

/**
 * Validate video content before upload
 * @param caption - Video caption text
 * @param location - Location text (optional)
 * @returns Validation result
 */
export const validateVideoContent = (
  caption: string, 
  location?: string
): { isValid: boolean; message?: string; severity: 'low' | 'medium' | 'high' } => {
  // Check caption
  const captionResult = basicContentFilter(caption);
  if (!captionResult.isAllowed) {
    return {
      isValid: false,
      message: `Caption: ${captionResult.reason}`,
      severity: captionResult.severity
    };
  }
  
  // Check location if provided
  if (location && location.trim()) {
    const locationResult = basicContentFilter(location);
    if (!locationResult.isAllowed) {
      return {
        isValid: false,
        message: `Location: ${locationResult.reason}`,
        severity: locationResult.severity
      };
    }
  }
  
  return { 
    isValid: true, 
    severity: 'low' 
  };
};

/**
 * Generate a user-friendly error message for content violations
 * @param result - Content moderation result
 * @returns User-friendly error message
 */
export const getContentViolationMessage = (result: ContentModerationResult): string => {
  if (result.severity === 'high') {
    return 'This content contains material that violates our community guidelines and cannot be posted.';
  }
  
  if (result.flaggedWords && result.flaggedWords.length > 0) {
    return 'Your content contains words that may violate our community guidelines. Please review and edit your content.';
  }
  
  if (result.flaggedPatterns && result.flaggedPatterns.length > 0) {
    return 'Your content appears to contain personal information. For your safety, please remove any emails, phone numbers, or other sensitive data.';
  }
  
  return 'Your content may violate our community guidelines. Please review and try again.';
};

/**
 * Content categories for reporting
 */
export const reportCategories = [
  { value: 'inappropriate', label: 'Inappropriate content', description: 'Content that is offensive or unsuitable' },
  { value: 'spam', label: 'Spam or misleading', description: 'Unwanted promotional content or false information' },
  { value: 'harassment', label: 'Harassment or bullying', description: 'Content that targets or attacks individuals' },
  { value: 'copyright', label: 'Copyright violation', description: 'Unauthorized use of copyrighted material' },
  { value: 'violence', label: 'Violence or dangerous content', description: 'Content promoting violence or harmful activities' },
  { value: 'other', label: 'Other', description: 'Other violations not listed above' }
];

/**
 * Check if user can perform moderation actions based on their role/status
 * @param userRole - User's role or status
 * @returns Whether user can moderate content
 */
export const canModerateContent = (userRole?: string): boolean => {
  const moderatorRoles = ['admin', 'moderator', 'trusted_user'];
  return moderatorRoles.includes(userRole || '');
};

export default {
  basicContentFilter,
  calculateAge,
  verifyAge,
  validateVideoContent,
  getContentViolationMessage,
  reportCategories,
  canModerateContent
};
