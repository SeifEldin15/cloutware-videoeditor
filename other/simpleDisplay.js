import { formatTime } from '../../utils/timeUtils';

export const SimpleDisplay = (subtitle, start, end, style) => {
  const events = [];
  const chars = subtitle.text.split('');
  const charWidth = 31;
  const totalWidth = chars.length * charWidth;
  const startX = 640 - (totalWidth / 2);
  const baseY = 460;
  const outDuration = 0.25;
  const mainEnd = end - outDuration;

  chars.forEach((char, i) => {
    if (char === ' ') {
      events.push(
        `Dialogue: 0,${formatTime(start)},${formatTime(mainEnd)},Default,,0,0,0,, `
      );
      return;
    }

    const moveY = 0.4;
    const cycleDuration = 0.7;
    const phaseOffset = (i / chars.length) * Math.PI * 2;
    const steps = 30;
    const xPos = startX + (i * charWidth);
    const finalMoveDistance = 300;
    
    for (let cycle = 0; cycle < Math.ceil((mainEnd - start) / cycleDuration); cycle++) {
      const cycleStart = start + (cycle * cycleDuration);
      
      for (let step = 0; step < steps; step++) {
        const stepStart = cycleStart + (step * cycleDuration / steps);
        const stepEnd = cycleStart + ((step + 1) * cycleDuration / steps);
        
        if (stepEnd > mainEnd) break;
        
        const progress = step / steps;
        const yOffset = Math.sin(progress * Math.PI * 2 + phaseOffset) * moveY;
        const yPos = baseY + yOffset;
        
        const moveProgress = (stepStart - start) / (mainEnd - start);
        const currentXPos = xPos + (finalMoveDistance * moveProgress);
        
        events.push(
          `Dialogue: 0,${formatTime(stepStart)},${formatTime(stepEnd)},Default,,0,0,0,,` +
          `{\\pos(${currentXPos},${yPos})}${char}`
        );
      }
    }

    const trailSteps = 5;
    const trailMoveDistance = 150;
    const fadeStep = 1 / trailSteps;

    for (let trail = 0; trail < trailSteps; trail++) {
      const trailStart = mainEnd;
      const trailProgress = trail / trailSteps;
      const xOffset = trailMoveDistance * trailProgress;
      const alpha = 1 - (trail * fadeStep);
      
      const finalXPos = xPos + finalMoveDistance;
      
      events.push(
        `Dialogue: 0,${formatTime(mainEnd)},${formatTime(end)},Default,,0,0,0,,` +
        `{\\pos(${finalXPos + xOffset},${baseY})\\alpha&H${Math.floor((1 - alpha) * 255).toString(16).padStart(2, '0')}&}${char}`
      );
    }
  });

  return events;
}; 