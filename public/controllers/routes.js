angular.module('modulosCities', ['ngRoute'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider

            .when('/rsa', {
                templateUrl: 'templates/pages/rsaModule.html',
                controller:'RsaController'})
            .when('/blind', {
                templateUrl: 'templates/pages/blind.html',
                controller:'BlindController'})
            .when('/paillier', {
                templateUrl: 'templates/pages/paillier.html',
                controller:'PaillierController'})
            .when('/threshold', {
                templateUrl: 'templates/pages/threshold.html',
                controller:'ThresholdController'})
            .when('/repudiation', {
                templateUrl: 'templates/pages/repudiation.html',
                controller:'RepudiationController'})
    }]);
