<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-blue-400">Complete Processing</h1>
        <p class="text-gray-300 mt-2">
          Upload, transcribe, add subtitles, and process videos all in one place
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Panel: Input & Configuration -->
        <div class="space-y-6">
          <!-- Video Input Section -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-300">
              1. Video Input
            </h2>

            <!-- Video URL Input -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">Video URL</label>
              <input
                v-model="videoUrl"
                type="url"
                placeholder="https://example.com/video.mp4"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- File Upload -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2"
                >Or Upload Video File</label
              >
              <div
                class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
              >
                <input
                  type="file"
                  accept="video/*"
                  @change="handleFileUpload"
                  class="hidden"
                  ref="fileInput"
                />
                <div @click="$refs.fileInput.click()" class="cursor-pointer">
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <p class="mt-2 text-sm text-gray-400">
                    <span class="font-medium text-blue-400"
                      >Click to upload</span
                    >
                    or drag and drop
                  </p>
                  <p class="text-xs text-gray-500">MP4, MOV, AVI up to 500MB</p>
                </div>
              </div>

              <div v-if="uploadedFile" class="mt-2 text-sm text-green-400">
                ✓ {{ uploadedFile.name }} ({{
                  Math.round(uploadedFile.size / 1024 / 1024)
                }}MB)
              </div>
            </div>
          </div>

          <!-- Transcription Settings -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-300">
              2. Transcription Settings
            </h2>

            <!-- Source Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2"
                >Transcription Source</label
              >
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="transcriptionSettings.source"
                    value="video-audio"
                    type="radio"
                    class="text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm"
                    >Extract from video audio (AI transcription)</span
                  >
                </label>
                <label class="flex items-center">
                  <input
                    v-model="transcriptionSettings.source"
                    value="manual"
                    type="radio"
                    class="text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm">Manual text input</span>
                </label>
              </div>
            </div>

            <!-- Manual Text Input (when manual is selected) -->
            <div v-if="transcriptionSettings.source === 'manual'" class="mb-4">
              <label class="block text-sm font-medium mb-2"
                >Manual Transcription Text</label
              >
              <textarea
                v-model="transcriptionSettings.manualText"
                class="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="Enter your text content here. This will be converted to subtitle format automatically."
              ></textarea>
            </div>

            <!-- AI Transcription Settings (when video-audio is selected) -->
            <div
              v-if="transcriptionSettings.source === 'video-audio'"
              class="space-y-4"
            >
              <!-- Language Selection -->
              <div>
                <label class="block text-sm font-medium mb-2">Language</label>
                <select
                  v-model="transcriptionSettings.language"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              <!-- Advanced Options -->
              <div class="space-y-3">
                <label class="flex items-center">
                  <input
                    v-model="transcriptionSettings.speakerLabels"
                    type="checkbox"
                    class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm">Speaker labels</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="transcriptionSettings.punctuate"
                    type="checkbox"
                    class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm">Auto punctuation</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="transcriptionSettings.formatText"
                    type="checkbox"
                    class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm">Format text</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Subtitle Settings -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-300">
              3. Subtitle Settings
            </h2>

            <!-- Style Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2"
                >Animation Style Template</label
              >
              <select
                v-model="subtitleSettings.animationStyle"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="🔥 Viral Templates">
                  <option value="girlboss">
                    💅 Girlboss - Bold pink/purple animations
                  </option>
                  <option value="hormozi">
                    🚀 Hormozi - Business motivational style
                  </option>
                  <option value="tiktokstyle">
                    📱 TikTok Style - Social media trending
                  </option>
                </optgroup>
                <optgroup label="⚡ Impact Templates">
                  <option value="whiteimpact">
                    ⚪ White Impact - Clean white highlights
                  </option>
                  <option value="impactfull">
                    💥 Impact Full - Maximum visual impact
                  </option>
                  <option value="thinToBold">
                    📈 Thin to Bold - Progressive emphasis
                  </option>
                </optgroup>
                <optgroup label="🎨 Creative Templates">
                  <option value="wavyColors">
                    🌊 Wavy Colors - Flowing rainbow effects
                  </option>
                  <option value="revealEnlarge">
                    🔍 Reveal Enlarge - Zoom-in discovery
                  </option>
                  <option value="shrinkingPairs">
                    📐 Shrinking Pairs - Minimalist pairs
                  </option>
                </optgroup>
              </select>

              <!-- Template Preview/Description -->
              <div
                class="mt-2 p-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg border border-gray-500"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="font-medium text-blue-300">
                    {{
                      getTemplateDescription(subtitleSettings.animationStyle)
                    }}
                  </div>
                  <div class="text-xs bg-blue-600 px-2 py-1 rounded-full">
                    {{ subtitleSettings.animationStyle.toUpperCase() }}
                  </div>
                </div>

                <!-- Template Preset Info -->
                <div
                  class="mb-2 p-2 bg-blue-900/30 border border-blue-600 rounded"
                >
                  <div class="flex items-center text-blue-400 text-xs">
                    <span class="mr-2">🎨</span>
                    <span class="font-medium">TEMPLATE PRESET LOADED</span>
                  </div>
                  <div class="text-blue-300 text-xs mt-1">
                    This template's optimized settings have been loaded as your
                    starting point. Feel free to customize!
                  </div>
                </div>

                <div class="text-gray-300 text-xs mb-2">
                  {{ getTemplateFeatures(subtitleSettings.animationStyle) }}
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-gray-400">
                    🎨
                    <span
                      class="inline-block w-3 h-3 rounded-full ml-1"
                      :style="{
                        backgroundColor: subtitleSettings.primaryColor,
                      }"
                    ></span>
                    <span
                      class="inline-block w-3 h-3 rounded-full ml-1"
                      :style="{
                        backgroundColor: subtitleSettings.secondaryColor,
                      }"
                    ></span>
                    • 📝 {{ subtitleSettings.fontFamily }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ subtitleSettings.fontSize }}px •
                    {{ subtitleSettings.wordMode }} •
                    {{ subtitleSettings.verticalPosition }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Font Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">
                Font Family
                <span class="text-xs text-blue-400 ml-2"
                  >✨ Template Suggested</span
                >
              </label>

              <!-- Always Editable Font Selection -->
              <select
                v-model="subtitleSettings.fontFamily"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter-Bold.ttf">Inter Bold</option>
                <option value="Roboto-Bold.ttf">Roboto Bold</option>
                <option value="Montserrat-Bold.ttf">Montserrat Bold</option>
                <option value="OpenSans-Bold.ttf">Open Sans Bold</option>
                <option value="Poppins-Bold.ttf">Poppins Bold</option>
                <option value="SourceSansPro-Bold.ttf">
                  Source Sans Pro Bold
                </option>
              </select>
            </div>

            <!-- Colors -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium">
                  Subtitle Colors
                  <span class="text-xs text-blue-400 ml-2"
                    >✨ Template Suggested</span
                  >
                </label>
              </div>

              <!-- Always Editable Color Selection -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium mb-1 text-gray-300"
                    >Primary Color</label
                  >
                  <input
                    v-model="subtitleSettings.primaryColor"
                    type="color"
                    class="w-full h-10 bg-gray-700 border border-gray-600 rounded-md"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1 text-gray-300"
                    >Secondary Color</label
                  >
                  <input
                    v-model="subtitleSettings.secondaryColor"
                    type="color"
                    class="w-full h-10 bg-gray-700 border border-gray-600 rounded-md"
                  />
                </div>
              </div>
              <div class="mt-2 text-xs text-blue-400">
                🎨 Template colors loaded as starting point - customize as
                needed!
              </div>
            </div>

            <!-- Font Size -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">
                Font Size: {{ subtitleSettings.fontSize }}px
                <span class="text-xs text-blue-400 ml-2"
                  >✨ Template Suggested</span
                >
              </label>

              <!-- Always Editable Font Size -->
              <input
                v-model="subtitleSettings.fontSize"
                type="range"
                min="20"
                max="100"
                class="w-full"
              />
              <div class="mt-1 text-xs text-blue-400">
                📏 Template optimized size loaded - adjust as needed!
              </div>
            </div>

            <!-- Vertical Position -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">
                Vertical Position
                <span class="text-xs text-blue-400 ml-2"
                  >✨ Template Suggested</span
                >
              </label>

              <!-- Always Editable Vertical Position -->
              <select
                v-model="subtitleSettings.verticalPosition"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="top">
                  🔝 Top - Subtitles at the top of video
                </option>
                <option value="center">
                  🎯 Center - Subtitles in the middle
                </option>
                <option value="bottom">
                  🔽 Bottom - Subtitles at the bottom (default)
                </option>
              </select>
              <div class="mt-1 text-xs text-blue-400">
                📍 Template position loaded - choose what works best for your
                video!
              </div>
            </div>

            <!-- Word Processing Settings -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium">
                  Word Animation Mode
                  <span class="text-xs text-blue-400 ml-2"
                    >✨ Template Suggested</span
                  >
                </label>
              </div>

              <!-- Always Editable Word Processing -->
              <select
                v-model="subtitleSettings.wordMode"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 mb-2"
              >
                <option value="normal">Normal - Full sentences</option>
                <option value="single">Single - One word at a time</option>
                <option value="multiple">Multiple - Word groups</option>
              </select>

              <div v-if="subtitleSettings.wordMode === 'multiple'" class="mt-2">
                <label class="block text-xs font-medium mb-1 text-gray-300"
                  >Words per Group: {{ subtitleSettings.wordsPerGroup }}</label
                >
                <input
                  v-model="subtitleSettings.wordsPerGroup"
                  type="range"
                  min="1"
                  max="6"
                  class="w-full"
                />
              </div>

              <div class="mt-2 text-xs text-blue-400">
                🎯 Template optimized settings loaded - customize for your
                style!
              </div>
            </div>
          </div>

          <!-- Processing Options -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-300">
              4. Processing Options
            </h2>

            <!-- Video Quality Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2"
                >Video Quality</label
              >
              <select
                v-model="processingOptions.quality"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="premium">
                  🏆 Premium - Near-lossless quality (CRF 12, slower preset)
                </option>
                <option value="high">
                  ⭐ High Quality - Professional grade (CRF 15, slow preset)
                </option>
                <option value="standard">
                  🎯 Standard - Balanced quality (CRF 18, medium preset)
                </option>
                <option value="fast">
                  ⚡ Fast - Quick processing (CRF 23, fast preset)
                </option>
              </select>
              <div class="mt-2 text-xs text-gray-400">
                Higher quality = larger file size and longer processing time
              </div>
            </div>

            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  v-model="processingOptions.generateSubtitles"
                  type="checkbox"
                  class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-2 text-sm">Generate subtitle files</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="processingOptions.embedSubtitles"
                  type="checkbox"
                  class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-2 text-sm">Embed subtitles in video</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="processingOptions.optimizeForWeb"
                  type="checkbox"
                  class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-2 text-sm">Optimize for web playback</span>
              </label>
            </div>
          </div>

          <!-- 5. Narration Settings -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-300">
              5. Narration (Text-to-Speech)
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              Generate AI voiceover from your SRT transcription and overlay it
              onto the video.
            </p>

            <!-- Enable Narration Toggle -->
            <label class="flex items-center mb-4 cursor-pointer">
              <div class="relative">
                <input
                  v-model="narrationSettings.enabled"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
                ></div>
              </div>
              <span class="ml-3 text-sm font-medium">Enable AI Narration</span>
            </label>

            <div v-if="narrationSettings.enabled" class="space-y-4">
              <!-- Voice Selection -->
              <div>
                <label class="block text-sm font-medium mb-2">🎤 Voice</label>
                <select
                  v-model="narrationSettings.voice"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <optgroup label="Female Voices">
                    <option value="21m00Tcm4TlvDq8ikWAM">
                      Rachel - American Female
                    </option>
                    <option value="AZnzlk1XvdvUeBnXmlld">
                      Domi - American Female
                    </option>
                    <option value="EXAVITQu4vr4xnSDxMaL">
                      Bella - American Female
                    </option>
                    <option value="MF3mGyEYCl7XYWbV9V6O">
                      Elli - American Female
                    </option>
                  </optgroup>
                  <optgroup label="Male Voices">
                    <option value="ErXwobaYiN019PkySvjV">
                      Antoni - American Male
                    </option>
                    <option value="TxGEqnHWrfWFTfGW9XjX">
                      Josh - American Male
                    </option>
                    <option value="VR6AewLTigWG4xSOukaG">
                      Arnold - American Male
                    </option>
                    <option value="pNInz6obpgDQGcFmaJgB">
                      Adam - American Male
                    </option>
                    <option value="yoZ06aMxZJJ28mfd3POQ">
                      Sam - American Male
                    </option>
                  </optgroup>
                </select>
              </div>

              <!-- Speed -->
              <div>
                <label class="block text-sm font-medium mb-2"
                  >⚡ Speed: {{ narrationSettings.speed }}x</label
                >
                <input
                  v-model.number="narrationSettings.speed"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  class="w-full accent-purple-500"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>

              <!-- Volume Controls -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2"
                    >🔊 Narration Vol:
                    {{
                      Math.round(narrationSettings.narrationVolume * 100)
                    }}%</label
                  >
                  <input
                    v-model.number="narrationSettings.narrationVolume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    class="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2"
                    >🔈 Original Vol:
                    {{
                      Math.round(narrationSettings.originalVolume * 100)
                    }}%</label
                  >
                  <input
                    v-model.number="narrationSettings.originalVolume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    class="w-full accent-purple-500"
                  />
                </div>
              </div>

              <!-- Keep Original Audio Toggle -->
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="narrationSettings.keepOriginalAudio"
                  type="checkbox"
                  class="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <span class="ml-2 text-sm"
                  >Mix with original audio (uncheck to replace entirely)</span
                >
              </label>

              <!-- Generate Narration Button -->
              <button
                @click="generateNarration"
                :disabled="!canGenerateNarration || isGeneratingNarration"
                class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <svg
                  v-if="isGeneratingNarration"
                  class="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                <span>{{
                  isGeneratingNarration
                    ? "Generating Narration..."
                    : "🎙️ Generate Narration from SRT"
                }}</span>
              </button>

              <div
                v-if="!results.transcription"
                class="text-xs text-yellow-400"
              >
                ⚠️ Run transcription first to generate SRT content, then use
                narration.
              </div>

              <!-- Narration Progress -->
              <div v-if="isGeneratingNarration" class="mt-2">
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
                    :style="{ width: narrationProgress + '%' }"
                  ></div>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ narrationStage }}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="bg-gray-800 rounded-lg p-6">
            <div class="flex space-x-4">
              <button
                @click="startTranscription"
                :disabled="!canStartTranscription || isProcessing"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-md font-medium transition-colors"
              >
                <span v-if="isTranscribing">{{
                  transcriptionSettings.source === "video-audio"
                    ? "Extracting & Transcribing..."
                    : "Processing..."
                }}</span>
                <span v-else>{{
                  transcriptionSettings.source === "video-audio"
                    ? "Extract Audio & Transcribe"
                    : "Use Manual Transcription"
                }}</span>
              </button>

              <button
                @click="processVideo"
                :disabled="!canProcessVideo || isProcessing"
                class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-md font-medium transition-colors"
              >
                {{
                  isProcessingVideo
                    ? "Processing..."
                    : !results.transcription
                      ? "Run Transcription First"
                      : "Process Video"
                }}
              </button>
            </div>

            <!-- Debug Info -->
            <div class="mt-4 p-3 bg-gray-700 rounded text-xs">
              <div><strong>Debug:</strong></div>
              <div>Has transcription: {{ !!results.transcription }}</div>
              <div>
                Transcription length: {{ results.transcription?.length || 0 }}
              </div>
              <div>Is transcribing: {{ isTranscribing }}</div>
              <div>
                Processing steps completed:
                {{
                  processingSteps.filter((s) => s.status === "completed")
                    .length
                }}/{{ processingSteps.length }}
              </div>
              <button
                @click="testTranscription"
                class="mt-2 px-2 py-1 bg-purple-600 rounded text-xs"
              >
                Test Set Transcription
              </button>
              <button
                @click="testAPI"
                class="mt-2 ml-2 px-2 py-1 bg-yellow-600 rounded text-xs"
              >
                Test API
              </button>
            </div>
          </div>
        </div>

        <!-- Right Panel: Preview & Results -->
        <div class="space-y-6">
          <!-- Video Preview -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-300">Preview</h2>

            <div
              v-if="(videoUrl && videoUrl.length > 0) || uploadedFile"
              class="aspect-video bg-black rounded-lg overflow-hidden"
            >
              <video
                v-if="previewVideoUrl"
                :src="previewVideoUrl"
                controls
                class="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
              <div
                v-else
                class="flex items-center justify-center h-full text-gray-400"
              >
                <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  />
                </svg>
              </div>
            </div>

            <div
              v-else
              class="aspect-video bg-gray-700 rounded-lg flex items-center justify-center"
            >
              <div class="text-center text-gray-400">
                <svg
                  class="mx-auto h-16 w-16 mb-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  />
                </svg>
                <p>Video preview will appear here</p>
              </div>
            </div>
          </div>

          <!-- Progress Indicator -->
          <div v-if="isProcessing" class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">Processing Progress</h3>

            <!-- Overall Progress Bar -->
            <div v-if="isProcessingVideo" class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-blue-300"
                  >Video Processing Progress</span
                >
                <span class="text-sm font-medium text-blue-300"
                  >{{ videoProcessingProgress }}%</span
                >
              </div>
              <div class="w-full bg-gray-700 rounded-full h-3">
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                  :style="{ width: videoProcessingProgress + '%' }"
                ></div>
              </div>
              <div
                v-if="currentProcessingStage"
                class="mt-2 text-xs text-gray-400"
              >
                {{ currentProcessingStage }}
              </div>
            </div>

            <!-- Step by Step Progress -->
            <div class="space-y-4">
              <div
                v-for="step in processingSteps"
                :key="step.id"
                class="flex items-center space-x-3"
              >
                <div class="flex-shrink-0">
                  <div
                    v-if="step.status === 'completed'"
                    class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div
                    v-else-if="step.status === 'processing'"
                    class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                  ></div>
                  <div v-else class="w-6 h-6 bg-gray-600 rounded-full"></div>
                </div>
                <div class="flex-1">
                  <p
                    class="text-sm font-medium"
                    :class="
                      step.status === 'completed'
                        ? 'text-green-400'
                        : step.status === 'processing'
                          ? 'text-blue-400'
                          : 'text-gray-400'
                    "
                  >
                    {{ step.name }}
                  </p>
                  <p v-if="step.description" class="text-xs text-gray-500">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div
            v-if="
              results.transcription ||
              results.processedVideo ||
              results.narratedVideo
            "
            class="bg-gray-800 rounded-lg p-6"
          >
            <h3 class="text-lg font-semibold mb-4">Results</h3>

            <!-- Transcription Result -->
            <div v-if="results.transcription" class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-md font-medium text-green-400">
                  Generated SRT Subtitles
                </h4>
                <span class="text-xs text-gray-400"
                  >✏️ Editable - Make changes if needed</span
                >
              </div>

              <!-- Editable SRT Content -->
              <div class="mb-3">
                <textarea
                  v-model="results.transcription"
                  class="w-full h-40 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-100 font-mono resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SRT content will appear here..."
                  spellcheck="false"
                ></textarea>
                <p class="text-xs text-gray-400 mt-1">
                  💡 You can edit the subtitles above. Format: SRT (Sequence
                  number, timestamps, text)
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  @click="downloadTranscription"
                  class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  📥 Download SRT
                </button>
                <button
                  @click="copyTranscription"
                  class="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  @click="validateSRT"
                  class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  ✅ Validate SRT
                </button>
                <button
                  @click="resetTranscription"
                  class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  🔄 Re-generate
                </button>
              </div>
            </div>

            <!-- Processed Video Result -->
            <div v-if="results.processedVideo" class="mb-6">
              <h4 class="text-md font-medium mb-2 text-green-400">
                Video Processing Complete
              </h4>
              <div
                class="aspect-video bg-black rounded-lg overflow-hidden mb-2"
              >
                <video
                  :src="results.processedVideo"
                  controls
                  class="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="downloadProcessedVideo"
                  class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Download Video
                </button>
                <button
                  v-if="results.subtitleFile"
                  @click="downloadSubtitles"
                  class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  Download Subtitles
                </button>
              </div>
            </div>

            <!-- Narrated Video Result -->
            <div v-if="results.narratedVideo" class="mb-6">
              <h4 class="text-md font-medium mb-2 text-purple-400">
                🎙️ Narrated Video Ready
              </h4>
              <div
                class="aspect-video bg-black rounded-lg overflow-hidden mb-2"
              >
                <video
                  :src="results.narratedVideo"
                  controls
                  class="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="downloadNarratedVideo"
                  class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  📥 Download Narrated Video
                </button>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          <div
            v-if="error"
            class="bg-red-900 border border-red-700 rounded-lg p-4"
          >
            <h4 class="text-red-400 font-medium mb-2">Error</h4>
            <p class="text-red-300 text-sm">{{ error }}</p>
            <button
              @click="clearError"
              class="mt-2 px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from "vue";

