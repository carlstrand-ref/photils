import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vector2, Vector3 } from 'babylonjs';
import { Utils } from './utils';

export interface IGeoImage {
    id: number,
    title: string,
    thumbnailUrl: string,
    imageUrl: string,
    detailsUrl: string,
    lat: number,
    long: number,
    views: number,
    thumbnail:Observable<{width: number, height:number}>,
    image:Observable<{width: number, height:number}>
    distance?:number
    position: Vector3;
    equirectengularCoordinates(radius: number, origin:{lat: number, lon:number}):Vector2;
}

export class GeoImage implements IGeoImage {
    public position: Vector3;
    public distance?: number;
    private cache:any = {};

    constructor (public id:number, public title: string, public thumbnailUrl: string,
        public imageUrl:string,public detailsUrl:string, public lat:number, public long: number,
        public views: number, private http: HttpClient) {
            this.position = Utils.latLonToXYZ(lat, long);
        };

    thumbnail = new Observable<{objUrl:string, width: number, height:number}>( observer => {
        if ('thumbnail' in this.cache && this.cache.thumbnail !== null) {
            let t = this.cache.thumbnail;
            observer.next({objUrl: t.src, width: t.width, height: t.height});
            return observer.complete();
        }

        this.http.get(this.thumbnailUrl, { responseType: 'blob' }).subscribe((response) => {
            let data = window.URL.createObjectURL(((response as any).blob()));
            let img = new Image();
            img.src = data;
            img.onload = () => {
                this.cache.thumbnail = img;
                observer.next({objUrl: data, width: img.width, height: img.height});
                observer.complete();
            }

        });
    });

    image = new Observable<{objUrl:string,width: number, height:number}>( observer => {
        if ('image' in this.cache && this.cache.image !== null) {
            let t = this.cache.image;
            observer.next({objUrl: t.src, width: t.width, height: t.height});
            return observer.complete();
        }

        this.http.get(this.imageUrl, { responseType: 'blob' }).subscribe((response) => {
            let data = window.URL.createObjectURL(response);
            let img = new Image();
            img.src = data;
            img.onload = () => {
                this.cache.image = img;
                observer.next({objUrl: data, width: img.width, height: img.height});
                observer.complete();
            }
        });
    });

    equirectengularCoordinates(radius:number, origin:{lat: number, lon:number}) : Vector2 {
        return Utils.latLonToEquirectengular(radius, {lat: this.lat, lon: this.long}, origin);
    }

}

export abstract class GeoImageService {
    abstract getCurrentPage():number;
    abstract getNumPages(): number;
    abstract getTotal(): number;
    abstract getItemsPerPage(): number;
    abstract async getImages(lat: number, long: number, radius: number, page?:number, units?:number) : Promise<Array<IGeoImage>>;
}

enum flickrMethod {
    photoSearch = "flickr.photos.search"
};


export class FlickrImageService extends GeoImageService {
    private baseUrl =  'https://api.flickr.com/services/rest/?method=';
    private _currentPage: number = 1;
    private _numPages: number;
    private _total: number;
    private _itemsPerPage: number = 100;
    public getCurrentPage(): number { return this._currentPage };
    public getNumPages(): number { return this._numPages };
    public getTotal(): number { return this._total };
    public getItemsPerPage() : number { return this._itemsPerPage };

    constructor(private apiKey: string, private http: HttpClient) {
        super();
    };

    private sendRequest(method: flickrMethod, parameters:string) {
        let url = this.baseUrl +
            method +
            '&nojsoncallback=1' +
            '&per_page=' + this._itemsPerPage +
            '&api_key=' + this.apiKey +
            '&format=json&' + parameters;
        return this.http.get(url).toPromise();
    }



    public async getImages(lat: number, lon: number, radius: number, page?:number, units?:number) : Promise<Array<IGeoImage>> {
        this._currentPage = page === undefined ? this._currentPage : page;
        let minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 3);

        return new Promise<Array<IGeoImage>>((resolve, reject) => {
            let parameters = 'lat='+lat+'&lon='+lon + "&radius="+ radius +
                             '&min_taken_date=' + minDate.getTime() / 1000  +
                             '&extras=geo,url_t,url_z,views,path_alias' +
                             '&page='+this._currentPage;

            this.sendRequest(flickrMethod.photoSearch, parameters)
            .then((data: any) => {
                let photos: Array<IGeoImage> = [];
                this._numPages = Number(data.photos.pages);
                this._total = Number(data.photos.total);

                for (let photo of (data as any).photos.photo) {
                    if ( !('url_z' in photo))
                        continue;


                    let details = "https://www.flickr.com/photos/"
                                  + photo.owner + "/" + photo.id

                    let geoImage = new GeoImage(
                        photo.id,
                        photo.title, photo.url_t, photo.url_z, details,
                        Number(photo.latitude), Number(photo.longitude),
                        Number(photo.views), this.http );

                    geoImage.distance = Utils.getDistanceFromLatLon(
                        lat, lon, photo.latitude, photo.longitude
                    );


                    photos.push(geoImage);
                }

                //photos.sort((a, b) => a.views - b.views);
                resolve(photos);
            })
            .catch((e) => reject(e));
        })
    }
}