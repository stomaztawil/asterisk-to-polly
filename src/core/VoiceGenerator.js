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
            
            try {
                await this.processSoundItem(item);
            } catch (error) {
                console.error(`Failed to process ${item.filename}:`, error);
            }
        }
    }

    async loadSoundList() {
        const data = await fs.readFile(this.config.paths.soundList, 'utf8');
        return data.split('\n')
            .map(line => this.parseSoundLine(line))
            .filter(Boolean);
    }

    parseSoundLine(line) {
        line = line.trim();
        if (!line || line.startsWith(';')) return null;

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return null;

        return {
            filename: line.substring(0, colonIndex).trim(),
            text: line.substring(colonIndex + 1).trim()
        };
    }

    shouldSkip(item) {
        if (!item || !item.filename || !item.text) return true;
        if (item.text.startsWith('<') && item.text.endsWith('>')) return true;
        if (item.text.startsWith('[') && item.text.endsWith(']')) return true;
        return false;
    }

    async processSoundItem(item) {
        const outputBase = path.join(this.config.paths.outputDir, item.filename);
        
        console.log(`Processing: ${item.filename}`);
        
        await this.polly.generateAudio({
            text: item.text,
            outputFile: outputBase,
            voiceId: this.config.voices.defaultVoice
        });

        await this.converter.toUlaw(
            `${outputBase}.wav`,
            `${outputBase}.ulaw`
        );

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