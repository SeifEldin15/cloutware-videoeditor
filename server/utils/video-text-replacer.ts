import { getInitializedFfmpeg } from "./ffmpeg";
import { PassThrough } from "stream";
import type { DetectedText } from "./text-detection-coords";

export interface TextReplacement {
  originalText: string;
  newText: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  startTime?: number; // Start time in seconds when text should appear
  endTime?: number; // End time in seconds when text should disappear
  style?: {
    backgroundColor?: string;
    backgroundOpacity?: number;
    fontColor?: string;
    fontSize?: number;
  };
}

export interface ReplaceTextOptions {
  textReplacements: TextReplacement[];
  outputName?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderRadius?: number;
  videoWidth?: number; // Video width for horizontal alignment
}

/**
 * Replace text in video by overlaying white rectangles and new text
 * When borderRadius > 0, uses Sharp to generate rounded rectangle PNGs
 * and overlays them with FFmpeg's overlay filter for proper rounded corners.
 */
export async function replaceTextInVideo(
  videoUrl: string,
  options: ReplaceTextOptions,
): Promise<PassThrough> {
  const {
    textReplacements,
    outputName = "replaced_text_video",
    fontFamily = "Arial",
    fontSize = 24,
    fontColor = "#000000",
    backgroundColor = "#FFFFFF",
    backgroundOpacity = 1.0,
    borderRadius = 0,
    videoWidth,
  } = options;

  console.log(
    `🎨 Replacing ${textReplacements.length} text region(s) in video (borderRadius=${borderRadius})`,
  );

  return new Promise<PassThrough>(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough({ highWaterMark: 8 * 1024 * 1024 });

      // Use temp file for proper MP4 formatting
      const fs = await import("fs");
      const os = await import("os");
      const path = await import("path");
      const tempFile = path.join(
        os.tmpdir(),
        `video_text_replace_${Date.now()}.mp4`,
      );
      console.log(`📁 Using temp file: ${tempFile}`);

      const ffmpeg = await getInitializedFfmpeg();
      let command = ffmpeg(videoUrl);

      // Input options
      command.inputOptions([
        "-protocol_whitelist",
        "file,http,https,tcp,tls",
        "-reconnect",
        "1",
        "-reconnect_streamed",
        "1",
        "-reconnect_delay_max",
        "5",
      ]);

      // Track temp PNG files and ASS file for cleanup
      const tempPngFiles: string[] = [];
      const tempAssPath = path.join(os.tmpdir(), `text_replace_${Date.now()}.ass`);
      tempPngFiles.push(tempAssPath);

      let filterComplex: string;

      if (borderRadius > 0) {
        // ── Rounded corners path: generate PNG overlays with Sharp ──
        const effectiveRadius = borderRadius * 2;
        console.log(
          `🔵 Using rounded rectangle overlays (input radius=${borderRadius}px, effective=${effectiveRadius}px)`,
        );
        const sharpModule = (await import("sharp")).default;
        const padding = 10;

        // Add each rounded rect PNG as an additional FFmpeg input
        for (let i = 0; i < textReplacements.length; i++) {
          const replacement = textReplacements[i];
          const { boundingBox } = replacement;

          const currentBgColorHex =
            replacement.style?.backgroundColor || backgroundColor;
          const currentOpacity =
            replacement.style?.backgroundOpacity ?? backgroundOpacity;

          const width = boundingBox.width + padding * 2;
          const height = boundingBox.height + padding * 2;

          // Generate rounded rectangle SVG → PNG
          const opacity255 = Math.round(currentOpacity * 255);
          const opacityHex = opacity255.toString(16).padStart(2, "0");
          const fillColor = currentBgColorHex.startsWith("#")
            ? currentBgColorHex + opacityHex
            : `#${currentBgColorHex}${opacityHex}`;

          const svgRect = `<svg width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${effectiveRadius}" ry="${effectiveRadius}" fill="${fillColor}"/></svg>`;

          const tempPng = path.join(
            os.tmpdir(),
            `overlay_box_${Date.now()}_${i}.png`,
          );
          await sharpModule(Buffer.from(svgRect)).png().toFile(tempPng);
          tempPngFiles.push(tempPng);

          // Add as FFmpeg input (input index = i + 1, since 0 is the video)
          command.input(tempPng);

          console.log(
            `   📐 Generated rounded rect PNG ${i}: ${width}x${height} radius=${effectiveRadius} → ${tempPng}`,
          );
        }

        // Build filter complex with overlay filters for rounded rects + ass filter for text
        filterComplex = buildRoundedFilterComplex(textReplacements, {
          fontFamily,
          fontSize,
          fontColor,
          backgroundColor,
          backgroundOpacity,
          borderRadius,
          padding,
        }, tempAssPath);
      } else {
        // ── Standard rectangular path (drawbox) ──
        filterComplex = buildTextReplacementFilterComplex(
          textReplacements,
          {
            fontFamily,
            fontSize,
            fontColor,
            backgroundColor,
            backgroundOpacity,
            borderRadius: 0,
          },
          tempAssPath,
          videoWidth,
        );
      }

      console.log("📝 Applying text replacements...");
      console.log(`📐 Filter complex:`, filterComplex);
      console.log(
        `📊 Replacements:`,
        JSON.stringify(textReplacements, null, 2),
      );

      let hasStarted = false;
      let hasError = false;

      command
        .complexFilter(filterComplex)
        .outputOptions([
          "-map",
          "[out]", // Map the filtered video stream
          "-map",
          "0:a?", // Map audio stream if exists (? means optional)
          "-c:v",
          "libx264",
          "-preset",
          "medium", // Medium for crisp text (fast causes text artifacts)
          "-crf",
          "18", // Good quality
          "-tune",
          "stillimage", // Optimize for sharp edges like text
          "-c:a",
          "aac", // Re-encode audio to AAC
          "-b:a",
          "192k", // Audio bitrate
          "-max_muxing_queue_size",
          "4096", // Increase muxing queue
          "-movflags",
          "+faststart", // Enable fast start
        ])
        .on("start", (commandLine: string) => {
          hasStarted = true;
          console.log(`🎬 ${outputName} FFmpeg started`);
          console.log(`📋 Command: ${commandLine}`);
        })
        .on("stderr", (stderrLine: string) => {
          console.log(`[FFmpeg stderr]: ${stderrLine}`);
        })
        .on("progress", (progress: any) => {
          if (progress.percent) {
            console.log(
              `${outputName} Processing: ${progress.percent.toFixed(2)}%`,
            );
          }
          if (progress.targetSize) {
            console.log(`${outputName} Current size: ${progress.targetSize}kB`);
          }
        })
        .on("end", async () => {
          console.log(
            `✅ ${outputName} FFmpeg completed, reading temp file...`,
          );

          try {
            // Read the complete file
            const fileBuffer = await fs.promises.readFile(tempFile);
            console.log(`📊 Read ${fileBuffer.length} bytes from temp file`);

            // Write to stream
            outputStream.write(fileBuffer);
            outputStream.end();

            // Clean up temp file
            await fs.promises.unlink(tempFile);
            console.log(`🗑️ Deleted temp file: ${tempFile}`);

            // Clean up rounded rect PNGs
            for (const pngFile of tempPngFiles) {
              try {
                await fs.promises.unlink(pngFile);
              } catch {}
            }
          } catch (err) {
            console.error("Error reading temp file:", err);
            reject(err);
          }
        })
        .on("error", async (error: any) => {
          hasError = true;
          console.error(`❌ ${outputName} FFmpeg error:`, error.message);
          console.error(`📊 Error details:`, error);
          if (!hasStarted) {
            console.error("⚠️ FFmpeg never started!");
          }

          // Clean up temp file on error
          try {
            await fs.promises.unlink(tempFile);
          } catch (e) {
            // Ignore cleanup errors
          }
          // Clean up rounded rect PNGs on error
          for (const pngFile of tempPngFiles) {
            try {
              await fs.promises.unlink(pngFile);
            } catch {}
          }

          if (!outputStream.destroyed) {
            outputStream.destroy(error);
          }
          reject(new Error(`Video processing failed: ${error.message}`));
        });

      // Save to temp file to ensure proper MP4 formatting
      command.save(tempFile);

      console.log("🔄 FFmpeg processing to temp file...");
      resolve(outputStream);
    } catch (error) {
      console.error("Text replacement error:", error);
      reject(error);
    }
  });
}

