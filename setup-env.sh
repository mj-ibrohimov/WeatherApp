#!/bin/bash

# Weather App Environment Setup Script

echo "🌤️  Weather App Environment Setup"
echo "=================================="

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Copy example file
if [ -f "env.example" ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
else
    # Create .env file manually if env.example doesn't exist
    cat > .env << EOF
# Weather API Configuration
# Get your free API key at: https://openweathermap.org/api
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
EOF
    echo "✅ Created .env file with template"
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit the .env file and replace 'your_openweather_api_key_here' with your actual API key"
echo "2. Get a free API key at: https://openweathermap.org/api"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "🔒 Security note: The .env file is already in .gitignore and won't be committed to Git"