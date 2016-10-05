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
    var url = "http://localhost:8080";
    var keyPair;
    var d,n,e;
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
        e=keyPair.publicKey.e;
        n=keyPair.publicKey.n;
        d=keyPair.privateKey.d;
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
                console.log(bigInt(res.data,16));
                var unblind = (msgSigned.multiply(rand.modInv(n))).mod(n);
                var decryptMsg = unblind.modPow(e, n).toString(16);
                console.log(hex2a(decryptMsg));
            })
        });
    };
    $scope.nonRepudiation = function () {

        var A = 'Alice';
        var B = 'Bob';
        var C = CryptoJS.AES.encrypt('Se que lo has leido', clientSecret).toString();
        console.log(C);
        var originProbe = A + '|' + B + '|' + C;
        var originProbeHash = CryptoJS.SHA256(originProbe).toString(CryptoJS.enc.Hex);
        originProbe= bigInt(originProbeHash,16).modPow(d,n).toString(16);
        var data = {
            A: 'Alice',
            B: 'Bob',
            C: C,
            originProbe: originProbe
        };

        $http.post(url + '/nonRep', {data: data}).success(function (res) {
            var A='Alice';
            var B='Bob';
            var TTP='TTP';
            var K =clientSecret;
            var concat = A+'|'+TTP+'|'+B+'|'+K;
            var hash= CryptoJS.SHA256(concat).toString(CryptoJS.enc.Hex);
            var originProof = bigInt(hash,16).modPow(d,n).toString(16);
            var data ={
                A:A,
                TTP:TTP,
                B:B,
                K:K,
                originProof:originProof

            };
            $http.post('http://localhost:8085/ttp', {data:data}).success(function (res) {
                console.log('ok');
            })
        })


    }

}]);