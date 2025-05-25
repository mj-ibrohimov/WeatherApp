import type { WeatherApiResponse, ForecastApiResponse, ForecastItemData } from './interfaces.js';

/**
 * Weather class representing current weather conditions
 * Implements the Single Responsibility Principle by handling only weather data and operations
 */
export class Weather {
  private readonly _temperature: number;
  private readonly _feelsLike: number;
  private readonly _minTemperature: number;
  private readonly _maxTemperature: number;
  private readonly _humidity: number;
  private readonly _pressure: number;
  private readonly _windSpeed: number;
  private readonly _windDirection: number;
  private readonly _conditions: string;
  private readonly _description: string;
  private readonly _icon: string;
  private readonly _cityName: string;
  private readonly _country: string;
  private readonly _coordinates: { lat: number; lon: number };
  private readonly _date: Date;
  private readonly _sunrise: Date;
  private readonly _sunset: Date;

  constructor(data: WeatherApiResponse) {
    // Validate required data
    if (!data || !data.main || !data.weather || data.weather.length === 0) {
      throw new Error('Invalid weather data provided');
    }

    this._temperature = Math.round(data.main.temp * 10) / 10;
    this._feelsLike = Math.round(data.main.feels_like * 10) / 10;
    this._minTemperature = Math.round(data.main.temp_min * 10) / 10;
    this._maxTemperature = Math.round(data.main.temp_max * 10) / 10;
    this._humidity = data.main.humidity;
    this._pressure = data.main.pressure;
    this._windSpeed = data.wind.speed;
    this._windDirection = data.wind.deg;
    this._conditions = data.weather[0].main;
    this._description = data.weather[0].description;
    this._icon = data.weather[0].icon;
    this._cityName = data.name;
    this._country = data.sys.country;
    this._coordinates = { lat: data.coord.lat, lon: data.coord.lon };
    this._date = new Date(data.dt * 1000);
    this._sunrise = new Date(data.sys.sunrise * 1000);
    this._sunset = new Date(data.sys.sunset * 1000);
  }

  // Getters for encapsulation
  get temperature(): number { return this._temperature; }
  get feelsLike(): number { return this._feelsLike; }
  get minTemperature(): number { return this._minTemperature; }
  get maxTemperature(): number { return this._maxTemperature; }
  get humidity(): number { return this._humidity; }
  get pressure(): number { return this._pressure; }
  get windSpeed(): number { return this._windSpeed; }
  get windDirection(): number { return this._windDirection; }
  get conditions(): string { return this._conditions; }
  get description(): string { return this._description; }
  get icon(): string { return this._icon; }
  get cityName(): string { return this._cityName; }
  get country(): string { return this._country; }
  get coordinates(): { lat: number; lon: number } { return { ...this._coordinates }; }
  get date(): Date { return new Date(this._date); }
  get sunrise(): Date { return new Date(this._sunrise); }
  get sunset(): Date { return new Date(this._sunset); }

  /**
   * Get formatted date string
   */
  public getFormattedDate(): string {
    return this._date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get formatted time string
   */
  public getFormattedTime(): string {
    return this._date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get formatted sunrise time
   */
  public getFormattedSunrise(): string {
    return this._sunrise.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get formatted sunset time
   */
  public getFormattedSunset(): string {
    return this._sunset.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get weather icon URL
   */
  public getIconUrl(): string {
    return `https://openweathermap.org/img/wn/${this._icon}@2x.png`;
  }

  /**
   * Get wind direction as compass direction
   */
  public getWindDirection(): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(this._windDirection / 22.5) % 16;
    return directions[index];
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): object {
    return {
      temperature: this._temperature,
      feelsLike: this._feelsLike,
      minTemperature: this._minTemperature,
      maxTemperature: this._maxTemperature,
      humidity: this._humidity,
      pressure: this._pressure,
      windSpeed: this._windSpeed,
      windDirection: this._windDirection,
      conditions: this._conditions,
      description: this._description,
      icon: this._icon,
      cityName: this._cityName,
      country: this._country,
      coordinates: this._coordinates,
      date: this._date.toISOString(),
      sunrise: this._sunrise.toISOString(),
      sunset: this._sunset.toISOString(),
    };
  }
}

/**
 * Forecast class representing weather forecast data
 */
export class Forecast {
  private readonly _items: ForecastItemData[];
  private readonly _city: string;
  private readonly _country: string;

  constructor(data: ForecastApiResponse) {
    if (!data || !data.list || data.list.length === 0) {
      throw new Error('Invalid forecast data provided');
    }

    this._items = data.list;
    this._city = data.city.name;
    this._country = data.city.country;
  }

  get items(): ForecastItemData[] { return [...this._items]; }
  get city(): string { return this._city; }
  get country(): string { return this._country; }

  /**
   * Get daily forecast (one item per day, preferring midday times)
   */
  public getDailyForecast(): ForecastItemData[] {
    const dailyForecasts: ForecastItemData[] = [];
    const processedDates = new Set<string>();

    for (const item of this._items) {
      const date = new Date(item.dt * 1000);
      const dateString = date.toDateString();
      const hour = date.getHours();

      // Skip the first day if it's already late in the day (past 18:00)
      if (dailyForecasts.length === 0) {
        const now = new Date();
        if (date.toDateString() === now.toDateString() && hour < 6) {
          continue; // Skip very early hours of today
        }
      }

      // Get one forecast per day, preferring midday times (9-18)
      if (!processedDates.has(dateString)) {
        // Prefer times between 9 AM and 6 PM for better representation
        if (hour >= 9 && hour <= 18) {
          dailyForecasts.push(item);
          processedDates.add(dateString);
        } else if (processedDates.size === 0 || 
                   !Array.from(processedDates).some(processedDate => 
                     new Date(processedDate).toDateString() === dateString)) {
          // If no better time is available, take any time for this date
          dailyForecasts.push(item);
          processedDates.add(dateString);
        }
      }

      // Limit to 5 days
      if (dailyForecasts.length >= 5) break;
    }

    return dailyForecasts;
  }

  /**
   * Get formatted temperature for forecast item
   */
  public static getFormattedTemp(item: ForecastItemData): string {
    return `${Math.round(item.main.temp)}°C`;
  }

  /**
   * Get formatted date for forecast item
   */
  public static getFormattedDate(item: ForecastItemData): string {
    const date = new Date(item.dt * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
} 