<template>
  <div class="subtitle-styling">
    <div class="form-group">
      <label for="srtContent">SRT Content</label>
      <textarea
        id="srtContent"
        v-model="caption.srtContent"
        rows="8"
        placeholder="1&#10;00:00:00,000 --> 00:00:03,000&#10;Hello World!"
      ></textarea>
      <small class="hint">Enter your subtitle content in SRT format. You can also use the transcription API to generate this automatically.</small>
    </div>

         <div v-if="showAdvanced" class="subsection">
       <h3>Text Styling</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="fontSize">Font Size (10-72)</label>
          <input
            id="fontSize"
            v-model.number="caption.fontSize"
            type="range"
            min="10"
            max="72"
            step="2"
          />
          <span class="range-value">{{ caption.fontSize }}px</span>
        </div>
        <div class="form-group">
          <label for="fontColor">Font Color</label>
          <input
            id="fontColor"
            v-model="caption.fontColor"
            type="color"
          />
          <input
            v-model="caption.fontColor"
            type="text"
            class="color-text"
            placeholder="#ffffff"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="fontFamily">Font Family</label>
          <select id="fontFamily" v-model="caption.fontFamily">
            <option v-for="font in availableFonts" :key="font" :value="font">
              {{ font }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="fontStyle">Font Style</label>
          <select id="fontStyle" v-model="caption.fontStyle">
            <option value="regular">Regular</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
          </select>
        </div>
      </div>
    </div>

         <div v-if="showAdvanced" class="subsection">
       <h3>Positioning</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="subtitlePosition">Subtitle Position</label>
          <select id="subtitlePosition" v-model="caption.subtitlePosition">
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        <div class="form-group">
          <label for="horizontalAlignment">Horizontal Alignment</label>
          <select id="horizontalAlignment" v-model="caption.horizontalAlignment">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="verticalMargin">Vertical Margin (10-100px)</label>
          <input
            id="verticalMargin"
            v-model.number="caption.verticalMargin"
            type="range"
            min="10"
            max="100"
            step="5"
          />
          <span class="range-value">{{ caption.verticalMargin }}px</span>
        </div>
        <div class="form-group">
          <label for="verticalPosition">Vertical Position (0-100%)</label>
          <input
            id="verticalPosition"
            v-model.number="caption.verticalPosition"
            type="range"
            min="0"
            max="100"
            step="5"
          />
          <span class="range-value">{{ caption.verticalPosition }}%</span>
        </div>
      </div>
    </div>

         <div v-if="showAdvanced" class="subsection">
       <h3>Background & Effects</h3>
      <div class="checkbox-group">
        <label class="checkbox">
          <input v-model="caption.showBackground" type="checkbox" />
          <span>Show Background</span>
        </label>
      </div>
      <div v-if="caption.showBackground" class="form-row">
        <div class="form-group">
          <label for="backgroundColor">Background Color</label>
          <input
            id="backgroundColor"
            v-model="caption.backgroundColor"
            type="text"
            placeholder="black@0.5"
          />
          <small class="hint">Format: color@opacity (e.g., black@0.5, white@0.8)</small>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="outlineWidth">Outline Width (0-8px)</label>
          <input
            id="outlineWidth"
            v-model.number="caption.outlineWidth"
            type="range"
            min="0"
            max="8"
            step="1"
          />
          <span class="range-value">{{ caption.outlineWidth }}px</span>
        </div>
        <div class="form-group">
          <label for="outlineColor">Outline Color</label>
          <input
            id="outlineColor"
            v-model="caption.outlineColor"
            type="color"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="shadowStrength">Shadow Strength (0.5-5.0)</label>
          <input
            id="shadowStrength"
            v-model.number="caption.shadowStrength"
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
          />
          <span class="range-value">{{ caption.shadowStrength }}</span>
        </div>
        <div class="form-group">
          <label for="animation">Animation</label>
          <select id="animation" v-model="caption.animation">
            <option value="none">None</option>
            <option value="shake">Shake</option>
          </select>
        </div>
      </div>
    </div>

    <div class="subsection">
      <h3>Style Template</h3>
      <div class="form-group">
        <label for="subtitleStyle">Predefined Style</label>
        <select id="subtitleStyle" v-model="caption.subtitleStyle">
          <option value="basic">Basic</option>
          <option value="girlboss">Girlboss</option>
          <option value="hormozi">Hormozi</option>
          <option value="tiktokstyle">TikTok Style</option>
          <option value="thintobold">Thin to Bold</option>
          <option value="wavycolors">Wavy Colors</option>
          <option value="shrinkingpairs">Shrinking Pairs</option>
          <option value="revealenlarge">Reveal Enlarge</option>
        </select>
        <small class="hint">Selecting a predefined style will override individual styling options above</small>
      </div>

      <!-- Style-specific options -->
      <div v-if="caption.subtitleStyle === 'girlboss'" class="style-options">
        <div class="form-group">
          <label for="girlbossColor">Girlboss Color</label>
          <input
            id="girlbossColor"
            v-model="caption.girlbossColor"
            type="color"
          />
        </div>
      </div>

      <div v-if="caption.subtitleStyle === 'hormozi'" class="style-options">
        <div class="form-group">
          <label>Hormozi Colors (4 colors)</label>
          <div class="color-array">
            <input
              v-for="(color, index) in caption.hormoziColors"
              :key="index"
              v-model="caption.hormoziColors[index]"
              type="color"
              class="color-picker-small"
            />
          </div>
        </div>
      </div>

      <div v-if="caption.subtitleStyle === 'tiktokstyle'" class="style-options">
        <div class="form-group">
          <label for="tiktokstyleColor">TikTok Style Color</label>
          <input
            id="tiktokstyleColor"
            v-model="caption.tiktokstyleColor"
            type="color"
          />
        </div>
      </div>

      <div v-if="caption.subtitleStyle === 'revealenlarge'" class="style-options">
        <div class="form-group">
          <label>Reveal Enlarge Colors (4 colors)</label>
          <div class="color-array">
            <input
              v-for="(color, index) in caption.revealEnlargeColors"
              :key="index"
              v-model="caption.revealEnlargeColors[index]"
              type="color"
              class="color-picker-small"
            />
          </div>
        </div>
      </div>
    </div>

         <div v-if="showAdvanced" class="subsection">
       <h3>Word Processing</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="wordMode">Word Mode</label>
          <select id="wordMode" v-model="caption.wordMode">
            <option value="normal">Normal</option>
            <option value="single">Single Word</option>
            <option value="multiple">Multiple Words</option>
          </select>
        </div>
        <div v-if="caption.wordMode === 'multiple'" class="form-group">
          <label for="wordsPerGroup">Words Per Group (1-10)</label>
          <input
            id="wordsPerGroup"
            v-model.number="caption.wordsPerGroup"
            type="range"
            min="1"
            max="10"
            step="1"
          />
          <span class="range-value">{{ caption.wordsPerGroup }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  availableFonts: {
    type: Array,
    default: () => ['Arial']
  },
  showAdvanced: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const caption = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Initialize missing properties with defaults
if (!caption.value.backgroundColor) {
  caption.value.backgroundColor = 'black@0.5'
}
if (!caption.value.outlineWidth) {
  caption.value.outlineWidth = 2
}
if (!caption.value.outlineColor) {
  caption.value.outlineColor = '#000000'
}
if (!caption.value.shadowStrength) {
  caption.value.shadowStrength = 1.5
}
if (!caption.value.animation) {
  caption.value.animation = 'none'
}
if (!caption.value.subtitlePosition) {
  caption.value.subtitlePosition = 'bottom'
}
if (!caption.value.horizontalAlignment) {
  caption.value.horizontalAlignment = 'center'
}
if (!caption.value.verticalMargin) {
  caption.value.verticalMargin = 30
}
if (!caption.value.verticalPosition) {
  caption.value.verticalPosition = 15
}
if (!caption.value.fontStyle) {
  caption.value.fontStyle = 'bold'
}
if (!caption.value.wordMode) {
  caption.value.wordMode = 'normal'
}
if (!caption.value.wordsPerGroup) {
  caption.value.wordsPerGroup = 1
}
if (!caption.value.girlbossColor) {
  caption.value.girlbossColor = '#F361D8'
}
if (!caption.value.hormoziColors) {
  caption.value.hormoziColors = ['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00']
}
if (!caption.value.tiktokstyleColor) {
  caption.value.tiktokstyleColor = '#FFFF00'
}
if (!caption.value.revealEnlargeColors) {
  caption.value.revealEnlargeColors = ['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00']
}
</script>

<style scoped>
.subtitle-styling {
  width: 100%;
}

.subsection {
  margin: 20px 0;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.subsection h3 {
  font-size: 1.2rem;
  margin: 0 0 15px 0;
  color: #374151;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input[type="range"] {
  padding: 0;
}

.form-group input[type="color"] {
  height: 45px;
  padding: 2px;
}

.color-text {
  margin-top: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.range-value {
  display: inline-block;
  margin-left: 10px;
  font-weight: 600;
  color: #667eea;
  min-width: 40px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  margin: 0 10px 0 0;
  width: auto;
}

.hint {
  display: block;
  margin-top: 5px;
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
}

.style-options {
  margin-top: 15px;
  padding: 15px;
  background: #e5e7eb;
  border-radius: 6px;
}

.color-array {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-picker-small {
  width: 60px !important;
  height: 40px;
  padding: 2px;
  border-radius: 4px;
}
</style> 