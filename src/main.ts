import './style.css';
import { WeatherApp } from './app/WeatherApp';

/**
 * Application entry point
 * Initialize the weather application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Starting Weather Application...');
    
    const app = new WeatherApp();
    await app.initialize();
    
    // Add global error handler for unhandled promises
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
    
  } catch (error) {
    console.error('Failed to initialize Weather Application:', error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>Failed to start the application. Please refresh the page.</span>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}); 