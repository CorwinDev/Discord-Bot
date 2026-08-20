FROM node:24-bookworm

WORKDIR /usr/src/app

# Install native system dependencies required by Cairo/Canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./

# Clean cache and compile native bindings directly in the container environment
RUN npm ci && npm rebuild canvas --build-from-source

# Copy remaining source files
COPY . .

CMD ["npm", "start"]