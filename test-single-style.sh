#!/bin/bash

# Single Style Test Script for Debugging (with Complete Transformations Support)
# Tests each animation style with custom outline parameters and all available transformations
# Usage: ./test-single-style.sh [style_name]
# Example: ./test-single-style.sh girlboss
# Available styles: girlboss, hormozi, tiktokstyle, thintobold, wavycolors, shrinkingpairs, revealenlarge, whiteimpact, impactfull, basic
#
# 🎬 TRANSFORMATIONS INCLUDED:
# 
# VIDEO TRANSFORMATIONS:
# - speedFactor: Playback speed adjustment (0.5-2.0)
# - zoomFactor: Video zoom level (1.0-2.0)
# - saturationFactor: Color saturation (0.5-2.0)
# - lightness: Brightness adjustment (-0.5 to 0.5)
# - framerate: Custom frame rate
# - smartCrop: Intelligent cropping with direction control
# - temporalModification: Frame dropping/duplication, reverse segments
# - visibleChanges: Horizontal flip, border, timestamp overlay
# - antiDetection: Pixel shift, micro crop, subtle rotation, noise addition, metadata poisoning, frame interpolation
#
# AUDIO TRANSFORMATIONS:
# - audioPitch: Pitch adjustment (0.5-1.5)
# - audioBitrate: Audio quality (128k, 192k, 256k, 320k)
# - audioTempoMod: Tempo changes with pitch preservation options
# - syncShift: Audio/video synchronization adjustment (-500 to +500ms)
# - eqAdjustments: 3-band equalizer (low, mid, high frequencies)
# - reverbEffect: Echo/reverb with level and delay control
# - backgroundAudio: Background audio mixing
# - backgroundAddition: Ambient sounds (room, crowd, nature, white noise)
#
# Each style showcases different combinations of these transformations for comprehensive testing.

API_URL="http://localhost:3000/api/encode"
OUTPUT_DIR="./test_outputs_single"
TEST_VIDEO="https://y3u8scangj.ufs.sh/f/7dW2GvuYCTVQVMYIEOIJPbYgNiVLIT0Av3uq9WCa2JZ8H5Gk"
WORDS_PER_GROUP=4

# Get style from command line argument or default to girlboss
STYLE=${1:-girlboss}

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Single Style Test - $STYLE"
echo "============================="
echo "Video: $TEST_VIDEO"
echo "Output: $OUTPUT_DIR/${STYLE}_test.mp4"
echo ""

# Show font assignment for this style
case $STYLE in
    "girlboss"|"hormozi"|"tiktokstyle"|"wavycolors"|"shrinkingpairs"|"revealenlarge"|"whiteimpact"|"impactfull")
        echo "✨ Font: Luckiest Guy (Bold, Impact style)"
        ;;
    "thintobold")
        echo "🎨 Font: Montserrat Thin → Montserrat + 120% scaling (Elegant transformation)"
        ;;
    "basic")
        echo "📝 Font: Arial (Professional, Clean)"
        ;;
esac
echo ""

