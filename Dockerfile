# Use the official Node.js v22 base image
FROM node:22

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install node dependencies
RUN npm install

# Copy the full app source
COPY . .

# Expose the app's runtime port (should match .env PORT)
EXPOSE 8080

# Start the app using the package.json script
CMD ["npm", "start"]
