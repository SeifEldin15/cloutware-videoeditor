# Word Mode Testing Scripts

This directory contains specialized test scripts for the new **Word Mode** functionality, which allows subtitles to be displayed as individual words or word groups instead of entire subtitle segments at once.

## 📁 Test Scripts

### 1. `test-word-mode-single.sh`
Tests **Single Word Mode** where each word appears individually.

**Usage:**
```bash
./test-word-mode-single.sh [style_name]
```

**Examples:**
```bash
./test-word-mode-single.sh girlboss
./test-word-mode-single.sh hormozi
./test-word-mode-single.sh thintobold
./test-word-mode-single.sh wavycolors
./test-word-mode-single.sh basic
```

**What it does:**
- Sets `"wordMode": "single"`
- Sets `"wordsPerGroup": 1`
- Each word gets equal timing from the original subtitle duration
- All animations and effects are preserved per word

### 2. `test-word-mode-multiple.sh`
Tests **Multiple Word Mode** where words appear in groups of 3.

**Usage:**
```bash
./test-word-mode-multiple.sh [style_name]
```

**Examples:**
```bash
./test-word-mode-multiple.sh girlboss
./test-word-mode-multiple.sh hormozi
./test-word-mode-multiple.sh thintobold
./test-word-mode-multiple.sh wavycolors
./test-word-mode-multiple.sh basic
```

**What it does:**
- Sets `"wordMode": "multiple"`
- Sets `"wordsPerGroup": 3`
- Words are grouped into sets of 3
- Each group gets equal timing from the original subtitle duration
- All animations and effects are preserved per group

### 3. `test-word-modes-comparison.sh`
Runs both single and multiple word mode tests for easy comparison.

**Usage:**
```bash
./test-word-modes-comparison.sh [style_name]
```

**What it does:**
- Runs single word mode test first
- Waits 3 seconds
- Runs multiple word mode test
- Provides comparison summary

## 🎯 Expected Results

### Single Word Mode
```
Original: "This is an amazing test"
Result: "This" → "is" → "an" → "amazing" → "test"
Timing: Each word appears for (total duration ÷ 5 words)
```

### Multiple Word Mode (3 words)
```
Original: "This is an amazing test video"
Result: "This is an" → "amazing test video"
Timing: Each group appears for (total duration ÷ 2 groups)
```

## 📊 Output Files

All test outputs are saved to `./test_outputs_single/`:

- `{style}_single_word.mp4` - Single word mode results
- `{style}_multiple_word.mp4` - Multiple word mode results

## 🔤 Word Mode Parameters

### New Caption Parameters:
```json
{
  "caption": {
    "wordMode": "single" | "multiple" | "normal",
    "wordsPerGroup": 1-10,
    // ... other caption parameters
  }
}
```

### Parameter Details:
- **`wordMode`**: 
  - `"normal"` (default): Traditional subtitle behavior
  - `"single"`: Each word appears individually
  - `"multiple"`: Words appear in groups
- **`wordsPerGroup`**: Number of words per group (only used with `"multiple"` mode)

## 🚀 Quick Test Commands

```bash
# Test girlboss style with both word modes
./test-word-modes-comparison.sh girlboss

# Test just single word mode for hormozi
./test-word-mode-single.sh hormozi

# Test just multiple word mode for thintobold
./test-word-mode-multiple.sh thintobold
```

## ✅ Compatibility

Word Mode works with:
- ✅ All subtitle styles (basic, girlboss, hormozi, thintobold, wavycolors)
- ✅ All animations (shake, static)
- ✅ All styling options (colors, fonts, shadows, outlines)
- ✅ Both basic and advanced subtitle processing
- ✅ MP4 format only (GIF and PNG don't support subtitles)

## 🎨 Style Examples

### Girlboss + Single Word Mode
Each word appears with pink color, glow effects, and optional shake animation.

### Hormozi + Multiple Word Mode
Word groups appear with each individual word alternating colors within and across groups.

**Example with colors [Green, Red, Blue, Yellow]:**
- Group 1: "Attention entrepreneurs this" → Attention(Green) entrepreneurs(Red) this(Blue)
- Group 2: "revolutionary system will" → revolutionary(Yellow) system(Green) will(Red) 
- Group 3: "absolutely change everything" → absolutely(Blue) change(Yellow) everything(Green)

**Single Word Mode Example:**
- "Attention"(Green) → "entrepreneurs"(Red) → "this"(Blue) → "revolutionary"(Yellow) → "system"(Green) → "will"(Red) → ...

### ThinToBold + Single Word Mode
Individual words with elegant thin-to-bold font transitions.

### WavyColors + Multiple Word Mode
Word groups with rainbow color cycling effects.

### Basic + Single Word Mode
Clean, traditional subtitle styling applied per word.

## 🔧 Customization

You can modify the scripts to test different:
- Word group sizes (change `WORDS_PER_GROUP=3` to any value 1-10)
- SRT content (longer or shorter text)
- Timing durations
- Style combinations

## 📝 Notes

- Processing time may be slightly longer for word mode due to increased subtitle segments
- File size impact is minimal
- Memory usage scales with the number of word segments created
- All existing functionality remains backward compatible 