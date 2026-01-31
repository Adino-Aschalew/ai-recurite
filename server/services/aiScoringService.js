const OpenAI = require('openai');
const nlpService = require('./nlpService');
const pool = require('../config/database');

class AIScoringService {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  /**
   * Main CV scoring function
   * Implements real AI-based scoring with explainability
   */
  async scoreCV(cvData, jobRequirements = null) {
    const {
      text,
      extractedData,
      skills,
      experience,
      education
    } = cvData;

    // Initialize scores
    const scores = {
      skills: 0,
      experience: 0,
      education: 0,
      quality: 0,
      keyword: 0
    };

    const breakdown = {
      skills: { score: 0, details: [], matched: [], missing: [] },
      experience: { score: 0, details: [] },
      education: { score: 0, details: [] },
      quality: { score: 0, details: [] },
      keyword: { score: 0, details: [] }
    };

    // 1. Skills Scoring (40% weight)
    if (jobRequirements && jobRequirements.required_skills) {
      const skillScore = this.scoreSkills(skills, jobRequirements.required_skills, jobRequirements.preferred_skills);
      scores.skills = skillScore.score;
      breakdown.skills = skillScore;
    } else {
      // Score based on skill diversity if no job requirements
      scores.skills = Math.min(100, skills.length * 10);
      breakdown.skills = {
        score: scores.skills,
        details: [`Found ${skills.length} skills`],
        matched: skills,
        missing: []
      };
    }

    // 2. Experience Scoring (30% weight)
    if (jobRequirements && jobRequirements.min_experience_years) {
      const expScore = this.scoreExperience(experience, jobRequirements.min_experience_years);
      scores.experience = expScore.score;
      breakdown.experience = expScore;
    } else {
      scores.experience = Math.min(100, experience.totalYears * 20);
      breakdown.experience = {
        score: scores.experience,
        details: [`${experience.totalYears} years of experience`]
      };
    }

    // 3. Education Scoring (20% weight)
    if (jobRequirements && jobRequirements.education_level) {
      const eduScore = this.scoreEducation(education, jobRequirements.education_level);
      scores.education = eduScore.score;
      breakdown.education = eduScore;
    } else {
      scores.education = education.hasEducation ? 70 : 30;
      breakdown.education = {
        score: scores.education,
        details: [education.highestDegree || 'Education information found']
      };
    }

    // 4. CV Quality Scoring (10% weight)
    const qualityAnalysis = nlpService.analyzeTextQuality(text);
    scores.quality = qualityAnalysis.qualityScore;
    breakdown.quality = {
      score: scores.quality,
      details: qualityAnalysis.issues.length > 0 
        ? [`Issues: ${qualityAnalysis.issues.join(', ')}`]
        : ['Well-structured CV']
    };

    // 5. Keyword Relevance (bonus, factored into overall)
    if (jobRequirements) {
      const allKeywords = [
        ...(jobRequirements.required_skills || []),
        ...(jobRequirements.preferred_skills || [])
      ];
      const keywordScore = nlpService.calculateKeywordRelevance(text, allKeywords) * 100;
      scores.keyword = keywordScore;
      breakdown.keyword = {
        score: keywordScore,
        details: [`${Math.round(keywordScore)}% keyword match`]
      };
    }

    // Calculate weighted overall score
    const weights = {
      skills: 0.40,
      experience: 0.30,
      education: 0.20,
      quality: 0.10
    };

    let overallScore = 
      scores.skills * weights.skills +
      scores.experience * weights.experience +
      scores.education * weights.education +
      scores.quality * weights.quality;

    // Add keyword bonus (up to 5%)
    if (scores.keyword > 0) {
      overallScore += (scores.keyword / 100) * 0.05 * 100;
    }

    overallScore = Math.min(100, Math.max(0, overallScore));

    // Generate AI suggestions if OpenAI is available
    let suggestions = [];
    let aiAnalysis = null;

    if (this.openai && jobRequirements) {
      try {
        const aiResult = await this.generateAISuggestions(cvData, jobRequirements, breakdown);
        suggestions = aiResult.suggestions;
        aiAnalysis = aiResult.analysis;
      } catch (error) {
        console.error('OpenAI API error:', error.message);
        // Fallback to rule-based suggestions
        suggestions = this.generateRuleBasedSuggestions(breakdown);
      }
    } else {
      suggestions = this.generateRuleBasedSuggestions(breakdown);
    }

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      scores: {
        skills: Math.round(scores.skills * 100) / 100,
        experience: Math.round(scores.experience * 100) / 100,
        education: Math.round(scores.education * 100) / 100,
        quality: Math.round(scores.quality * 100) / 100,
        keyword: Math.round(scores.keyword * 100) / 100
      },
      breakdown,
      suggestions,
      aiAnalysis
    };
  }

  /**
   * Score skills against job requirements
   */
  scoreSkills(cvSkills, requiredSkills, preferredSkills = []) {
    const cvSkillsLower = cvSkills.map(s => s.toLowerCase());
    const requiredLower = requiredSkills.map(s => s.toLowerCase());
    const preferredLower = (preferredSkills || []).map(s => s.toLowerCase());

    const matchedRequired = [];
    const matchedPreferred = [];
    const missing = [];

    // Check required skills
    requiredLower.forEach(skill => {
      const found = cvSkillsLower.find(cvSkill => 
        cvSkill.includes(skill) || skill.includes(cvSkill) ||
        nlpService.calculateSimilarity(cvSkill, skill) > 0.7
      );
      if (found) {
        matchedRequired.push(skill);
      } else {
        missing.push(skill);
      }
    });

    // Check preferred skills
    preferredLower.forEach(skill => {
      const found = cvSkillsLower.find(cvSkill => 
        cvSkill.includes(skill) || skill.includes(cvSkill) ||
        nlpService.calculateSimilarity(cvSkill, skill) > 0.7
      );
      if (found) {
        matchedPreferred.push(skill);
      }
    });

    // Calculate score
    const requiredScore = (matchedRequired.length / Math.max(requiredLower.length, 1)) * 70;
    const preferredScore = (matchedPreferred.length / Math.max(preferredLower.length, 1)) * 30;
    const totalScore = Math.min(100, requiredScore + preferredScore);

    return {
      score: totalScore,
      details: [
        `Matched ${matchedRequired.length}/${requiredLower.length} required skills`,
        `Matched ${matchedPreferred.length}/${preferredLower.length} preferred skills`
      ],
      matched: [...matchedRequired, ...matchedPreferred],
      missing
    };
  }

  /**
   * Score experience
   */
  scoreExperience(experience, minYears) {
    const years = experience.totalYears || 0;
    let score = 0;

    if (years >= minYears) {
      score = 100;
    } else if (years >= minYears * 0.8) {
      score = 80;
    } else if (years >= minYears * 0.6) {
      score = 60;
    } else if (years >= minYears * 0.4) {
      score = 40;
    } else {
      score = Math.max(0, (years / minYears) * 30);
    }

    return {
      score,
      details: [
        `Has ${years} years, required: ${minYears} years`,
        years >= minYears ? 'Meets experience requirement' : `Missing ${minYears - years} years`
      ]
    };
  }

  /**
   * Score education
   */
  scoreEducation(education, requiredLevel) {
    const degreeHierarchy = {
      'high school': 1,
      'diploma': 2,
      'bachelor': 3,
      'master': 4,
      'phd': 5,
      'doctorate': 5
    };

    const requiredRank = degreeHierarchy[requiredLevel.toLowerCase()] || 3;
    const candidateRank = degreeHierarchy[education.highestDegree] || 0;

    let score = 0;
    if (candidateRank >= requiredRank) {
      score = 100;
    } else if (candidateRank >= requiredRank - 1) {
      score = 70;
    } else if (candidateRank >= requiredRank - 2) {
      score = 40;
    } else {
      score = 20;
    }

    return {
      score,
      details: [
        `Has ${education.highestDegree || 'unknown'} degree, required: ${requiredLevel}`,
        candidateRank >= requiredRank ? 'Meets education requirement' : 'Below required level'
      ]
    };
  }

  /**
   * Generate AI-powered suggestions using OpenAI
   */
  async generateAISuggestions(cvData, jobRequirements, breakdown) {
    if (!this.openai) {
      return { suggestions: [], analysis: null };
    }

    try {
      const prompt = `Analyze this CV and job requirements, then provide improvement suggestions.

CV Summary:
- Skills: ${cvData.skills.join(', ')}
- Experience: ${cvData.experience.totalYears} years
- Education: ${cvData.education.highestDegree || 'Not specified'}

Job Requirements:
- Required Skills: ${jobRequirements.required_skills.join(', ')}
- Preferred Skills: ${(jobRequirements.preferred_skills || []).join(', ')}
- Min Experience: ${jobRequirements.min_experience_years} years
- Education: ${jobRequirements.education_level}

Score Breakdown:
- Skills: ${breakdown.skills.score}% (Missing: ${breakdown.skills.missing.join(', ')})
- Experience: ${breakdown.experience.score}%
- Education: ${breakdown.education.score}%
- Quality: ${breakdown.quality.score}%

Provide:
1. Top 3 specific improvement suggestions
2. Skill gaps to address
3. CV structure recommendations
4. ATS optimization tips

Format as JSON with keys: suggestions (array), skillGaps (array), structureTips (array), atsTips (array).`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert CV reviewer and career advisor.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Fallback if not valid JSON
        parsed = {
          suggestions: [content],
          skillGaps: breakdown.skills.missing,
          structureTips: [],
          atsTips: []
        };
      }

      // Log AI usage
      await this.logAIAnalysis(null, null, 'cv_suggestions', { prompt }, parsed, 'gpt-4', 
        response.usage?.total_tokens || 0);

      return {
        suggestions: parsed.suggestions || [],
        analysis: {
          skillGaps: parsed.skillGaps || [],
          structureTips: parsed.structureTips || [],
          atsTips: parsed.atsTips || []
        }
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return { suggestions: this.generateRuleBasedSuggestions(breakdown), analysis: null };
    }
  }

  /**
   * Generate rule-based suggestions
   */
  generateRuleBasedSuggestions(breakdown) {
    const suggestions = [];

    if (breakdown.skills.missing.length > 0) {
      suggestions.push(`Consider adding these skills: ${breakdown.skills.missing.slice(0, 3).join(', ')}`);
    }

    if (breakdown.experience.score < 70) {
      suggestions.push('Highlight more relevant work experience and achievements');
    }

    if (breakdown.quality.score < 70) {
      suggestions.push('Improve CV structure and formatting for better readability');
    }

    if (breakdown.education.score < 70) {
      suggestions.push('Consider adding or highlighting relevant education and certifications');
    }

    if (suggestions.length === 0) {
      suggestions.push('Your CV looks strong! Consider adding quantifiable achievements.');
    }

    return suggestions;
  }

  /**
   * Generate interview questions based on CV
   */
  async generateInterviewQuestions(cvData, jobRequirements) {
    if (!this.openai) {
      return this.generateDefaultQuestions(cvData, jobRequirements);
    }

    try {
      const prompt = `Generate 5 relevant interview questions for this candidate based on their CV and the job requirements.

CV Skills: ${cvData.skills.join(', ')}
Experience: ${cvData.experience.totalYears} years
Job Requirements: ${jobRequirements.required_skills.join(', ')}

Generate behavioral and technical questions. Return as JSON array of strings.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert HR interviewer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      let questions;
      try {
        questions = JSON.parse(content);
      } catch {
        questions = this.generateDefaultQuestions(cvData, jobRequirements);
      }

      return Array.isArray(questions) ? questions : this.generateDefaultQuestions(cvData, jobRequirements);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateDefaultQuestions(cvData, jobRequirements);
    }
  }

  generateDefaultQuestions(cvData, jobRequirements) {
    return [
      `Tell me about your experience with ${jobRequirements.required_skills[0] || 'your primary skill'}`,
      `Describe a challenging project you worked on`,
      `How do you stay updated with industry trends?`,
      `What motivates you in your career?`,
      `Why are you interested in this position?`
    ];
  }

  /**
   * Analyze skill gaps
   */
  analyzeSkillGaps(cvSkills, jobRequirements) {
    const required = jobRequirements.required_skills || [];
    const preferred = jobRequirements.preferred_skills || [];
    const allRequired = [...required, ...preferred];

    const cvSkillsLower = cvSkills.map(s => s.toLowerCase());
    const gaps = allRequired.filter(skill => {
      const skillLower = skill.toLowerCase();
      return !cvSkillsLower.some(cvSkill => 
        cvSkill.includes(skillLower) || skillLower.includes(cvSkill) ||
        nlpService.calculateSimilarity(cvSkill, skillLower) > 0.7
      );
    });

    return {
      gaps,
      critical: gaps.slice(0, 3),
      recommendations: gaps.map(gap => `Consider learning or gaining experience with ${gap}`)
    };
  }

  /**
   * Log AI analysis for tracking
   */
  async logAIAnalysis(cvId, jobId, analysisType, inputData, outputData, modelUsed, tokens) {
    try {
      const costPerToken = 0.00003; // Approximate cost per token for GPT-4
      const cost = (tokens / 1000) * costPerToken;

      await pool.execute(
        `INSERT INTO ai_analysis_logs 
         (cv_id, job_id, analysis_type, input_data, output_data, model_used, processing_time_ms, cost_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cvId,
          jobId,
          analysisType,
          JSON.stringify(inputData),
          JSON.stringify(outputData),
          modelUsed,
          null, // Could track this if needed
          cost
        ]
      );
    } catch (error) {
      console.error('Error logging AI analysis:', error);
    }
  }
}

module.exports = new AIScoringService();

