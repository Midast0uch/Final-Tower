const fs = require('fs');
const content = fs.readFileSync('C:/Users/midas/Desktop/Apps/opencode-test/tower-defense.html', 'utf-8');
const lines = content.split('\n');

// Check for invisible/special characters around TOWER_TYPES
for (let i = 450; i <= 460; i++) {
    const line = lines[i];
    const bytes = [];
    for (let j = 0; j < line.length; j++) {
        const code = line.charCodeAt(j);
        if (code > 127) {
            bytes.push(`char[${j}]=U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
        }
    }
    if (bytes.length > 0) {
        console.log(`Line ${i + 1}: ${bytes.join(', ')} | ${line.substring(0, 80)}...`);
    }
}
