import { Weather, Forecast } from '../models/Weather';
import { Location } from '../models/Location';
import { Notification } from '../models/Notification';
import type { NotificationRule, NotificationCondition } from '../models/interfaces';
import weatherService from '../services/WeatherService';
import storageService from '../services/StorageService';

/**
 * UIManager class for handling all DOM manipulation and UI interactions
 * Implements separation of concerns by isolating DOM operations
 */
export class UIManager {
  private searchForm!: HTMLFormElement;
  private cityInput!: HTMLInputElement;
  private errorContainer!: HTMLElement;
  private errorMessage!: HTMLElement;
  private loadingContainer!: HTMLElement;
  private welcomeContainer!: HTMLElement;
  private weatherContainer!: HTMLElement;
  private currentWeatherContainer!: HTMLElement;
  private forecastContainer!: HTMLElement;
  private favoritesTab!: HTMLElement;
  private notificationsTab!: HTMLElement;
  private favoritesList!: HTMLElement;
  private notificationsList!: HTMLElement;

  private searchCallback?: (city: string) => void;
  private addToFavoritesCallback?: () => void;
  private removeFromFavoritesCallback?: (locationId: string) => void;
  private selectFavoriteCallback?: (location: Location) => void;
  private toggleNotificationCallback?: (id: string, active: boolean) => void;
  private removeNotificationCallback?: (id: string) => void;
  private saveNotificationCallback?: (location: Location, rules: NotificationRule[]) => void;

