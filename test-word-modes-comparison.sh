#!/bin/bash

# Word Mode Comparison Test Script
# Tests both single and multiple word modes for the same style
# Usage: ./test-word-modes-comparison.sh [style_name]
# Example: ./test-word-modes-comparison.sh girlboss

STYLE=${1:-girlboss}

echo "🎬 Word Mode Comparison Test"
echo "============================"
echo "🔤 Testing Style: $STYLE"
echo "📋 Testing both SINGLE and MULTIPLE (3 words) word modes"
echo ""

# Test single word mode
echo "🔤 Step 1: Testing SINGLE word mode..."
echo "-------------------------------------"
./test-word-mode-single.sh "$STYLE"

echo ""
echo "⏳ Waiting 3 seconds before next test..."
sleep 3
echo ""

# Test multiple word mode  
echo "🔤 Step 2: Testing MULTIPLE word mode (3 words per group)..."
echo "-----------------------------------------------------------"
./test-word-mode-multiple.sh "$STYLE"

echo ""
echo "🎯 Comparison Summary"
echo "===================="
echo "✅ Single Word Mode: Each word appears individually"
echo "   - File: test_outputs_single/${STYLE}_single_word.mp4"
echo "   - Timing: Fast word-by-word reveals"
echo "   - Use Case: Maximum emphasis, learning content"
echo ""
echo "✅ Multiple Word Mode: Words appear in groups of 3"
echo "   - File: test_outputs_single/${STYLE}_multiple_word.mp4"
echo "   - Timing: Balanced reading flow"
echo "   - Use Case: Better comprehension, professional content"
echo ""
echo "💡 Test both files to see the difference in pacing and readability!"
echo ""
echo "🚀 Quick test commands:"
echo "   ./test-word-modes-comparison.sh girlboss"
echo "   ./test-word-modes-comparison.sh hormozi"
echo "   ./test-word-modes-comparison.sh thintobold"
echo "   ./test-word-modes-comparison.sh wavycolors"
echo "   ./test-word-modes-comparison.sh basic" 