import { generateAdvancedASSFile, parseSRT, processWordModeSegments } from './server/utils/subtitleUtils.js';

const testSRT = `1\n00:00:00,000 --> 00:00:02,000\nlet me show you how to play\n\n2\n00:00:02,000 --> 00:00:04,000\nthis is going to be fun`;

const segments = parseSRT(testSRT);
const wordSegments = processWordModeSegments(segments, 'multiple', 2);

console.log('=== RAW SEGMENTS ===');
wordSegments.forEach((s: any, i: number) => console.log(`  ${i}: [${s.start.toFixed(2)}-${s.end.toFixed(2)}] "${s.text}"`));

const girlbossStyle = {
  color: '#FF1493', shadowStrength: 2.0, animation: 'shake',
  verticalPosition: 18, fontSize: 32, fontFamily: 'Luckiest Guy',
  textAlign: 'center', outlineWidth: 3, outlineColor: '#000000', outlineBlur: 1,
};

const tiktokStyle = {
  color: '#FFFF00', shadowStrength: 0, animation: 'shake',
  verticalPosition: 20, fontSize: 32, fontFamily: 'TikTok Sans Bold',
  textAlign: 'center', outlineWidth: 4, outlineColor: '#000000', outlineBlur: 0,
};

const girlbossASS = generateAdvancedASSFile(wordSegments, girlbossStyle, 'girlboss');
const tiktokASS = generateAdvancedASSFile(wordSegments, tiktokStyle, 'tiktokstyle');

const gLines = girlbossASS.split('\n').filter((l: string) => l.startsWith('Dialogue:'));
const tLines = tiktokASS.split('\n').filter((l: string) => l.startsWith('Dialogue:'));

console.log(`\nGirlboss dialogue lines: ${gLines.length}`);
console.log(`TikTok dialogue lines:   ${tLines.length}`);

console.log('\n=== GIRLBOSS FIRST 8 LINES ===');
gLines.slice(0, 8).forEach((l: string, i: number) => console.log(`  ${i}: ${l.substring(0, 160)}`));

console.log('\n=== TIKTOK FIRST 8 LINES ===');
tLines.slice(0, 8).forEach((l: string, i: number) => console.log(`  ${i}: ${l.substring(0, 160)}`));
