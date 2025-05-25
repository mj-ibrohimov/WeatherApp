import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../services/StorageService';
import { Location } from '../models/Location';
import { Notification } from '../models/Notification';
import type { NotificationRule } from '../models/interfaces';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockLocation: Location;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storageService = new StorageService();
    mockLocation = new Location('London', 'GB', 51.5074, -0.1278);
  });

  describe('Favorites Management', () => {
    it('should return empty array when no favorites exist', () => {
      const favorites = storageService.getFavorites();
      expect(favorites).toEqual([]);
    });

    it('should add a favorite location', () => {
      storageService.addFavorite(mockLocation);
      const favorites = storageService.getFavorites();
      
      expect(favorites).toHaveLength(1);
      expect(favorites[0].name).toBe('London');
      expect(favorites[0].country).toBe('GB');
    });

    it('should not add duplicate favorites', () => {
      storageService.addFavorite(mockLocation);
      storageService.addFavorite(mockLocation); // Try to add again
      
      const favorites = storageService.getFavorites();
      expect(favorites).toHaveLength(1);
    });

    it('should remove a favorite location', () => {
      storageService.addFavorite(mockLocation);
      expect(storageService.getFavorites()).toHaveLength(1);
      
      storageService.removeFavorite(mockLocation.id);
      expect(storageService.getFavorites()).toHaveLength(0);
    });

    it('should check if location is favorite', () => {
      expect(storageService.isFavorite(mockLocation.id)).toBe(false);
      
      storageService.addFavorite(mockLocation);
      expect(storageService.isFavorite(mockLocation.id)).toBe(true);
      
      storageService.removeFavorite(mockLocation.id);
      expect(storageService.isFavorite(mockLocation.id)).toBe(false);
    });

    it('should handle corrupted favorites data gracefully', () => {
      localStorage.setItem('weather_favorites', 'invalid json');
      const favorites = storageService.getFavorites();
      expect(favorites).toEqual([]);
    });
  });

  describe('Notifications Management', () => {
    const mockRules: NotificationRule[] = [
      { condition: 'temperature_above', value: 30 }
    ];

    it('should return empty array when no notifications exist', () => {
      const notifications = storageService.getNotifications();
      expect(notifications).toEqual([]);
    });

    it('should add a notification', () => {
      const notification = storageService.addNotification(mockLocation, mockRules);
      
      expect(notification).toBeInstanceOf(Notification);
      expect(notification.location.name).toBe('London');
      expect(notification.rules).toEqual(mockRules);
      
      const notifications = storageService.getNotifications();
      expect(notifications).toHaveLength(1);
    });

    it('should remove a notification', () => {
      const notification = storageService.addNotification(mockLocation, mockRules);
      expect(storageService.getNotifications()).toHaveLength(1);
      
      storageService.removeNotification(notification.id);
      expect(storageService.getNotifications()).toHaveLength(0);
    });

    it('should update notification status', () => {
      const notification = storageService.addNotification(mockLocation, mockRules);
      expect(notification.isActive).toBe(true);
      
      storageService.updateNotificationStatus(notification.id, false);
      const notifications = storageService.getNotifications();
      expect(notifications[0].isActive).toBe(false);
      
      storageService.updateNotificationStatus(notification.id, true);
      const updatedNotifications = storageService.getNotifications();
      expect(updatedNotifications[0].isActive).toBe(true);
    });

    it('should update notification rules', () => {
      const notification = storageService.addNotification(mockLocation, mockRules);
      const newRules: NotificationRule[] = [
        { condition: 'temperature_below', value: 10 }
      ];
      
      storageService.updateNotification(notification.id, newRules);
      const notifications = storageService.getNotifications();
      expect(notifications[0].rules).toEqual(newRules);
    });

    it('should throw error when updating non-existent notification', () => {
      expect(() => {
        storageService.updateNotification('non-existent-id', mockRules);
      }).toThrow('Failed to update notification');
    });

    it('should get notifications for specific location', () => {
      const london = new Location('London', 'GB', 51.5074, -0.1278);
      const paris = new Location('Paris', 'FR', 48.8566, 2.3522);
      
      storageService.addNotification(london, mockRules);
      storageService.addNotification(paris, mockRules);
      
      const londonNotifications = storageService.getNotificationsForLocation(london.id);
      expect(londonNotifications).toHaveLength(1);
      expect(londonNotifications[0].location.name).toBe('London');
    });

    it('should get only active notifications', () => {
      const notification1 = storageService.addNotification(mockLocation, mockRules);
      const notification2 = storageService.addNotification(mockLocation, [{ condition: 'rain' }]);
      
      storageService.updateNotificationStatus(notification1.id, false);
      
      const activeNotifications = storageService.getActiveNotifications();
      expect(activeNotifications).toHaveLength(1);
      expect(activeNotifications[0].id).toBe(notification2.id);
    });

    it('should handle corrupted notifications data gracefully', () => {
      localStorage.setItem('weather_notifications', 'invalid json');
      const notifications = storageService.getNotifications();
      expect(notifications).toEqual([]);
    });
  });

  describe('Storage Management', () => {
    it('should clear all data', () => {
      storageService.addFavorite(mockLocation);
      storageService.addNotification(mockLocation, [{ condition: 'rain' }]);
      
      expect(storageService.getFavorites()).toHaveLength(1);
      expect(storageService.getNotifications()).toHaveLength(1);
      
      storageService.clearAllData();
      
      expect(storageService.getFavorites()).toHaveLength(0);
      expect(storageService.getNotifications()).toHaveLength(0);
    });

    it('should get storage statistics', () => {
      storageService.addFavorite(mockLocation);
      storageService.addNotification(mockLocation, [{ condition: 'rain' }]);
      
      const stats = storageService.getStorageStats();
      expect(stats.favorites).toBe(1);
      expect(stats.notifications).toBe(1);
    });

    it('should check if storage is available', () => {
      expect(storageService.isStorageAvailable()).toBe(true);
    });

    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        storageService.addFavorite(mockLocation);
      }).toThrow('Failed to save favorite location');

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors in getFavorites', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const favorites = storageService.getFavorites();
      expect(favorites).toEqual([]);

      localStorage.getItem = originalGetItem;
    });

    it('should handle localStorage errors in getNotifications', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const notifications = storageService.getNotifications();
      expect(notifications).toEqual([]);

      localStorage.getItem = originalGetItem;
    });

    it('should handle errors in isFavorite check', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const result = storageService.isFavorite('some-id');
      expect(result).toBe(false);

      localStorage.getItem = originalGetItem;
    });

    it('should handle errors in removeFavorite', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        storageService.removeFavorite('some-id');
      }).toThrow('Failed to remove favorite location');

      localStorage.setItem = originalSetItem;
    });

    it('should handle errors in removeNotification', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        storageService.removeNotification('some-id');
      }).toThrow('Failed to remove notification');

      localStorage.setItem = originalSetItem;
    });

    it('should handle errors in updateNotificationStatus', () => {
      const notification = storageService.addNotification(mockLocation, [{ condition: 'rain' }]);
      
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        storageService.updateNotificationStatus(notification.id, false);
      }).toThrow('Failed to update notification status');

      localStorage.setItem = originalSetItem;
    });

    it('should handle errors in clearAllData', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        storageService.clearAllData();
      }).toThrow('Failed to clear storage');

      localStorage.removeItem = originalRemoveItem;
    });
  });
}); 