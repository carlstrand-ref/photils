import * as BABYLON from 'babylonjs';

export class Utils {
    public static colorToCss(color: BABYLON.Color3) {    
        return 'rgb( ' + color.r * 255.0 + ', ' + color.g * 255.0 + ', ' + color.b * 255.0 +')';
    }
}