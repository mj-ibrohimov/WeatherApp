import { Notification } from '../models/Notification';
import { Weather } from '../models/Weather';
import weatherService from '../services/WeatherService';

/**
 * NotificationManager class for handling weather notifications
 * Implements periodic weather checking and alert triggering
 */
export class NotificationManager {
  private notifications: Notification[] = [];
  private isChecking = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private callbacks: Array<(notification: Notification, weather: Weather) => void> = [];
  private lastCheckedTimes: Map<string, number> = new Map();
  
  // Check interval: every 5 minutes (300000ms) for demo, normally would be 30 minutes
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  
  // Minimum time between notifications for same location (1 hour)
  private readonly MIN_NOTIFICATION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  constructor() {
    console.log('NotificationManager initialized');
  }

  /**
   * Start checking for notifications periodically
   */
  public startChecking(): void {
    if (this.isChecking) {
      console.log('Notification checking already active');
      return;
    }

    this.isChecking = true;
    console.log('🔔 Notification checking started - will check every 5 minutes');
    
    // Perform initial check
    this.checkNotifications();
    
    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      this.checkNotifications();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop checking for notifications
   */
  public stopChecking(): void {
    this.isChecking = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('🔕 Notification checking stopped');
  }

  /**
   * Check all active notifications against current weather
   */
  private async checkNotifications(): Promise<void> {
    if (!this.isChecking || this.notifications.length === 0) {
      return;
    }

    console.log(`🔍 Checking ${this.notifications.length} notifications...`);

    const activeNotifications = this.notifications.filter(n => n.isActive);
    
    for (const notification of activeNotifications) {
      try {
        await this.checkSingleNotification(notification);
      } catch (error) {
        console.error(`Error checking notification for ${notification.location.name}:`, error);
      }
    }
  }

  /**
   * Check a single notification against current weather
   */
  private async checkSingleNotification(notification: Notification): Promise<void> {
    const location = notification.location;
    const locationKey = `${location.lat},${location.lon}`;
    const now = Date.now();
    
    // Check if we've notified for this location recently
    const lastChecked = this.lastCheckedTimes.get(locationKey) || 0;
    if (now - lastChecked < this.MIN_NOTIFICATION_INTERVAL_MS) {
      return; // Skip to avoid spam
    }

    try {
      // Get current weather for the location
      const weatherResult = await weatherService.getWeatherByCoordinates(
        location.lat, 
        location.lon
      );
      
      // Check if conditions match notification rules
      if (notification.matchesCondition(weatherResult.originalData)) {
        console.log(`🚨 Notification triggered for ${location.name}!`);
        
        // Update last checked time
        this.lastCheckedTimes.set(locationKey, now);
        
        // Trigger callbacks to show notification to user
        this.triggerNotification(notification, weatherResult.weather);
      }
    } catch (error) {
      console.error(`Failed to check weather for ${location.name}:`, error);
    }
  }

  /**
   * Trigger notification callbacks
   */
  private triggerNotification(notification: Notification, weather: Weather): void {
    this.callbacks.forEach(callback => {
      try {
        callback(notification, weather);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  /**
   * Load notifications and start checking
   */
  public loadNotifications(notifications: Notification[]): void {
    this.notifications = [...notifications];
    console.log(`📋 Loaded ${notifications.length} notifications`);
    
    // If we're already checking, restart to include new notifications
    if (this.isChecking) {
      this.checkNotifications();
    }
  }

  /**
   * Add a notification
   */
  public addNotification(notification: Notification): void {
    this.notifications.push(notification);
    console.log(`➕ Added notification for ${notification.location.name}`);
  }

  /**
   * Remove a notification
   */
  public removeNotification(notificationId: string): void {
    const beforeCount = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    const afterCount = this.notifications.length;
    
    if (beforeCount > afterCount) {
      console.log(`➖ Removed notification ${notificationId}`);
    }
  }

  /**
   * Register callback for triggered notifications
   */
  public onNotificationTriggered(callback: (notification: Notification, weather: Weather) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Check if manager is active
   */
  public isActive(): boolean {
    return this.isChecking;
  }

  /**
   * Get notification statistics
   */
  public getStats(): object {
    return {
      totalNotifications: this.notifications.length,
      activeNotifications: this.notifications.filter(n => n.isActive).length,
      isChecking: this.isChecking,
      checkInterval: this.CHECK_INTERVAL_MS / 1000 / 60, // in minutes
      lastCheckedLocations: this.lastCheckedTimes.size
    };
  }

  /**
   * Force check all notifications (for testing)
   */
  public async forceCheck(): Promise<void> {
    console.log('🔄 Force checking all notifications...');
    await this.checkNotifications();
  }
} 