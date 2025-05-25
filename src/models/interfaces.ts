/**
 * Weather API interfaces for type safety and data structure definition
 */

export interface WeatherCondition {
  readonly id: number;
  readonly main: string;
  readonly description: string;
  readonly icon: string;
}

export interface Coordinates {
  readonly lat: number;
  readonly lon: number;
}

export interface MainWeatherData {
  readonly temp: number;
  readonly feels_like: number;
  readonly temp_min: number;
  readonly temp_max: number;
  readonly pressure: number;
  readonly humidity: number;
  readonly sea_level?: number;
  readonly grnd_level?: number;
}

export interface WindData {
  readonly speed: number;
  readonly deg: number;
  readonly gust?: number;
}

export interface CloudData {
  readonly all: number;
}

export interface RainData {
  readonly "1h"?: number;
  readonly "3h"?: number;
}

export interface SnowData {
  readonly "1h"?: number;
  readonly "3h"?: number;
}

export interface SystemData {
  readonly type?: number;
  readonly id?: number;
  readonly country: string;
  readonly sunrise: number;
  readonly sunset: number;
}

export interface WeatherApiResponse {
  readonly coord: Coordinates;
  readonly weather: WeatherCondition[];
  readonly base: string;
  readonly main: MainWeatherData;
  readonly visibility: number;
  readonly wind: WindData;
  readonly clouds: CloudData;
  readonly rain?: RainData;
  readonly snow?: SnowData;
  readonly dt: number;
  readonly sys: SystemData;
  readonly timezone: number;
  readonly id: number;
  readonly name: string;
  readonly cod: number;
}

export interface ForecastItemData {
  readonly dt: number;
  readonly main: MainWeatherData;
  readonly weather: WeatherCondition[];
  readonly clouds: CloudData;
  readonly wind: WindData;
  readonly visibility: number;
  readonly pop: number;
  readonly rain?: RainData;
  readonly snow?: SnowData;
  readonly sys: {
    readonly pod: string;
  };
  readonly dt_txt: string;
}

export interface ForecastApiResponse {
  readonly cod: string;
  readonly message: number;
  readonly cnt: number;
  readonly list: ForecastItemData[];
  readonly city: {
    readonly id: number;
    readonly name: string;
    readonly coord: Coordinates;
    readonly country: string;
    readonly population: number;
    readonly timezone: number;
    readonly sunrise: number;
    readonly sunset: number;
  };
}

export type NotificationCondition = 
  | 'temperature_above'
  | 'temperature_below'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'clear';

export interface NotificationRule {
  readonly condition: NotificationCondition;
  readonly value?: number;
}

export interface LocationData {
  readonly name: string;
  readonly country: string;
  readonly lat: number;
  readonly lon: number;
}

export interface NotificationData {
  readonly id: string;
  readonly location: LocationData;
  readonly rules: NotificationRule[];
  readonly isActive: boolean;
  readonly createdAt: Date;
} 