<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <!-- Header -->
    <header class="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-white mb-2">
          🎬 Cloutware Video Editor
        </h1>
        <p class="text-xl text-gray-300">Professional video processing with AI-powered transcription and dynamic subtitles</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        
        <!-- Complete Processing Card -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 hover:scale-105 transition-all duration-300">
          <div class="text-center">
            <div class="text-6xl mb-4">🎯</div>
            <h2 class="text-2xl font-bold text-white mb-4">Complete Processing</h2>
            <p class="text-gray-300 mb-6">Full video processing suite with transcription, subtitle generation, and animation styling in one place.</p>
            <NuxtLink
              to="/complete-processing"
              class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105 inline-block"
            >
              Launch Complete Suite
            </NuxtLink>
          </div>
        </div>

        <!-- Quick Features Grid -->
        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Video Upload Feature -->
          <div class="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div class="flex items-center mb-3">
              <div class="text-3xl mr-3">📹</div>
              <h3 class="text-lg font-semibold text-white">Video Upload</h3>
            </div>
            <p class="text-gray-400 text-sm">Drag & drop or upload video files for processing</p>
          </div>

          <!-- AI Transcription Feature -->
          <div class="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div class="flex items-center mb-3">
              <div class="text-3xl mr-3">🎤</div>
              <h3 class="text-lg font-semibold text-white">AI Transcription</h3>
            </div>
            <p class="text-gray-400 text-sm">Extract audio and generate accurate subtitles with AssemblyAI</p>
          </div>

          <!-- Subtitle Styles Feature -->
          <div class="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div class="flex items-center mb-3">
              <div class="text-3xl mr-3">🎨</div>
              <h3 class="text-lg font-semibold text-white">7 Animation Styles</h3>
            </div>
            <p class="text-gray-400 text-sm">Choose from Girlboss, TikTok, Hormozi, and more dynamic styles</p>
          </div>

          <!-- Real-time Processing Feature -->
          <div class="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div class="flex items-center mb-3">
              <div class="text-3xl mr-3">⚡</div>
              <h3 class="text-lg font-semibold text-white">Real-time Processing</h3>
            </div>
            <p class="text-gray-400 text-sm">Live progress tracking and instant video preview</p>
          </div>

        </div>
      </div>

      <!-- Additional Features Section -->
      <div class="mt-16">
        <h2 class="text-3xl font-bold text-white text-center mb-12">Powerful Features</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <!-- Multi-language Support -->
          <div class="text-center">
            <div class="bg-gradient-to-br from-green-400 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">🌍</span>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Multi-language Support</h3>
            <p class="text-gray-400">Transcribe videos in multiple languages with high accuracy</p>
          </div>

          <!-- Custom Styling -->
          <div class="text-center">
            <div class="bg-gradient-to-br from-purple-400 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">🎭</span>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Custom Styling</h3>
            <p class="text-gray-400">Personalize fonts, colors, animations, and positioning</p>
          </div>

          <!-- Professional Output -->
          <div class="text-center">
            <div class="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">💎</span>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Professional Output</h3>
            <p class="text-gray-400">High-quality video output ready for social media</p>
          </div>

        </div>
      </div>

      <!-- Getting Started Section -->
      <div class="mt-16 text-center">
        <div class="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 inline-block">
          <h2 class="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p class="text-gray-300 mb-6">Process your first video with AI-powered transcription and professional subtitle animations</p>
          <NuxtLink
            to="/complete-processing"
            class="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105 inline-block text-lg"
          >
            🚀 Start Processing Now
          </NuxtLink>
        </div>
      </div>

    </main>

    <!-- Footer -->
    <footer class="bg-black/20 backdrop-blur-sm mt-20 p-6">
      <div class="max-w-7xl mx-auto text-center">
        <p class="text-gray-400">© 2024 Cloutware Video Editor - Professional Video Processing Suite</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
useHead({
  title: 'Cloutware Video Editor - Professional Video Processing Suite',
  meta: [
    { name: 'description', content: 'Professional video processing with AI-powered transcription and dynamic subtitles. Create engaging videos with 7 animation styles.' }
  ]
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>