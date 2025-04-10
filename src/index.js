const { VoiceGenerator } = require('./core/VoiceGenerator');
const config = require('config');

async function main() {
  try {
    const generator = new VoiceGenerator(config);
    await generator.initialize();
    await generator.processSoundFiles();
    await generator.finalize();
    
    console.log('Processing completed successfully!');
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

main();