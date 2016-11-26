/**
 * Created by bernatmir on 26/11/16.
 */
angular.module('modulosCities').controller('NavbarController', ['$http', '$scope', function ($http, $scope) {
    $scope.navbarClick =function () {
        console.log('clicked');
        document.getElementById("bg").style.display = "none";
    }
    $scope.init = function () {
        document.getElementById("bg").style.display = "inline";
    }
}]);