/**
 * Helper to format seconds to ASS timestamp (H:MM:SS.cs)
 */
function formatAssTime(seconds: number | undefined, defaultTime: string): string {
  if (seconds === undefined) return defaultTime;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const cs = Math.floor((seconds % 1) * 100).toString().padStart(2, "0");
  return `${h}:${m}:${s}.${cs}`;
}

/**
 * Build FFmpeg filter complex for rounded rectangle overlays.
 * Each overlay PNG is an additional input (inputs 1..N), and the video is input 0.
 * Uses chained overlay filters with time-based enable, then ass on top.
 */
function buildRoundedFilterComplex(
  replacements: TextReplacement[],
  style: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    borderRadius: number;
    padding: number;
  },
  tempAssPath: string,
): string {
  console.log(
    `🎨 Building rounded filter complex for ${replacements.length} replacement(s)`,
  );

  const { padding } = style;
  const parts: string[] = [];
  
  // Create ASS File for the texts
  const assStyles = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},&H00${(style.fontColor || '#000000').replace('#', '').match(/.{2}/g)?.reverse().join('') || '000000'}&,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  let assEvents = '';

  // Step 1: Scale the video to even dimensions
  parts.push("[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2[base]");

  // Step 2: Chain overlay filters — each rounded rect PNG overlaid onto the video
  let prevLabel = "base";

  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i];
    const { boundingBox, startTime, endTime } = replacement;

    const x = Math.max(0, boundingBox.x - padding);
    const y = Math.max(0, boundingBox.y - padding);

    // Build time-based enable expression for overlay
    let enableExpr = "";
    if (startTime !== undefined && endTime !== undefined) {
      enableExpr = `:enable='between(t,${startTime.toFixed(3)},${endTime.toFixed(3)})'`;
    }

    const outLabel = `ov${i}`;
    // Input index for this PNG is i+1 (0 is the video)
    parts.push(
      `[${prevLabel}][${i + 1}:v]overlay=x=${x}:y=${y}${enableExpr}[${outLabel}]`,
    );
    prevLabel = outLabel;
  }

  // Step 3: Write ASS events for the text replacements
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i];
    const { boundingBox, newText, startTime, endTime } = replacement;

    const currentFontColorHex = replacement.style?.fontColor || style.fontColor;
    const currentFontSize = replacement.style?.fontSize || style.fontSize;

    const x = Math.max(0, boundingBox.x - padding);
    const y = Math.max(0, boundingBox.y - padding);
    const width = boundingBox.width + padding * 2;
    const height = boundingBox.height + padding * 2;

    // Clean text for FFmpeg (allow emojis to pass through natively for ASS)
    const safeText = newText
      .replace(/[^\p{L}\p{N}\p{Emoji}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!safeText || safeText.length === 0) {
      console.log(`   ⚠️ Skipping empty text after cleaning: "${newText}"`);
      continue;
    }

    // Ass formatting
    const startStr = formatAssTime(startTime, "0:00:00.00");
    const endStr = formatAssTime(endTime, "99:00:00.00");
    
    // Position vertically and horizontally using POS
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    let styleOverride = "";
    
    if (currentFontColorHex !== style.fontColor || currentFontSize !== style.fontSize) {
      const hex = currentFontColorHex.replace('#', '')
      const assColor = `&H00${hex.match(/.{2}/g)?.reverse().join('') || '000000'}&`
      styleOverride = `{\\fs${currentFontSize}\\1c${assColor}}`;
    }

    const safeAssLines = safeText.replace(/\\/g, '\\\\')
    assEvents += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\pos(${centerX},${centerY})}${styleOverride}${safeAssLines}\n`;

    console.log(
      `   ✍️  Rounded ASS overlay ${i}: text "${safeText}" at (${x},${y}) ${width}x${height}`,
    );
  }

  // Write the ASS file
  const fs = require('fs');
  fs.writeFileSync(tempAssPath, assStyles + assEvents);

  // Apply ASS filter
  parts.push(`[${prevLabel}]ass='${tempAssPath.replace(/\\/g, '/').replace(/:/g, '\\\\:')}'[out]`);

  const filterComplex = parts.join(";");
  console.log(`🎬 Built rounded filter complex: ${filterComplex}`);
  return filterComplex;
}

/**
 * Build FFmpeg filter complex string for text replacements (rectangular, no border radius)
 * Uses a single filter chain with symmetric overlays and text
 * Supports time-based filtering so each overlay only appears when the text is visible
 */
function buildTextReplacementFilterComplex(
  replacements: TextReplacement[],
  style: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    borderRadius?: number;
  },
  tempAssPath: string,
  videoWidth?: number, // Add video width parameter for centering
): string {
  console.log(
    `🎨 Building filter complex for ${replacements.length} replacement(s)`,
  );

  const padding = 10;

  // Create ASS File for the texts
  const assStyles = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},&H00${(style.fontColor || '#000000').replace('#', '').match(/.{2}/g)?.reverse().join('') || '000000'}&,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  let assEvents = '';

  // Start with scale filter
  let filterChain = "[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2";

  // Add each replacement with horizontally aligned overlays AND time-based filtering
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i];
    const { boundingBox, newText, startTime, endTime } = replacement;

    // Determine styles (use replacement override or global default)
    const currentBgColorHex =
      replacement.style?.backgroundColor || style.backgroundColor;
    const currentBgColor = hexToRgb(currentBgColorHex);
    const currentOpacity =
      replacement.style?.backgroundOpacity ?? style.backgroundOpacity;
    const currentFontColorHex = replacement.style?.fontColor || style.fontColor;
    const currentFontSize = replacement.style?.fontSize || style.fontSize;

    console.log(
      `📝 Processing replacement ${i + 1}: "${replacement.originalText}" -> "${newText}"`,
    );

    // Use exact X and Y position to cover the original detected text accurately
    const x = Math.max(0, boundingBox.x - padding);
    const y = Math.max(0, boundingBox.y - padding);
    const width = boundingBox.width + padding * 2;
    const height = boundingBox.height + padding * 2;

    // Build time-based enable expression
    // Format: enable='between(t,START,END)'
    let enableExpression = "";
    if (startTime !== undefined && endTime !== undefined) {
      // Use exact times without buffer to prevent overlap
      enableExpression = `:enable='between(t,${startTime.toFixed(3)},${endTime.toFixed(3)})'`;
      console.log(
        `   ⏱️  Time range: ${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s`,
      );
    } else {
      console.log(
        `   ⏱️  No time range - overlay will be visible for entire video`,
      );
    }

    // Draw white rectangle overlay with time-based enable (filled)
    filterChain += `,drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=${currentBgColor}@${currentOpacity}:t=fill${enableExpression}`;

    // Clean text: Allow emojis 
    const safeText = newText
      .replace(/[^\p{L}\p{N}\p{Emoji}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Skip if text is empty after cleaning
    if (!safeText || safeText.length === 0) {
      console.log(`   ⚠️ Skipping empty text after cleaning: "${newText}"`);
      continue;
    }

    // Ass formatting
    const startStr = formatAssTime(startTime, "0:00:00.00");
    const endStr = formatAssTime(endTime, "99:00:00.00");
    
    // Position vertically and horizontally using POS
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    let styleOverride = "";
    
    if (currentFontColorHex !== style.fontColor || currentFontSize !== style.fontSize) {
      const hex = currentFontColorHex.replace('#', '')
      const assColor = `&H00${hex.match(/.{2}/g)?.reverse().join('') || '000000'}&`
      styleOverride = `{\\fs${currentFontSize}\\1c${assColor}}`;
    }

    const safeAssLines = safeText.replace(/\\/g, '\\\\')
    assEvents += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\pos(${centerX},${centerY})}${styleOverride}${safeAssLines}\n`;

    console.log(
      `   📦 Overlay at (${x},${y}) size ${width}x${height} - HORIZONTALLY CENTERED`,
    );
    console.log(`   ✍️  Text "${safeText}" centered in overlay using ASS`);
  }

  // Write the ASS file
  const fs = require('fs');
  fs.writeFileSync(tempAssPath, assStyles + assEvents);

  // Close the filter chain appending ass
  filterChain += `[base];[base]ass='${tempAssPath.replace(/\\/g, '/').replace(/:/g, '\\\\:')}'[out]`;

  console.log(
    `🎬 Built filter complex with ${replacements.length} time-based horizontally aligned overlays + text`,
  );
  console.log(`Filter: ${filterChain}`);

  return filterChain;
}

