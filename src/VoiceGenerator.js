const fs = require('fs').promises;
const path = require('path');
const { PollyService } = require('../services/PollyService');
const { AsteriskDB } = require('../services/AsteriskDB');
const { FileConverter } = require('../services/FileConverter');

class VoiceGenerator {
  constructor(config) {
    this.config = config;
    this.polly = new PollyService(config);
    this.db = new AsteriskDB(config);
    this.converter = new FileConverter();
  }

  async initialize() {
    await this.polly.verifyCredentials();
    await fs.mkdir(this.config.paths.outputDir, { recursive: true });
    await this.db.initialize();
  }

  async processSoundFiles() {
    const soundList = await this.loadSoundList();
    
    for (const item of soundList) {
      if (this.shouldSkip(item)) continue;
      
      await this.processSoundItem(item);
    }
  }

  async loadSoundList() {
    const data = await fs.readFile(this.config.paths.soundList, 'utf8');
    return data.split('\n')
      .map(line => this.parseSoundLine(line))
      .filter(Boolean);
  }

  parseSoundLine(line) {
    // Similar implementation to original but more robust
  }

  shouldSkip(item) {
    // Logic to skip comments and invalid lines
  }

  async processSoundItem(item) {
    const outputBase = path.join(this.config.paths.outputDir, item.filename);
    
    // Generate audio with Polly
    await this.polly.generateAudio({
      text: item.text,
      outputFile: outputBase,
      voiceId: this.config.voices.defaultVoice
    });

    // Convert to ulaw
    await this.converter.toUlaw(
      `${outputBase}.wav`,
      `${outputBase}.ulaw`
    );

    // Register in database
    await this.db.insertRecording({
      filename: item.filename,
      description: item.text,
      language: this.config.voices.language
    });
  }

  async finalize() {
    await this.db.close();
  }
}

module.exports = { VoiceGenerator };