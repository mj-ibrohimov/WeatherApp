import { describe, it, expect } from 'vitest';
import { Location } from '../models/Location';
import type { WeatherApiResponse } from '../models/interfaces';

describe('Location Class', () => {
  it('should create a Location instance with valid data', () => {
    const location = new Location('London', 'GB', 51.5074, -0.1278);

    expect(location.name).toBe('London');
    expect(location.country).toBe('GB');
    expect(location.lat).toBe(51.5074);
    expect(location.lon).toBe(-0.1278);
    expect(location.id).toBe('51.5074_-0.1278');
  });

  it('should throw error with invalid location data', () => {
    expect(() => new Location('', 'GB', 51.5074, -0.1278)).toThrow('Location name cannot be empty');
    expect(() => new Location('London', '', 51.5074, -0.1278)).toThrow('Country cannot be empty');
    expect(() => new Location('London', 'GB', 91, -0.1278)).toThrow('Latitude must be between -90 and 90 degrees');
    expect(() => new Location('London', 'GB', 51.5074, 181)).toThrow('Longitude must be between -180 and 180 degrees');
  });

  it('should trim whitespace from name and country', () => {
    const location = new Location('  London  ', '  GB  ', 51.5074, -0.1278);
    expect(location.name).toBe('London');
    expect(location.country).toBe('GB');
  });

  it('should round coordinates to 4 decimal places', () => {
    const location = new Location('London', 'GB', 51.50741234, -0.12785678);
    expect(location.lat).toBe(51.5074);
    expect(location.lon).toBe(-0.1279);
  });

  it('should create Location from weather data', () => {
    const weatherData: WeatherApiResponse = {
      coord: { lat: 51.5074, lon: -0.1278 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      base: 'stations',
      main: { temp: 22.5, feels_like: 24.1, temp_min: 20.0, temp_max: 25.0, pressure: 1013, humidity: 65 },
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

    const location = Location.fromWeatherData(weatherData);
    expect(location.name).toBe('London');
    expect(location.country).toBe('GB');
    expect(location.lat).toBe(51.5074);
    expect(location.lon).toBe(-0.1278);
  });

  it('should throw error with invalid weather data', () => {
    expect(() => Location.fromWeatherData(null as any)).toThrow('Invalid weather data for location creation');
    expect(() => Location.fromWeatherData({} as any)).toThrow('Invalid weather data for location creation');
  });

  it('should get full name correctly', () => {
    const location = new Location('London', 'GB', 51.5074, -0.1278);
    expect(location.getFullName()).toBe('London, GB');
  });

  it('should get coordinates as tuple', () => {
    const location = new Location('London', 'GB', 51.5074, -0.1278);
    const coords = location.getCoordinates();
    expect(coords).toEqual([51.5074, -0.1278]);
  });

  it('should calculate distance between locations', () => {
    const london = new Location('London', 'GB', 51.5074, -0.1278);
    const paris = new Location('Paris', 'FR', 48.8566, 2.3522);
    
    const distance = london.distanceTo(paris);
    expect(distance).toBeGreaterThan(300); // Approximately 344 km
    expect(distance).toBeLessThan(400);
  });

  it('should check equality correctly', () => {
    const london1 = new Location('London', 'GB', 51.5074, -0.1278);
    const london2 = new Location('London', 'GB', 51.5074, -0.1278);
    const paris = new Location('Paris', 'FR', 48.8566, 2.3522);

    expect(london1.equals(london2)).toBe(true);
    expect(london1.equals(paris)).toBe(false);
  });

  it('should convert to JSON correctly', () => {
    const location = new Location('London', 'GB', 51.5074, -0.1278);
    const json = location.toJSON();

    expect(json).toEqual({
      name: 'London',
      country: 'GB',
      lat: 51.5074,
      lon: -0.1278
    });
  });

  it('should convert to string correctly', () => {
    const location = new Location('London', 'GB', 51.5074, -0.1278);
    expect(location.toString()).toBe('London, GB (51.5074, -0.1278)');
  });

  it('should create from stored data', () => {
    const data = {
      name: 'London',
      country: 'GB',
      lat: 51.5074,
      lon: -0.1278
    };

    const location = Location.fromData(data);
    expect(location.name).toBe('London');
    expect(location.country).toBe('GB');
    expect(location.lat).toBe(51.5074);
    expect(location.lon).toBe(-0.1278);
  });

  it('should have immutable createdAt date', () => {
    const location = new Location('London', 'GB', 51.5074, -0.1278);
    const date1 = location.createdAt;
    const date2 = location.createdAt;
    
    expect(date1).toEqual(date2);
    expect(date1).not.toBe(date2); // Should be different instances
  });
}); 