/**
 * Build FFmpeg filter array for text replacements (simple string format)
 */
function buildTextReplacementFiltersSimple(
  replacements: TextReplacement[],
  style: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
  },
): string[] {
  const filters: string[] = [];

  // Ensure even dimensions
  filters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");

  console.log(`🎨 Building filters for ${replacements.length} replacement(s)`);

  const fontFilePath = getFontFilePath(style.fontFamily);
  // For Windows paths: convert backslashes AND escape colons for FFmpeg filter syntax
  const cleanFontPath = fontFilePath
    ? fontFilePath.replace(/\\/g, "/").replace(/:/g, "\\:")
    : null;

  // For each replacement, draw white rectangle then text
  for (const replacement of replacements) {
    const { boundingBox, newText } = replacement;

    console.log(
      `📝 Processing replacement: "${replacement.originalText}" -> "${newText}"`,
    );

    // Add padding to bounding box
    const padding = 10;
    const x = Math.max(0, boundingBox.x - padding);
    const y = Math.max(0, boundingBox.y - padding);
    const width = boundingBox.width + padding * 2;
    const height = boundingBox.height + padding * 2;

    // Draw white rectangle
    const bgColor = hexToRgb(style.backgroundColor);
    filters.push(
      `drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=${bgColor}@${style.backgroundOpacity}:t=fill`,
    );

    // Draw text - minimal escaping for array format (fluent-ffmpeg handles most of it)
    const escapedText = newText.replace(/'/g, "'\\''"); // Only escape single quotes

    if (cleanFontPath) {
      // Quote the fontfile path to protect the escaped colon
      filters.push(
        `drawtext=text='${escapedText}':fontfile='${cleanFontPath}':fontsize=${style.fontSize}:fontcolor=${style.fontColor}:x=${x + padding}:y=${y + height / 2}`,
      );
    } else {
      filters.push(
        `drawtext=text='${escapedText}':font=${style.fontFamily}:fontsize=${style.fontSize}:fontcolor=${style.fontColor}:x=${x + padding}:y=${y + height / 2}`,
      );
    }
  }

  console.log(`🎬 Built ${filters.length} filters`);

  return filters;
}

/**
 * Build FFmpeg filter array for text replacements
 * Returns array of filter objects for videoFilters() method
 */
function buildTextReplacementFilters(
  replacements: TextReplacement[],
  style: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
  },
): any[] {
  const filters: any[] = [];

  // Ensure even dimensions
  filters.push({
    filter: "scale",
    options: "trunc(iw/2)*2:trunc(ih/2)*2",
  });

  console.log(`🎨 Building filters for ${replacements.length} replacement(s)`);

  // For each replacement, draw white rectangle then text
  for (const replacement of replacements) {
    const { boundingBox, newText, timestamp } = replacement;

    console.log(
      `📝 Processing replacement: "${replacement.originalText}" -> "${newText}"`,
    );
    console.log(`📐 Bounding box:`, boundingBox);

    // Add padding to bounding box
    const padding = 10;
    const x = Math.max(0, boundingBox.x - padding);
    const y = Math.max(0, boundingBox.y - padding);
    const width = boundingBox.width + padding * 2;
    const height = boundingBox.height + padding * 2;

    console.log(`📏 After padding: x=${x}, y=${y}, w=${width}, h=${height}`);

    // Convert hex color to RGB for drawbox
    const bgColor = hexToRgb(style.backgroundColor);
    const opacity = style.backgroundOpacity;

    // Draw white/colored rectangle (background)
    filters.push({
      filter: "drawbox",
      options: {
        x,
        y,
        w: width,
        h: height,
        color: `${bgColor}@${opacity}`,
        t: "fill",
      },
    });

    // Draw text on top
    const fontFilePath = getFontFilePath(style.fontFamily);
    const escapedFontPath = fontFilePath
      ? fontFilePath.replace(/\\/g, "/")
      : null;

    const textOptions: any = {
      text: newText,
      fontsize: style.fontSize,
      fontcolor: style.fontColor,
      x: x + padding,
      y: y + height / 2,
    };

    if (escapedFontPath) {
      textOptions.fontfile = escapedFontPath;
    } else {
      textOptions.font = style.fontFamily;
    }

    filters.push({
      filter: "drawtext",
      options: textOptions,
    });
  }

  console.log(`🎬 Built ${filters.length} filter objects`);

  return filters;
}

