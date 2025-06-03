import { Weather, Forecast } from '../models/Weather';
import { Location } from '../models/Location';
import { Notification } from '../models/Notification';
import type { NotificationRule } from '../models/interfaces';
import weatherService, { WeatherResult, ForecastResult } from '../services/WeatherService';
import storageService from '../services/StorageService';
import { UIManager } from './UIManager';
import { NotificationManager } from './NotificationManager';

/**
 * Main WeatherApp class that coordinates all application functionality
 * Implements the MVC pattern with proper separation of concerns
 */
export class WeatherApp {
  private uiManager: UIManager;
  private notificationManager: NotificationManager;
  private currentWeather: Weather | null = null;
  private currentForecast: Forecast | null = null;
  private currentLocation: Location | null = null;

  constructor() {
    this.uiManager = new UIManager();
    this.notificationManager = new NotificationManager();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    this.setupEventListeners();
    await this.loadInitialData();
    this.notificationManager.startChecking();
    
    console.log('Weather Application initialized successfully');
  }

  /**
   * Set up all event listeners
   */
  private setupEventListeners(): void {
    // Search functionality
    this.uiManager.onSearch(async (city: string) => {
      await this.searchWeather(city);
    });

    // Favorites functionality
    this.uiManager.onAddToFavorites(() => {
      if (this.currentLocation) {
        this.addToFavorites(this.currentLocation);
      }
    });

    this.uiManager.onRemoveFromFavorites((locationId: string) => {
      this.removeFromFavorites(locationId);
    });

    this.uiManager.onSelectFavorite(async (location: Location) => {
      await this.selectLocation(location);
    });

    // Notification functionality
    this.uiManager.onCreateNotification(() => {
      if (this.currentLocation) {
        this.uiManager.showNotificationForm(this.currentLocation);
      }
    });

    this.uiManager.onSaveNotification(async (location: Location, rules: NotificationRule[]) => {
      await this.createNotification(location, rules);
    });

    this.uiManager.onEditNotification((notificationId: string) => {
      this.editNotification(notificationId);
    });

    this.uiManager.onUpdateNotification(async (notificationId: string, rules: NotificationRule[]) => {
      await this.updateNotification(notificationId, rules);
    });

    this.uiManager.onToggleNotification((notificationId: string, isActive: boolean) => {
      this.toggleNotification(notificationId, isActive);
    });

    this.uiManager.onRemoveNotification((notificationId: string) => {
      this.removeNotification(notificationId);
    });

    // Tab switching
    this.uiManager.onTabSwitch((tabId: string) => {
      this.handleTabSwitch(tabId);
    });

    // Error handling
    this.uiManager.onDismissError(() => {
      this.uiManager.hideError();
    });

    // Notification alerts
    this.notificationManager.onNotificationTriggered((notification: Notification, weather: Weather) => {
      this.uiManager.showNotificationAlert(notification, weather);
    });
  }

