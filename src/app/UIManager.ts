import { Weather, Forecast } from '../models/Weather.js';
import { Location } from '../models/Location.js';
import { Notification } from '../models/Notification.js';
import type { NotificationRule, NotificationCondition } from '../models/interfaces.js';

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

  // Track current location for notifications
  private currentLocation: Location | null = null;

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

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabId = target.getAttribute('data-tab');
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
   * Render current weather
   */
  private renderCurrentWeather(weather: Weather, location: Location): void {
    this.currentWeatherContainer.innerHTML = `
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">${location.getFullName()}</h1>
          <p class="text-gray-600">${weather.getFormattedDate()}</p>
        </div>
        <button id="add-to-favorites" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          ⭐ Add to Favorites
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex items-center">
          <img src="${weather.getIconUrl()}" alt="${weather.description}" class="w-20 h-20 mr-4">
          <div>
            <div class="text-5xl font-bold text-gray-800">${Math.round(weather.temperature)}°C</div>
            <div class="text-gray-600 capitalize">${weather.description}</div>
            <div class="text-sm text-gray-500">Feels like ${Math.round(weather.feelsLike)}°C</div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-gray-500">Humidity</div>
            <div class="text-xl font-semibold">${weather.humidity}%</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-gray-500">Wind Speed</div>
            <div class="text-xl font-semibold">${weather.windSpeed} m/s</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-gray-500">Pressure</div>
            <div class="text-xl font-semibold">${weather.pressure} hPa</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-gray-500">Wind Direction</div>
            <div class="text-xl font-semibold">${weather.getWindDirection()}</div>
          </div>
        </div>
      </div>
    `;

    // Add event listener for favorites button
    const favButton = document.getElementById('add-to-favorites');
    if (favButton && this.addToFavoritesCallback) {
      favButton.addEventListener('click', this.addToFavoritesCallback);
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
   * Update favorites list
   */
  public updateFavoritesList(favorites: Location[]): void {
    if (favorites.length === 0) {
      this.favoritesList.innerHTML = '<p class="text-gray-500 text-sm">No favorite locations yet.</p>';
      return;
    }

    this.favoritesList.innerHTML = favorites.map(location => `
      <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" 
           data-location-id="${location.id}">
        <div>
          <div class="font-medium">${location.name}</div>
          <div class="text-sm text-gray-500">${location.country}</div>
        </div>
        <button class="text-red-500 hover:text-red-700 remove-favorite" data-location-id="${location.id}">×</button>
      </div>
    `).join('');

    // Add event listeners
    this.favoritesList.querySelectorAll('[data-location-id]:not(.remove-favorite)').forEach(element => {
      element.addEventListener('click', (e) => {
        const locationId = (e.currentTarget as HTMLElement).getAttribute('data-location-id');
        const location = favorites.find(fav => fav.id === locationId);
        if (location && this.selectFavoriteCallback) {
          this.selectFavoriteCallback(location);
        }
      });
    });

    this.favoritesList.querySelectorAll('.remove-favorite').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const locationId = (e.target as HTMLElement).getAttribute('data-location-id');
        if (locationId && this.removeFromFavoritesCallback) {
          this.removeFromFavoritesCallback(locationId);
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
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active', 'border-blue-500', 'text-blue-600');
      button.classList.add('border-transparent', 'text-gray-500');
    });

    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active', 'border-blue-500', 'text-blue-600');
      activeButton.classList.remove('border-transparent', 'text-gray-500');
    }

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });

    const activeContent = document.getElementById(`${tabId}-tab`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
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
  public showNotificationAlert(notification: Notification, weather: Weather): void {}
  public showSuccessMessage(message: string): void {}

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    // Remove event listeners if needed
  }
} 