FROM node:20.11.1

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your app listens to
EXPOSE 8000

# Set the command to start the app (adjust according to your entry file)
CMD ["node", "app.js"]
