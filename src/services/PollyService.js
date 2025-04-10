const { Polly } = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

class PollyService {
  constructor(config) {
    this.polly = new Polly({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.config = config;
  }

  async verifyCredentials() {
    try {
      await this.polly.describeVoices().promise();
    } catch (error) {
      throw new Error('AWS Polly authentication failed: ' + error.message);
    }
  }

  async generateAudio({ text, outputFile, voiceId }) {
    const params = {
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: voiceId,
      Engine: 'neural' // Use neural voices when available
    };

    try {
      const data = await this.polly.synthesizeSpeech(params).promise();
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      
      // Save files
      await Promise.all([
        fs.writeFile(`${outputFile}.mp3`, data.AudioStream),
        this.convertToWav(`${outputFile}.mp3`, `${outputFile}.wav`)
      ]);
      
    } catch (error) {
      throw new Error(`Audio generation failed: ${error.message}`);
    }
  }

  async convertToWav(inputFile, outputFile) {
    // Implementation using ffmpeg or similar
  }
}

module.exports = { PollyService };