// Set page title
useHead({
  title: "Complete Processing - Video Processing Suite",
});

// Reactive data - declared first to avoid initialization issues
const videoUrl = ref("");
const uploadedFile = ref(null);
const previewVideoUrl = ref("");

// Debug initialization
console.log("🚀 Component initializing, videoUrl ref:", videoUrl);

const transcriptionSettings = ref({
  source: "video-audio",
  language: "en",
  outputFormat: "srt",
  speakerLabels: false,
  punctuate: true,
  formatText: true,
  manualText: "",
});

// Template configurations with exact predefined parameters
const templateConfigurations = {
  girlboss: {
    fontFamily: "Luckiest Guy",
    primaryColor: "#FF1493",
    secondaryColor: "#FF69B4",
    fontSize: 32,
    wordMode: "multiple",
    wordsPerGroup: 2,
    verticalPosition: "bottom",
  },
  hormozi: {
    fontFamily: "Luckiest Guy",
    primaryColor: "#00FF00",
    secondaryColor: "#FF0000",
    fontSize: 50,
    wordMode: "multiple",
    wordsPerGroup: 4,
    verticalPosition: "bottom",
  },
  tiktokstyle: {
    fontFamily: "Luckiest Guy",
    primaryColor: "#FFFF00",
    secondaryColor: "#25F4EE",
    fontSize: 50,
    wordMode: "multiple",
    wordsPerGroup: 2,
    verticalPosition: "bottom",
  },
  whiteimpact: {
    fontFamily: "Impact",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E5E7EB",
    fontSize: 48,
    wordMode: "single",
    wordsPerGroup: 1,
    verticalPosition: "center",
  },
  impactfull: {
    fontFamily: "Impact",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E5E7EB",
    fontSize: 42,
    wordMode: "normal",
    wordsPerGroup: 1,
    verticalPosition: "center",
  },
  thinToBold: {
    fontFamily: "Montserrat Thin",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E5E7EB",
    fontSize: 50,
    wordMode: "normal",
    wordsPerGroup: 4,
    verticalPosition: "top",
  },
  wavyColors: {
    fontFamily: "Luckiest Guy",
    primaryColor: "#FF0000",
    secondaryColor: "#00FF00",
    fontSize: 50,
    wordMode: "multiple",
    wordsPerGroup: 1,
    verticalPosition: "center",
  },
  revealEnlarge: {
    fontFamily: "Luckiest Guy",
    primaryColor: "#FF0000",
    secondaryColor: "#00FF00",
    fontSize: 50,
    wordMode: "multiple",
    wordsPerGroup: 4,
    verticalPosition: "bottom",
  },
  shrinkingPairs: {
    fontFamily: "Luckiest Guy",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E5E7EB",
    fontSize: 36,
    wordMode: "multiple",
    wordsPerGroup: 4,
    verticalPosition: "center",
  },
};

