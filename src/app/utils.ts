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
                return new BABYLON.Color3(v, q, p);
        }
    }
}