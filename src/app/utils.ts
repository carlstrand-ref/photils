import * as BABYLON from 'babylonjs';

declare const window: any;

export class Utils {
    static degtorad = Math.PI / 180; // Degree-to-Radian conversion
    static isMobile = navigator.userAgent.indexOf("Mobile") !== -1;
    
    public static colorToCss(color: BABYLON.Color3) : String {    
        return 'rgb( ' + color.r * 255.0 + ', ' + color.g * 255.0 + ', ' + color.b * 255.0 +')';
    }

    public static latLonToXYZ(lat, lon) : BABYLON.Vector3 {        
        const r = 6371; // km                    
        lat = lat * this.degtorad;
        lon = lon * this.degtorad;
        
        let x = r * Math.cos(lat) * Math.cos(lon);
        let y = r * Math.cos(lat) * Math.sin(lon);
        let z = r * Math.sin(lat);

        return new BABYLON.Vector3(x,y,z);
    }

    public static angleFromCoords(lat1, lon1, lat2, lon2) {
        let dLon = (lon2 - lon1)
        let y = Math.sin(dLon) * Math.cos(lat2)
        let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

        let brng = Math.atan2(y, x)
        brng = BABYLON.Tools.ToDegrees(brng);
        brng = (brng + 360) % 360
        brng = 360 - brng

        return brng
    }

    // https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula?answertab=votes#tab-top
    public static getDistanceFromLatLon(lat1,lon1,lat2,lon2) {
        let p = this.degtorad;    // Math.PI / 180
        let c = Math.cos;
        let a = 0.5 - c((lat2 - lat1) * p)/2 + 
                c(lat1 * p) * c(lat2 * p) * 
                (1 - c((lon2 - lon1) * p))/2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
      }

    public static angleBetweenVector3(v1:BABYLON.Vector3, v2:BABYLON.Vector3) {
        let dot = BABYLON.Vector3.Dot(v1, v2);    
        let angle = dot / (v1.length() * v2.length());  
        return BABYLON.Tools.ToDegrees(angle);
    }

    public static angleBetweenVector2(v1:BABYLON.Vector2, v2:BABYLON.Vector2) {
        let dot = BABYLON.Vector2.Dot(v1, v2);    
        let angle = dot / (v1.length() * v2.length());  
        return BABYLON.Tools.ToDegrees(angle);
    }

    public static latLonToEquirectengular(radius:number, coord:{lat: number, lon:number}, center:{lat: number, lon:number}) {        
        let x = radius * coord.lat * Math.cos(center.lat);
        let y = radius * coord.lon;

        return new BABYLON.Vector2(x, y);
    }

    public static hueToColor3(h, s, v) : BABYLON.Color3 {
        if (s === 0 ) {
            return new BABYLON.Color3(v, v, v);
        }

        let hi = Math.floor(h / 60);
        let f = h / 60 - hi;

        let p = v * (1 - s);
        let q = v * (1 - s * f);
        let t = v * (1 - s * (1 - f));

        switch(hi) {
            case 0:
            case 6:
                return new BABYLON.Color3(v, t, p);
            case 1:
                return new BABYLON.Color3(q, v, p);
            case 2:
                return new BABYLON.Color3(p, v, t);
            case 3:
                return new BABYLON.Color3(p, q, v);
            case 4:
                return new BABYLON.Color3(t, p, v);
            case 5:
                return new BABYLON.Color3(v, p, q);
        }
    }

    // https://stackoverflow.com/a/21829819/20838
    // http://w3c.github.io/deviceorientation/spec-source-orientation.html#worked-example
    public static compassHeading(alpha: number, beta: number, gamma: number) : number{
        let _x = beta  ? beta  * this.degtorad : 0; // beta value
        let _y = gamma ? gamma * this.degtorad : 0; // gamma value
        let _z = alpha ? alpha * this.degtorad : 0; // alpha value

        let cX = Math.cos( _x );
        let cY = Math.cos( _y );
        let cZ = Math.cos( _z );
        let sX = Math.sin( _x );
        let sY = Math.sin( _y );
        let sZ = Math.sin( _z );

        // Calculate Vx and Vy components
        let Vx = - cZ * sY - sZ * sX * cY;
        let Vy = - sZ * sY + cZ * sX * cY;

        // Calculate compass heading
        let compassHeading = Math.atan( Vx / Vy );

        // Convert compass heading to use whole unit circle
        if( Vy < 0 ) {
            compassHeading += Math.PI;
        } else if( Vx < 0 ) {
            compassHeading += 2 * Math.PI;
        }

        return compassHeading * ( 180 / Math.PI ); // Compass Heading (in degrees)
    }

    // https://gist.github.com/mikaelbr/0fed772d49fe655186a4e6ef4b270481
    public static getKeyFromUserAgent(ua?) {
        let userAgent = ua || window.navigator.userAgent;
        // IOS uses a special property
        if (userAgent.match(/(iPad|iPhone|iPod)/i)) {
          return 'ios';
        } else if (userAgent.match(/Firefox/i)) {
          return 'firefox';
        } else if (userAgent.match(/Opera/i)) {
          return 'opera';
        } else if (userAgent.match(/Android/i)) {
          if (window.chrome) {
            return 'android_chrome';
          } else {
            return 'android_stock';
          }
        } else {
          return 'unknown';
        }
    }2
}