const subtitleSettings = ref({
  animationStyle: "girlboss",
  fontFamily: "Luckiest Guy",
  primaryColor: "#FF1493",
  secondaryColor: "#FF69B4",
  fontSize: 32,
  wordMode: "multiple",
  wordsPerGroup: 2,
  verticalPosition: "bottom",
});

const processingOptions = ref({
  generateSubtitles: true,
  embedSubtitles: true,
  optimizeForWeb: true,
  quality: "premium",
});

// Narration settings
const narrationSettings = ref({
  enabled: false,
  voice: "21m00Tcm4TlvDq8ikWAM",
  speed: 1.0,
  narrationVolume: 1.0,
  originalVolume: 0.1,
  keepOriginalAudio: true,
});

const isGeneratingNarration = ref(false);
const narrationProgress = ref(0);
const narrationStage = ref("");

const isTranscribing = ref(false);
const isProcessingVideo = ref(false);
const videoProcessingProgress = ref(0);
const currentProcessingStage = ref("");
const error = ref("");

const results = ref({
  transcription: "",
  processedVideo: "",
  subtitleFile: "",
  videoBlob: null,
  narratedVideo: "",
  narratedBlob: null,
});

const processingSteps = ref([
  {
    id: 1,
    name: "Preparing video",
    description: "Uploading and validating video source",
    status: "pending",
  },
  {
    id: 2,
    name: "Audio extraction",
    description: "Extracting audio track from video",
    status: "pending",
  },
  {
    id: 3,
    name: "AI transcription",
    description: "Converting speech to text using AI",
    status: "pending",
  },
  {
    id: 4,
    name: "Subtitle styling",
    description: "Applying animations and formatting",
    status: "pending",
  },
  {
    id: 5,
    name: "Video processing",
    description: "Embedding subtitles and finalizing",
    status: "pending",
  },
]);

