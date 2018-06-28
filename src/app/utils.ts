import * as BABYLON from 'babylonjs';

export class Utils {
    public static colorToCss(color: BABYLON.Color3) : String {    
        return 'rgb( ' + color.r * 255.0 + ', ' + color.g * 255.0 + ', ' + color.b * 255.0 +')';
    }

    public static latLonToXYZ(lat, lon) : BABYLON.Vector3 {        
        const r = 6378137; // meter                    
        lat = lat * Math.PI / 180.0;
        lon = lon * Math.PI / 180.0;
        
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
}