  /**
   * Load initial data (favorites and notifications) and show favorite locations weather
   */
  private async loadInitialData(): Promise<void> {
    try {
      const favorites = storageService.getFavorites();
      const notifications = storageService.getNotifications();
      
      this.uiManager.updateFavoritesList(favorites);
      this.uiManager.updateNotificationsList(notifications);
      
      // Load notifications into the notification manager
      this.notificationManager.loadNotifications(notifications);

      // If there are favorites, load weather data for them and display the first one
      if (favorites.length > 0) {
        this.uiManager.hideWelcome(); // Hide welcome message
        await this.uiManager.loadFavoritesWeatherData(favorites);
        
        // Auto-select the first favorite location
        const firstFavorite = favorites[0];
        await this.selectLocation(firstFavorite);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.uiManager.showError('Failed to load saved data');
    }
  }

  /**
   * Search for weather by city name
   */
  private async searchWeather(city: string): Promise<void> {
    if (!city || city.trim().length === 0) {
      this.uiManager.showError('Please enter a city name');
      return;
    }

    try {
      this.uiManager.showLoading();
      
      // Validate input: must contain at least one letter and no only spaces
      const trimmedCity = city.trim();
      if (!/[a-zA-Z]/.test(trimmedCity)) {
        throw new Error('City name must contain letters');
      }

      const [weatherResult, forecastResult] = await Promise.all([
        weatherService.getWeatherByCity(trimmedCity),
        weatherService.getForecastByCity(trimmedCity)
      ]);

      this.currentWeather = weatherResult.weather;
      this.currentForecast = forecastResult.forecast;
      this.currentLocation = Location.fromWeatherData(weatherResult.originalData);

      this.uiManager.displayWeather(weatherResult.weather, forecastResult.forecast, this.currentLocation);
      this.uiManager.hideLoading();
      this.uiManager.hideWelcome();

    } catch (error) {
      this.uiManager.hideLoading();
      
      if (error instanceof Error) {
        this.uiManager.showError(error.message);
      } else {
        this.uiManager.showError('Failed to fetch weather data');
      }
      
      console.error('Weather search error:', error);
    }
  }

  /**
   * Select a location from favorites
   */
  private async selectLocation(location: Location): Promise<void> {
    try {
      this.uiManager.showLoading();
      
      const [weatherResult, forecastResult] = await Promise.all([
        weatherService.getWeatherByCoordinates(location.lat, location.lon),
        weatherService.getForecastByCoordinates(location.lat, location.lon)
      ]);

      this.currentWeather = weatherResult.weather;
      this.currentForecast = forecastResult.forecast;
      this.currentLocation = location;

      this.uiManager.displayWeather(weatherResult.weather, forecastResult.forecast, location);
      this.uiManager.hideLoading();
      this.uiManager.hideWelcome();

    } catch (error) {
      this.uiManager.hideLoading();
      this.uiManager.showError('Failed to fetch weather data for selected location');
      console.error('Location selection error:', error);
    }
  }

  /**
   * Add current location to favorites
   */
  private addToFavorites(location: Location): void {
    try {
      storageService.addFavorite(location);
      const favorites = storageService.getFavorites();
      this.uiManager.updateFavoritesList(favorites);
      this.uiManager.updateFavoriteButton(location, true);
    } catch (error) {
      this.uiManager.showError('Failed to add location to favorites');
      console.error('Add to favorites error:', error);
    }
  }

  /**
   * Remove location from favorites
   */
  private removeFromFavorites(locationId: string): void {
    try {
      storageService.removeFavorite(locationId);
      const favorites = storageService.getFavorites();
      this.uiManager.updateFavoritesList(favorites);
      
      // Update favorite button if this is the current location
      if (this.currentLocation && this.currentLocation.id === locationId) {
        this.uiManager.updateFavoriteButton(this.currentLocation, false);
      }
    } catch (error) {
      this.uiManager.showError('Failed to remove location from favorites');
      console.error('Remove from favorites error:', error);
    }
  }

  /**
   * Create a new notification
   */
  private async createNotification(location: Location, rules: NotificationRule[]): Promise<void> {
    try {
      const notification = storageService.addNotification(location, rules);
      const notifications = storageService.getNotifications();
      
      this.uiManager.updateNotificationsList(notifications);
      this.uiManager.hideNotificationForm();
      this.notificationManager.addNotification(notification);
      
      // Show success message
      this.uiManager.showSuccessMessage('Notification created successfully');
    } catch (error) {
      this.uiManager.showError('Failed to create notification');
      console.error('Create notification error:', error);
    }
  }

  /**
   * Toggle notification active status
   */
  private toggleNotification(notificationId: string, isActive: boolean): void {
    try {
      storageService.updateNotificationStatus(notificationId, isActive);
      const notifications = storageService.getNotifications();
      this.uiManager.updateNotificationsList(notifications);
      this.notificationManager.loadNotifications(notifications);
    } catch (error) {
      this.uiManager.showError('Failed to update notification status');
      console.error('Toggle notification error:', error);
    }
  }

  /**
   * Remove a notification
   */
  private removeNotification(notificationId: string): void {
    try {
      storageService.removeNotification(notificationId);
      const notifications = storageService.getNotifications();
      this.uiManager.updateNotificationsList(notifications);
      this.notificationManager.removeNotification(notificationId);
    } catch (error) {
      this.uiManager.showError('Failed to remove notification');
      console.error('Remove notification error:', error);
    }
  }

  /**
   * Handle tab switching
   */
  private handleTabSwitch(tabId: string): void {
    switch (tabId) {
      case 'favorites': {
        const favorites = storageService.getFavorites();
        this.uiManager.updateFavoritesList(favorites);
        break;
      }
      case 'notifications': {
        const notifications = storageService.getNotifications();
        this.uiManager.updateNotificationsList(notifications);
        break;
      }
      default:
        console.warn(`Unknown tab: ${tabId}`);
    }
  }

  /**
   * Edit a notification
   */
  private editNotification(notificationId: string): void {
    try {
      const notifications = storageService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        this.uiManager.populateNotificationForm(notification);
      } else {
        this.uiManager.showError('Notification not found');
      }
    } catch (error) {
      this.uiManager.showError('Failed to load notification for editing');
      console.error('Edit notification error:', error);
    }
  }

  /**
   * Update an existing notification
   */
  private async updateNotification(notificationId: string, rules: NotificationRule[]): Promise<void> {
    try {
      storageService.updateNotification(notificationId, rules);
      const notifications = storageService.getNotifications();
      
      this.uiManager.updateNotificationsList(notifications);
      this.notificationManager.loadNotifications(notifications);
      
      // Show success message
      this.uiManager.showSuccessMessage('Notification updated successfully');
    } catch (error) {
      this.uiManager.showError('Failed to update notification');
      console.error('Update notification error:', error);
    }
  }

  /**
   * Get application statistics for debugging
   */
  public getStats(): object {
    return {
      currentWeather: !!this.currentWeather,
      currentLocation: !!this.currentLocation,
      favorites: storageService.getStorageStats().favorites,
      notifications: storageService.getStorageStats().notifications,
      notificationManagerActive: this.notificationManager.isActive(),
    };
  }

  /**
   * Cleanup resources when app is destroyed
   */
  public destroy(): void {
    this.notificationManager.stopChecking();
    this.uiManager.cleanup();
  }
} 