// Computed properties - defined after all reactive variables
const isProcessing = computed(() => {
  return (
    isTranscribing.value ||
    isProcessingVideo.value ||
    isGeneratingNarration.value
  );
});

const canGenerateNarration = computed(() => {
  const hasVideo = videoUrl?.value || uploadedFile.value;
  const hasTranscription =
    results.value.transcription &&
    results.value.transcription.trim().length > 0;
  return (
    hasVideo &&
    hasTranscription &&
    narrationSettings.value.enabled &&
    !isProcessing.value
  );
});

const canStartTranscription = computed(() => {
  if (transcriptionSettings.value.source === "manual") {
    return (
      transcriptionSettings.value.manualText.trim().length > 0 &&
      !isProcessing.value
    );
  }
  return (videoUrl?.value || uploadedFile.value) && !isProcessing.value;
});

const canProcessVideo = computed(() => {
  const hasVideo = videoUrl?.value || uploadedFile.value;
  const hasTranscription =
    results.value.transcription &&
    results.value.transcription.trim().length > 0;
  return hasVideo && hasTranscription && !isProcessing.value;
});

// Template system computed properties (all templates are now editable presets)
const isUsingPredefinedTemplate = computed(() => {
  return false; // All templates are now editable presets with suggested values
});

const currentTemplateConfig = computed(() => {
  return templateConfigurations[subtitleSettings.value.animationStyle] || null;
});

