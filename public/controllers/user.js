/**
 * Created by aitor on 19/9/16.
 */


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
angular.module('Rsa', []).controller('User', ['$http', '$scope', function ($http, $scope) {
    var clientSecret = 'clientSecret';
    var serverSecret = 'serverSecret';
    var url = "https://localhost:8080";
    var keyPair;
    var d, n, e;
    var keys = {
        publicKey: ""
    };
    var msg = "Hola soy el cliente y solo el servidor puede leerlo";
    $scope.rsa = function () {
        $http.get(url + '/publickey').success(function (response) {
            keys.publicKey = response;
            var msgEnc = bigInt(convertToHex(msg), 16);
            msgEnc = msgEnc.modPow(keys.publicKey.e, keys.publicKey.n).toString(16);
            $http.post(url + '/encrypt', {data: msgEnc}).success(function (res) {
                var msgSignedServer = bigInt(res.data, 16);
                var decryptMsg = msgSignedServer.modPow(keys.publicKey.e, keys.publicKey.n).toString(16);
                console.log(hex2a(decryptMsg));
            });
        });
    };
    $scope.init = function () {
        keyPair = rsaInt.generateKeys(512);
        e = keyPair.publicKey.e;
        n = keyPair.publicKey.n;
        d = keyPair.privateKey.d;
    };
    var signMsg = 'Mensaje cegado';
    $scope.blindSign = function () {
        var n, e;
        var rand;
        $http.get(url + '/publickey').success(function (response) {
            keys.publicKey = response;
            n = keys.publicKey.n;
            e = keys.publicKey.e;
            rand = bigInt.randBetween(2, n - 1);
            var msgEnc = bigInt(convertToHex(signMsg), 16);
            var msgBlinded = (msgEnc.multiply(rand.modPow(e, n))).mod(n).toString(16);
            //msgSign=msgBlinded.toString(16);
            $http.post(url + '/blindSign', {data: msgBlinded}).success(function (res) {
                var msgSigned = bigInt(res.data, 16);
                console.log(bigInt(res.data, 16));
                var unblind = (msgSigned.multiply(rand.modInv(n))).mod(n);
                var decryptMsg = unblind.modPow(e, n).toString(16);
                console.log(hex2a(decryptMsg));
            })
        });
    };
    var token;
    var username = "bernatmir";
    var password = "1234";
    var g0 = 5;
    var g1 = 10;
    $scope.zkp = function () {
        $http.get(url + '/token').success(function (response) {
            token = bigInt(response.token, 16);
            var x = CryptoJS.MD5(password).toString(CryptoJS.enc.Hex);
            var y = bigInt(g0).modPow(bigInt(x, 16), g1);
            console.log(y);
        });
    };
    $scope.nonRepudiation = function () {

        var A = 'Alice';
        var B = 'Bob';
        var C = CryptoJS.AES.encrypt('Se que lo has leido', clientSecret).toString();
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
        })


    };

    $scope.paillier = function () {

        $http.get(url + '/paillierKeys').success(function (response) {
            var msg = '2';
            var msg2 = '4';
            var n = bigInt(response.n);
            var g = bigInt(response.g);
            var r1 = bigInt.randBetween(bigInt(0), n);
            var r2 = bigInt.randBetween(bigInt(0), n);
            var c1 = g.modPow(bigInt(msg.toString(16)), n.pow(2)).multiply(r1.modPow(n, n.pow(2))).mod(n.pow(2)).toString(16);
            var c2 = g.modPow(bigInt(msg2.toString(16)), n.pow(2)).multiply(r2.modPow(n, n.pow(2))).mod(n.pow(2)).toString(16);
            $http.post(url + '/paillierCipher', {
                c1: c1,
                c2: c2
            }).success(function (res) {
                console.log('ok');
            })
        });
    };

    function Lagrange(u) {
        return (u.subtract(1)).divide(512);
    }

}]);