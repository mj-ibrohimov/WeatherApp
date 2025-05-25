import type { LocationData, WeatherApiResponse } from './interfaces.js';

/**
 * Location class representing a geographical location
 * Implements encapsulation and data validation
 */
export class Location {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _country: string;
  private readonly _lat: number;
  private readonly _lon: number;
  private readonly _createdAt: Date;

  constructor(name: string, country: string, lat: number, lon: number) {
    // Validate input data
    if (!name || name.trim().length === 0) {
      throw new Error('Location name cannot be empty');
    }
    if (!country || country.trim().length === 0) {
      throw new Error('Country cannot be empty');
    }
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (lon < -180 || lon > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    this._name = name.trim();
    this._country = country.trim();
    this._lat = Number(lat.toFixed(4)); // Round to 4 decimal places
    this._lon = Number(lon.toFixed(4));
    this._id = `${this._lat}_${this._lon}`;
    this._createdAt = new Date();
  }

  // Getters for encapsulation
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get country(): string { return this._country; }
  get lat(): number { return this._lat; }
  get lon(): number { return this._lon; }
  get createdAt(): Date { return new Date(this._createdAt); }

  /**
   * Create Location from weather API response
   */
  public static fromWeatherData(weatherData: WeatherApiResponse): Location {
    if (!weatherData || !weatherData.coord || !weatherData.name || !weatherData.sys) {
      throw new Error('Invalid weather data for location creation');
    }

    return new Location(
      weatherData.name,
      weatherData.sys.country,
      weatherData.coord.lat,
      weatherData.coord.lon
    );
  }

  /**
   * Create Location from stored data
   */
  public static fromData(data: LocationData): Location {
    return new Location(data.name, data.country, data.lat, data.lon);
  }

  /**
   * Get full location name (City, Country)
   */
  public getFullName(): string {
    return `${this._name}, ${this._country}`;
  }

  /**
   * Get coordinates as a tuple
   */
  public getCoordinates(): [number, number] {
    return [this._lat, this._lon];
  }

  /**
   * Calculate distance to another location using Haversine formula
   */
  public distanceTo(other: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other._lat - this._lat);
    const dLon = this.toRadians(other._lon - this._lon);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(this._lat)) * Math.cos(this.toRadians(other._lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
  }

  /**
   * Check if this location is the same as another location
   */
  public equals(other: Location): boolean {
    return this._id === other._id;
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): LocationData {
    return {
      name: this._name,
      country: this._country,
      lat: this._lat,
      lon: this._lon,
    };
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return `${this.getFullName()} (${this._lat}, ${this._lon})`;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 