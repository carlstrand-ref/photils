import { AbsoluteDeviceOrientationResult, AbsoluteDeviceOrientationService } from '../absolute-device-orientation.service'
export class CustomFreeCameraDeviceOrientationInput implements BABYLON.ICameraInput<BABYLON.FreeCamera> {
    private _camera: BABYLON.FreeCamera;

    private _screenOrientationAngle: number = 0;
    private _orientation: AbsoluteDeviceOrientationResult;
    private _constantTranform: BABYLON.Quaternion;
    private _screenQuaternion: BABYLON.Quaternion = new BABYLON.Quaternion();

    constructor(private absoluteOrientation: AbsoluteDeviceOrientationService ) {
        absoluteOrientation.deviceOrientationChanged.subscribe((orientation) => {
            console.log("get orientation");
            this._orientation = orientation;
        });

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
        //In certain cases, the attach control is called AFTER orientation was changed,
        //So this is needed.
        this._orientationChanged();
    }

    private _orientationChanged = () => {
        this._screenOrientationAngle = (window.orientation !== undefined ? +window.orientation : (window.screen.orientation && (<any>window.screen.orientation)['angle'] ? (<any>window.screen.orientation).angle : 0));
        this._screenOrientationAngle = -BABYLON.Tools.ToRadians(this._screenOrientationAngle / 2);
        this._screenQuaternion.copyFromFloats(0, Math.sin(this._screenOrientationAngle), 0, Math.cos(this._screenOrientationAngle));
    }

    detachControl(element: BABYLON.Nullable<HTMLElement>) {
        window.removeEventListener("orientationchange", this._orientationChanged);
    }

    public checkInputs() {
        //if no device orientation provided, don't update the rotation.
        //Only testing against alpha under the assumption thatnorientation will never be so exact when set.
        if (!this._orientation || !this._orientation.alpha) return;
        BABYLON.Quaternion.RotationYawPitchRollToRef(
            BABYLON.Tools.ToRadians(this._orientation.alpha * -1),
            BABYLON.Tools.ToRadians(this._orientation.beta),
            -BABYLON.Tools.ToRadians(this._orientation.gamma),
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