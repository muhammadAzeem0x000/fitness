const fs = require('fs');
const path = require('path');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\AZEEM\\.gemini\\antigravity-ide\\brain\\362f90a1-b7f1-4b3e-a58a-bb992bcf8bbd\\.system_generated\\logs\\transcript.jsonl';
const outputPath = path.join(__dirname, 'MASTER_ROADMAP.md');

const fileStream = fs.createReadStream(transcriptPath);

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.step_index === 49) {
      const codeContent = data.tool_calls[0].args.CodeContent;
      fs.writeFileSync(outputPath, codeContent);
      console.log('Successfully recovered MASTER_ROADMAP.md!');
      process.exit(0);
    }
  } catch(e) {
    // ignore parse errors
  }
});
