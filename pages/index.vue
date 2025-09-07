<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl font-bold mb-2">
          🎬 Video Processing Studio
        </h1>
        <p class="text-xl opacity-90">Professional video processing with AI-powered subtitle templates</p>
      </div>
    </header>

    <div class="container mx-auto px-4 py-8">
      <!-- Main UI Access -->
      <div class="text-center mb-12">
        <div class="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
          <div class="text-6xl mb-4">🚀</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">All-in-One Video Processor</h2>
          <p class="text-gray-600 mb-6">Complete video processing suite with basic encoding, template styling, text replacement, and AI auto-subtitles all in one unified interface.</p>
          <a 
            href="/video-processor-all-in-one.html" 
            class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all inline-block font-semibold text-lg"
            target="_blank"
          >
            🎬 Launch Video Processor
          </a>
        </div>
      </div>

      <!-- API Overview -->
      <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Available APIs</h2>
        
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Template Processing -->
          <div class="border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-colors">
            <div class="text-center mb-4">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl">🎨</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-800">Template Styling</h3>
            </div>
            <p class="text-gray-600 text-sm mb-4">Advanced subtitle templates with animations and effects</p>
            <div class="space-y-2 text-xs">
              <div class="bg-purple-50 px-2 py-1 rounded">Endpoint: <code>/api/encode-template</code></div>
              <div class="text-gray-500">10 premium templates available</div>
            </div>
          </div>

          <!-- General Processing -->
          <div class="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
            <div class="text-center mb-4">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl">⚙️</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-800">General Processing</h3>
            </div>
            <p class="text-gray-600 text-sm mb-4">Video encoding, effects, and basic subtitle addition</p>
            <div class="space-y-2 text-xs">
              <div class="bg-blue-50 px-2 py-1 rounded">Endpoint: <code>/api/encode</code></div>
              <div class="text-gray-500">MP4, GIF, PNG output formats</div>
            </div>
          </div>

          <!-- Text Replacement -->
          <div class="border-2 border-amber-200 rounded-xl p-6 hover:border-amber-400 transition-colors">
            <div class="text-center mb-4">
              <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl">✏️</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-800">Text Replacement</h3>
            </div>
            <p class="text-gray-600 text-sm mb-4">Replace static text elements with custom content</p>
            <div class="space-y-2 text-xs">
              <div class="bg-amber-50 px-2 py-1 rounded">Endpoint: <code>/api/text-replace</code></div>
              <div class="text-gray-500">Multiple replacements supported</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Template Gallery -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Subtitle Style Templates</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div v-for="template in templates" :key="template.key" class="bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-xl p-4 text-center">
            <div class="text-2xl mb-2">{{ template.icon }}</div>
            <div class="text-sm font-bold">{{ template.name }}</div>
            <div class="text-xs opacity-90">{{ template.category }}</div>
          </div>
        </div>

        <div class="text-center mt-8">
          <p class="text-gray-600 mb-4">Ready to create stunning videos with professional subtitle animations?</p>
          <div class="space-x-4">
            <a 
              href="/video-api-ui.html" 
              class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all inline-block font-semibold"
              target="_blank"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Page meta
useHead({
  title: 'Video Processing Studio - Professional Video Processing APIs',
  meta: [
    { name: 'description', content: 'Professional video processing with AI-powered subtitle templates, effects, and text replacement capabilities.' }
  ]
})

// Template data
const templates = [
  { key: 'hormozi', name: 'Hormozi', category: 'Viral', icon: '🔥' },
  { key: 'girlboss', name: 'Girlboss', category: 'Viral', icon: '💅' },
  { key: 'tiktokstyle', name: 'TikTok', category: 'Social', icon: '🎵' },
  { key: 'whiteimpact', name: 'White Impact', category: 'Business', icon: '📝' },
  { key: 'thintobold', name: 'Thin to Bold', category: 'Elegant', icon: '✨' },
  { key: 'wavycolors', name: 'Wavy Colors', category: 'Fun', icon: '🌈' },
  { key: 'shrinkingpairs', name: 'Shrinking Pairs', category: 'Dynamic', icon: '🎯' },
  { key: 'revealenlarge', name: 'Reveal & Enlarge', category: 'Dynamic', icon: '🎭' },
  { key: 'impactfull', name: 'Impact Full', category: 'Business', icon: '📰' },
  { key: 'basic', name: 'Basic', category: 'Business', icon: '📄' }
]
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>
