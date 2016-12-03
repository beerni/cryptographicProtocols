/**
 * Created by bernatmir on 26/11/16.
 */

var url = "https://localhost:8080";
function convertToHex(str) {
    var hex = '';
    for (var i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}
function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
angular.module('modulosCities').controller('RsaController', ['$http', '$scope', function ($http, $scope) {
    $scope.message = {};
    var keyPair;
    var d, n, e;
    var keys = {
        publicKey: ""
    };
    $scope.rsa = function () {
        console.log($scope.message.unencrypted);
        document.getElementById("rsaLogic").style.display = "inline";
        $http.get(url + '/publickey').success(function (response) {
            keys.publicKey = response;
            var msgEnc = bigInt(convertToHex($scope.message.unencrypted), 16);
            msgEnc = msgEnc.modPow(keys.publicKey.e, keys.publicKey.n).toString(16);
            $scope.message.publicKeyE = keys.publicKey.e;
            $scope.message.publicKeyN = keys.publicKey.n;
            $scope.message.encrypted = msgEnc;
            $http.post(url + '/encrypt', {data: msgEnc}).success(function (res) {
                var msgSignedServer = bigInt(res.data, 16);
                $scope.message.signed = msgSignedServer.value;
                var decryptMsg = msgSignedServer.modPow(keys.publicKey.e, keys.publicKey.n).toString(16);
                $scope.message.decrypted = hex2a(decryptMsg);
            });
        });
    };
    $scope.init = function () {
        keyPair = rsaInt.generateKeys(512);
        e = keyPair.publicKey.e;
        n = keyPair.publicKey.n;
        d = keyPair.privateKey.d;
    };
}])
;

angular.module('modulosCities').controller('BlindController', ['$http', '$scope', function ($http, $scope) {
    console.log('Inside Blind controller ');
}]);
angular.module('modulosCities').controller('RepudiationController', ['$http', '$scope', function ($http, $scope) {
    console.log('Inside Repudiation controller ');
}]);
angular.module('modulosCities').controller('ThresholdController', ['$http', '$scope', function ($http, $scope) {
    console.log('Inside threshold controller ');
}]);
angular.module('modulosCities').controller('PaillierController', ['$http', '$scope', function ($http, $scope) {
    console.log('Inside Paillier controller ');
}]);

