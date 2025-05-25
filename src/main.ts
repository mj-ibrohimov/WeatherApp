import './style.css';
import { WeatherApp } from './app/WeatherApp.js';

/**
 * Application entry point
 * Initializes the weather application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new WeatherApp();
    app.initialize();
  } catch (error) {
    console.error('Failed to initialize weather application:', error);
    
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed inset-0 bg-red-100 flex items-center justify-center';
    errorDiv.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md">
        <h2 class="text-xl font-bold text-red-600 mb-2">Application Error</h2>
        <p class="text-gray-700">Failed to initialize the weather application. Please refresh the page.</p>
        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Refresh Page
        </button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}); 