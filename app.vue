<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          🎬 Cloutware Video Editor
        </h1>
        <p class="text-xl text-gray-300 max-w-2xl mx-auto">
          Transform your videos with stunning templates and anti-detection features
        </p>
      </div>

      <!-- Main Form -->
      <div class="max-w-4xl mx-auto">
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <form @submit.prevent="processVideo" class="space-y-8">
            
            <!-- Video URL Input -->
            <div class="space-y-2">
              <label for="videoUrl" class="block text-lg font-semibold text-white">
                📹 Video URL
              </label>
              <input
                id="videoUrl"
                v-model="form.videoUrl"
                type="url"
                placeholder="https://example.com/your-video.mp4"
                required
                class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <!-- SRT Content -->
            <div class="space-y-2">
              <label for="srtContent" class="block text-lg font-semibold text-white">
                📝 Subtitle Content (SRT Format)
              </label>
              <textarea
                id="srtContent"
                v-model="form.srtContent"
                placeholder="1&#10;00:00:00,000 --> 00:00:03,000&#10;Your awesome subtitle text here!"
                rows="6"
                required
                class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
              ></textarea>
              <p class="text-sm text-gray-400">
                Format: sequence number, timestamp (HH:MM:SS,mmm --> HH:MM:SS,mmm), subtitle text
              </p>
            </div>

            <!-- Template Selector -->
            <div class="space-y-4">
              <label class="block text-lg font-semibold text-white">
                🎨 Choose Template
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <template v-for="template in availableTemplates" :key="template.key">
                  <div 
                    @click="form.selectedTemplate = template.key"
                    :class="[
                      'p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105',
                      form.selectedTemplate === template.key 
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300' 
                        : 'border-white/30 bg-white/5 text-white hover:border-pink-400'
                    ]"
                  >
                    <div class="text-center">
                      <div class="text-2xl mb-2">{{ getTemplateEmoji(template.key) }}</div>
                      <div class="font-semibold text-sm">{{ template.name }}</div>
                      <div class="text-xs mt-1 opacity-75">{{ template.description.split(' ').slice(0, 4).join(' ') }}...</div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="!templatesLoaded" class="text-center text-gray-400">
                Loading templates...
              </div>
            </div>

            <!-- Output Name -->
            <div class="space-y-2">
              <label for="outputName" class="block text-lg font-semibold text-white">
                💾 Output Filename
              </label>
              <input
                id="outputName"
                v-model="form.outputName"
                type="text"
                placeholder="my_awesome_video"
                pattern="[a-zA-Z0-9_-]+"
                class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
              <p class="text-sm text-gray-400">
                Only letters, numbers, underscores, and hyphens allowed
              </p>
            </div>

            <!-- Anti-Detection Features -->
            <div class="space-y-4">
              <div class="flex items-center space-x-3">
                <input
                  id="antiDetection"
                  v-model="form.antiDetection"
                  type="checkbox"
                  class="w-5 h-5 rounded border-2 border-white/30 bg-white/10 text-pink-500 focus:ring-pink-500 focus:ring-2"
                />
                <label for="antiDetection" class="text-lg font-semibold text-white">
                  🛡️ Enable Anti-Detection Features
                </label>
              </div>
              
              <div v-if="form.antiDetection" class="bg-white/5 rounded-lg p-4 border border-white/20">
                <p class="text-sm text-gray-300 mb-3">
                  Anti-detection features help your content bypass automated detection systems:
                </p>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-400">
                  <div class="flex items-center space-x-2">
                    <span class="text-green-400">✓</span>
                    <span>Pixel Shifting</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-green-400">✓</span>
                    <span>Micro Cropping</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-green-400">✓</span>
                    <span>Subtle Rotation</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-green-400">✓</span>
                    <span>Noise Addition</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-green-400">✓</span>
                    <span>Metadata Poisoning</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-green-400">✓</span>
                    <span>Frame Interpolation</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="text-center pt-6">
              <button
                type="submit"
                :disabled="isProcessing || !form.videoUrl || !form.srtContent || !form.selectedTemplate"
                :class="[
                  'px-8 py-4 rounded-xl font-bold text-lg transition-all transform',
                  isProcessing || !form.videoUrl || !form.srtContent || !form.selectedTemplate
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                ]"
              >
                <span v-if="isProcessing" class="flex items-center justify-center space-x-2">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing Video...</span>
                </span>
                <span v-else>
                  🚀 Create Amazing Video
                </span>
              </button>
            </div>

          </form>

          <!-- Status Messages -->
          <div v-if="statusMessage" class="mt-6 p-4 rounded-lg" :class="statusMessage.type === 'error' ? 'bg-red-500/20 border border-red-500/50' : 'bg-green-500/20 border border-green-500/50'">
            <p :class="statusMessage.type === 'error' ? 'text-red-300' : 'text-green-300'">
              {{ statusMessage.text }}
            </p>
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-12 text-gray-400">
        <p>Powered by Cloutware Video Processing Engine 🎥✨</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Reactive form data
