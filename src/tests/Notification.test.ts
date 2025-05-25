import { describe, it, expect } from 'vitest';
import { Notification } from '../models/Notification';
import { Location } from '../models/Location';
import type { NotificationRule, WeatherApiResponse } from '../models/interfaces';

describe('Notification Class', () => {
  const mockLocation = new Location('London', 'GB', 51.5074, -0.1278);
  
  const mockWeatherData: WeatherApiResponse = {
    coord: { lat: 51.5074, lon: -0.1278 },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    base: 'stations',
    main: { temp: 25.0, feels_like: 27.0, temp_min: 22.0, temp_max: 28.0, pressure: 1013, humidity: 65 },
    visibility: 10000,
    wind: { speed: 3.5, deg: 180 },
    clouds: { all: 0 },
    dt: 1609459200,
    sys: { type: 1, id: 1414, country: 'GB', sunrise: 1609459200, sunset: 1609495200 },
    timezone: 0,
    id: 2643743,
    name: 'London',
    cod: 200
  };

  it('should create a Notification instance with valid data', () => {
    const rules: NotificationRule[] = [
      { condition: 'temperature_above', value: 30 }
    ];
    
    const notification = new Notification(mockLocation, rules);
    
    expect(notification.location).toBe(mockLocation);
    expect(notification.rules).toEqual(rules);
    expect(notification.isActive).toBe(true);
    expect(notification.id).toBeDefined();
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  it('should throw error with invalid data', () => {
    const rules: NotificationRule[] = [
      { condition: 'temperature_above', value: 30 }
    ];

    expect(() => new Notification(null as any, rules)).toThrow('Location is required for notification');
    expect(() => new Notification(mockLocation, [])).toThrow('At least one notification rule is required');
    expect(() => new Notification(mockLocation, null as any)).toThrow('At least one notification rule is required');
  });

  it('should validate temperature rules', () => {
    expect(() => new Notification(mockLocation, [
      { condition: 'temperature_above', value: undefined as any }
    ])).toThrow('Temperature condition requires a value');

    expect(() => new Notification(mockLocation, [
      { condition: 'temperature_below', value: -60 }
    ])).toThrow('Temperature value must be between -50 and 60 degrees Celsius');

    expect(() => new Notification(mockLocation, [
      { condition: 'temperature_above', value: 70 }
    ])).toThrow('Temperature value must be between -50 and 60 degrees Celsius');
  });

  it('should validate notification conditions', () => {
    expect(() => new Notification(mockLocation, [
      { condition: 'invalid_condition' as any }
    ])).toThrow('Invalid notification condition: invalid_condition');
  });

  it('should match temperature above condition', () => {
    const rules: NotificationRule[] = [
      { condition: 'temperature_above', value: 20 }
    ];
    const notification = new Notification(mockLocation, rules);
    
    expect(notification.matchesCondition(mockWeatherData)).toBe(true); // 25 > 20
    
    const coldWeather = { ...mockWeatherData, main: { ...mockWeatherData.main, temp: 15 } };
    expect(notification.matchesCondition(coldWeather)).toBe(false); // 15 < 20
  });

  it('should match temperature below condition', () => {
    const rules: NotificationRule[] = [
      { condition: 'temperature_below', value: 30 }
    ];
    const notification = new Notification(mockLocation, rules);
    
    expect(notification.matchesCondition(mockWeatherData)).toBe(true); // 25 < 30
    
    const hotWeather = { ...mockWeatherData, main: { ...mockWeatherData.main, temp: 35 } };
    expect(notification.matchesCondition(hotWeather)).toBe(false); // 35 > 30
  });

  it('should match rain condition', () => {
    const rules: NotificationRule[] = [
      { condition: 'rain' }
    ];
    const notification = new Notification(mockLocation, rules);
    
    const rainyWeather = {
      ...mockWeatherData,
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
      rain: { '1h': 0.5 }
    };
    
    expect(notification.matchesCondition(rainyWeather)).toBe(true);
    expect(notification.matchesCondition(mockWeatherData)).toBe(false); // Clear weather
  });

  it('should match snow condition', () => {
    const rules: NotificationRule[] = [
      { condition: 'snow' }
    ];
    const notification = new Notification(mockLocation, rules);
    
    const snowyWeather = {
      ...mockWeatherData,
      weather: [{ id: 600, main: 'Snow', description: 'light snow', icon: '13d' }],
      snow: { '1h': 0.5 }
    };
    
    expect(notification.matchesCondition(snowyWeather)).toBe(true);
    expect(notification.matchesCondition(mockWeatherData)).toBe(false); // Clear weather
  });

  it('should match thunderstorm condition', () => {
    const rules: NotificationRule[] = [
      { condition: 'thunderstorm' }
    ];
    const notification = new Notification(mockLocation, rules);
    
    const stormyWeather = {
      ...mockWeatherData,
      weather: [{ id: 200, main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' }]
    };
    
    expect(notification.matchesCondition(stormyWeather)).toBe(true);
    expect(notification.matchesCondition(mockWeatherData)).toBe(false); // Clear weather
  });

  it('should match clear condition', () => {
    const rules: NotificationRule[] = [
      { condition: 'clear' }
    ];
    const notification = new Notification(mockLocation, rules);
    
    expect(notification.matchesCondition(mockWeatherData)).toBe(true); // Clear weather
    
    const cloudyWeather = {
      ...mockWeatherData,
      weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }]
    };
    expect(notification.matchesCondition(cloudyWeather)).toBe(false);
  });

  it('should not match when inactive', () => {
    const rules: NotificationRule[] = [
      { condition: 'temperature_above', value: 20 }
    ];
    const notification = new Notification(mockLocation, rules);
    notification.deactivate();
    
    expect(notification.matchesCondition(mockWeatherData)).toBe(false);
  });

  it('should get correct description for rules', () => {
    const tempAbove = new Notification(mockLocation, [{ condition: 'temperature_above', value: 30 }]);
    expect(tempAbove.getDescription()).toBe('Temperature above 30°C');

    const tempBelow = new Notification(mockLocation, [{ condition: 'temperature_below', value: 10 }]);
    expect(tempBelow.getDescription()).toBe('Temperature below 10°C');

    const rain = new Notification(mockLocation, [{ condition: 'rain' }]);
    expect(rain.getDescription()).toBe('Rain');

    const multiple = new Notification(mockLocation, [
      { condition: 'temperature_above', value: 30 },
      { condition: 'rain' }
    ]);
    expect(multiple.getDescription()).toBe('Temperature above 30°C OR Rain');
  });

  it('should get correct notification messages', () => {
    const tempAbove = new Notification(mockLocation, [{ condition: 'temperature_above', value: 20 }]);
    const message = tempAbove.getNotificationMessage(mockWeatherData);
    expect(message).toBe('Temperature is now 25°C, above 20°C in London, GB');

    const rain = new Notification(mockLocation, [{ condition: 'rain' }]);
    const rainyWeather = {
      ...mockWeatherData,
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
      rain: { '1h': 0.5 }
    };
    const rainMessage = rain.getNotificationMessage(rainyWeather);
    expect(rainMessage).toBe("It's currently raining in London, GB");
  });

  it('should activate and deactivate correctly', () => {
    const notification = new Notification(mockLocation, [{ condition: 'rain' }]);
    
    expect(notification.isActive).toBe(true);
    
    notification.deactivate();
    expect(notification.isActive).toBe(false);
    
    notification.activate();
    expect(notification.isActive).toBe(true);
    
    notification.toggle();
    expect(notification.isActive).toBe(false);
    
    notification.toggle();
    expect(notification.isActive).toBe(true);
  });

  it('should create from stored data', () => {
    const data = {
      id: 'test_id',
      location: mockLocation.toJSON(),
      rules: [{ condition: 'temperature_above' as const, value: 30 }],
      isActive: false,
      createdAt: new Date()
    };

    const notification = Notification.fromData(data);
    expect(notification.location.name).toBe('London');
    expect(notification.rules).toEqual(data.rules);
    expect(notification.isActive).toBe(false);
  });

  it('should convert to JSON correctly', () => {
    const rules: NotificationRule[] = [
      { condition: 'temperature_above', value: 30 }
    ];
    const notification = new Notification(mockLocation, rules);
    
    const json = notification.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('location');
    expect(json).toHaveProperty('rules', rules);
    expect(json).toHaveProperty('isActive', true);
    expect(json).toHaveProperty('createdAt');
  });

  it('should return copies of rules array', () => {
    const rules: NotificationRule[] = [
      { condition: 'temperature_above', value: 30 }
    ];
    const notification = new Notification(mockLocation, rules);
    
    const retrievedRules = notification.rules;
    retrievedRules.push({ condition: 'rain' });
    
    expect(notification.rules).toHaveLength(1); // Original should be unchanged
  });

  it('should handle error in condition checking gracefully', () => {
    const notification = new Notification(mockLocation, [{ condition: 'temperature_above', value: 30 }]);
    
    // Test with malformed weather data
    const result = notification.matchesCondition(null as any);
    expect(result).toBe(false);
  });
}); 