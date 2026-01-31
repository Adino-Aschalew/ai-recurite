const _pdfParse = require('pdf-parse');
const pdfParse = _pdfParse && _pdfParse.default ? _pdfParse.default : _pdfParse;
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

class CVParser {
  /**
   * Parse PDF file and extract text
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          info: data.info
        }
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse DOCX file and extract text
   */
  async parseDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value,
        metadata: {
          messages: result.messages
        }
      };
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse CV file based on type
   */
  async parseCV(filePath, fileType) {
    const normalizedType = fileType.toLowerCase();

    if (normalizedType === 'application/pdf') {
      return await this.parsePDF(filePath);
    } else if (normalizedType.includes('wordprocessingml') || normalizedType.includes('msword')) {
      return await this.parseDOCX(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
      .trim();
  }

  /**
   * Extract basic information using regex patterns
   */
  extractBasicInfo(text) {
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/gi;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    const urls = text.match(urlRegex) || [];
    const linkedin = text.match(linkedinRegex) || [];

    // Extract name (first line or before email)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const name = lines[0] || '';

    return {
      name: name.trim(),
      email: emails[0] || null,
      phone: phones[0] || null,
      linkedin: linkedin[0] || null,
      urls: urls.slice(0, 3)
    };
  }
}

module.exports = new CVParser();

