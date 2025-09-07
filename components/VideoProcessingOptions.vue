<template>
  <div class="processing-options">
    <!-- Basic Adjustments -->
    <div class="subsection">
      <h3>Basic Adjustments</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="speedFactor">Speed Factor (0.5-2.0)</label>
          <input
            id="speedFactor"
            v-model.number="options.speedFactor"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
          />
          <span class="range-value">{{ options.speedFactor }}</span>
        </div>
        <div class="form-group">
          <label for="zoomFactor">Zoom Factor (1.0-2.0)</label>
          <input
            id="zoomFactor"
            v-model.number="options.zoomFactor"
            type="range"
            min="1.0"
            max="2.0"
            step="0.1"
          />
          <span class="range-value">{{ options.zoomFactor }}</span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="saturationFactor">Saturation (0.5-2.0)</label>
          <input
            id="saturationFactor"
            v-model.number="options.saturationFactor"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
          />
          <span class="range-value">{{ options.saturationFactor }}</span>
        </div>
        <div class="form-group">
          <label for="lightness">Brightness (-0.5 to 0.5)</label>
          <input
            id="lightness"
            v-model.number="options.lightness"
            type="range"
            min="-0.5"
            max="0.5"
            step="0.1"
          />
          <span class="range-value">{{ options.lightness }}</span>
        </div>
      </div>
    </div>

    <!-- Audio Options -->
    <div class="subsection">
      <h3>Audio Options</h3>
      <div class="checkbox-group">
        <label class="checkbox">
          <input v-model="options.backgroundAudio" type="checkbox" />
          <span>Add Background Audio</span>
        </label>
      </div>
      <div v-if="options.backgroundAudio" class="form-row">
        <div class="form-group">
          <label for="backgroundAudioVolume">Background Audio Volume (0.05-0.5)</label>
          <input
            id="backgroundAudioVolume"
            v-model.number="options.backgroundAudioVolume"
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
          />
          <span class="range-value">{{ options.backgroundAudioVolume }}</span>
        </div>
        <div class="form-group">
          <label for="audioPitch">Audio Pitch (0.5-1.5)</label>
          <input
            id="audioPitch"
            v-model.number="options.audioPitch"
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
          />
          <span class="range-value">{{ options.audioPitch }}</span>
        </div>
      </div>
    </div>

    <!-- Smart Crop Options -->
    <div class="subsection">
      <h3>Smart Crop</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="cropPercentage">Crop Percentage (0.1-2.0)</label>
          <input
            id="cropPercentage"
            v-model.number="options.smartCrop.percentage"
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
          />
          <span class="range-value">{{ options.smartCrop.percentage }}</span>
        </div>
        <div class="form-group">
          <label for="cropDirection">Crop Direction</label>
          <select id="cropDirection" v-model="options.smartCrop.direction">
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="random">Random</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Audio Enhancements -->
    <div class="subsection">
      <h3>Audio Enhancements</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="tempoFactor">Tempo Factor (0.8-1.2)</label>
          <input
            id="tempoFactor"
            v-model.number="options.audioTempoMod.tempoFactor"
            type="range"
            min="0.8"
            max="1.2"
            step="0.1"
          />
          <span class="range-value">{{ options.audioTempoMod.tempoFactor }}</span>
        </div>
        <div class="form-group">
          <label for="reverbLevel">Reverb Level (0.05-0.2)</label>
          <input
            id="reverbLevel"
            v-model.number="options.reverbEffect.level"
            type="range"
            min="0.05"
            max="0.2"
            step="0.01"
          />
          <span class="range-value">{{ options.reverbEffect.level }}</span>
        </div>
      </div>
      <div class="checkbox-group">
        <label class="checkbox">
          <input v-model="options.audioTempoMod.preservePitch" type="checkbox" />
          <span>Preserve Pitch During Tempo Change</span>
        </label>
      </div>
    </div>

    <!-- Visual Modifications -->
    <div class="subsection">
      <h3>Visual Modifications</h3>
      <div class="checkbox-grid">
        <label class="checkbox">
          <input v-model="options.visibleChanges.horizontalFlip" type="checkbox" />
          <span>Horizontal Flip</span>
        </label>
        <label class="checkbox">
          <input v-model="options.visibleChanges.border" type="checkbox" />
          <span>Add Border</span>
        </label>
        <label class="checkbox">
          <input v-model="options.visibleChanges.timestamp" type="checkbox" />
          <span>Add Timestamp</span>
        </label>
      </div>
    </div>

    <!-- Anti-Detection Features -->
    <div class="subsection">
      <h3>Anti-Detection Features</h3>
      <div class="checkbox-grid">
        <label class="checkbox">
          <input v-model="options.antiDetection.pixelShift" type="checkbox" />
          <span>Pixel Shift</span>
        </label>
        <label class="checkbox">
          <input v-model="options.antiDetection.microCrop" type="checkbox" />
          <span>Micro Crop</span>
        </label>
        <label class="checkbox">
          <input v-model="options.antiDetection.subtleRotation" type="checkbox" />
          <span>Subtle Rotation</span>
        </label>
        <label class="checkbox">
          <input v-model="options.antiDetection.noiseAddition" type="checkbox" />
          <span>Noise Addition</span>
        </label>
        <label class="checkbox">
          <input v-model="options.antiDetection.metadataPoisoning" type="checkbox" />
          <span>Metadata Poisoning</span>
        </label>
        <label class="checkbox">
          <input v-model="options.antiDetection.frameInterpolation" type="checkbox" />
          <span>Frame Interpolation</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const options = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Initialize missing nested objects
if (!options.value.smartCrop) {
  options.value.smartCrop = { percentage: 0.8, direction: 'center' }
}
if (!options.value.audioTempoMod) {
  options.value.audioTempoMod = { tempoFactor: 1.0, preservePitch: true }
}
if (!options.value.reverbEffect) {
  options.value.reverbEffect = { level: 0.1, delay: 50 }
}
if (!options.value.visibleChanges) {
  options.value.visibleChanges = { horizontalFlip: false, border: false, timestamp: false }
}
</script>

<script>
import { computed } from 'vue'
</script>

<style scoped>
.processing-options {
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
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input[type="range"] {
  padding: 0;
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

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
</style> 