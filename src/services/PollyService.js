const { Polly } = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PollyService {
    constructor(config) {
        this.polly = new Polly({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        this.config = config;
    }

    async verifyCredentials() {
        try {
            await this.polly.describeVoices().promise();
            return true;
        } catch (error) {
            console.error('AWS Polly authentication failed:', error.message);
            throw error;
        }
    }

    async generateAudio({ text, outputFile, voiceId = 'Joanna' }) {
        try {
            const params = {
                OutputFormat: 'mp3',
                Text: text,
                VoiceId: voiceId,
                Engine: 'neural'
            };

            const data = await this.polly.synthesizeSpeech(params).promise();
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(outputFile), { recursive: true });
            
            // Save MP3
            await fs.writeFile(`${outputFile}.mp3`, data.AudioStream);
            
            // Convert to WAV using ffmpeg
            await this.convertToWav(`${outputFile}.mp3`, `${outputFile}.wav`);
            
            return true;
        } catch (error) {
            console.error('Audio generation failed:', error);
            throw error;
        }
    }

    async convertToWav(inputFile, outputFile) {
        try {
            const { stdout, stderr } = await execPromise(
                `ffmpeg -i ${inputFile} ${outputFile}`
            );
            
            if (stderr) {
                console.warn('FFmpeg warning:', stderr);
            }
            
            return true;
        } catch (error) {
            console.error('WAV conversion failed:', error);
            throw error;
        }
    }
}

module.exports = { PollyService };