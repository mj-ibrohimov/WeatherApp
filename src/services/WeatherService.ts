import type { WeatherApiResponse, ForecastApiResponse } from '../models/interfaces.js';
import { Weather, Forecast } from '../models/Weather.js';

/**
 * Custom error classes for better error handling
 */
export class WeatherApiError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Result type that includes both processed weather and original API data
 */
export interface WeatherResult {
  weather: Weather;
  originalData: WeatherApiResponse;
}

export interface ForecastResult {
  forecast: Forecast;
  originalData: ForecastApiResponse;
}

/**
 * WeatherService class for handling API calls to OpenWeatherMap
 * Implements proper error handling and type safety
 */
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(apiKey: string = 'dd2e48a3c3d534b5f15db5d1115c0732') {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required for WeatherService');
    }
    
    this.apiKey = apiKey.trim();
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Fetch weather data by city name
   */
  public async getWeatherByCity(city: string): Promise<WeatherResult> {
    if (!city || city.trim().length === 0) {
      throw new Error('City name is required');
    }

    const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city.trim())}&units=metric&appid=${this.apiKey}`;
    
    try {
      const response = await this.fetchWithTimeout(url);
      const data = await this.handleResponse<WeatherApiResponse>(response);
      const weather = new Weather(data);
      return { weather, originalData: data };
    } catch (error) {
      this.handleError(error, `fetching weather for city: ${city}`);
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Fetch weather data by coordinates
   */
  public async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherResult> {
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (lon < -180 || lon > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    
    try {
      const response = await this.fetchWithTimeout(url);
      const data = await this.handleResponse<WeatherApiResponse>(response);
      const weather = new Weather(data);
      return { weather, originalData: data };
    } catch (error) {
      this.handleError(error, `fetching weather for coordinates: ${lat}, ${lon}`);
      throw error;
    }
  }

  /**
   * Fetch forecast data by city name
   */
  public async getForecastByCity(city: string): Promise<ForecastResult> {
    if (!city || city.trim().length === 0) {
      throw new Error('City name is required');
    }

    const url = `${this.baseUrl}/forecast?q=${encodeURIComponent(city.trim())}&units=metric&appid=${this.apiKey}`;
    
    try {
      const response = await this.fetchWithTimeout(url);
      const data = await this.handleResponse<ForecastApiResponse>(response);
      const forecast = new Forecast(data);
      return { forecast, originalData: data };
    } catch (error) {
      this.handleError(error, `fetching forecast for city: ${city}`);
      throw error;
    }
  }

  /**
   * Fetch forecast data by coordinates
   */
  public async getForecastByCoordinates(lat: number, lon: number): Promise<ForecastResult> {
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (lon < -180 || lon > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    
    try {
      const response = await this.fetchWithTimeout(url);
      const data = await this.handleResponse<ForecastApiResponse>(response);
      const forecast = new Forecast(data);
      return { forecast, originalData: data };
    } catch (error) {
      this.handleError(error, `fetching forecast for coordinates: ${lat}, ${lon}`);
      throw error;
    }
  }

  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout - please check your internet connection');
      }
      throw new NetworkError('Network error - please check your internet connection');
    }
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If we can't parse the error response, use the default message
      }

      switch (response.status) {
        case 401:
          throw new WeatherApiError('Invalid API key', 401);
        case 404:
          throw new WeatherApiError('Location not found', 404);
        case 429:
          throw new WeatherApiError('API rate limit exceeded', 429);
        case 500:
        case 502:
        case 503:
          throw new WeatherApiError('Weather service temporarily unavailable', response.status);
        default:
          throw new WeatherApiError(errorMessage, response.status);
      }
    }

    try {
      return await response.json() as T;
    } catch (error) {
      throw new WeatherApiError('Invalid response format from weather service');
    }
  }

  /**
   * Handle and log errors
   */
  private handleError(error: unknown, context: string): void {
    console.error(`WeatherService error while ${context}:`, error);
    
    // You could add more sophisticated error reporting here
    // such as sending to an error tracking service
  }

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.getWeatherByCity('London');
      return true;
    } catch {
      return false;
    }
  }
}

// Create and export a singleton instance
export const weatherService = new WeatherService();
export default weatherService; 