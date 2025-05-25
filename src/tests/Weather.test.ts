import { describe, it, expect } from 'vitest';
import { Weather, Forecast } from '../models/Weather.js';
import type { WeatherApiResponse, ForecastApiResponse } from '../models/interfaces.js';

describe('Weather Class', () => {
  const mockWeatherData: WeatherApiResponse = {
    coord: { lat: 51.5074, lon: -0.1278 },
    weather: [
      {
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }
    ],
    base: 'stations',
    main: {
      temp: 22.5,
      feels_like: 24.1,
      temp_min: 20.0,
      temp_max: 25.0,
      pressure: 1013,
      humidity: 65
    },
    visibility: 10000,
    wind: {
      speed: 3.5,
      deg: 180
    },
    clouds: { all: 0 },
    dt: 1609459200, // January 1, 2021 00:00:00 UTC
    sys: {
      type: 1,
      id: 1414,
      country: 'GB',
      sunrise: 1609459200,
      sunset: 1609495200
    },
    timezone: 0,
    id: 2643743,
    name: 'London',
    cod: 200
  };

  it('should create a Weather instance with valid data', () => {
    const weather = new Weather(mockWeatherData);

    expect(weather.temperature).toBe(22.5);
    expect(weather.feelsLike).toBe(24.1);
    expect(weather.humidity).toBe(65);
    expect(weather.pressure).toBe(1013);
    expect(weather.windSpeed).toBe(3.5);
    expect(weather.windDirection).toBe(180);
    expect(weather.conditions).toBe('Clear');
    expect(weather.description).toBe('clear sky');
    expect(weather.icon).toBe('01d');
    expect(weather.cityName).toBe('London');
    expect(weather.country).toBe('GB');
  });

  it('should throw error with invalid weather data', () => {
    expect(() => new Weather(null as any)).toThrow('Invalid weather data provided');
    expect(() => new Weather({} as any)).toThrow('Invalid weather data provided');
    expect(() => new Weather({ main: null } as any)).toThrow('Invalid weather data provided');
  });

  it('should format dates correctly', () => {
    const weather = new Weather(mockWeatherData);
    
    expect(weather.getFormattedDate()).toMatch(/Friday, January 1, 2021/);
    expect(weather.getFormattedTime()).toMatch(/\d{1,2}:\d{2} [AP]M/);
    expect(weather.getFormattedSunrise()).toMatch(/\d{1,2}:\d{2} [AP]M/);
    expect(weather.getFormattedSunset()).toMatch(/\d{1,2}:\d{2} [AP]M/);
  });

  it('should generate correct icon URL', () => {
    const weather = new Weather(mockWeatherData);
    expect(weather.getIconUrl()).toBe('https://openweathermap.org/img/wn/01d@2x.png');
  });

  it('should get wind direction as compass', () => {
    const weather = new Weather(mockWeatherData);
    expect(weather.getWindDirection()).toBe('S'); // 180 degrees = South
  });

  it('should round temperatures to 1 decimal place', () => {
    const dataWithPreciseTemp = {
      ...mockWeatherData,
      main: {
        ...mockWeatherData.main,
        temp: 22.567,
        feels_like: 24.123
      }
    };
    
    const weather = new Weather(dataWithPreciseTemp);
    expect(weather.temperature).toBe(22.6);
    expect(weather.feelsLike).toBe(24.1);
  });

  it('should handle coordinates correctly', () => {
    const weather = new Weather(mockWeatherData);
    const coords = weather.coordinates;
    
    expect(coords.lat).toBe(51.5074);
    expect(coords.lon).toBe(-0.1278);
    
    // Should return a copy, not the original
    coords.lat = 0;
    expect(weather.coordinates.lat).toBe(51.5074);
  });

  it('should convert to JSON correctly', () => {
    const weather = new Weather(mockWeatherData);
    const json = weather.toJSON();
    
    expect(json).toHaveProperty('temperature', 22.5);
    expect(json).toHaveProperty('cityName', 'London');
    expect(json).toHaveProperty('coordinates');
  });
});

describe('Forecast Class', () => {
  const mockForecastData: ForecastApiResponse = {
    cod: '200',
    message: 0,
    cnt: 5,
    list: [
      {
        dt: 1609459200,
        main: {
          temp: 20.0,
          feels_like: 18.5,
          temp_min: 18.0,
          temp_max: 22.0,
          pressure: 1013,
          humidity: 70
        },
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        clouds: { all: 0 },
        wind: { speed: 2.5, deg: 180 },
        visibility: 10000,
        pop: 0,
        sys: { pod: 'd' },
        dt_txt: '2021-01-01 12:00:00'
      }
    ],
    city: {
      id: 2643743,
      name: 'London',
      coord: { lat: 51.5074, lon: -0.1278 },
      country: 'GB',
      population: 8982000,
      timezone: 0,
      sunrise: 1609459200,
      sunset: 1609495200
    }
  };

  it('should create a Forecast instance with valid data', () => {
    const forecast = new Forecast(mockForecastData);

    expect(forecast.city).toBe('London');
    expect(forecast.country).toBe('GB');
    expect(forecast.items).toHaveLength(1);
  });

  it('should throw error with invalid forecast data', () => {
    expect(() => new Forecast(null as any)).toThrow('Invalid forecast data provided');
    expect(() => new Forecast({} as any)).toThrow('Invalid forecast data provided');
    expect(() => new Forecast({ list: [] } as any)).toThrow('Invalid forecast data provided');
  });

  it('should get daily forecast correctly', () => {
    const forecast = new Forecast(mockForecastData);
    const daily = forecast.getDailyForecast();
    
    expect(daily).toHaveLength(1);
    expect(daily[0].dt).toBe(1609459200);
  });

  it('should format temperature correctly', () => {
    const temp = Forecast.getFormattedTemp(mockForecastData.list[0]);
    expect(temp).toBe('20°C');
  });

  it('should format date correctly', () => {
    const date = Forecast.getFormattedDate(mockForecastData.list[0]);
    expect(date).toMatch(/Fri, Jan 1/);
  });

  it('should return copy of items array', () => {
    const forecast = new Forecast(mockForecastData);
    const items = forecast.items;
    
    items.push({} as any);
    expect(forecast.items).toHaveLength(1); // Original should be unchanged
  });
}); 