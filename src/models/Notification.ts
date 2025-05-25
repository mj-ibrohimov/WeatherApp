import type { NotificationRule, NotificationCondition, NotificationData, WeatherApiResponse } from './interfaces';
import { Location } from './Location';

/**
 * Notification class for managing weather alerts
 * Implements business logic for notification conditions and matching
 */
export class Notification {
  private readonly _id: string;
  private readonly _location: Location;
  private readonly _rules: NotificationRule[];
  private _isActive: boolean;
  private readonly _createdAt: Date;

  constructor(location: Location, rules: NotificationRule[]) {
    // Validate input data
    if (!location) {
      throw new Error('Location is required for notification');
    }
    if (!rules || rules.length === 0) {
      throw new Error('At least one notification rule is required');
    }

    // Validate rules
    for (const rule of rules) {
      this.validateRule(rule);
    }

    this._location = location;
    this._rules = [...rules]; // Create a copy to prevent external modification
    this._id = `${location.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._isActive = true;
    this._createdAt = new Date();
  }

  // Getters for encapsulation
  get id(): string { return this._id; }
  get location(): Location { return this._location; }
  get rules(): NotificationRule[] { return [...this._rules]; } // Return copy
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return new Date(this._createdAt); }

  /**
   * Validate a notification rule
   */
  private validateRule(rule: NotificationRule): void {
    const validConditions: NotificationCondition[] = [
      'temperature_above', 'temperature_below', 'rain', 'snow', 'thunderstorm', 'clear'
    ];

    if (!validConditions.includes(rule.condition)) {
      throw new Error(`Invalid notification condition: ${rule.condition}`);
    }

    // Temperature conditions require a value
    if ((rule.condition === 'temperature_above' || rule.condition === 'temperature_below')) {
      if (rule.value === undefined || rule.value === null) {
        throw new Error(`Temperature condition requires a value`);
      }
      if (typeof rule.value !== 'number' || rule.value < -50 || rule.value > 60) {
        throw new Error(`Temperature value must be between -50 and 60 degrees Celsius`);
      }
    }
  }

  /**
   * Check if current weather conditions match notification criteria
   */
  public matchesCondition(weatherData: WeatherApiResponse): boolean {
    if (!this._isActive) {
      return false;
    }

    try {
      for (const rule of this._rules) {
        if (this.checkSingleRule(rule, weatherData)) {
          return true; // Any matching rule triggers the notification
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking notification condition:', error);
      return false;
    }
  }

  /**
   * Check a single notification rule against weather data
   */
  private checkSingleRule(rule: NotificationRule, weatherData: WeatherApiResponse): boolean {
    switch (rule.condition) {
      case 'temperature_above':
        return weatherData.main.temp > (rule.value ?? 0);
        
      case 'temperature_below':
        return weatherData.main.temp < (rule.value ?? 0);
        
      case 'rain':
        return weatherData.weather.some(w => w.main.toLowerCase() === 'rain') || 
               !!weatherData.rain;
        
      case 'snow':
        return weatherData.weather.some(w => w.main.toLowerCase() === 'snow') || 
               !!weatherData.snow;
        
      case 'thunderstorm':
        return weatherData.weather.some(w => w.main.toLowerCase() === 'thunderstorm');
        
      case 'clear':
        return weatherData.weather.some(w => w.main.toLowerCase() === 'clear');
        
      default:
        return false;
    }
  }

  /**
   * Get human-readable description of notification rules
   */
  public getDescription(): string {
    const descriptions = this._rules.map(rule => {
      switch (rule.condition) {
        case 'temperature_above':
          return `Temperature above ${rule.value}°C`;
        case 'temperature_below':
          return `Temperature below ${rule.value}°C`;
        case 'rain':
          return 'Rain';
        case 'snow':
          return 'Snow';
        case 'thunderstorm':
          return 'Thunderstorm';
        case 'clear':
          return 'Clear sky';
        default:
          return String(rule.condition).replace('_', ' ');
      }
    });
    
    return descriptions.join(' OR ');
  }

  /**
   * Get notification message for triggered condition
   */
  public getNotificationMessage(weatherData: WeatherApiResponse): string {
    const temp = Math.round(weatherData.main.temp);
    const conditions = weatherData.weather[0]?.main?.toLowerCase() || 'unknown';

    for (const rule of this._rules) {
      if (this.checkSingleRule(rule, weatherData)) {
        switch (rule.condition) {
          case 'temperature_above':
            return `Temperature is now ${temp}°C, above ${rule.value}°C in ${this._location.getFullName()}`;
          case 'temperature_below':
            return `Temperature is now ${temp}°C, below ${rule.value}°C in ${this._location.getFullName()}`;
          case 'rain':
            return `It's currently raining in ${this._location.getFullName()}`;
          case 'snow':
            return `It's currently snowing in ${this._location.getFullName()}`;
          case 'thunderstorm':
            return `There's a thunderstorm in ${this._location.getFullName()}`;
          case 'clear':
            return `The sky is clear in ${this._location.getFullName()}`;
        }
      }
    }
    
    return `Weather update for ${this._location.getFullName()}`;
  }

  /**
   * Activate the notification
   */
  public activate(): void {
    this._isActive = true;
  }

  /**
   * Deactivate the notification
   */
  public deactivate(): void {
    this._isActive = false;
  }

  /**
   * Toggle notification active state
   */
  public toggle(): void {
    this._isActive = !this._isActive;
  }

  /**
   * Create Notification from stored data
   */
  public static fromData(data: NotificationData): Notification {
    const location = Location.fromData(data.location);
    const notification = new Notification(location, data.rules);
    
    // Restore the original state
    notification._isActive = data.isActive;
    
    return notification;
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): NotificationData {
    return {
      id: this._id,
      location: this._location.toJSON(),
      rules: [...this._rules],
      isActive: this._isActive,
      createdAt: this._createdAt,
    };
  }
} 