  // Track current location for notifications and favorites
  private currentLocation: Location | null = null;
  private favoritesWeatherData: Map<string, Weather> = new Map();

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.searchForm = document.getElementById('search-form') as HTMLFormElement;
    this.cityInput = document.getElementById('city-input') as HTMLInputElement;
    this.errorContainer = document.getElementById('error-container') as HTMLElement;
    this.errorMessage = document.getElementById('error-message') as HTMLElement;
    this.loadingContainer = document.getElementById('loading-container') as HTMLElement;
    this.welcomeContainer = document.getElementById('welcome-container') as HTMLElement;
    this.weatherContainer = document.getElementById('weather-container') as HTMLElement;
    this.currentWeatherContainer = document.getElementById('current-weather') as HTMLElement;
    this.forecastContainer = document.getElementById('forecast-list') as HTMLElement;
    this.favoritesTab = document.getElementById('favorites-tab') as HTMLElement;
    this.notificationsTab = document.getElementById('notifications-tab') as HTMLElement;
    this.favoritesList = document.getElementById('favorites-list') as HTMLElement;
    this.notificationsList = document.getElementById('notifications-list') as HTMLElement;
  }

  /**
   * Setup basic event listeners
   */
  private setupEventListeners(): void {
    // Search form submission
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const city = this.cityInput.value.trim();
      if (city && this.searchCallback) {
        this.searchCallback(city);
      }
    });

    // Error dismissal
    const closeErrorBtn = document.getElementById('close-error');
    if (closeErrorBtn) {
      closeErrorBtn.addEventListener('click', () => {
        this.hideError();
      });
    }

    // Tab switching - fixed to use currentTarget
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement; // Use currentTarget instead of target
        const tabId = target.getAttribute('data-tab');
        console.log('Tab clicked:', tabId); // Debug log
        if (tabId) {
          this.switchTab(tabId);
        }
      });
    });
  }

  /**
   * Register callbacks
   */
  public onSearch(callback: (city: string) => void): void {
    this.searchCallback = callback;
  }

  public onAddToFavorites(callback: () => void): void {
    this.addToFavoritesCallback = callback;
  }

  public onRemoveFromFavorites(callback: (locationId: string) => void): void {
    this.removeFromFavoritesCallback = callback;
  }

  public onSelectFavorite(callback: (location: Location) => void): void {
    this.selectFavoriteCallback = callback;
  }

  public onToggleNotification(callback: (id: string, active: boolean) => void): void {
    this.toggleNotificationCallback = callback;
  }

  public onRemoveNotification(callback: (id: string) => void): void {
    this.removeNotificationCallback = callback;
  }

  public onSaveNotification(callback: (location: Location, rules: NotificationRule[]) => void): void {
    this.saveNotificationCallback = callback;
  }

  public onCreateNotification(callback: () => void): void {
    // This functionality is now handled in the notification form
  }
  
  public onTabSwitch(callback: (tabId: string) => void): void {}
  public onDismissError(callback: () => void): void {}

  /**
   * Display weather data (enhanced to track current location)
   */
  public displayWeather(weather: Weather, forecast: Forecast, location: Location): void {
    this.currentLocation = location; // Track current location
    this.showWeatherContainer();
    this.renderCurrentWeather(weather, location);
    this.renderForecast(forecast);
  }

  /**
   * Render current weather with modern gradient design and animated heart system
   */
  private renderCurrentWeather(weather: Weather, location: Location): void {
    const isFavorite = storageService.isFavorite(location.id);
    
    this.currentWeatherContainer.innerHTML = `
      <!-- Main Weather Card with Dynamic Gradient Background -->
      <div class="relative bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-3xl p-8 text-white mb-6 overflow-hidden shadow-2xl">
        <!-- Animated background elements -->
        <div class="absolute top-4 right-4 opacity-20 animate-pulse">
          <div class="w-32 h-32 bg-white bg-opacity-30 rounded-full"></div>
        </div>
        <div class="absolute bottom-0 left-0 opacity-10">
          <div class="w-40 h-40 bg-white bg-opacity-20 rounded-full -mb-20 -ml-20 animate-bounce" style="animation-duration: 3s;"></div>
        </div>
        
        <!-- Main Content -->
        <div class="relative z-10">
          <!-- Header with location and animated favorite heart -->
          <div class="flex items-start justify-between mb-6">
            <div class="flex-1">
              <h1 class="text-3xl font-bold mb-2 text-white drop-shadow-lg">${location.name}, ${location.country}</h1>
              <p class="text-white text-opacity-90 text-lg font-medium">${weather.getFormattedDate()}</p>
            </div>
            
            <!-- Animated Heart Favorite Button -->
            <button 
              id="add-to-favorites" 
              class="favorite-heart group relative p-3 rounded-full bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-300 hover:scale-110 active:scale-95"
              data-location-id="${location.id}"
              title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
            >
              <div class="heart-container relative">
                <!-- Empty Heart (always visible as base) -->
                <span class="heart-empty text-2xl text-white opacity-${isFavorite ? '0' : '100'} transition-opacity duration-300">🤍</span>
                <!-- Filled Heart (overlay for favorites) -->
                <span class="heart-filled absolute inset-0 text-2xl text-red-500 opacity-${isFavorite ? '100' : '0'} transition-all duration-300 ${isFavorite ? 'animate-pulse' : ''}">❤️</span>
              </div>
              
              <!-- Ripple effect -->
              <div class="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-30 transition-opacity duration-150"></div>
            </button>
          </div>
          
          <!-- Main Temperature Display with Weather Icon -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <div class="relative">
                <img 
                  src="${weather.getIconUrl()}" 
                  alt="${weather.description}" 
                  class="w-24 h-24 mr-6 drop-shadow-2xl transform hover:scale-110 transition-transform duration-300"
                >
                <!-- Glow effect behind icon -->
                <div class="absolute inset-0 w-24 h-24 bg-white opacity-20 rounded-full blur-xl -z-10"></div>
              </div>
              <div>
                <div class="text-6xl font-bold mb-2 text-white drop-shadow-lg">${Math.round(weather.temperature)}°C</div>
                <div class="text-xl text-white text-opacity-95 capitalize font-medium">${weather.description}</div>
              </div>
            </div>
            
            <!-- High/Low Temperature Display -->
            <div class="text-right">
              <div class="text-white text-opacity-90 mb-2 text-lg">
                <span class="inline-block w-6 text-center">🌡️</span> 
                Feels like <span class="font-semibold">${Math.round(weather.feelsLike)}°C</span>
              </div>
              <div class="text-white text-opacity-90 text-lg">
                <span class="font-semibold">H:</span> ${Math.round(weather.maxTemperature)}° 
                <span class="mx-2">|</span> 
                <span class="font-semibold">L:</span> ${Math.round(weather.minTemperature)}°
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Weather Details Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Humidity Card -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-blue-200">
          <div class="text-blue-500 text-3xl mb-3 animate-bounce" style="animation-duration: 2s;">💧</div>
          <div class="text-gray-600 text-sm font-medium mb-2">Humidity</div>
          <div class="text-2xl font-bold text-blue-700">${weather.humidity}%</div>
        </div>
        
        <!-- Wind Card -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-green-200">
          <div class="text-green-500 text-3xl mb-3 animate-pulse">💨</div>
          <div class="text-gray-600 text-sm font-medium mb-2">Wind Speed</div>
          <div class="text-2xl font-bold text-green-700">${weather.windSpeed} m/s</div>
        </div>
        
        <!-- Pressure Card -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-purple-200">
          <div class="text-purple-500 text-3xl mb-3">🌇</div>
          <div class="text-gray-600 text-sm font-medium mb-2">Sunset</div>
          <div class="text-2xl font-bold text-purple-700">${weather.getFormattedSunset()}</div>
        </div>
        
        <!-- Visibility Card -->
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-orange-200">
          <div class="text-orange-500 text-3xl mb-3">🌅</div>
          <div class="text-gray-600 text-sm font-medium mb-2">Sunrise</div>
          <div class="text-2xl font-bold text-orange-700">${weather.getFormattedSunrise()}</div>
        </div>
      </div>
    `;

    // Setup heart animation click handler
    this.setupFavoriteHeartHandler(location);
  }

  /**
   * Setup the animated heart favorite button handler
   */
  private setupFavoriteHeartHandler(location: Location): void {
    const heartButton = document.getElementById('add-to-favorites');
    if (!heartButton) return;

    heartButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const heartEmpty = heartButton.querySelector('.heart-empty') as HTMLElement;
      const heartFilled = heartButton.querySelector('.heart-filled') as HTMLElement;
      
      const isFavorite = storageService.isFavorite(location.id);
      
      if (isFavorite) {
        // Remove from favorites with animation
        heartFilled.style.transform = 'scale(1.3)';
        heartFilled.style.opacity = '0';
        heartEmpty.style.opacity = '100';
        
        setTimeout(() => {
          heartFilled.style.transform = 'scale(1)';
          heartFilled.classList.remove('animate-pulse');
        }, 300);

        if (this.removeFromFavoritesCallback) {
          this.removeFromFavoritesCallback(location.id);
        }
      } else {
        // Add to favorites with celebration animation
        heartEmpty.style.opacity = '0';
        heartFilled.style.opacity = '100';
        heartFilled.style.transform = 'scale(1.5)';
        heartFilled.classList.add('animate-pulse');
        
        // Create floating hearts animation
        this.createFloatingHeartsAnimation(heartButton);
        
        setTimeout(() => {
          heartFilled.style.transform = 'scale(1)';
        }, 300);

        if (this.addToFavoritesCallback) {
          this.addToFavoritesCallback();
        }
      }

      // Update tooltip
      heartButton.setAttribute('title', !isFavorite ? 'Remove from favorites' : 'Add to favorites');
    });
  }

  /**
   * Create floating hearts animation when adding to favorites
   */
  private createFloatingHeartsAnimation(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const container = document.body;

    for (let i = 0; i < 5; i++) {
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.className = 'fixed text-lg pointer-events-none z-50 animate-ping';
      heart.style.left = `${rect.left + Math.random() * 20}px`;
      heart.style.top = `${rect.top + Math.random() * 20}px`;
      heart.style.opacity = '1';
      
      container.appendChild(heart);

      // Animate upward and fade out
      setTimeout(() => {
        heart.style.transition = 'all 2s ease-out';
        heart.style.transform = 'translateY(-100px) scale(0.5)';
        heart.style.opacity = '0';
      }, i * 100);

      // Remove element after animation
      setTimeout(() => {
        if (heart.parentNode) {
          heart.parentNode.removeChild(heart);
        }
      }, 2000 + i * 100);
    }
  }

  /**
   * Render forecast
   */
  private renderForecast(forecast: Forecast): void {
    const dailyForecast = forecast.getDailyForecast();
    
    console.log('Rendering forecast:', dailyForecast.length, 'days'); // Debug log
    
    if (dailyForecast.length === 0) {
      this.forecastContainer.innerHTML = '<div class="text-gray-500 text-center">No forecast data available</div>';
      return;
    }
    
    this.forecastContainer.innerHTML = dailyForecast.map((item, index) => {
      const date = new Date(item.dt * 1000);
      const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return `
        <div class="bg-gray-50 p-4 rounded-lg text-center border border-gray-200 hover:shadow-md transition-shadow">
          <div class="text-sm font-medium text-gray-700 mb-1">${dayName}</div>
          <div class="text-xs text-gray-500 mb-2">${monthDay}</div>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" 
               alt="${item.weather[0].description}" 
               class="w-12 h-12 mx-auto mb-2">
          <div class="font-semibold text-lg text-gray-800">${Math.round(item.main.temp)}°C</div>
          <div class="text-xs text-gray-500 capitalize mt-1">${item.weather[0].description}</div>
          <div class="text-xs text-gray-400 mt-1">
            H: ${Math.round(item.main.temp_max)}° L: ${Math.round(item.main.temp_min)}°
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update favorites list display with weather data
   */
  public updateFavoritesList(favorites: Location[]): void {
    if (favorites.length === 0) {
      this.favoritesList.innerHTML = `
        <div class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-4">🌍</div>
          <p class="text-gray-500 text-sm">No favorite locations yet.</p>
          <p class="text-gray-400 text-xs mt-1">Search for a city to add it to favorites.</p>
        </div>
      `;
      return;
    }

    this.favoritesList.innerHTML = favorites.map(location => {
      const weather = this.favoritesWeatherData.get(location.id);
      
      if (weather) {
        // Show location with weather data
        return `
          <div class="favorite-item group bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl p-3 mb-2 cursor-pointer transition-all duration-300 hover:shadow-md border border-blue-100 hover:border-blue-200" 
               data-location-id="${location.id}">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 flex-1 min-w-0">
                <!-- Weather Icon (smaller) -->
                <div class="relative flex-shrink-0">
                  <img src="${weather.getIconUrl()}" alt="${weather.description}" 
                       class="w-10 h-10 rounded-lg group-hover:scale-105 transition-transform duration-300">
                </div>
                
                <!-- Location & Weather Info (more compact) -->
                <div class="flex-1 min-w-0 mr-2">
                  <h4 class="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-700 transition-colors duration-300">
                    ${location.name}
                  </h4>
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-gray-600 capitalize truncate">${weather.description}</p>
                    <div class="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-300 ml-2">
                      ${Math.round(weather.temperature)}°C
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <div class="flex items-center space-x-2">
                      <span>💧${weather.humidity}%</span>
                      <span>💨${weather.windSpeed}m/s</span>
                    </div>
                    <span class="text-xs">
                      H:${Math.round(weather.maxTemperature)}° L:${Math.round(weather.minTemperature)}°
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Remove Button (smaller and always visible) -->
              <button class="remove-favorite flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                      title="Remove from favorites"
                      data-location-id="${location.id}">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        `;
      } else {
        // Show location without weather data (loading state)
        return `
          <div class="favorite-item bg-gray-50 hover:bg-gray-100 rounded-xl p-3 mb-2 cursor-pointer transition-all duration-300 border border-gray-200" 
               data-location-id="${location.id}">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 flex-1 min-w-0">
                <!-- Loading Weather Icon (smaller) -->
                <div class="w-10 h-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                
                <!-- Location Info (more compact) -->
                <div class="flex-1 min-w-0 mr-2">
                  <h4 class="font-semibold text-sm text-gray-800 truncate">${location.name}</h4>
                  <p class="text-xs text-gray-500">${location.country}</p>
                  <div class="text-xs text-gray-400 mt-1">Loading weather...</div>
                </div>
                
                <!-- Loading Temperature -->
                <div class="text-right flex-shrink-0">
                  <div class="w-10 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div class="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              
              <!-- Remove Button (smaller) -->
              <button class="remove-favorite flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                      title="Remove from favorites"
                      data-location-id="${location.id}">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        `;
      }
    }).join('');

    // Setup event listeners for favorite items and remove buttons
    this.setupFavoritesEventListeners();
  }

  /**
   * Setup event listeners for favorites list items
   */
  private setupFavoritesEventListeners(): void {
    // Click on favorite item to select location
    const favoriteItems = this.favoritesList.querySelectorAll('.favorite-item');
    favoriteItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        // Don't trigger if clicking on remove button
        if (target.closest('.remove-favorite')) {
          return;
        }
        
        const locationId = item.getAttribute('data-location-id');
        if (locationId && this.selectFavoriteCallback) {
          // Find the location by ID (you'll need to pass favorites to this method)
          const favorites = storageService.getFavorites();
          const location = favorites.find(fav => fav.id === locationId);
          if (location) {
            this.selectFavoriteCallback(location);
          }
        }
      });
    });

    // Remove favorite buttons
    const removeButtons = this.favoritesList.querySelectorAll('.remove-favorite');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the item click
        const locationId = button.getAttribute('data-location-id');
        if (locationId && this.removeFromFavoritesCallback) {
          // Add confirmation animation
          const item = button.closest('.favorite-item') as HTMLElement;
          if (item) {
            item.style.transform = 'scale(0.95)';
            item.style.opacity = '0.7';
            setTimeout(() => {
              this.removeFromFavoritesCallback!(locationId);
            }, 150);
          }
        }
      });
    });
  }

  /**
   * Update notifications list (enhanced with edit functionality and better parameter display)
   */
  public updateNotificationsList(notifications: Notification[]): void {
    this.notificationsList.innerHTML = `
      <div class="mb-4">
        <button id="create-notification-btn" class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          + Create New Weather Alert
        </button>
      </div>
      
      <div id="notification-form" class="hidden mb-4 p-4 bg-gray-50 rounded-lg border">
        <h3 class="text-lg font-semibold mb-3">
          <span id="form-title">Create Weather Alert</span>
        </h3>
        
        <div class="mb-3">
          <label for="alert-type" class="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
          <select id="alert-type" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
            <option value="temperature_above">Temperature above threshold</option>
            <option value="temperature_below">Temperature below threshold</option>
            <option value="rain">Rain expected</option>
            <option value="snow">Snow expected</option>
            <option value="thunderstorm">Thunderstorm expected</option>
            <option value="clear">Clear sky</option>
          </select>
        </div>
        
        <div class="mb-3" id="temp-value-container">
          <label for="alert-value" class="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
          <input type="number" id="alert-value" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                 placeholder="e.g., 25" min="-50" max="60">
        </div>
        
        <div class="mb-3">
          <label for="alert-message" class="block text-sm font-medium text-gray-700 mb-1">Custom Message (Optional)</label>
          <input type="text" id="alert-message" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                 placeholder="e.g., Don't forget your jacket!">
        </div>
        
        <div class="flex gap-2">
          <button id="save-notification" class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <span id="save-btn-text">Save Alert</span>
          </button>
          <button id="cancel-notification" class="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `;

    if (notifications.length === 0) {
      this.notificationsList.innerHTML += '<div class="text-gray-500 text-sm mt-4 p-4 text-center border border-dashed border-gray-300 rounded-lg">No weather alerts set up yet. Create your first alert above!</div>';
    } else {
      const notificationsHtml = notifications.map(notification => {
        const params = this.getNotificationDisplayParams(notification);
        
        return `
          <div class="p-4 bg-white border border-gray-200 rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="font-medium text-gray-800 mb-1">${notification.location.getFullName()}</div>
                <div class="text-sm text-blue-600 font-medium mb-1">${params.title}</div>
                <div class="text-xs text-gray-500 mb-2">${params.description}</div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-1 rounded-full ${notification.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                    ${notification.isActive ? '🔔 Active' : '🔕 Paused'}
                  </span>
                </div>
              </div>
              <div class="flex flex-col gap-1 ml-3">
                <button class="edit-notification px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors" 
                        data-id="${notification.id}">
                  ✏️ Edit
                </button>
                <button class="toggle-notification px-3 py-1 text-xs rounded transition-colors ${notification.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}" 
                        data-id="${notification.id}">
                  ${notification.isActive ? '⏸️ Pause' : '▶️ Activate'}
                </button>
                <button class="remove-notification px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors" 
                        data-id="${notification.id}">
                  🗑️ Remove
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      this.notificationsList.innerHTML += notificationsHtml;
    }

    // Add event listeners for notification controls
    this.setupNotificationEventListeners();
  }

  /**
   * Get display parameters for a notification
   */
  private getNotificationDisplayParams(notification: Notification): { title: string; description: string } {
    const rule = notification.rules[0]; // Get first rule
    
    switch (rule.condition) {
      case 'temperature_above':
        return {
          title: `Temperature Alert (>${rule.value}°C)`,
          description: `Alert when temperature exceeds ${rule.value}°C`
        };
      case 'temperature_below':
        return {
          title: `Temperature Alert (<${rule.value}°C)`,
          description: `Alert when temperature drops below ${rule.value}°C`
        };
      case 'rain':
        return {
          title: 'Rain Alert',
          description: 'Alert when rain is expected'
        };
      case 'snow':
        return {
          title: 'Snow Alert',
          description: 'Alert when snow is expected'
        };
      case 'thunderstorm':
        return {
          title: 'Thunderstorm Alert',
          description: 'Alert when thunderstorms are expected'
        };
      case 'clear':
        return {
          title: 'Clear Sky Alert',
          description: 'Alert when clear skies are expected'
        };
      default:
        return {
          title: 'Weather Alert',
          description: 'Custom weather alert'
        };
    }
  }

  // Add editing state tracking
  private editingNotificationId: string | null = null;

  /**
   * Setup event listeners for notification controls (enhanced with edit functionality)
   */
  private setupNotificationEventListeners(): void {
    const createBtn = document.getElementById('create-notification-btn');
    const notificationForm = document.getElementById('notification-form');
    const saveBtn = document.getElementById('save-notification');
    const cancelBtn = document.getElementById('cancel-notification');
    const alertTypeSelect = document.getElementById('alert-type') as HTMLSelectElement;
    const tempContainer = document.getElementById('temp-value-container');

    // Alert type change listener to show/hide temperature input
    if (alertTypeSelect && tempContainer) {
      alertTypeSelect.addEventListener('change', () => {
        const needsValue = ['temperature_above', 'temperature_below'].includes(alertTypeSelect.value);
        tempContainer.style.display = needsValue ? 'block' : 'none';
      });

      // Set initial visibility
      const needsValue = ['temperature_above', 'temperature_below'].includes(alertTypeSelect.value);
      tempContainer.style.display = needsValue ? 'block' : 'none';
    }

    if (createBtn && notificationForm) {
      createBtn.addEventListener('click', () => {
        if (this.currentLocation) {
          this.editingNotificationId = null;
          this.resetNotificationForm();
          document.getElementById('form-title')!.textContent = 'Create Weather Alert';
          document.getElementById('save-btn-text')!.textContent = 'Save Alert';
          notificationForm.classList.toggle('hidden');
        } else {
          this.showError('Please search for a location first to create weather alerts');
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (this.editingNotificationId) {
          this.handleEditNotification();
        } else {
          this.handleSaveNotification();
        }
      });
    }

    if (cancelBtn && notificationForm) {
      cancelBtn.addEventListener('click', () => {
        notificationForm.classList.add('hidden');
        this.editingNotificationId = null;
        this.resetNotificationForm();
      });
    }

    // Edit buttons
    document.querySelectorAll('.edit-notification').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id) {
          this.startEditNotification(id);
        }
      });
    });

    // Toggle and remove buttons
    document.querySelectorAll('.toggle-notification').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id && this.toggleNotificationCallback) {
          const isCurrentlyActive = (e.target as HTMLElement).textContent?.includes('Pause');
          this.toggleNotificationCallback(id, !isCurrentlyActive);
        }
      });
    });

    document.querySelectorAll('.remove-notification').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id && this.removeNotificationCallback) {
          if (confirm('Are you sure you want to remove this notification?')) {
            this.removeNotificationCallback(id);
          }
        }
      });
    });
  }

  /**
   * Start editing a notification
   */
  private startEditNotification(notificationId: string): void {
    // Find the notification (you'd need access to the notifications list)
    // For now, we'll show the form and let the parent handle the data population
    this.editingNotificationId = notificationId;
    const form = document.getElementById('notification-form');
    if (form) {
      form.classList.remove('hidden');
      document.getElementById('form-title')!.textContent = 'Edit Weather Alert';
      document.getElementById('save-btn-text')!.textContent = 'Update Alert';
    }

    // Trigger callback to get notification data for editing
    if (this.editNotificationCallback) {
      this.editNotificationCallback(notificationId);
    }
  }

  /**
   * Handle editing an existing notification
   */
  private handleEditNotification(): void {
    if (!this.editingNotificationId) return;

    const alertType = (document.getElementById('alert-type') as HTMLSelectElement)?.value;
    const alertValue = (document.getElementById('alert-value') as HTMLInputElement)?.value;

    if (!alertType) {
      this.showError('Please select an alert type');
      return;
    }

    const needsValue = ['temperature_above', 'temperature_below'].includes(alertType);
    if (needsValue && !alertValue) {
      this.showError('Please enter a temperature value');
      return;
    }

    const rule: NotificationRule = {
      condition: alertType as any,
      value: needsValue ? parseFloat(alertValue) : undefined
    };

    if (this.updateNotificationCallback) {
      this.updateNotificationCallback(this.editingNotificationId, [rule]);
      
      // Hide form and reset
      const form = document.getElementById('notification-form');
      if (form) {
        form.classList.add('hidden');
        this.editingNotificationId = null;
        this.resetNotificationForm();
      }
    }
  }

  /**
   * Reset notification form
   */
  private resetNotificationForm(): void {
    (document.getElementById('alert-type') as HTMLSelectElement).value = 'temperature_above';
    (document.getElementById('alert-value') as HTMLInputElement).value = '';
    (document.getElementById('alert-message') as HTMLInputElement).value = '';
    
    // Reset temperature container visibility
    const tempContainer = document.getElementById('temp-value-container');
    if (tempContainer) {
      tempContainer.style.display = 'block';
    }
  }

  /**
   * Populate form for editing
   */
  public populateNotificationForm(notification: Notification): void {
    const rule = notification.rules[0];
    if (rule) {
      (document.getElementById('alert-type') as HTMLSelectElement).value = rule.condition;
      if (rule.value !== undefined) {
        (document.getElementById('alert-value') as HTMLInputElement).value = rule.value.toString();
      }
      
      // Update temperature container visibility
      const tempContainer = document.getElementById('temp-value-container');
      const needsValue = ['temperature_above', 'temperature_below'].includes(rule.condition);
      if (tempContainer) {
        tempContainer.style.display = needsValue ? 'block' : 'none';
      }
    }
  }

  // Add new callback properties
  private editNotificationCallback?: (id: string) => void;
  private updateNotificationCallback?: (id: string, rules: NotificationRule[]) => void;

  /**
   * Register edit notification callback
   */
  public onEditNotification(callback: (id: string) => void): void {
    this.editNotificationCallback = callback;
  }

  public onUpdateNotification(callback: (id: string, rules: NotificationRule[]) => void): void {
    this.updateNotificationCallback = callback;
  }

  /**
   * Handle saving a new notification
   */
  private handleSaveNotification(): void {
    if (!this.currentLocation) {
      this.showError('No location selected');
      return;
    }

    const alertType = (document.getElementById('alert-type') as HTMLSelectElement)?.value;
    const alertValue = (document.getElementById('alert-value') as HTMLInputElement)?.value;

    if (!alertType) {
      this.showError('Please select an alert type');
      return;
    }

    const needsValue = ['temperature_above', 'temperature_below'].includes(alertType);
    if (needsValue && !alertValue) {
      this.showError('Please enter a temperature value');
      return;
    }

    const rule: NotificationRule = {
      condition: alertType as any,
      value: needsValue ? parseFloat(alertValue) : undefined
    };

    const rules: NotificationRule[] = [rule];

    if (this.saveNotificationCallback) {
      this.saveNotificationCallback(this.currentLocation, rules);
      
      // Hide form and reset
      const form = document.getElementById('notification-form');
      if (form) {
        form.classList.add('hidden');
        this.resetNotificationForm();
      }
    }
  }

  /**
   * Switch tabs
   */
  private switchTab(tabId: string): void {
    console.log('Switching to tab:', tabId); // Debug log
    
    // Update tab buttons - remove active classes from all
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active', 'border-blue-500', 'text-blue-600', 'bg-blue-50');
      button.classList.add('border-transparent', 'text-gray-500');
    });

    // Add active classes to the clicked button
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active', 'border-blue-500', 'text-blue-600', 'bg-blue-50');
      activeButton.classList.remove('border-transparent', 'text-gray-500');
      console.log('Active button updated for:', tabId); // Debug log
    }

    // Update tab content - hide all tabs first
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });

    // Show the selected tab content
    const activeContent = document.getElementById(`${tabId}-tab`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
      console.log('Tab content shown for:', tabId); // Debug log
    } else {
      console.error('Tab content not found for:', `${tabId}-tab`); // Debug log
    }
  }

  /**
   * Show/hide UI elements
   */
  public showLoading(): void {
    this.loadingContainer.classList.remove('hidden');
  }

  public hideLoading(): void {
    this.loadingContainer.classList.add('hidden');
  }

  public showError(message: string): void {
    this.errorMessage.textContent = message;
    this.errorContainer.classList.remove('hidden');
  }

  public hideError(): void {
    this.errorContainer.classList.add('hidden');
  }

  public hideWelcome(): void {
    this.welcomeContainer.classList.add('hidden');
  }

  private showWeatherContainer(): void {
    this.weatherContainer.classList.remove('hidden');
  }

  // Placeholder methods for notification functionality
  public showNotificationForm(location: Location): void {}
  public hideNotificationForm(): void {}
  public updateFavoriteButton(location: Location, isFavorite: boolean): void {}
  
  /**
   * Show notification alert when weather conditions are met
   */
  public showNotificationAlert(notification: Notification, weather: Weather): void {
    const alertsContainer = document.getElementById('notification-alerts');
    if (!alertsContainer) return;

    const message = notification.getNotificationMessage({
      main: {
        temp: weather.temperature,
        feels_like: weather.feelsLike,
        temp_min: weather.minTemperature,
        temp_max: weather.maxTemperature,
        pressure: weather.pressure,
        humidity: weather.humidity
      },
      weather: [{
        main: weather.conditions,
        description: weather.description,
        icon: weather.icon
      }],
      wind: {
        speed: weather.windSpeed,
        deg: weather.windDirection
      },
      sys: {
        country: weather.country,
        sunrise: Math.floor(weather.sunrise.getTime() / 1000),
        sunset: Math.floor(weather.sunset.getTime() / 1000)
      },
      name: weather.cityName,
      coord: weather.coordinates,
      dt: Math.floor(weather.date.getTime() / 1000)
    } as any);

    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = 'notification-alert transform translate-x-full opacity-0 transition-all duration-500 ease-out';
    
    alertElement.innerHTML = `
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-2xl p-4 mb-3 max-w-sm border border-blue-400">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center">
            <div class="bg-white bg-opacity-20 rounded-full p-2 mr-3">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
            </div>
            <div>
              <h4 class="font-semibold text-sm">Weather Alert</h4>
              <p class="text-white text-opacity-90 text-xs">${notification.location.name}</p>
            </div>
          </div>
          <button class="close-alert text-white text-opacity-70 hover:text-opacity-100 transition-opacity" data-alert-id="${alertId}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="flex items-center mb-3">
          <img src="${weather.getIconUrl()}" alt="${weather.description}" class="w-12 h-12 mr-3">
          <div>
            <div class="text-lg font-bold">${Math.round(weather.temperature)}°C</div>
            <div class="text-white text-opacity-90 text-sm capitalize">${weather.description}</div>
          </div>
        </div>
        
        <div class="bg-white bg-opacity-10 rounded-xl p-3 mb-3">
          <p class="text-sm text-white font-medium">${message}</p>
        </div>
        
        <div class="flex justify-between text-xs text-white text-opacity-80">
          <span>💧 ${weather.humidity}%</span>
          <span>💨 ${weather.windSpeed} m/s</span>
          <span>🌡️ ${Math.round(weather.feelsLike)}°C</span>
        </div>
        
        <!-- Progress bar for auto-dismiss -->
        <div class="mt-3 bg-white bg-opacity-20 rounded-full h-1 overflow-hidden">
          <div class="progress-bar bg-white h-full w-full origin-left transform scale-x-0" style="animation: progressShrink 8s linear forwards;"></div>
        </div>
      </div>
    `;

    // Add to container
    alertsContainer.appendChild(alertElement);

    // Animate in
    setTimeout(() => {
      alertElement.classList.remove('translate-x-full', 'opacity-0');
      alertElement.classList.add('translate-x-0', 'opacity-100');
    }, 100);

    // Setup close button
    const closeButton = alertElement.querySelector('.close-alert');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.dismissAlert(alertId);
      });
    }

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      this.dismissAlert(alertId);
    }, 8000);

    // Play notification sound (if browser supports it)
    this.playNotificationSound();

    // Show desktop notification if permitted
    this.showDesktopNotification(notification, weather);
  }

  /**
   * Dismiss a notification alert
   */
  private dismissAlert(alertId: string): void {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
      alertElement.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (alertElement.parentNode) {
          alertElement.parentNode.removeChild(alertElement);
        }
      }, 500);
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  /**
   * Show desktop notification if permitted
   */
  private showDesktopNotification(notification: Notification, weather: Weather): void {
    if ('Notification' in window && window.Notification) {
      if (window.Notification.permission === 'granted') {
        new window.Notification(`Weather Alert - ${notification.location.name}`, {
          body: `${Math.round(weather.temperature)}°C - ${weather.description}`,
          icon: weather.getIconUrl(),
          tag: `weather-${notification.location.id}`
        });
      } else if (window.Notification.permission !== 'denied') {
        window.Notification.requestPermission().then((permission: NotificationPermission) => {
          if (permission === 'granted') {
            this.showDesktopNotification(notification, weather);
          }
        });
      }
    }
  }
  
  public showSuccessMessage(message: string): void {
    const alertsContainer = document.getElementById('notification-alerts');
    if (!alertsContainer) return;

    const alertId = `success-${Date.now()}`;
    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = 'transform translate-x-full opacity-0 transition-all duration-500 ease-out';
    
    alertElement.innerHTML = `
      <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 mb-3 max-w-sm">
        <div class="flex items-center">
          <div class="bg-white bg-opacity-20 rounded-full p-2 mr-3">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <p class="font-medium">${message}</p>
        </div>
      </div>
    `;

    alertsContainer.appendChild(alertElement);

    // Animate in
    setTimeout(() => {
      alertElement.classList.remove('translate-x-full', 'opacity-0');
      alertElement.classList.add('translate-x-0', 'opacity-100');
    }, 100);

    // Auto-dismiss
    setTimeout(() => {
      this.dismissAlert(alertId);
    }, 3000);
  }

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    // Remove event listeners if needed
  }

  /**
   * Load weather data for all favorite locations and cache it
   */
  public async loadFavoritesWeatherData(favorites: Location[]): Promise<void> {
    try {
      const weatherPromises = favorites.map(async (location) => {
        try {
          const weatherResult = await weatherService.getWeatherByCoordinates(location.lat, location.lon);
          return { location, weather: weatherResult.weather };
        } catch (error) {
          console.error(`Failed to load weather for ${location.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(weatherPromises);
      
      // Cache the weather data
      results.forEach(result => {
        if (result) {
          this.favoritesWeatherData.set(result.location.id, result.weather);
        }
      });

      // Update the favorites list with weather data
      this.updateFavoritesList(favorites);
    } catch (error) {
      console.error('Error loading favorites weather data:', error);
    }
  }
} 