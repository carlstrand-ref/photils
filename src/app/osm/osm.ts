import * as Leaflet from 'leaflet';

export class OSMProvider { 
  public static DEFAULT_LAT_LNG: Array<number> = [52.5200, 13.4050];
  public static OSM_TILE_API: string = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  private static OSM_API_KEY: string = null;

  public map: Leaflet.Map;
  public readonly enableHighAccuracy: boolean;
  public readonly zoomLevel: number;

  constructor(options?: any) {
    // Parse object configuration
    this.enableHighAccuracy = options && options.enableHighAccuracy || true;
    this.zoomLevel = options && options.zoomLevel || 14;
  }

  public async initialize(domElement: string, marker: boolean = false): Promise<any> {
    return new Promise((resolve) => {
        // Get current gps position, use defaults if rejected
       this.getDevicePosition({
          enableHighAccuracy: this.enableHighAccuracy,
          timeout: null,
          maximumAge: null
        }).then(devicePosition => {
          // Convert device position into leaflet gps type
          const position = <Leaflet.LatLngExpression> [devicePosition.coords.latitude, devicePosition.coords.longitude];
          // Setup map
          this.setup(domElement, position, marker);
          // Resolve promise
          resolve();
        }).catch(() => {
          // Convert device position into leaflet gps type
          const position = <Leaflet.LatLngExpression> OSMProvider.DEFAULT_LAT_LNG;
          // Setup map
          this.setup(domElement, position, marker);
          // Resolve promise
          resolve();
        })
    });
  }

  private setup(element: string, position: Leaflet.LatLngExpression, setMarker: boolean) {
    // Init map object
    this.initializeMap(element, position);
    // Add map layer to map object
    this.loadMapTiles();
    // Add marker
    if(setMarker) this.setMarkerAtLocation(position);
  }

  private initializeMap(element: string, center: Leaflet.LatLngExpression) {
    // Create map container instance
    this.map = Leaflet.map(element);
    // Set map center at detected gps position, use defaults if permission not given
    this.map.setView(center, this.zoomLevel);
  }

  private loadMapTiles() {
    // Fetch map data from API
    Leaflet.tileLayer(OSMProvider.OSM_TILE_API, {
      attribution: 'Map data provided by OpenStreetMap'
    }).addTo(this.map);
  }

  private setMarkerAtLocation(location: Leaflet.LatLngExpression) {
    // Set a marker at the current map center
    Leaflet.marker(location).addTo(this.map);
  }

  private getDevicePosition(options?: PositionOptions): Promise<any> {
    if(navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    }
  }
}