// Template information functions
const getTemplateDescription = (template) => {
  const descriptions = {
    girlboss:
      "Bold pink/purple animations with dramatic emphasis and confidence vibes",
    hormozi:
      "Business motivational style with professional color schemes and impact",
    tiktokstyle: "Social media trending format with engaging visual effects",
    whiteimpact:
      "Clean white highlights with sharp contrast and professional look",
    impactfull:
      "Maximum visual impact with bold animations and attention-grabbing effects",
    thinToBold:
      "Progressive text emphasis that grows from thin to bold for key moments",
    wavyColors:
      "Flowing rainbow effects with smooth color transitions and wave motions",
    revealEnlarge:
      "Zoom-in discovery effects that reveal text with enlarging animations",
    shrinkingPairs:
      "Minimalist paired animations with clean shrinking transitions",
  };
  return descriptions[template] || "Custom animation template";
};

const getTemplateFeatures = (template) => {
  const features = {
    girlboss: "✨ Pink/purple gradients • Bold typography • Confidence themes",
    hormozi: "🎯 Business colors • Motivational emphasis • Professional appeal",
    tiktokstyle: "📱 Trending effects • Social engagement • Mobile-optimized",
    whiteimpact: "⚪ White highlights • Clean design • High contrast",
    impactfull: "💥 Maximum impact • Bold effects • Attention-grabbing",
    thinToBold: "📈 Progressive weight • Dynamic emphasis • Smooth transitions",
    wavyColors: "🌈 Rainbow effects • Flowing motion • Color waves",
    revealEnlarge: "🔍 Zoom reveals • Discovery effects • Enlarging text",
    shrinkingPairs:
      "📐 Paired elements • Minimalist design • Shrinking effects",
  };
  return features[template] || "Custom features and animations";
};

// Template color schemes
const getTemplateColors = (template) => {
  const colorSchemes = {
    girlboss: { primary: "#ff1493", secondary: "#ff69b4" }, // Deep pink, hot pink
    hormozi: { primary: "#1e40af", secondary: "#f59e0b" }, // Blue, amber
    tiktokstyle: { primary: "#fe2c55", secondary: "#25f4ee" }, // TikTok red, cyan
    whiteimpact: { primary: "#ffffff", secondary: "#e5e7eb" }, // White, light gray
    impactfull: { primary: "#dc2626", secondary: "#fbbf24" }, // Red, yellow
    thinToBold: { primary: "#3b82f6", secondary: "#8b5cf6" }, // Blue, purple
    wavyColors: { primary: "#06b6d4", secondary: "#f59e0b" }, // Cyan, amber
    revealEnlarge: { primary: "#10b981", secondary: "#3b82f6" }, // Green, blue
    shrinkingPairs: { primary: "#6b7280", secondary: "#9ca3af" }, // Gray, light gray
  };
  return colorSchemes[template] || { primary: "#3b82f6", secondary: "#10b981" };
};

// Methods
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    uploadedFile.value = file;
    previewVideoUrl.value = URL.createObjectURL(file);
    if (videoUrl && videoUrl.value !== undefined) {
      videoUrl.value = ""; // Clear URL if file is uploaded
    }
  }
};

// Apply predefined template settings automatically
const applyTemplateSettings = (templateName) => {
  const templateConfig = templateConfigurations[templateName];
  if (templateConfig) {
    console.log(
      `🎨 Applying predefined ${templateName} template settings:`,
      templateConfig,
    );

    // Apply all template-specific settings
    subtitleSettings.value.fontFamily = templateConfig.fontFamily;
    subtitleSettings.value.primaryColor = templateConfig.primaryColor;
    subtitleSettings.value.secondaryColor = templateConfig.secondaryColor;
    subtitleSettings.value.fontSize = templateConfig.fontSize;
    subtitleSettings.value.wordMode = templateConfig.wordMode;
    subtitleSettings.value.wordsPerGroup = templateConfig.wordsPerGroup;
    subtitleSettings.value.verticalPosition = templateConfig.verticalPosition;
  }
};

// Legacy function for manual color application (now unused)
const applyTemplateColors = () => {
  const colors = getTemplateColors(subtitleSettings.value.animationStyle);
  subtitleSettings.value.primaryColor = colors.primary;
  subtitleSettings.value.secondaryColor = colors.secondary;
};

// Get optimal word processing mode for each template
const getTemplateWordMode = (template) => {
  const wordModeSettings = {
    girlboss: "multiple", // Works well with 2-3 words at a time for emphasis
    hormozi: "single", // Best with individual word highlighting
    tiktokstyle: "single", // TikTok style emphasizes individual words
    whiteimpact: "single", // White impact designed for word-by-word reveals
    impactfull: "single", // Maximum impact with individual words
    thinToBold: "single", // Progressive weight change works per word
    wavyColors: "single", // Wavy animations work best word-by-word
    revealEnlarge: "multiple", // Revealing groups of words creates better flow
    shrinkingPairs: "multiple", // Pairs work better with multiple words
  };
  return wordModeSettings[template] || "normal";
};

