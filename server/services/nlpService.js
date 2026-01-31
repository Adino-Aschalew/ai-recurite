const natural = require('natural');
const compromise = require('compromise');

class NLPService {
  constructor() {
    // Initialize tokenizers and stemmers
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Common skill keywords database
    this.skillKeywords = {
      'programming': ['javascript', 'python', 'java', 'c++', 'typescript', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin'],
      'web': ['react', 'vue', 'angular', 'html', 'css', 'node.js', 'express', 'django', 'flask', 'spring'],
      'database': ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle'],
      'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
      'devops': ['ci/cd', 'jenkins', 'gitlab', 'github actions', 'ansible', 'chef'],
      'mobile': ['react native', 'flutter', 'ios', 'android', 'xamarin'],
      'data': ['machine learning', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
      'testing': ['jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest']
    };
  }

  /**
   * Extract skills from text using keyword matching and NLP
   */
  extractSkills(text) {
    const normalizedText = text.toLowerCase();
    const extractedSkills = new Set();
    const skillCategories = {};

    // Keyword-based extraction
    for (const [category, keywords] of Object.entries(this.skillKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(normalizedText)) {
          extractedSkills.add(keyword);
          if (!skillCategories[category]) {
            skillCategories[category] = [];
          }
          skillCategories[category].push(keyword);
        }
      }
    }

    // Use compromise NLP for additional skill extraction
    const doc = compromise(text);
    const nouns = doc.nouns().out('array');
    
    // Filter potential technical terms (capitalized or common tech terms)
    nouns.forEach(noun => {
      const lowerNoun = noun.toLowerCase();
      if (this.isLikelySkill(lowerNoun)) {
        extractedSkills.add(lowerNoun);
      }
    });

    return {
      skills: Array.from(extractedSkills),
      categories: skillCategories,
      count: extractedSkills.size
    };
  }

  /**
   * Check if a word is likely a technical skill
   */
  isLikelySkill(word) {
    // Common technical patterns
    const techPatterns = [
      /^[a-z]+\.js$/i, // e.g., react.js
      /^[a-z]+\.net$/i,
      /^[a-z]+-?[a-z]+$/i, // hyphenated tech terms
    ];

    return techPatterns.some(pattern => pattern.test(word));
  }

  /**
   * Extract experience information
   */
  extractExperience(text) {
    const experiencePatterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/gi,
      /experience[:\s]+(\d+)\+?\s*(?:years?|yrs?)/gi,
      /(\d+)\+?\s*(?:years?|yrs?)\s+in/gi
    ];

    let totalYears = 0;
    const matches = [];

    experiencePatterns.forEach(pattern => {
      const found = text.matchAll(pattern);
      for (const match of found) {
        const years = parseInt(match[1]);
        if (years > 0 && years <= 50) {
          matches.push(years);
        }
      }
    });

    if (matches.length > 0) {
      totalYears = Math.max(...matches);
    }

    // Extract job titles and companies
    const doc = compromise(text);
    const organizations = doc.organizations().out('array');
    const people = doc.people().out('array');

    return {
      totalYears,
      organizations: organizations.slice(0, 10),
      jobTitles: this.extractJobTitles(text)
    };
  }

  /**
   * Extract job titles from text
   */
  extractJobTitles(text) {
    const commonTitles = [
      'developer', 'engineer', 'manager', 'director', 'lead', 'senior', 'junior',
      'architect', 'analyst', 'consultant', 'specialist', 'coordinator', 'executive'
    ];

    const titles = [];
    const lines = text.split('\n');

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      commonTitles.forEach(title => {
        if (lowerLine.includes(title) && line.length < 100) {
          titles.push(line.trim());
        }
      });
    });

    return [...new Set(titles)].slice(0, 10);
  }

  /**
   * Extract education information
   */
  extractEducation(text) {
    const educationKeywords = ['bachelor', 'master', 'phd', 'doctorate', 'degree', 'diploma', 'certificate'];
    const degreePatterns = [
      /(bachelor|b\.?s\.?|b\.?a\.?|b\.?e\.?)/gi,
      /(master|m\.?s\.?|m\.?a\.?|m\.?b\.?a\.?|m\.?e\.?)/gi,
      /(ph\.?d\.?|doctorate|d\.?phil\.?)/gi
    ];

    const degrees = [];
    degreePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        degrees.push(...matches);
      }
    });

    const highestDegree = this.getHighestDegree(degrees);

    return {
      degrees: [...new Set(degrees)],
      highestDegree,
      hasEducation: educationKeywords.some(keyword => text.toLowerCase().includes(keyword))
    };
  }

  /**
   * Determine highest degree level
   */
  getHighestDegree(degrees) {
    const normalized = degrees.map(d => d.toLowerCase());
    if (normalized.some(d => d.includes('phd') || d.includes('doctorate'))) return 'phd';
    if (normalized.some(d => d.includes('master') || d.includes('m.'))) return 'master';
    if (normalized.some(d => d.includes('bachelor') || d.includes('b.'))) return 'bachelor';
    return null;
  }

  /**
   * Calculate semantic similarity between two texts
   */
  calculateSimilarity(text1, text2) {
    const tokens1 = this.tokenizer.tokenize(text1.toLowerCase());
    const tokens2 = this.tokenizer.tokenize(text2.toLowerCase());

    if (!tokens1 || !tokens2 || tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    // Jaccard similarity
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate keyword relevance score
   */
  calculateKeywordRelevance(text, keywords) {
    if (!keywords || keywords.length === 0) return 0;

    const normalizedText = text.toLowerCase();
    let matches = 0;

    keywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      const regex = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(normalizedText)) {
        matches++;
      }
    });

    return matches / keywords.length;
  }

  /**
   * Analyze text quality (grammar, structure)
   */
  analyzeTextQuality(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenizer.tokenize(text) || [];
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);

    // Check for common issues
    const issues = [];
    if (avgWordsPerSentence > 30) issues.push('long_sentences');
    if (avgWordsPerSentence < 5) issues.push('short_sentences');
    if (text.length < 100) issues.push('too_short');
    if (text.length > 10000) issues.push('too_long');

    // Calculate quality score (0-100)
    let qualityScore = 100;
    qualityScore -= issues.length * 10;
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      qualityScore,
      issues,
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10
    };
  }
}

module.exports = new NLPService();

