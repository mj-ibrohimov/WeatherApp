# Deployment Guide for Weather Application

## Netlify Deployment

### Prerequisites
- Node.js v18 or later
- npm package manager
- Netlify account

### Deployment Steps

1. **Build the Application**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Deploy

### Configuration Files

#### `netlify.toml`
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### `public/_redirects`
```
/*    /index.html   200
```

### Build Configuration

The project uses Vite with the following configuration:
- **Target**: ES2020
- **Output**: `dist/` directory
- **Base path**: Relative (`./`)
- **Minification**: Terser

### Troubleshooting

#### Issue: "Only HTML structure showing, no styling or functionality"

**Causes:**
1. Missing CSS/JS assets
2. Incorrect asset paths
3. Build configuration issues
4. Import statement problems

**Solutions:**
1. **Check Build Output**
   ```bash
   npm run build
   ls -la dist/
   ls -la dist/assets/
   ```

2. **Verify Asset References**
   - Check `dist/index.html` for correct asset paths
   - Ensure paths use relative references (`./assets/`)

3. **Check Browser Console**
   - Look for 404 errors on CSS/JS files
   - Check for JavaScript errors

4. **Verify Dependencies**
   ```bash
   npm install --save-dev terser
   npm run build
   ```

#### Issue: "Module not found" errors

**Solution:**
- Remove `.js` extensions from TypeScript import statements
- Use relative imports without file extensions

#### Issue: "Build fails with terser error"

**Solution:**
```bash
npm install --save-dev terser
```

### Environment Variables

If using custom API keys, set them in Netlify:
1. Go to Site Settings → Environment Variables
2. Add `VITE_WEATHER_API_KEY` with your OpenWeatherMap API key

### Performance Optimization

The build includes:
- CSS minification with TailwindCSS
- JavaScript minification with Terser
- Asset optimization
- Gzip compression (handled by Netlify)

### Testing Deployment

1. **Local Preview**
   ```bash
   npm run preview
   ```

2. **Production Test**
   - Test all functionality after deployment
   - Check browser console for errors
   - Verify API calls work correctly

### Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are in the `dist/` directory
3. Ensure Netlify build logs show successful completion
4. Test the application locally with `npm run preview`

---

**Last Updated**: December 2024
**Node.js Version**: 18.17.0
**Vite Version**: 5.4.2 