# Function to test different styles
test_style() {
    local style="$1"
    local output_name="${style}_test"
    
    echo "🚀 Testing $style style..."
    
    case $style in
        "girlboss")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 1.1,
                        "zoomFactor": 1.2,
                        "saturationFactor": 1.3,
                        "lightness": 0.1,
                        "audioPitch": 1.05,
                        "audioBitrate": "192k",
                        "audioTempoMod": {
                            "tempoFactor": 1.05,
                            "preservePitch": true
                        },
                        "syncShift": 50,
                        "eqAdjustments": {
                            "low": 1,
                            "mid": 0.5,
                            "high": 1.5
                        },
                        "smartCrop": {
                            "percentage": 1.1,
                            "direction": "center"
                        },
                        "visibleChanges": {
                            "border": true,
                            "timestamp": false
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "microCrop": true,
                            "subtleRotation": true,
                            "noiseAddition": true,
                            "metadataPoisoning": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nGIRLBOSS ENERGY! 💅✨\n\n2\n00:00:03,000 --> 00:00:06,000\nOWN YOUR POWER! 👑",
                        "subtitleStyle": "girlboss",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 32,
                        "girlbossColor": "#FF1493",
                        "shadowStrength": 2.0,
                        "animation": "shake",
                        "verticalPosition": 18,
                        "outlineWidth": 3,
                        "outlineColor": "#000000",
                        "outlineBlur": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "hormozi")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 0.9,
                        "zoomFactor": 1.3,
                        "saturationFactor": 1.5,
                        "lightness": 0.2,
                        "audioPitch": 1.1,
                        "audioBitrate": "256k",
                        "audioTempoMod": {
                            "tempoFactor": 1.1,
                            "preservePitch": false
                        },
                        "syncShift": -25,
                        "reverbEffect": {
                            "level": 0.1,
                            "delay": 50
                        },
                        "smartCrop": {
                            "percentage": 1.2,
                            "direction": "center"
                        },
                        "temporalModification": {
                            "dropFrames": 2,
                            "duplicateFrames": 1
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "noiseAddition": true,
                            "subtleRotation": true,
                            "frameInterpolation": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:02,500\nATTENTION! 🚨💰\n\n2\n00:00:02,500 --> 00:00:05,000\nThis will CHANGE your LIFE! 🔥",
                        "subtitleStyle": "hormozi",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 50,
                        "hormoziColors": ["#00FF00", "#FF0000", "#0080FF", "#FFFF00"],
                        "shadowStrength": 3.5,
                        "animation": "shake",
                        "verticalPosition": 15,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 0
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "tiktokstyle")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 1.2,
                        "zoomFactor": 1.1,
                        "saturationFactor": 1.8,
                        "lightness": 0.15,
                        "audioPitch": 1.15,
                        "audioBitrate": "320k",
                        "backgroundAudio": true,
                        "backgroundAudioVolume": 0.3,
                        "smartCrop": {
                            "percentage": 1.3,
                            "direction": "random"
                        },
                        "visibleChanges": {
                            "horizontalFlip": false,
                            "border": true,
                            "timestamp": true
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "microCrop": true,
                            "metadataPoisoning": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:02,500\nTIKTOK STYLE! 🎵💫\n\n2\n00:00:02,500 --> 00:00:05,000\nSingle color VIBES! 🔥✨",
                        "subtitleStyle": "tiktokstyle",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 50,
                        "tiktokstyleColor": "#FFFF00",
                        "shadowStrength": 0.5,
                        "animation": "shake",
                        "verticalPosition": 15,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 0
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "thintobold")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 0.8,
                        "zoomFactor": 1.4,
                        "saturationFactor": 0.9,
                        "lightness": -0.1,
                        "audioPitch": 0.95,
                        "audioBitrate": "256k",
                        "audioTempoMod": {
                            "tempoFactor": 0.95,
                            "preservePitch": true
                        },
                        "eqAdjustments": {
                            "low": -1,
                            "mid": 2,
                            "high": 0.5
                        },
                        "backgroundAddition": {
                            "type": "nature",
                            "level": 0.05
                        },
                        "smartCrop": {
                            "percentage": 0.9,
                            "direction": "top"
                        },
                        "antiDetection": {
                            "subtleRotation": true,
                            "frameInterpolation": true,
                            "metadataPoisoning": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nTHIN TO BOLD\n\n2\n00:00:03,000 --> 00:00:06,000\nELEGANT TRANSITIONS",
                        "subtitleStyle": "thintobold",
                        "fontFamily": "Montserrat Thin",
                        "fontSize": 50,
                        "thinToBoldColor": "#FFFFFF",
                        "shadowStrength": 1.8,
                        "animation": "none",
                        "verticalPosition": 22,
                        "outlineWidth": 0.5,
                        "outlineColor": "#000000",
                        "outlineBlur": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "wavycolors")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 1.3,
                        "zoomFactor": 1.5,
                        "saturationFactor": 2.0,
                        "lightness": 0.3,
                        "framerate": 60,
                        "audioPitch": 1.2,
                        "backgroundAudio": true,
                        "backgroundAudioVolume": 0.15,
                        "smartCrop": {
                            "percentage": 1.4,
                            "direction": "left"
                        },
                        "temporalModification": {
                            "duplicateFrames": 3,
                            "reverseSegments": true
                        },
                        "visibleChanges": {
                            "horizontalFlip": true,
                            "border": false
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "noiseAddition": true,
                            "microCrop": true,
                            "frameInterpolation": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:04,000\nRAINBOW COLORS 🌈✨\n\n2\n00:00:04,000 --> 00:00:08,000\nWAVY MAGIC 🔮",
                        "subtitleStyle": "wavycolors",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 50,
                        "wavyColorsOutlineWidth": 3,
                        "verticalPosition": 12,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "shrinkingpairs")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 0.7,
                        "zoomFactor": 1.6,
                        "saturationFactor": 1.2,
                        "lightness": -0.2,
                        "audioPitch": 0.8,
                        "audioBitrate": "128k",
                        "syncShift": 100,
                        "reverbEffect": {
                            "level": 0.15,
                            "delay": 75
                        },
                        "eqAdjustments": {
                            "low": 2,
                            "mid": -1,
                            "high": 3
                        },
                        "backgroundAddition": {
                            "type": "crowd",
                            "level": 0.08
                        },
                        "smartCrop": {
                            "percentage": 0.8,
                            "direction": "bottom"
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "subtleRotation": true,
                            "noiseAddition": true,
                            "metadataPoisoning": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nSHRINKING PAIRS SHRINKING PAIRS\n\n2\n00:00:03,000 --> 00:00:06,000\nWATCH IT SHRINK! ⚡",
                        "subtitleStyle": "shrinkingpairs",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 36,
                        "shrinkingPairsColor": "#FFFFFF",
                        "shadowStrength": 2.5,
                        "animation": "shake",
                        "verticalPosition": 20,
                        "outlineWidth": 3,
                        "outlineColor": "#000000",
                        "outlineBlur": 1,
                        "wordMode": "multiple",
                        "wordsPerGroup": '$WORDS_PER_GROUP'
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "revealenlarge")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 1.4,
                        "zoomFactor": 1.8,
                        "saturationFactor": 1.7,
                        "lightness": 0.4,
                        "framerate": 30,
                        "audioPitch": 1.3,
                        "audioBitrate": "320k",
                        "audioTempoMod": {
                            "tempoFactor": 1.2,
                            "preservePitch": false
                        },
                        "syncShift": -75,
                        "backgroundAudio": true,
                        "backgroundAudioVolume": 0.4,
                        "smartCrop": {
                            "percentage": 1.7,
                            "direction": "right"
                        },
                        "temporalModification": {
                            "dropFrames": 1,
                            "duplicateFrames": 2,
                            "reverseSegments": false
                        },
                        "visibleChanges": {
                            "horizontalFlip": false,
                            "border": true,
                            "timestamp": true
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "microCrop": true,
                            "subtleRotation": true,
                            "noiseAddition": true,
                            "metadataPoisoning": true,
                            "frameInterpolation": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nREVEAL AND ENLARGE! 🌟\n\n2\n00:00:03,000 --> 00:00:06,000\nCOLOR CYCLING MAGIC! 🎨",
                        "subtitleStyle": "revealenlarge",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 50,
                        "revealEnlargeColors": ["#FF0000", "#00FF00", "#0080FF", "#FFFF00", "#FF1493"],
                        "shadowStrength": 3.0,
                        "animation": "shake",
                        "verticalPosition": 16,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "whiteimpact")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 1.1,
                        "zoomFactor": 1.3,
                        "saturationFactor": 0.8,
                        "lightness": 0.25,
                        "audioPitch": 1.05,
                        "audioBitrate": "192k",
                        "backgroundAudio": true,
                        "backgroundAudioVolume": 0.25,
                        "smartCrop": {
                            "percentage": 1.2,
                            "direction": "center"
                        },
                        "visibleChanges": {
                            "border": true,
                            "timestamp": false
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "noiseAddition": true,
                            "subtleRotation": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nWHITE IMPACT! ⚡💥\n\n2\n00:00:03,000 --> 00:00:06,000\nPOWERFUL EFFECT! 🔥",
                        "subtitleStyle": "whiteimpact",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 48,
                        "shadowStrength": 2.5,
                        "animation": "shake",
                        "verticalPosition": 18,
                        "outlineWidth": 3,
                        "outlineColor": "#000000",
                        "outlineBlur": 0
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "impactfull")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 0.9,
                        "zoomFactor": 1.7,
                        "saturationFactor": 1.4,
                        "lightness": 0.35,
                        "framerate": 60,
                        "audioPitch": 0.95,
                        "audioBitrate": "320k",
                        "audioTempoMod": {
                            "tempoFactor": 0.95,
                            "preservePitch": false
                        },
                        "reverbEffect": {
                            "level": 0.2,
                            "delay": 100
                        },
                        "backgroundAddition": {
                            "type": "room",
                            "level": 0.1
                        },
                        "smartCrop": {
                            "percentage": 1.5,
                            "direction": "center"
                        },
                        "temporalModification": {
                            "duplicateFrames": 4,
                            "reverseSegments": false
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "microCrop": true,
                            "subtleRotation": true,
                            "noiseAddition": true,
                            "metadataPoisoning": true,
                            "frameInterpolation": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nFULL IMPACT MODE! 💥⚡\n\n2\n00:00:03,000 --> 00:00:06,000\nMAXIMUM INTENSITY! 🚀",
                        "subtitleStyle": "impactfull",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 52,
                        "shadowStrength": 4.0,
                        "animation": "shake",
                        "verticalPosition": 14,
                        "outlineWidth": 4,
                        "outlineColor": "#000000",
                        "outlineBlur": 2
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "basic")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "options": {
                        "speedFactor": 1.0,
                        "zoomFactor": 1.1,
                        "saturationFactor": 1.1,
                        "lightness": 0.05,
                        "audioPitch": 1.0,
                        "audioBitrate": "256k",
                        "audioTempoMod": {
                            "tempoFactor": 1.0,
                            "preservePitch": true
                        },
                        "eqAdjustments": {
                            "low": 0,
                            "mid": 1,
                            "high": 0
                        },
                        "smartCrop": {
                            "percentage": 1.0,
                            "direction": "center"
                        },
                        "antiDetection": {
                            "pixelShift": true,
                            "microCrop": true,
                            "metadataPoisoning": true
                        }
                    },
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nProfessional Content\n\n2\n00:00:03,000 --> 00:00:06,000\nClean and Simple",
                        "subtitleStyle": "basic",
                        "fontSize": 32,
                        "fontColor": "white",
                        "fontStyle": "bold",
                        "subtitlePosition": "bottom",
                        "horizontalAlignment": "center",
                        "verticalPosition": 35,
                        "showBackground": true,
                        "backgroundColor": "black@0.8",
                        "outlineWidth": 3,
                        "outlineColor": "#000000",
                        "outlineBlur": 0
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        *)
            echo "❌ Unknown style: $style"
            echo "Available styles: girlboss, hormozi, tiktokstyle, thintobold, wavycolors, shrinkingpairs, revealenlarge, whiteimpact, impactfull, basic"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo "✅ $style test completed successfully!"
        echo "📁 Output file: $OUTPUT_DIR/${output_name}.mp4"
        
        # Show file size
        if [ -f "$OUTPUT_DIR/${output_name}.mp4" ]; then
            size=$(ls -lh "$OUTPUT_DIR/${output_name}.mp4" | awk '{print $5}')
            echo "📊 File size: $size"
        fi
    else
        echo "❌ $style test failed!"
    fi
}

# Test the specified style
test_style "$STYLE"

echo ""
echo "💡 Usage examples:"
echo "   ./test-single-style.sh girlboss"
echo "   ./test-single-style.sh hormozi"
echo "   ./test-single-style.sh tiktokstyle"
echo "   ./test-single-style.sh thintobold"
echo "   ./test-single-style.sh wavycolors"
echo "   ./test-single-style.sh shrinkingpairs"
echo "   ./test-single-style.sh revealenlarge"
echo "   ./test-single-style.sh whiteimpact"
echo "   ./test-single-style.sh impactfull"
echo "   ./test-single-style.sh basic" 