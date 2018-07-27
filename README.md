<p align="center">
<img align="center" src='images/photils-logo.png' />
</p>

<h1 align="center">
photils
</h1>

<h4 align="center">a PWA that features many useful tools for amateur and professional photographers.</h4>


[![Build Status](https://travis-ci.com/scheckmedia/photils.svg?token=yxFcaKcyMQHwPfT6EUy7&branch=master)](https://travis-ci.com/scheckmedia/photils)
[![Website](https://img.shields.io/website-up-down-green-red/http/shields.io.svg?label=try%20photils)](https://dev.photils.app)



## Features

### ![](images/exposure.png) Exposure Calculator

Set your aperture, ISO and exposure time and let this module have your exposure value being calculated.

### ![](images/depth_of_fields.png) Depth of Field Calculator

Use this calculator in order to have your Depth of Field calculated for your specific camera model. Input values for aperture, the focal length of your lens and specify the distance of your object. The Depth of Field and values such as the Hyperfocal distance as well as near and far limit will automatically be calculated. You can also try the interactive demo that meets your input values and simulates objects in the distance.

### ![](images/ar_inspiration.png) AR Inspiration

This module uses the device gyro sensors and camera to overlay markers of snapped pictures in your surrounding area. Click on one of the images to see in which distance it was taken and let your phone navigate you that point of interest.

### ![](images/autotagger.png) Auto Tagger

Take a picture and let the Auto Tagger suggest many Hashtags for your image. There are two modes for the Auto Tagger (changeable under settings), the default and a legacy mode. Sometimes (at the moment all iOS devices) there are problems with the default mode because of missing features or hardware restrictions. If this is the case the application automaticly use the legacy mode as fallback. In the default mode every calculation to extract informations of your image will be executed locally. After this, the calculated feature will be sent to our backend for a keyword lookup. The size of this feature will be ~ 1.2 kB. Unfortunately the default mode requires to download a CNN model which is ~ 100 MB. But it will be cached so that a download just happen once until something change in the CNN model (really rare). The Auto Tagger in legacy mode (an orange warning sign is shown) will send a downsample version of your image (256x256 px) to the backend where the calculation and feature lookup will be executed. The disadvantage of this method is the size of the downsampled image. It tooks ~ 250 kB for a single request. If you are using the Auto Tagger with your cellular data, the default mode is more customer friendly.


## Supported Devices

**Browser Matrix:**

|OS|Browser|![](images/exposure.png)|![](images/depth_of_fields.png)|![](images/ar_inspiration.png)|![](images/autotagger.png)
|---|---|---|---|---|---|
|macOS|Safari|✔️|✔️|️✖️|✔️|
||Chrome|✔️|✔️|️✖️|✔️|
||Firefox|✔️|✔️|️✖️|✔️|
||Opera|✔️|✔️|️✖️|✔️|
|Windows|Chrome|✔️|✔️|️✖️|✔️|
||Firefox|✔️|✔️|️✖️|✔️|
|iOS >= 11.4|Safari|✔️|✔️|️✔️|✔️|
||Chrome|✔️|✔️|️✖️|✔️|
||Firefox|✔️|✔️|️✖️|✔️|
|Android|Chrome|✔️|✔️|️✔️|✔️|
||Firefox|✔️|✔️|️✖️|✔️|

## Contributor

- [Tobias Scheck](https://scheck-media.de)  - [:octocat:](https://github.com/scheckmedia)
- Michél Neumann - [:octocat:](https://github.com/Corrodize)
- [Max Behr](https://maxbehr.de/) - [:octocat:](https://github.com/maxbehr)

## Todo
Find here the things we are still working on and want to accomplish:
 - sun calculator
 - light polution

## Troubleshooting
Found a bug? Use the projects [issue page](https://github.com/scheckmedia/photils/issues) to let us know about it.

## Contributing

Want to contribute to Photils? We're happy to get some help during development. Send us a Pull Request or get in touch.

### Fork it

Fork the project and implement your own modules. We're happy to receive your Pull Request!

## License

[Apache License 2.0](https://github.com/scheckmedia/photils/blob/master/LICENSE.md)