const form = reactive({
  videoUrl: '',
  srtContent: '1\n00:00:00,000 --> 00:00:03,000\nYour awesome content here!\n\n2\n00:00:03,000 --> 00:00:06,000\nThis will be amazing!',
  selectedTemplate: 'girlboss',
  outputName: 'my_video',
  antiDetection: true
})

// State management
const isProcessing = ref(false)
const templatesLoaded = ref(false)
const availableTemplates = ref([])
const statusMessage = ref(null)

// Template emojis mapping
const templateEmojis = {
  girlboss: '💅',
  hormozi: '🔥',
  tiktokstyle: '🎵',
  thintobold: '✨',
  wavycolors: '🌈',
  shrinkingpairs: '🎯',
  revealenlarge: '🌟',
  basic: '📋'
}

// Methods
const getTemplateEmoji = (templateKey) => {
  return templateEmojis[templateKey] || '🎬'
}

const showStatus = (message, type = 'success') => {
  statusMessage.value = { text: message, type }
  setTimeout(() => {
    statusMessage.value = null
  }, 5000)
}

const loadTemplates = async () => {
  try {
    const response = await $fetch('/api/encode-template', {
      method: 'GET'
    })
    
    if (response.success) {
      availableTemplates.value = response.templates
      templatesLoaded.value = true
      
      // Set default template if available
      if (availableTemplates.value.length > 0 && !form.selectedTemplate) {
        form.selectedTemplate = availableTemplates.value.find(t => t.key === 'girlboss')?.key || availableTemplates.value[0].key
      }
    }
  } catch (error) {
    console.error('Failed to load templates:', error)
    showStatus('Failed to load templates. Please refresh the page.', 'error')
  }
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const processVideo = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  statusMessage.value = null
  
  try {
    // Prepare the request body
    const requestBody = {
      url: form.videoUrl,
      srtContent: form.srtContent,
      templateName: form.selectedTemplate,
      outputName: form.outputName || 'processed_video'
    }

    // Add anti-detection options if enabled
    if (form.antiDetection) {
      requestBody.options = {
        antiDetection: {
          pixelShift: true,
          microCrop: true,
          subtleRotation: true,
          noiseAddition: true,
          metadataPoisoning: true,
          frameInterpolation: true
        }
      }
    }

    // Make the API request
    const response = await fetch('/api/encode-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    // Check if response is a video file
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('video/mp4')) {
      // Download the video file
      const blob = await response.blob()
      const filename = `${form.outputName || 'processed_video'}.mp4`
      downloadBlob(blob, filename)
      
      showStatus(`✅ Video processed successfully! "${filename}" has been downloaded.`, 'success')
    } else {
      // Handle JSON response (error case)
      const jsonResponse = await response.json()
      throw new Error(jsonResponse.error || 'Unexpected response format')
    }

  } catch (error) {
    console.error('Error processing video:', error)
    showStatus(`❌ Error: ${error.message}`, 'error')
  } finally {
    isProcessing.value = false
  }
}

// Load templates on component mount
onMounted(() => {
  loadTemplates()
})
</script>