export class CustomFreeCameraDeviceOrientationInput implements BABYLON.ICameraInput<BABYLON.FreeCamera> {
    private _camera: BABYLON.FreeCamera;

    private _screenOrientationAngle: number = 0;

    private _constantTranform: BABYLON.Quaternion;
    private _screenQuaternion: BABYLON.Quaternion = new BABYLON.Quaternion();

    private _alpha: number = 0;
    private _beta: number = 0;
    private _gamma: number = 0;

    private _initial_alpha: number = 0;
    private _initial_beta: number = 0;
    private _initial_gamma: number = 0;

    constructor(alpha?: number, beta?: number, gamma?: number) {
        this._initial_alpha = alpha;
        this._initial_beta = beta;
        this._initial_gamma = gamma;

        this._constantTranform = new BABYLON.Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        this._orientationChanged();
    }

    public get camera(): BABYLON.FreeCamera {
        return this._camera;
    }

    public set camera(camera: BABYLON.FreeCamera) {
        this._camera = camera;        
        if (this._camera != null && !this._camera.rotationQuaternion) {            
            this._camera.rotationQuaternion = new BABYLON.Quaternion();
        }
    }

    attachControl(element: HTMLElement, noPreventDefault?: boolean) {
        window.addEventListener("orientationchange", this._orientationChanged);
        window.addEventListener("deviceorientation", this._deviceOrientation);
        //In certain cases, the attach control is called AFTER orientation was changed,
        //So this is needed.
        this._orientationChanged();
    }

    private _orientationChanged = () => {
        this._screenOrientationAngle = (window.orientation !== undefined ? +window.orientation : (window.screen.orientation && (<any>window.screen.orientation)['angle'] ? (<any>window.screen.orientation).angle : 0));
        this._screenOrientationAngle = -BABYLON.Tools.ToRadians(this._screenOrientationAngle / 2);
        this._screenQuaternion.copyFromFloats(0, Math.sin(this._screenOrientationAngle), 0, Math.cos(this._screenOrientationAngle));
    }

    private _deviceOrientation = (evt: DeviceOrientationEvent) => {
        this._alpha = evt.alpha !== null ? evt.alpha : 0;
        this._beta = evt.beta !== null ? evt.beta : 0;
        this._gamma = evt.gamma !== null ? evt.gamma : 0;
    }

    detachControl(element: BABYLON.Nullable<HTMLElement>) {
        window.removeEventListener("orientationchange", this._orientationChanged);
        window.removeEventListener("deviceorientation", this._deviceOrientation);
    }

    public checkInputs() {
        //if no device orientation provided, don't update the rotation.
        //Only testing against alpha under the assumption thatnorientation will never be so exact when set.
        if (!this._alpha) return;
        BABYLON.Quaternion.RotationYawPitchRollToRef(
            BABYLON.Tools.ToRadians(this._alpha + this._initial_alpha), 
            BABYLON.Tools.ToRadians(this._beta + this._initial_beta), 
            -BABYLON.Tools.ToRadians(this._gamma + this._initial_gamma), 
            this.camera.rotationQuaternion);
        this._camera.rotationQuaternion.multiplyInPlace(this._screenQuaternion);
        this._camera.rotationQuaternion.multiplyInPlace(this._constantTranform);
        //Mirror on XY Plane
        this._camera.rotationQuaternion.z *= -1;
        this._camera.rotationQuaternion.w *= -1;
    }

    getClassName(): string {
        return "CustomFreeCameraDeviceOrientationInput";
    }

    getSimpleName() {
        return "deviceOrientation";
    }
}

(<any>BABYLON.CameraInputTypes)["CustomFreeCameraDeviceOrientationInput"] = CustomFreeCameraDeviceOrientationInput;