/**
 * Build text overlay filter
 */
function buildTextOverlay(
  text: string,
  options: {
    x: number;
    y: number;
    fontFamily: string;
    fontSize: number;
    fontColor: string;
  },
): string {
  // Escape text properly for FFmpeg drawtext filter
  const escapedText = text
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/'/g, "'\\\\\\''") // Escape single quotes for shell
    .replace(/:/g, "\\:") // Escape colons
    .replace(/\n/g, " "); // Replace newlines with spaces

  const fontFilePath = getFontFilePath(options.fontFamily);

  // Use different quoting strategy - escape the fontfile path properly
  const escapedFontPath = fontFilePath
    ? fontFilePath.replace(/\\/g, "/").replace(/:/g, "\\:")
    : "";

  let filter = `drawtext=text='${escapedText}'`;

  if (escapedFontPath) {
    filter += `:fontfile='${escapedFontPath}'`;
  } else {
    filter += `:font='${options.fontFamily}'`;
  }

  filter += `:fontsize=${options.fontSize}`;
  filter += `:fontcolor=${options.fontColor}`;
  filter += `:x=${options.x}`;
  filter += `:y=${options.y}`;

  return filter;
}

/**
 * Convert hex color to RGB format for FFmpeg
 */
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `0x${hex}`;
}

/**
 * Helper to create text replacements from detected texts
 */
export function createReplacementsFromDetections(
  detectedTexts: DetectedText[],
  replacementMap: Map<string, string>,
): TextReplacement[] {
  const replacements: TextReplacement[] = [];

  for (const detected of detectedTexts) {
    const newText = replacementMap.get(detected.text);
    if (newText !== undefined) {
      replacements.push({
        originalText: detected.text,
        newText,
        boundingBox: detected.boundingBox,
        timestamp: detected.timestamp,
        startTime: detected.startTime, // Include time range
        endTime: detected.endTime, // Include time range
      });
    }
  }

  return replacements;
}