// Get optimal words per group for templates using 'multiple' mode
const getTemplateWordsPerGroup = (template) => {
  const wordsPerGroupSettings = {
    girlboss: 2, // 2 words for confident emphasis
    hormozi: 1, // Single words for business impact
    tiktokstyle: 1, // Individual words for viral effect
    whiteimpact: 1, // Single words for clean impact
    impactfull: 1, // Single words for maximum impact
    thinToBold: 1, // Progressive effect per word
    wavyColors: 1, // Wavy effect per word
    revealEnlarge: 3, // 3 words for smooth reveals
    shrinkingPairs: 2, // Pairs of words
  };
  return wordsPerGroupSettings[template] || 1;
};

// Get description of template's optimal word mode
const getTemplateWordModeDescription = (template) => {
  const wordMode = getTemplateWordMode(template);
  const wordsPerGroup = getTemplateWordsPerGroup(template);

  const descriptions = {
    girlboss: `Multiple words (${wordsPerGroup} at a time) for confident emphasis`,
    hormozi: "Single words for maximum business impact",
    tiktokstyle: "Single words for viral TikTok-style effect",
    whiteimpact: "Single words with clean white reveals",
    impactfull: "Single words for maximum visual impact",
    thinToBold: "Single words with progressive weight changes",
    wavyColors: "Single words with flowing color waves",
    revealEnlarge: `Multiple words (${wordsPerGroup} at a time) for smooth reveals`,
    shrinkingPairs: `Word pairs (${wordsPerGroup} words) for minimalist effect`,
  };

  return descriptions[template] || "Standard sentence-based timing";
};

// Apply template's optimal word processing settings
const applyTemplateWordSettings = () => {
  subtitleSettings.value.wordMode = getTemplateWordMode(
    subtitleSettings.value.animationStyle,
  );
  subtitleSettings.value.wordsPerGroup = getTemplateWordsPerGroup(
    subtitleSettings.value.animationStyle,
  );
};

const updateProcessingStep = (stepId, status, description = null) => {
  const step = processingSteps.value.find((s) => s.id === stepId);
  if (step) {
    step.status = status;
    if (description) step.description = description;
  }
};

const resetProcessingSteps = () => {
  processingSteps.value.forEach((step) => {
    step.status = "pending";
  });
};

const startTranscription = async () => {
  if (!canStartTranscription.value) return;

  console.log("✅ Starting transcription process...");
  isTranscribing.value = true;
  error.value = "";
  resetProcessingSteps();

  try {
    updateProcessingStep(1, "processing");
    console.log("🎬 Video URL:", videoUrl?.value || "Not set");

    // Handle manual transcription
    if (transcriptionSettings.value.source === "manual") {
      updateProcessingStep(1, "completed", "Manual transcription selected");
      updateProcessingStep(2, "completed", "Skipping audio extraction");
      updateProcessingStep(
        3,
        "processing",
        "Processing manual transcription...",
      );

      // Use manual transcription directly
      results.value.transcription = transcriptionSettings.value.manualText;
      updateProcessingStep(3, "completed");
      updateProcessingStep(4, "completed", "Ready for styling");
      updateProcessingStep(5, "completed", "Transcription complete");
      return;
    }

    // Handle video audio transcription
    let processVideoUrl = videoUrl?.value || "";
    if (!processVideoUrl && !uploadedFile.value) {
      throw new Error("No video URL or file provided");
    }
    updateProcessingStep(1, "completed", "Video source validated");

    if (uploadedFile.value) {
      // For file uploads, we need to process the audio extraction
      updateProcessingStep(
        2,
        "processing",
        "Extracting audio from uploaded video...",
      );

      // Call audio extraction API
      const audioResponse = await $fetch("/api/extract-audio", {
        method: "POST",
        body: {
          videoFile: uploadedFile.value,
        },
      });

      processVideoUrl = audioResponse.audioUrl;
      updateProcessingStep(
        2,
        "completed",
        "Audio track extracted successfully",
      );
    } else {
      updateProcessingStep(
        2,
        "processing",
        "Preparing video URL for audio extraction...",
      );
      updateProcessingStep(2, "completed", "Video URL ready for transcription");
    }

    updateProcessingStep(
      3,
      "processing",
      "Transcribing audio with AssemblyAI...",
    );

    // First test basic API connectivity
    console.log("🔍 Testing basic API connectivity...");
    try {
      const testResponse = await $fetch("/api/test", { method: "GET" });
      console.log("✅ Basic API connectivity confirmed:", testResponse);
    } catch (testError) {
      console.error("❌ Basic API test failed:", testError);
      error.value = "API connectivity issue: " + testError.message;
      return;
    }

    console.log("🤖 Making transcription API call with:", {
      url: processVideoUrl,
      language: transcriptionSettings.value.language,
      outputFormat: transcriptionSettings.value.outputFormat,
    });

    // Call transcription API with explicit error handling
    const response = await $fetch("/api/transcribe-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        url: processVideoUrl,
        language: transcriptionSettings.value.language,
        outputFormat: transcriptionSettings.value.outputFormat,
        speakerLabels: transcriptionSettings.value.speakerLabels,
        punctuate: transcriptionSettings.value.punctuate,
        formatText: transcriptionSettings.value.formatText,
      },
      timeout: 300000, // 5 minutes timeout for transcription
    }).catch((fetchError) => {
      console.error("🚨 API Fetch Error:", fetchError);
      throw new Error(
        `API request failed: ${fetchError.message || fetchError}`,
      );
    });

    console.log("✅ Transcription API response:", response);

    updateProcessingStep(3, "completed", "Speech-to-text conversion complete");
    updateProcessingStep(4, "completed", "Ready for subtitle styling");
    updateProcessingStep(5, "completed", "Transcription process finished");

    if (response.transcription) {
      console.log("📝 Setting transcription in results:", {
        before: results.value.transcription?.length || 0,
        after: response.transcription.length,
      });
      results.value.transcription = response.transcription;
      console.log("📝 Transcription saved successfully");
      console.log("🎯 Current results state:", {
        hasTranscription: !!results.value.transcription,
        transcriptionLength: results.value.transcription?.length || 0,
        transcriptionPreview:
          results.value.transcription?.substring(0, 100) || "EMPTY",
      });
    } else {
      console.warn("⚠️ No transcription in response:", response);
      error.value = "No transcription received from API";
    }
  } catch (err) {
    console.error("❌ Transcription error:", err);
    error.value = err.message || err.data?.message || "Transcription failed";
    resetProcessingSteps();

    // Show more detailed error info
    if (err.data) {
      console.error("Error details:", err.data);
    }
  } finally {
    isTranscribing.value = false;
  }
};

