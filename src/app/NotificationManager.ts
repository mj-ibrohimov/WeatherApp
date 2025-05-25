import { Notification } from '../models/Notification';
import { Weather } from '../models/Weather';

/**
 * NotificationManager class for handling weather notifications
 * Simplified version for core functionality
 */
export class NotificationManager {
  private notifications: Notification[] = [];
  private isChecking = false;
  private callbacks: Array<(notification: Notification, weather: Weather) => void> = [];

  constructor() {
    // Simplified constructor
  }

  /**
   * Start checking for notifications
   */
  public startChecking(): void {
    this.isChecking = true;
    console.log('Notification checking started');
  }

  /**
   * Stop checking for notifications
   */
  public stopChecking(): void {
    this.isChecking = false;
    console.log('Notification checking stopped');
  }

  /**
   * Load notifications
   */
  public loadNotifications(notifications: Notification[]): void {
    this.notifications = [...notifications];
  }

  /**
   * Add a notification
   */
  public addNotification(notification: Notification): void {
    this.notifications.push(notification);
  }

  /**
   * Remove a notification
   */
  public removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
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
} 