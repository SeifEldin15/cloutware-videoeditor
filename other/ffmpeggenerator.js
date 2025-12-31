import React, { useState, useRef, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { FiDownload, FiX } from 'react-icons/fi';
import { FaPlay } from "react-icons/fa";
import lottie from 'lottie-web';

import { mapAnimationToASS } from '../utils/mapAnimationToASS';
import {
  splitSubtitleIntoWords,
  revealWords,
  displayWords,
  Girlboss,
  fullDisplayColorsFill3,
  revealWordsOneByOne,
  generateColorSequence,
  alternatingColorsAnimation,
  alternatingColorsPairAnimation,
  alternatingColorsAnimation2,
  alternatingColorsAnimation3,
  shrinkingColorsPairAnimation,
  alternatingBoldThinAnimation,
  WormEffect,
  revealWords3 ,
  revealWordsOneByOne2,
  ThinToBold,
  Wavycolors,
  TrendingAli,
  RevealEnlarge,
  SimpleDisplay,
  Enlarge,
} from '../utils/ffmpegCustomAnimations';
import { formatTime } from '../utils/timeUtils';
import { convertColorToASS } from '../utils/colorUtils';
import emojiData from '../utils/ffmpegEmojiData.json';
import { convertLottieToFrames, processLottieAnimations } from '../utils/lottieProcessor';

let colorIndex = 0;

const generateRandomColor = () => {
  const colors = [
    'FF0000', // Red
    '30FF30', // Specified shade of green
    '0000FF'  // Blue
  ];
  const color = colors[colorIndex];
  colorIndex = (colorIndex + 1) % colors.length;
  
  return color.match(/.{2}/g).reverse().join('');
};

const mapTextAlignToASSAlignment = (textAlign) => {
  switch (textAlign) {
    case 'left':
      return '1'; 
    case 'center':
      return '2';
    case 'right':
      return '3';
    default:
      return '2'; 
  }
};

const generateASSFile = (subtitles, style, setError, videoData) => {
  if (subtitles.length === 0) return null; 

  let fontColorASS, bgColorASS, outlineColorASS, shadowColorASS;
  
  // Helper function to check if color is effectively transparent
  const isTransparentColor = (color) => {
    return !color || 
           color === 'transparent' || 
           color === '#00000000' || 
           color.endsWith(',0)') || // Catches rgba(...,0) and hsla(...,0)
           color === 'rgba(0,0,0,0)' ||
           color === 'rgba(255, 255, 255, 0)';
  };
  const isLargeOffset = style.animation === 'HormoziViralSentence4' || 
                       style.animation === 'GreenToRedPair' || 
                       style.animation === 'ThinToBold' ||
                       style.animation === 'ShrinkingPairs';

  // Adjust font size for 16:9 aspect ratio
  let adjustedFontSize = style.fontSize;
  const is16by9 = videoData?.aspectRatio === '16:9';
  if (is16by9) {
    adjustedFontSize = Math.round(style.fontSize * 2.5); // Increase font size by 20% for 16:9
  }
  const is9by16 = videoData?.aspectRatio === '9:16';
  if (is9by16) {
    adjustedFontSize = Math.round(style.fontSize * 0.8); // Increase font size by 20% for 16:9
  }
  const is9by16Split = videoData?.aspectRatio === '9:16' && videoData?.joinType === 'horizontal' && isLargeOffset;
  if (is9by16Split) {
    adjustedFontSize = Math.round(style.fontSize * 1.2); // Increase font size by 20% for 16:9
  }
  else if (videoData?.aspectRatio === '9:16' && videoData?.joinType === 'horizontal' && !isLargeOffset) {
    adjustedFontSize = Math.round(style.fontSize * 1.1); // Increase font size by 20% for 16:9
  }
  const is1by1 = videoData?.aspectRatio === '1:1';
  if (is1by1) {
    adjustedFontSize = Math.round(style.fontSize * 1.5); // Increase font size by 20% for 16:9
  }
  try {
    fontColorASS = convertColorToASS(style.color);
    // Only set background if it's explicitly set and not transparent
    bgColorASS = !isTransparentColor(style.backgroundColor)
      ? convertColorToASS(style.backgroundColor)
      : null;
    outlineColorASS = style.textOutlineColor
      ? convertColorToASS(style.textOutlineColor)
      : '&H00000000&';
    shadowColorASS = style.shadowColor
      ? convertColorToASS(style.shadowColor)
      : '&H000000&';
  } catch (err) {
    setError(`Color conversion error: ${err.message}`);
    throw err;
  }

  const alignment = mapTextAlignToASSAlignment(style.textAlign);
  
  // Add this logic to invert marginV for specific animations
  let marginV;
  const invertedAnimations = ['Girlboss', 'quickfox', 'HormoziViralSentence', 'HormoziViralSentence2', 'HormoziViralWord'];
  if (invertedAnimations.includes(style.animation)) {
    // For inverted animations, calculate from bottom of screen
    marginV = Math.round((720 * style.verticalPosition) / 100);
  } else {
    // Original calculation from top of screen
    marginV = Math.round((720 * (100 - style.verticalPosition)) / 100);
  }

  // Calculate shadow values
  const shadowX = Math.round(style.shadowOffsetX || 0);
  const shadowY = Math.round(style.shadowOffsetY || 0);
  const shadowBlur = Math.round((style.shadowBlur || 0) / 2); // Divide by 2 for better ASS compatibility
  const header = `[Script Info]
    ScriptType: v4.00+
    PlayResX: 1280
    PlayResY: 720
    ScaledBorderAndShadow: yes

    [V4+ Styles]
    Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
    Style: Default,${style.fontFamily},${adjustedFontSize},${fontColorASS},&H000000FF&,${outlineColorASS},&H00000000&,0,0,0,0,100,100,0,0,1,${style.textOutlineWidth / 2.2},${shadowBlur},${alignment},10,10,${marginV},1
    Style: Background,${style.fontFamily},${adjustedFontSize},&H00000000&,&H000000FF&,&H00000000&,${bgColorASS || '&H00000000&'},0,0,0,0,100,100,0,0,3,0,0,${alignment},10,10,${marginV},1

    [Events]
    Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
    `;

  // Calculate total duration from first to last subtitle
  const totalDuration = subtitles[subtitles.length - 1].end - subtitles[0].start;
  let lastPosition = null;

  const events = subtitles.flatMap((sub) => {
    const start = sub.start;
    const end = sub.end;
    let text = sub.text;
    
    text = text.replace(/\b[0-9A-F]{4,5}\b/g, '');

    if (style.textTransform === 'uppercase') text = text.toUpperCase();
    else if (style.textTransform === 'lowercase') text = text.toLowerCase();

    if (style.animation === 'HormoziViralSentence2') {
      if (style.animation2 === 'Shake') {
      const result = alternatingColorsAnimation(
        { ...sub, text }, 
        start, 
        end, 
        style, 
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return alternatingColorsAnimation({ ...sub, text }, start, end, style);
      }
    } 
    if (style.animation === 'PewDiePie' ) {
      if (style.animation2 === '') {
        const result = revealWords3(
          { ...sub, text }, 
          start, 
          end, 
          style,
          lastPosition
        );
        lastPosition = result.lastPosition;
        return result.events;
      }
      else {
        // Add specific PewDiePie animation handling
        return `Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,{\\fscx100\\fscy100\\t(0,100,\\fscx120\\fscy120)\\t(100,200,\\fscx100\\fscy100)}${text}`;
      }
    } 
    if (style.animation === 'Enlarge') {
      return Enlarge({ ...sub, text }, start, end, style);
    }
    if (style.animation === 'WormEffect') {
      return WormEffect({ ...sub, text }, start, end, style);
    }
    if (style.animation === 'quickfox4' ) {
      if (style.animation2 === 'Shake') {
      const result = revealWordsOneByOne2(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return revealWordsOneByOne2({ ...sub, text }, start, end, style);
      }
    } 
    
    if (style.animation === 'HormoziViralSentence4') {
      if (style.animation2 === 'Shake') {
      const result = alternatingColorsAnimation3(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return alternatingColorsAnimation3({ ...sub, text }, start, end, style);
      }
    } 
    if (style.animation === 'ShrinkingPairs') {
      if (style.animation2 === 'Shake') {
        const result = shrinkingColorsPairAnimation(
          { ...sub, text }, 
          start, 
          end, 
          style,
          lastPosition
        );
        lastPosition = result.lastPosition;
        return result.events;
      }
      else {
        return shrinkingColorsPairAnimation({ ...sub, text }, start, end, style);
      }
    }  
    if (style.animation === 'alternatingBoldThinAnimation') {
      return alternatingBoldThinAnimation({ ...sub, text }, start, end, style);
    } 
    if (style.animation === 'Wavycolors') {
      return Wavycolors({ ...sub, text }, start, end, style);
    } 
    if (style.animation === 'quickfox') {
      if (style.animation2 === 'Shake') {
      const result = alternatingColorsAnimation2(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return alternatingColorsAnimation2({ ...sub, text }, start, end, style);
      }
    }
    if (style.animation === 'Girlboss') {
      if (style.animation2 === 'Shake') {
      const result = Girlboss(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return Girlboss({ ...sub, text }, start, end, style);
      }
    }

    else if (style.animation === 'GreenToRedPair') {
      const result = alternatingColorsPairAnimation(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
    } 
    else if (style.animation === 'hormoziViral') {
      const words = splitSubtitleIntoWords(sub, start, end);
      
      return words.map(({ word, start: wordStart, end: wordEnd }) => {
        const randomColor = generateRandomColor();
        const coloredWord = `{\\c&H${randomColor}&}${word}`;
        
        return `Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredWord}`;
      });
    } 
    else if ( style.animation === 'quickfox5') {
      if (style.animation2 === 'Shake') {
      const result = revealWords2(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return revealWords2({ ...sub, text }, start, end, style);
      }
    } 
    else if (style.animation === 'ThinToBold') {
      if (style.animation2 === 'Shake') {
      const result = ThinToBold(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return ThinToBold({ ...sub, text }, start, end, style);
      }
    }
 
    else if (style.animation === 'RevealEnlarge' ) {
      if (style.animation2 === 'Shake') {
        const result = RevealEnlarge(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return RevealEnlarge({ ...sub, text }, start, end, style);
      }
    } 
    else if (style.animation === 'TrendingAli') {
      if (style.animation2 === 'Shake') {   
        const result = TrendingAli(
          { ...sub, text }, 
          start, 
          end, 
          style,
          lastPosition
        );
        lastPosition = result.lastPosition;
        return result.events;
      }
      else {
        return TrendingAli({ ...sub, text }, start, end, style);
      }
    }
    else if (style.animation === 'HormoziViralSentence' || style.animation == "weakGlitch") {
      if (style.animation2 === 'Shake') {
        const result = revealWords(
        { ...sub, text }, 
        start, 
        end, 
        style,
        lastPosition
      );
      lastPosition = result.lastPosition;
      return result.events;
      }
      else {
        return revealWords({ ...sub, text }, start, end, style);
      }
    } else if (style.animation === 'HormoziViralWord' ) {
      return revealWordsOneByOne({ ...sub, text }, start, end, style);
    } 
    else if (style.animation === 'SimpleDisplay') {
      if (style.animation2 === 'Shake') {
        const result = SimpleDisplay(
          { ...sub, text }, 
          start, 
          end, 
          style,
          lastPosition
        );
        lastPosition = result.lastPosition;
        return result.events;
      }
      else {
        return SimpleDisplay({ ...sub, text }, start, end, style);
      }
    }
    

    else {
      // Apply animation override tags
      let animationTags = [];
      if (style.animation !== 'none') {
        const tag = mapAnimationToASS(style.animation, 500, { 
          y: marginV // Use the calculated margin vertical
        });
        if (tag) animationTags.push(tag);
      }

      const overrideTag = animationTags.length > 0 ? `{${animationTags.join('')}}` : '';

      // For regular subtitles (non-animation cases)
      if (!style.animation || style.animation === 'none') {
        // Get background color and handle transparency
        const bgColor = style?.backgroundColor && style.backgroundColor !== '#00000000' 
          ? convertColorToASS(style.backgroundColor)
          : null;
        console.log('bgColor', bgColor);

        // Create text with background
        const displayText = bgColor 
          ? `{\\alpha&H00&\\1a&H00&\\3a&H00&\\4a&H00&\\bord2\\3c${bgColor}\\4c${bgColor}\\shad0}${text}`
          : `{\\alpha&H00&\\1a&H00&\\3a&HFF&\\4a&HFF&\\bord0\\shad0}${text}`;

        return [
          `Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${displayText}`
        ];
      }

      // For animated subtitles, handle them as before
      // ... rest of your existing animation handling code ...
    }
  }).join('\n');

  return header + events;
};

const loadedImages = new Set();

const loadImage = async (ffmpeg, name, path) => {
  try {
    if (loadedImages.has(name)) {
      console.log(`Image "${name}" is already loaded.`);
      return;
    }

    const response = await fetch(path);
    if (!response.ok) {
      console.error(`Failed to fetch image "${name}" from "${path}".`);
      throw new Error(`Failed to fetch image "${name}" from "${path}".`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);
    ffmpeg.FS('writeFile', name, imageData);
    loadedImages.add(name);
    console.log(`Image "${name}" loaded successfully.`);
  } catch (err) {
    console.error(`Error loading image "${name}":`, err);
    throw err;
  }
};

const getQualitySettings = (quality) => {
  switch (quality) {
    case 'low':
      return {
        width: 854,
        bitrate: '1M',
        crf: '28',
        colorspace: 'bt709',
        colorPrimaries: 'bt709',
        colorTrc: 'bt709',
        colorRange: 'tv',
        pixelFormat: 'yuv420p'  // Add pixel format
      };
    case 'medium':
      return {
        width: 1280,
        bitrate: '2M',
        crf: '23',
        colorspace: 'bt709',
        colorPrimaries: 'bt709',
        colorTrc: 'bt709',
        colorRange: 'tv',
        pixelFormat: 'yuv420p'
      };
    case 'high':
      return {
        width: 1920,   // 1080p
        bitrate: '2M',
        crf: '18',
        colorspace: 'bt709',
        colorPrimaries: 'bt709',
        colorTrc: 'bt709',
        colorRange: 'tv',
        pixelFormat: 'yuv420p'
      };
    case 'ultra':
      return {
        width: 3840,   // 4K
        bitrate: '8M',
        crf: '16',
        colorspace: 'bt709',
        colorPrimaries: 'bt709',
        colorTrc: 'bt709',
        colorRange: 'tv',
        pixelFormat: 'yuv420p'
      };
    default:
      return {
        width: 1280,   // Default to 720p
        bitrate: '2M',
        crf: '23'
      };
  }
};

export default function FFmpegGenerator({
  videoData,
  subtitles = [], // Default to empty array
  subtitleStyle = {
    color: '#FFFFFF',
    backgroundColor: '#00000000',
    textOutlineColor: '#000000',
    fontSize: 50,
    textAlign: 'center',
    textTransform: 'none',
    textOutline: 'none',
    textOutlineWidth: 0,
    verticalPosition: 50,
    fontFamily: 'Luckiest Guy', // Ensure default fontFamily is set
    bold: false,
    italic: false,
    underline: false,
    strikeOut: false,
    shadowColor: '#000000',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
  },
  audioSettings,
  videoFormat, // Supported formats: 'mp4', 'webm', 'mov'
  videoQuality,
  onGenerate,
  audioStatus,
  onCancel, // Add this new prop
  hasLottie, // Add this new prop
}) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputVideo, setOutputVideo] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const ffmpeg = useRef(null);
  const fontLoaded = useRef(false);


  // Add new state for tracking Lottie loading progress
  const [lottieProgress, setLottieProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);

  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    let dotsInterval;
    if (isGenerating && totalProgress < 20) {
      dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500); // Adjust speed of dots animation here
    }

    return () => {
      if (dotsInterval) clearInterval(dotsInterval);
    };
  }, [isGenerating, totalProgress]);

  const loadFFmpegInstance = async () => {
    ffmpeg.current = createFFmpeg({
      log: true,
      corePath:
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      wasmPath:
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm',
      coreOptions: ['-s', 'USE_PTHREADS=0'],
      arguments: ['-threads', '1'],
      worker: false,
      progress: ({ ratio }) => {
        // FFmpeg progress now accounts for 80% of total progress
        setTotalProgress(Math.round((ratio * 80) + lottieProgress));
      },
    });
    try {
      await ffmpeg.current.load();
      setReady(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      setError('Failed to load FFmpeg');
      setIsGenerating(false);
    }
  };

  const loadFont = async () => {
    try {
      // Load both Montserrat variants if using alternatingBoldThinAnimation or ThinToBold
      if (subtitleStyle.animation === 'alternatingBoldThinAnimation' || subtitleStyle.animation === 'ThinToBold') {
        const thinFontResponse = await fetch('/fonts/Montserrat Thin.ttf');
        const boldFontResponse = await fetch('/fonts/Montserrat.ttf');
        
        if (!thinFontResponse.ok || !boldFontResponse.ok) {
          throw new Error('Failed to fetch Montserrat font variants');
        }

        const thinFontData = new Uint8Array(await thinFontResponse.arrayBuffer());
        const boldFontData = new Uint8Array(await boldFontResponse.arrayBuffer());

        try {
          ffmpeg.current.FS('mkdir', '/fonts');
        } catch (err) {
          // Directory might already exist
        }

        ffmpeg.current.FS('writeFile', '/fonts/Montserrat-Thin.ttf', thinFontData);
        ffmpeg.current.FS('writeFile', '/fonts/Montserrat-Black.ttf', boldFontData);
        
        fontLoaded.current = true;
        return;
      }

      // Original font loading logic for other animations
      if (!subtitleStyle.fontFamily) return;

      const fontUrlMap = {
        'Garamond': '/fonts/Garamond.ttf',
        'Courier': '/fonts/Courier.ttf',
        'Segoe UI Emoji': '/fonts/Segoe UI Emoji.ttf',
        'Bungee': '/fonts/bungee.ttf',
        'OpenSansEmoji': '/fonts/OpenSansEmoji.ttf',
        'Noto Color Emoji': '/fonts/NotoColorEmoji.ttf',
        'Luckiest Guy': '/fonts/luckiestguy.ttf',
        'Bodoni Moda': '/fonts/Bodoni Moda.ttf',
        'Erica One': '/fonts/Erica One.ttf',
        'Montserrat': '/fonts/Montserrat.ttf',
        'Montserrat Black': '/fonts/Montserrat Black.ttf',
        'Montserrat Bold': '/fonts/Montserrat Bold.ttf',
        'Montserrat Thin': '/fonts/Montserrat Thin.ttf',   
        'ArialBlack': '/fonts/ArialBlack.ttf',
        'BookmanOldStyle': '/fonts/BookmanOldStyle.ttf',
        'ComicSansMS': '/fonts/ComicSansMS.ttf',
        'Georgia': '/fonts/georgia.ttf',
        'Helvetica': '/fonts/helvetica.ttf',
        'Impact': '/fonts/impact.ttf',
        'Palatino': '/fonts/Palatino.ttf',
        'Sigma': '/fonts/sigmar.ttf',
        'Sora': '/fonts/sora.ttf',
      };

      const fontPath = fontUrlMap[subtitleStyle.fontFamily];
      if (!fontPath) {
        throw new Error(`Font "${subtitleStyle.fontFamily}" not found.`);
      }

      const fontResponse = await fetch(fontPath);
      if (!fontResponse.ok) {
        throw new Error(`Failed to fetch font from "${fontPath}".`);
      }

      const fontArrayBuffer = await fontResponse.arrayBuffer();
      const fontData = new Uint8Array(fontArrayBuffer);

      try {
        ffmpeg.current.FS('mkdir', '/fonts');
      } catch (err) {
      }

      ffmpeg.current.FS(
        'writeFile',
        `/fonts/${subtitleStyle.fontFamily}.ttf`,
        fontData
      );

      fontLoaded.current = true;
    } catch (err) {
      console.error('Error loading font:', err);
      setError('Failed to load the required font for video generation.');
      throw err;
    }
  };

  const cancelGeneration = async () => {
    setIsCancelling(true);
    try {
      if (ffmpeg.current) {
        await ffmpeg.current.exit();
      }
    } catch (err) {
      console.error('Error cancelling FFmpeg process:', err);
    } finally {
      setIsGenerating(false);
      setIsCancelling(false);
      setProgress(0);
      onCancel(); // Call the onCancel prop
    }
  };

  const generateVideo = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setOutputVideo(null);
      setError(null);

      // Get quality settings early in the function
      const qualitySettings = getQualitySettings(videoQuality);
      const fixedWidth = qualitySettings.width;
      const targetFps = 30;

      // Always reinitialize FFmpeg instance
      await loadFFmpegInstance();
      await loadFont();

      const emojiTimings = subtitles.map(sub => {
        const emojiMatch = sub.text.match(/\b[0-9A-F]{4,5}\b/);
        if (emojiMatch) {
          return {
            emoji: emojiMatch[0],
            start: sub.start,
            end: sub.end
          };
        }
        return null;
      }).filter(timing => timing !== null);

      for (const timing of emojiTimings) {
        await loadImage(ffmpeg.current, `${timing.emoji}.png`, `/72/emoji_u${timing.emoji}.png`);
      }

      const assFile = generateASSFile(subtitles, subtitleStyle, setError, videoData);
      if (assFile) {
        ffmpeg.current.FS(
          'writeFile',
          'subtitles.ass',
          new TextEncoder().encode(assFile)
        );
      }
      let durationSeconds;
      let primaryVideoIndex = 0;
      if (videoData.videoType === 'single') {
        durationSeconds = videoData.videos[0].duration;
      } else {
        const primaryVideo = videoData.videos.find((video) => video.isPrimary);
        if (!primaryVideo) {
          throw new Error('No primary video selected for split video.');
        }
        durationSeconds = primaryVideo.duration;
        primaryVideoIndex = videoData.videos.indexOf(primaryVideo);
      }

      const loopCounts = videoData.videos.map((video) => {
        if (videoData.videoType === 'split') {
          if (video.isPrimary) {
            return 0;
          } else {
            const loops = Math.ceil(durationSeconds / video.duration) - 1;
            return loops > 0 ? loops : 0;
          }
        }
        return 0; // No loop for single video type
      });

      // FFmpeg Arguments
      const ffmpegArgs = [];

      // Add video inputs
      videoData.videos.forEach((video, index) => {
        if (videoData.videoType === 'split' && !video.isPrimary) {
          ffmpegArgs.push(
            '-stream_loop',
            `${loopCounts[index]}`,
            '-i',
            `input${index + 1}.mp4`
          );
        } else {
          ffmpegArgs.push('-i', `input${index + 1}.mp4`);
        }
      });

      // Parallel operations
      await Promise.all([
        (async () => {
          if (subtitles.length > 0) {
            ffmpeg.current.FS(
              'writeFile',
              'subtitles.ass',
              new TextEncoder().encode(assFile)
            );
          }
        })(),
        (async () => {
          const writeVideos = videoData.videos.map(async (video, index) => {
            const inputFileName = `input${index + 1}.mp4`;
            if (video.file) {
              const data = await fetchFile(video.file);
              ffmpeg.current.FS('writeFile', inputFileName, data);
            } else if (video.url) {
              const response = await fetch(video.url);
              if (!response.ok)
                throw new Error(`Failed to fetch video from ${video.url}`);
              const arrayBuffer = await response.arrayBuffer();
              const binaryData = new Uint8Array(arrayBuffer);
              ffmpeg.current.FS('writeFile', inputFileName, binaryData);
            }
          });
          await Promise.all(writeVideos);
        })(),
      ]);

      let filterComplex = '';
      const inputs = videoData.videos.length;
      const cropFilters = [];
      const scaledInputs = [];

      for (let i = 0; i < inputs; i++) {
        const video = videoData.videos[i];
        const crop = video.crop || { width: 100, height: 100, x: 0, y: 0 };
        const cropW = Math.round((video.width * crop.width) / 100);
        const cropH = Math.round((video.height * crop.height) / 100);
        const cropX = Math.round((video.width * crop.x) / 100);
        const cropY = Math.round((video.height * crop.y) / 100);

        const croppedLabel = `cropped${i}`;
        cropFilters.push(
          `[${i}:v]crop=${cropW}:${cropH}:${cropX}:${cropY}[${croppedLabel}]`
        );

        // For split videos, adjust the scale width based on the number of videos
        let scaleWidth = videoData.videoType === 'split' ? Math.round(fixedWidth / 2) : fixedWidth;
        
        // Ensure width is even by rounding down to nearest even number
        scaleWidth = Math.floor(scaleWidth / 2) * 2;
        
        scaledInputs.push(
          `[${croppedLabel}]scale=${scaleWidth}:-2:flags=lanczos,fps=${targetFps}[scaled${i}]`
        );
      }

      filterComplex += cropFilters.join('; ') + '; ' + scaledInputs.join('; ');

      // Modify the filter_complex construction
      if (inputs === 2 && videoData.joinType === 'vertical' && videoData.aspectRatio === '9:16' && videoData.videoType === 'split') {
        filterComplex += `; [scaled0][scaled1]hstack=inputs=2[v_stack]`;

        // Calculate padding
        filterComplex += `; [v_stack]pad=iw:ih+1082:0:541:black[v_padded]`;

        if (subtitles.length > 0) {
          filterComplex += `; [v_padded]ass=subtitles.ass:fontsdir=./fonts[v_with_subs]`;
        } else {
          filterComplex += `; [v_padded]format=yuv420p[v_with_subs]`;
        }
      } else {
        // Existing logic for other cases
        if (inputs === 2) {
          const joinType = videoData.joinType;
          if (joinType === 'vertical') {
            filterComplex += `; [scaled0][scaled1]hstack=inputs=2[v_stack]`;
          } else if (joinType === 'horizontal') {
            filterComplex += `; [scaled0][scaled1]vstack=inputs=2[v_stack]`;
          } else {
            filterComplex += `; [scaled0][scaled1]hstack=inputs=2[v_stack]`;
          }
          if (subtitles.length > 0) {
            filterComplex += `; [v_stack]ass=subtitles.ass:fontsdir=./fonts[v_with_subs]`;
          } else {
            filterComplex += `; [v_stack]format=yuv420p[v_with_subs]`;
          }
        } else {
          // For single video input
          if (subtitles.length > 0) {
            filterComplex += `; [scaled0]ass=subtitles.ass:fontsdir=./fonts[v_with_subs]`;
          } else {
            filterComplex += `; [scaled0]format=yuv420p[v_with_subs]`;
          }
        }
      }

      // Replace the Lottie processing section with:
      if (hasLottie) {
        const { filterComplex: updatedFilterComplex, lottieAnimations } = 
          await processLottieAnimations(
            ffmpegArgs, 
            filterComplex, 
            inputs, 
            subtitles, 
            subtitleStyle, 
            videoQuality,
            videoData
          );
        
        filterComplex = updatedFilterComplex;

        // Write the frame data
        for (const { frameList, frames, animIndex } of lottieAnimations) {
          ffmpeg.current.FS('writeFile', `frames_${animIndex}.txt`, frameList);
          
          for (let i = 0; i < frames.length; i++) {
            const frameData = new Uint8Array(await frames[i].arrayBuffer());
            ffmpeg.current.FS('writeFile', 
              `lottie_${animIndex}_${i.toString().padStart(4, '0')}.png`, 
              frameData
            );
          }
        }
      } else {
        filterComplex += '; [v_with_subs]format=yuv420p[v_final]';
      }

      // Add emoji inputs after Lottie frames
      emojiTimings.forEach(timing => {
        ffmpegArgs.push('-i', `${timing.emoji}.png`);
      });

      let audioFilterComplex = '';
      let containsAudio = false;
      let audioInputs = [];

      videoData.videos.forEach((video, index) => {
        const hasAudio = audioStatus[index] || false;
        const isMuted = video.muted || false;
        
        
        if (hasAudio) {
          if (!isMuted) {
            containsAudio = true;
          }
          audioInputs.push(index);
        }
      });


      if (audioInputs.length > 0) {
        audioFilterComplex = audioInputs.map((index) => {
          const isMuted = videoData.videos[index].muted || false;
          return `[${index}:a]${isMuted ? 'volume=0' : 'volume=1'}[a${index}_out]`;
        }).join('; ');

        if (audioInputs.length > 1) {
          audioFilterComplex += `; ${audioInputs.map(index => `[a${index}_out]`).join('')}amix=inputs=${audioInputs.length}:duration=longest[a_final]`;
        } else {
          audioFilterComplex += `; [a${audioInputs[0]}_out]aformat=fltp:44100:stereo[a_final]`;
        }
      }

      let combinedFilterComplex = filterComplex;
      if (audioFilterComplex) {
        combinedFilterComplex += `; ${audioFilterComplex}`;
      }

      let outputExtension = 'mp4';
      let outputCodec = {
        video: 'libx264',
        audio: 'aac',
      };

      if (videoFormat === 'webm') {
        outputExtension = 'webm';
        outputCodec.video = 'libvpx';
        outputCodec.audio = 'libvorbis';
      } else if (videoFormat === 'mov') {
        outputExtension = 'mov';
        outputCodec.video = 'prores_ks'; 
        outputCodec.audio = 'aac'; 
      }

      ffmpegArgs.push(
        '-filter_complex',
        combinedFilterComplex,
        '-map',
        '[v_final]'
      );

      if (audioInputs.length > 0) {
        ffmpegArgs.push('-map', '[a_final]');
        ffmpegArgs.push('-c:a', outputCodec.audio, '-b:a', '192k');
      } else {
        ffmpegArgs.push('-an'); 
      }

      ffmpegArgs.push(
        '-r',
        `${targetFps}`,
        '-vsync',
        '2',
        '-c:v',
        outputCodec.video
      );

      // Add quality-specific parameters
      if (outputCodec.video === 'libx264') {
        ffmpegArgs.push(
          '-b:v', qualitySettings.bitrate,
          '-crf', qualitySettings.crf,
          '-preset', 'ultrafast',
          '-pix_fmt', qualitySettings.pixelFormat,  // Add pixel format
          '-colorspace', qualitySettings.colorspace,
          '-color_primaries', qualitySettings.colorPrimaries,
          '-color_trc', qualitySettings.colorTrc,
          '-color_range', qualitySettings.colorRange,
          '-x264opts', `colorprim=${qualitySettings.colorPrimaries}:transfer=${qualitySettings.colorTrc}:colormatrix=${qualitySettings.colorspace}`
        );
      } else if (outputCodec.video === 'libvpx') {
        ffmpegArgs.push(
          '-b:v', qualitySettings.bitrate,
          '-crf', qualitySettings.crf,
          '-pix_fmt', qualitySettings.pixelFormat,  // Add pixel format
          '-colorspace', qualitySettings.colorspace,
          '-color_primaries', qualitySettings.colorPrimaries,
          '-color_trc', qualitySettings.colorTrc,
          '-color_range', qualitySettings.colorRange
        );
      } else if (outputCodec.video === 'prores_ks') {
        ffmpegArgs.push(
          '-profile:v',
          '3',  // High quality ProRes
          '-vendor',
          'apl0',
          '-bits_per_mb',
          '8000'
        );
      }

      ffmpegArgs.push(
        '-threads',
        '1',
        '-t',
        durationSeconds.toString(),
        `output.${outputExtension}`
      );

      // Modify the ffmpeg.run call to check for cancellation
      await new Promise((resolve, reject) => {
        ffmpeg.current.run(...ffmpegArgs)
          .then(resolve)
          .catch(reject);

        // Check for cancellation
        const cancelCheck = setInterval(() => {
          if (isCancelling) {
            clearInterval(cancelCheck);
            ffmpeg.current.exit();
            reject(new Error('Generation cancelled'));
          }
        }, 100);
      });

      const data = ffmpeg.current.FS('readFile', `output.${outputExtension}`);
      const videoBlob = new Blob([data.buffer], {
        type: `video/${outputExtension}`,
      });
      const videoUrl = URL.createObjectURL(videoBlob);
      setOutputVideo(videoUrl);
      onGenerate(videoUrl);
      setIsGenerating(false);
    } catch (err) {
      if (err.message === 'Generation cancelled') {
        console.log('Video generation was cancelled');
      } else {
        console.error('Error generating video:', err);
        setError(`Error generating video: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col items-center ">
      {!isGenerating && !outputVideo && (
        <button
          onClick={generateVideo}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          Generate Video
          <FaPlay style={{ width: '14px', height: '14px', marginLeft: '4px',  }} />
        </button>
      )}
      {isGenerating && (
        <div className="w-full px-1">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {totalProgress < 20 
              ? `Loading animations keep the window open might take a few minutes ${loadingDots}`
              : 'Generating video...'}
          </div>
          <button
            onClick={cancelGeneration}
            className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      )}
      {/* Comment out error display */}
      {/* {error && <div className="text-red-500">{error}</div>} */}
      {outputVideo && <div></div>}
    </div>
  );
}