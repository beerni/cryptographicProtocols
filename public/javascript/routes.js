angular.module('modulosCities', ['ngRoute'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider

            .when('/rsa', {
                templateUrl: 'templates/pages/rsaModule.html',
                controller:'RsaController'})
            .when('/blind', {
                templateUrl: 'templates/pages/blind.html',
                controller:'BlindController'})
    }]);