const processVideo = async () => {
  if (!canProcessVideo.value) return;

  isProcessingVideo.value = true;
  error.value = "";
  resetProcessingSteps();

  try {
    updateProcessingStep(1, "processing");

    // Prepare the video URL
    let processVideoUrl = videoUrl?.value || "";
    if (uploadedFile.value) {
      throw new Error(
        "File upload not yet implemented. Please use a video URL.",
      );
    }

    if (!processVideoUrl) {
      throw new Error("No video URL provided");
    }

    updateProcessingStep(1, "completed");

    // If no transcription exists, do transcription first
    if (!results.value.transcription) {
      updateProcessingStep(2, "processing");

      const transcriptionResponse = await $fetch("/api/transcribe-video", {
        method: "POST",
        body: {
          url: processVideoUrl,
          outputFormat: "json",
          language: transcriptionSettings.value.language,
        },
      });

      updateProcessingStep(2, "completed");
      results.value.transcription = transcriptionResponse.transcription;
    } else {
      updateProcessingStep(2, "completed", "Using existing transcription");
    }

    updateProcessingStep(3, "processing", "Creating styled subtitles...");

    // Debug logging
    console.log("Processing video with transcription:", {
      transcriptionLength: results.value.transcription?.length || 0,
      transcriptionPreview:
        results.value.transcription?.substring(0, 100) || "No transcription",
      template: subtitleSettings.value.animationStyle,
    });

    // Start realistic progress tracking
    videoProcessingProgress.value = 0;
    currentProcessingStage.value = "Initializing video processing...";

    // Realistic progress simulation that mimics actual video processing
    let progressStage = 0;
    let progressInterval = null;
    const progressStages = [
      {
        maxProgress: 15,
        duration: 2000,
        increment: 0.8,
        stage: "Initializing FFmpeg and loading video...",
      },
      {
        maxProgress: 25,
        duration: 3000,
        increment: 0.6,
        stage: "Analyzing video metadata and streams...",
      },
      {
        maxProgress: 40,
        duration: 4000,
        increment: 0.7,
        stage:
          "Preparing " +
          subtitleSettings.value.animationStyle +
          " animation template...",
      },
      {
        maxProgress: 65,
        duration: 8000,
        increment: 0.5,
        stage:
          "Rendering subtitles with " +
          processingOptions.value.quality +
          " quality...",
      },
      {
        maxProgress: 85,
        duration: 6000,
        increment: 0.6,
        stage: "Encoding video with embedded subtitles...",
      },
      {
        maxProgress: 92,
        duration: 3000,
        increment: 0.4,
        stage: "Finalizing output and compression...",
      },
    ];

    progressInterval = setInterval(() => {
      if (progressStage < progressStages.length) {
        const currentStage = progressStages[progressStage];

        if (videoProcessingProgress.value < currentStage.maxProgress) {
          videoProcessingProgress.value = Math.min(
            videoProcessingProgress.value +
              currentStage.increment +
              Math.random() * 0.4,
            currentStage.maxProgress,
          );
          currentProcessingStage.value = currentStage.stage;
        } else {
          progressStage++;
        }
      }
    }, 1000);

    // Call video processing API and get binary response
    console.log("🎬 Making video processing request...");
    const response = await fetch("/api/process-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl: processVideoUrl,
        template: subtitleSettings.value.animationStyle,
        transcription: results.value.transcription,
        fontFamily: subtitleSettings.value.fontFamily,
        primaryColor: subtitleSettings.value.primaryColor,
        secondaryColor: subtitleSettings.value.secondaryColor,
        fontSize: subtitleSettings.value.fontSize,
        verticalPosition: subtitleSettings.value.verticalPosition,
        embedSubtitles: processingOptions.value.embedSubtitles,
        generateSubtitles: processingOptions.value.generateSubtitles,
        quality: processingOptions.value.quality,
        // Word processing settings
        wordMode: subtitleSettings.value.wordMode,
        wordsPerGroup: subtitleSettings.value.wordsPerGroup,
      }),
    });

    console.log("📡 Video processing response status:", response.status);

    // Clear progress interval
    clearInterval(progressInterval);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Video processing failed: ${errorText}`);
    }

    updateProcessingStep(3, "completed");
    updateProcessingStep(4, "processing", "Downloading processed video...");

    // Smoothly progress to near completion
    videoProcessingProgress.value = Math.max(videoProcessingProgress.value, 95);
    currentProcessingStage.value = "Downloading processed video...";

    // Get the video blob
    const videoBlob = await response.blob();
    console.log("📹 Video blob received:", {
      size: videoBlob.size,
      type: videoBlob.type,
    });

    // Create object URL for the video
    const processedVideoUrl = URL.createObjectURL(videoBlob);
    results.value.processedVideo = processedVideoUrl;
    results.value.videoBlob = videoBlob; // Store blob for download

    updateProcessingStep(4, "completed");
    updateProcessingStep(5, "completed", "Ready for download");

    // Finalize progress
    videoProcessingProgress.value = 100;
    currentProcessingStage.value = "Processing complete!";
  } catch (err) {
    error.value = err.message || "Video processing failed";
    resetProcessingSteps();
  } finally {
    // Always clear progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    isProcessingVideo.value = false;
    // Reset progress after a delay
    setTimeout(() => {
      videoProcessingProgress.value = 0;
      currentProcessingStage.value = "";
    }, 3000);
  }
};

const downloadTranscription = () => {
  if (!results.value.transcription) return;

  const blob = new Blob([results.value.transcription], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transcription.${transcriptionSettings.value.outputFormat}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const copyTranscription = async () => {
  if (!results.value.transcription) return;

  try {
    await navigator.clipboard.writeText(results.value.transcription);
    // You could show a toast notification here
  } catch (err) {
    console.error("Failed to copy transcription:", err);
  }
};

const downloadProcessedVideo = () => {
  if (!results.value.processedVideo || !results.value.videoBlob) return;

  console.log("⬇️ Downloading processed video:", {
    blobSize: results.value.videoBlob.size,
    blobType: results.value.videoBlob.type,
  });

  const a = document.createElement("a");
  a.href = results.value.processedVideo; // This is the object URL
  a.download = "processed-video.mp4";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const downloadSubtitles = () => {
  if (!results.value.subtitleFile) return;

  const a = document.createElement("a");
  a.href = results.value.subtitleFile;
  a.download = "subtitles.srt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const clearError = () => {
  error.value = "";
};

const validateSRT = () => {
  if (!results.value.transcription) {
    alert("No SRT content to validate!");
    return;
  }

  // Basic SRT validation
  const lines = results.value.transcription.trim().split("\n");
  let isValid = true;
  let errorMessage = "";

  try {
    let currentBlock = 1;
    let i = 0;

    while (i < lines.length) {
      // Skip empty lines
      if (!lines[i].trim()) {
        i++;
        continue;
      }

      // Check sequence number
      if (parseInt(lines[i]) !== currentBlock) {
        isValid = false;
        errorMessage = `Invalid sequence number at line ${i + 1}. Expected ${currentBlock}, got ${lines[i]}`;
        break;
      }

      i++;
      if (i >= lines.length) break;

      // Check timestamp format
      const timeRegex = /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/;
      if (!timeRegex.test(lines[i])) {
        isValid = false;
        errorMessage = `Invalid timestamp format at line ${i + 1}: ${lines[i]}`;
        break;
      }

      i++;
      currentBlock++;

      // Skip text lines until next empty line or end
      while (i < lines.length && lines[i].trim()) {
        i++;
      }
    }

    if (isValid) {
      alert(`✅ SRT is valid! Found ${currentBlock - 1} subtitle blocks.`);
    } else {
      alert(`❌ SRT validation failed: ${errorMessage}`);
    }
  } catch (err) {
    alert(`❌ SRT validation error: ${err.message}`);
  }
};

const resetTranscription = async () => {
  if (
    confirm(
      "Are you sure you want to re-generate the transcription? This will overwrite your current edits.",
    )
  ) {
    results.value.transcription = "";
    await startTranscription();
  }
};

const testTranscription = () => {
  console.log("🧪 Testing transcription display...");
  const testSRT = `1
