<p align="center">
<img align="center" src='images/photils-logo.png' />
</p>

<h1 align="center">
photils
</h1>

<h4 align="center">a PWA that features many useful tools for amateur and professional photographers.</h4>

## Features

### ![](images/exposure.png) Exposure Calculator

Set your aperture, ISO and exposure time and let this this module have your exposure value being calculated.

### ![](images/depth_of_fields.png) Depth of Field Calculator

Use this calculator in order to have your Depth of Field calculated for your specific camera model. Input values for aperture, the focal length of your lens and specify the distance of your object. The Depth of Field and values such as the Hyperfocal distance as well as the Circle of confusion will automatically be calculated. You can also try the interactive demo that meets your input values and simulates objects in the distance.

### ![](images/ar_inspiration.png) AR Inspiration

This module uses the device gyro sensors and camera to overlay markers of snapped pictures in your surrounding area. Click on one of the images to see in which distance it was taken and let your phone navigate you that point of interest.

### ![](images/autotagger.png) Auto Tagger

Take a picture and let the Auto Tagger suggest many Hashtags for your image.

## Try Photils

You can try the current development state of Photils either on Desktop or your Smartphone under [dev.photils.app](https://dev.photils.app).
Check the following Browser Matrix for availability.

**Browser Matrix:**

|OS|Browser||
|---|---|---|
|macOS|Safari|?|
||Chrome|?|
||Firefox|?|
||Opera|?|
|Windows|Chrome|?|
||Firefox|?|
|iOS|Safari|?|
||Chrome|?|
|Android|Safari|?|
||Chrome|?|
||Firefox|?|

## About

Photils is a project by Tobias Scheck ([scheckmedia](https://github.com/scheckmedia)) and Michél Neumann ([Corrodize](https://github.com/Corrodize)).

## Todo
Find here the things we are still working on and want to accomplish:

[Irgendwelche großen Meilensteine?] 

## Troubleshooting
Found a bug? Use the projects [issue page]() to let us know about it.

## Contributing

Want to contribute to Photils? We're happy to get some help during development. Send us a Pull Request or get in touch via XXXX.

### Fork it

Fork the project and implement your own modules. We're happy to receive your Pull Request!

## Development
#### Certificate (Geolocation)

To test a feature using the clients geolocation, a certificate will be required. In order to create the certificate, follow these steps:

1. Generate a local certificate in some folder:

    ```
    git clone https://github.com/RubenVermeulen/generate-trusted-ssl-certificate.git
    cd generate-trusted-ssl-certificate
    bash generate.sh
    ```

2. Create an ssl folder inside this directory, copy the `server.crt` and `server.key` file into this folder.
Enable ssl for the dev-server with the `angular.json` file.

    ```
    "serve": {
              "builder": "@angular-devkit/build-angular:dev-server",
              "options": {
                "browserTarget": "photils:build",
                "ssl": true,
                "sslKey": "ssl/server.key",
                "sslCert": "ssl/server.crt"
              },
              ...
    ```

3. Start the development server with the following command:

    ```
    ng serve --host 0.0.0.0 --disableHostCheck
    ```
    
## License

[Welche Lizenz? Soll das überhaupt erwähnt werden?]
