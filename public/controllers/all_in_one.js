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
    $scope.message = {};
    var keys = {
        publicKey: ""
    };
    $scope.blindMessage = function () {
        console.log('blind');
        var n, e;
        var rand;
        $http.get(url + '/publickey').success(function (response) {
            document.getElementById("blinded").style.display = "inline";
            keys.publicKey = response;
            n = keys.publicKey.n;
            e = keys.publicKey.e;
            rand = bigInt.randBetween(2, n - 1);
            $scope.message.random = rand.value;
            var msgEnc = bigInt(convertToHex($scope.message.blind), 16);
            var msgBlinded = (msgEnc.multiply(rand.modPow(e, n))).mod(n).toString(16);
            $scope.message.blinded = msgBlinded;
            $http.post(url + '/blindSign', {data: msgBlinded}).success(function (res) {
                var msgSigned = bigInt(res.data, 16);
                console.log(bigInt(res.data, 16));
                var unblind = (msgSigned.multiply(rand.modInv(n))).mod(n);
                var decryptMsg = unblind.modPow(e, n).toString(16);
                $scope.message.unblinded = hex2a(decryptMsg);
            })
        });
    }
}]);
angular.module('modulosCities').controller('RepudiationController', ['$http', '$scope', function ($http, $scope) {
    var clientSecret = 'clientSecret';
    var keyPair;
    $scope.nonRepudiation = function () {
        document.getElementById("nonRepudiation").style.display = "inline";
        keyPair = rsaInt.generateKeys(512);
        e = keyPair.publicKey.e;
        n = keyPair.publicKey.n;
        d = keyPair.privateKey.d;
        var A = 'Alice';
        var B = 'Bob';
        var C = CryptoJS.AES.encrypt($scope.message.msg, clientSecret).toString();
        console.log(C);
        var originProbe = A + '|' + B + '|' + C;
        var originProbeHash = CryptoJS.SHA256(originProbe).toString(CryptoJS.enc.Hex);
        originProbe = bigInt(originProbeHash, 16).modPow(d, n).toString(16);
        var data = {
            A: 'Alice',
            B: 'Bob',
            C: C,
            originProbe: originProbe
        };

        $scope.message.proofOrigin = originProbe;
        $scope.message.crypted = C;
        $http.post(url + '/nonRep', {data: data}).success(function (res) {
            var A = 'Alice';
            var B = 'Bob';
            var TTP = 'TTP';
            var K = clientSecret;
            var concat = A + '|' + TTP + '|' + B + '|' + K;
            var hash = CryptoJS.SHA256(concat).toString(CryptoJS.enc.Hex);
            var originProof = bigInt(hash, 16).modPow(d, n).toString(16);
            var data = {
                A: A,
                TTP: TTP,
                B: B,
                K: K,
                originProof: originProof

            };
            $http.post('https://localhost:8085/ttp', {data: data}).success(function (res) {
                console.log('ok');
            })
        });
    }

}]);
angular.module('modulosCities').controller('ThresholdController', ['$http', '$scope', function ($http, $scope) {
    console.log('Inside threshold controller ');
    $scope.txt = "";
    $scope.share1 = "";
    $scope.share2 = "";
    $scope.share3 = "";

    $scope.message={};



    $scope.getShare=function () {
        $http.post("https://localhost:8080/getShare", {data: $scope.txt}
        ).success(function (data) {
            console.log(data);
            console.log(data[0]);
            $scope.message.share1 = 'jdiejd';

        })
    }
    $scope.msgShare=function () {
        $http.post("https://localhost:8080/msgShare", {share1: $scope.share1, share2: $scope.share2, share3: $scope.share3}
        ).success(function (data) {
            console.log(data);
        })
    }
}]);
angular.module('modulosCities').controller('PaillierController', ['$http', '$scope', function ($http, $scope) {
    $scope.message = {};
    $scope.paillier = function () {
        $http.get(url + '/paillierKeys').success(function (response) {
            var msg = '100';
            var msg2 = '102';
            var n = bigInt(response.n);
            var g = bigInt(response.g);
            var r1 = bigInt.randBetween(bigInt(0), n);
            var r2 = bigInt.randBetween(bigInt(0), n);
            var c1 = g.modPow(bigInt(msg.toString(16)), n.pow(2)).multiply(r1.modPow(n, n.pow(2))).mod(n.pow(2)).toString(16);
            var c2 = g.modPow(bigInt(msg2.toString(16)), n.pow(2)).multiply(r2.modPow(n, n.pow(2))).mod(n.pow(2)).toString(16);
            $scope.message.random1 = r1;
            $scope.message.random2 = r2;
            $scope.message.cipher1 = c1;
            $scope.message.cipher2 = c2;
            document.getElementById("paillier").style.display = "inline";

            $http.post(url + '/paillierCipher', {
                c1: c1,
                c2: c2
            }).success(function (res) {
                console.log('ok');
            })
        });
    }

}]);