00:00:00,000 --> 00:00:03,000
This is a test subtitle

2
00:00:03,000 --> 00:00:06,000
To see if the display works

3
00:00:06,000 --> 00:00:09,000
The UI should update now!`;

  results.value.transcription = testSRT;
  console.log("🧪 Test transcription set:", testSRT.length, "characters");
};

const testAPI = async () => {
  console.log("🧪 Testing API connectivity...");

  try {
    // Test GET request
    const getResponse = await $fetch("/api/test", {
      method: "GET",
    });
    console.log("✅ GET test successful:", getResponse);

    // Test POST request
    const postResponse = await $fetch("/api/test", {
      method: "POST",
      body: {
        test: "data",
        videoUrl: videoUrl?.value || "",
        timestamp: new Date().toISOString(),
      },
    });
    console.log("✅ POST test successful:", postResponse);

    alert("API tests passed! Check console for details.");
  } catch (error) {
    console.error("❌ API test failed:", error);
    alert(`API test failed: ${error.message}`);
  }
};

const generateNarration = async () => {
  if (!canGenerateNarration.value) return;

  isGeneratingNarration.value = true;
  narrationProgress.value = 0;
  narrationStage.value = "Initializing narration...";
  error.value = "";

  try {
    let processVideoUrl = videoUrl?.value || "";
    if (!processVideoUrl) {
      throw new Error(
        "A video URL is required for narration. File upload not yet supported.",
      );
    }

    narrationProgress.value = 10;
    narrationStage.value = "Sending SRT and video to narration engine...";

    // Start a progress simulation
    let progressInterval = setInterval(() => {
      if (narrationProgress.value < 85) {
        narrationProgress.value += Math.random() * 2 + 0.5;
        if (narrationProgress.value > 30 && narrationProgress.value < 60) {
          narrationStage.value =
            "Generating TTS audio for each subtitle segment...";
        } else if (narrationProgress.value >= 60) {
          narrationStage.value = "Merging narration audio with video...";
        }
      }
    }, 1500);

    const response = await fetch("/api/srt-narrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: processVideoUrl,
        srt: results.value.transcription,
        options: {
          voice: narrationSettings.value.voice,
          speed: narrationSettings.value.speed,
          narrationVolume: narrationSettings.value.narrationVolume,
          originalVolume: narrationSettings.value.originalVolume,
          keepOriginalAudio: narrationSettings.value.keepOriginalAudio,
        },
      }),
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errData = JSON.parse(errorText);
        throw new Error(errData.error || errorText);
      } catch (e) {
        if (e.message && e.message.includes("Narration failed")) throw e;
        throw new Error(`Narration failed: ${errorText}`);
      }
    }

    narrationProgress.value = 90;
    narrationStage.value = "Downloading narrated video...";

    const videoBlob = await response.blob();
    console.log("🎙️ Narrated video received:", {
      size: videoBlob.size,
      type: videoBlob.type,
    });

    // Revoke previous URL if it exists
    if (results.value.narratedVideo) {
      URL.revokeObjectURL(results.value.narratedVideo);
    }

    results.value.narratedVideo = URL.createObjectURL(videoBlob);
    results.value.narratedBlob = videoBlob;

    narrationProgress.value = 100;
    narrationStage.value = "Narration complete!";
  } catch (err) {
    console.error("❌ Narration error:", err);
    error.value = err.message || "Narration generation failed";
  } finally {
    isGeneratingNarration.value = false;
    setTimeout(() => {
      narrationProgress.value = 0;
      narrationStage.value = "";
    }, 3000);
  }
};

const downloadNarratedVideo = () => {
  if (!results.value.narratedVideo || !results.value.narratedBlob) return;

  const a = document.createElement("a");
  a.href = results.value.narratedVideo;
  a.download = "narrated-video.mp4";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Initialize watchers after component is mounted to avoid initialization issues
onMounted(() => {
  console.log("✅ Component mounted, setting up watchers");

  // Initialize optimal word processing settings for default template
  applyTemplateWordSettings();

  // Watch for video URL changes to update preview
  watch(
    () => videoUrl.value,
    (newUrl) => {
      console.log("🔄 VideoURL changed:", newUrl);
      if (newUrl && !uploadedFile?.value) {
        previewVideoUrl.value = newUrl;
      }
    },
    { immediate: false },
  );

  // Watch for transcription changes (debugging)
  watch(
    () => results.value.transcription,
    (newTranscription, oldTranscription) => {
      console.log("👀 Transcription watcher triggered:", {
        hadBefore: !!oldTranscription,
        hasNow: !!newTranscription,
        lengthBefore: oldTranscription?.length || 0,
        lengthNow: newTranscription?.length || 0,
        preview: newTranscription?.substring(0, 50) || "EMPTY",
      });
    },
  );

  // Watch for template changes to apply predefined settings automatically
  watch(
    () => subtitleSettings.value.animationStyle,
    (newTemplate, oldTemplate) => {
      if (newTemplate !== oldTemplate) {
        console.log("🎨 Template changed to:", newTemplate);
        // Apply complete predefined template settings (colors, fonts, word processing)
        applyTemplateSettings(newTemplate);
      }
    },
    { immediate: true },
  ); // Apply settings immediately on component mount
});
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
