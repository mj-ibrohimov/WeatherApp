import type { LocationData, NotificationData, NotificationRule } from '../models/interfaces';
import { Location } from '../models/Location';
import { Notification } from '../models/Notification';

/**
 * StorageService class for managing local storage operations
 * Implements proper error handling and data validation
 */
export class StorageService {
  private readonly favoritesKey = 'weather_favorites';
  private readonly notificationsKey = 'weather_notifications';

  /**
   * Get all favorite locations from storage
   */
  public getFavorites(): Location[] {
    try {
      const data = localStorage.getItem(this.favoritesKey);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data) as LocationData[];
      return parsed.map(locationData => Location.fromData(locationData));
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
      return [];
    }
  }

  /**
   * Add a location to favorites
   */
  public addFavorite(location: Location): void {
    try {
      const favorites = this.getFavorites();
      
      // Check if location already exists
      if (favorites.some(fav => fav.id === location.id)) {
        return; // Already in favorites
      }

      favorites.push(location);
      this.saveFavorites(favorites);
    } catch (error) {
      console.error('Error adding favorite to storage:', error);
      throw new Error('Failed to save favorite location');
    }
  }

  /**
   * Remove a location from favorites
   */
  public removeFavorite(locationId: string): void {
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(location => location.id !== locationId);
      this.saveFavorites(filtered);
    } catch (error) {
      console.error('Error removing favorite from storage:', error);
      throw new Error('Failed to remove favorite location');
    }
  }

  /**
   * Check if a location is in favorites
   */
  public isFavorite(locationId: string): boolean {
    try {
      const favorites = this.getFavorites();
      return favorites.some(location => location.id === locationId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Get all notifications from storage
   */
  public getNotifications(): Notification[] {
    try {
      const data = localStorage.getItem(this.notificationsKey);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data) as NotificationData[];
      return parsed.map(notificationData => Notification.fromData(notificationData));
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
      return [];
    }
  }

  /**
   * Add a notification to storage
   */
  public addNotification(location: Location, rules: NotificationRule[]): Notification {
    try {
      const notifications = this.getNotifications();
      const notification = new Notification(location, rules);
      
      notifications.push(notification);
      this.saveNotifications(notifications);
      
      return notification;
    } catch (error) {
      console.error('Error adding notification to storage:', error);
      throw new Error('Failed to save notification');
    }
  }

  /**
   * Remove a notification from storage
   */
  public removeNotification(notificationId: string): void {
    try {
      const notifications = this.getNotifications();
      const filtered = notifications.filter(notification => notification.id !== notificationId);
      this.saveNotifications(filtered);
    } catch (error) {
      console.error('Error removing notification from storage:', error);
      throw new Error('Failed to remove notification');
    }
  }

  /**
   * Update notification status (active/inactive)
   */
  public updateNotificationStatus(notificationId: string, isActive: boolean): void {
    try {
      const notifications = this.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        if (isActive) {
          notification.activate();
        } else {
          notification.deactivate();
        }
        this.saveNotifications(notifications);
      }
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw new Error('Failed to update notification status');
    }
  }

  /**
   * Update notification rules (creates new notification with updated rules)
   */
  public updateNotification(notificationId: string, rules: NotificationRule[]): void {
    try {
      const notifications = this.getNotifications();
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex !== -1) {
        const oldNotification = notifications[notificationIndex];
        // Create new notification with updated rules but keep the same location and active state
        const newNotification = new Notification(oldNotification.location, rules);
        
        // Restore the active state
        if (!oldNotification.isActive) {
          newNotification.deactivate();
        }
        
        // Replace the old notification with the new one
        notifications[notificationIndex] = newNotification;
        this.saveNotifications(notifications);
      } else {
        throw new Error('Notification not found');
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Failed to update notification');
    }
  }

  /**
   * Get notifications for a specific location
   */
  public getNotificationsForLocation(locationId: string): Notification[] {
    try {
      const notifications = this.getNotifications();
      return notifications.filter(notification => notification.location.id === locationId);
    } catch (error) {
      console.error('Error getting notifications for location:', error);
      return [];
    }
  }

  /**
   * Get only active notifications
   */
  public getActiveNotifications(): Notification[] {
    try {
      const notifications = this.getNotifications();
      return notifications.filter(notification => notification.isActive);
    } catch (error) {
      console.error('Error getting active notifications:', error);
      return [];
    }
  }

  /**
   * Clear all stored data
   */
  public clearAllData(): void {
    try {
      localStorage.removeItem(this.favoritesKey);
      localStorage.removeItem(this.notificationsKey);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): { favorites: number; notifications: number } {
    try {
      const favorites = this.getFavorites();
      const notifications = this.getNotifications();
      
      return {
        favorites: favorites.length,
        notifications: notifications.length,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { favorites: 0, notifications: 0 };
    }
  }

  /**
   * Save favorites to localStorage
   */
  private saveFavorites(favorites: Location[]): void {
    const data = favorites.map(location => location.toJSON());
    localStorage.setItem(this.favoritesKey, JSON.stringify(data));
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotifications(notifications: Notification[]): void {
    const data = notifications.map(notification => notification.toJSON());
    localStorage.setItem(this.notificationsKey, JSON.stringify(data));
  }

  /**
   * Check if localStorage is available
   */
  public isStorageAvailable(): boolean {
    try {
      const test = 'storage_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Create and export a singleton instance
export const storageService = new StorageService();
export default storageService; 