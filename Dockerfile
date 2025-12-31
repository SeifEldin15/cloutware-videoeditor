# Base image with NVIDIA CUDA support (Ubuntu 22.04 based)
# This provides the necessary drivers and libraries for NVENC
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

# Enforce UTC and non-interactive installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install system dependencies
# - curl, gnupg, ca-certificates: For downloading Node.js setup
# - ffmpeg: Ubuntu 22.04 ffmpeg usually supports nvenc
# - python3, make, g++: For building native Node.js modules
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    ffmpeg \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 (required by package.json engines)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Verify FFmpeg supports nvenc
RUN ffmpeg -encoders 2>/dev/null | grep nvenc || echo "WARNING: NVENC NOT DETECTED IN BUILD"

# Set working directory
WORKDIR /app

# Set environment variables for the app to use system FFmpeg
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe
ENV USE_GPU=true

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build the application (Nuxt/Nitro)
RUN pnpm build

# Expose the port (Nuxt usually defaults to 3000)
EXPOSE 3000

# Start command
CMD ["node", ".output/server/index.mjs"]
