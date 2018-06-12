# Photils

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).



### Required for geolocation:

Generate a local certificate in some folder:
```
git clone https://github.com/RubenVermeulen/generate-trusted-ssl-certificate.git
cd generate-trusted-ssl-certificate
bash generate.sh
```

Create a ssl folder inside this directory, copy the server.crt and server.key file into this folder.
Enable ssl for dev-server with the angular.json file.

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

run dev server with the following command:
```
ng serve --host 0.0.0.0 --disableHostChecks
```

