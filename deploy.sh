#!/bin/bash

# GitHub Pages Deployment Script for 3D Portfolio
# This script builds the project and deploys it to the gh-pages branch

echo "🚀 Starting GitHub Pages deployment..."

# Build the project
echo "📦 Building project..."
NODE_OPTIONS='--openssl-legacy-provider' npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed! No build directory found."
    exit 1
fi

echo "✅ Build completed successfully!"

# Create a temporary directory for deployment
echo "📁 Preparing deployment files..."
mkdir -p deploy-temp
cd deploy-temp

# Copy all necessary files for GitHub Pages
cp ../index.html .
cp ../style.css .
cp ../favicon.ico .
cp -r ../build .
cp -r ../src .

# Create a simple .nojekyll file to bypass Jekyll processing
touch .nojekyll

# Fix asset paths in index.html for GitHub Pages
echo "🔧 Fixing asset paths for GitHub Pages..."
sed -i.bak 's|src="/src/|src="./src/|g' index.html
sed -i.bak 's|href="/src/|href="./src/|g' index.html
sed -i.bak 's|src="build/|src="./build/|g' index.html
sed -i.bak 's|href="build/|href="./build/|g' index.html
sed -i.bak 's|href="style.css"|href="./style.css"|g' index.html
sed -i.bak 's|href="favicon.ico"|href="./favicon.ico"|g' index.html

# Remove backup file
rm index.html.bak

# Initialize git repository for gh-pages
git init
git add .
git commit -m "Deploy 3D Portfolio to GitHub Pages - $(date)"

# Add the gh-pages branch
git branch -M gh-pages

# Add the remote origin
git remote add origin https://github.com/AkshayanMohandas/akshayan-portfolio-3d.git

# Force push to gh-pages branch
echo "🌐 Pushing to GitHub Pages..."
git push -f origin gh-pages

# Clean up
cd ..
rm -rf deploy-temp

echo "✅ Deployment completed!"
echo "🌍 Your portfolio should be available at:"
echo "   https://akshayanmohandas.github.io/akshayan-portfolio-3d/"
echo ""
echo "📝 Next steps:"
echo "   1. Go to your GitHub repository settings"
echo "   2. Navigate to 'Pages' section"
echo "   3. Select 'gh-pages' branch as source"
echo "   4. Save the settings"
echo "   5. Wait a few minutes for the site to be available"
