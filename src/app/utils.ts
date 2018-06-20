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
}