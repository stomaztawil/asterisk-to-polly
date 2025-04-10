// Replace aws-sdk with @aws-sdk/client-polly
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const fs = require('fs').promises;

class PollyService {
    constructor(config) {
        this.polly = new PollyClient({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey
            }
        });
    }

    async generateAudio({ text, outputFile, voiceId = 'Joanna' }) {
        const params = {
            OutputFormat: 'mp3',
            Text: text,
            VoiceId: voiceId,
            Engine: 'neural'
        };

        try {
            const command = new SynthesizeSpeechCommand(params);
            const data = await this.polly.send(command);
            
            // Save the audio file
            await fs.writeFile(`${outputFile}.mp3`, await data.AudioStream.transformToByteArray());
            return true;
        } catch (error) {
            console.error('Audio generation failed:', error);
            throw error;
        }
    }
}

module.exports = { PollyService };