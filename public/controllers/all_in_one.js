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
    var keyPair;
    $scope.nonRepudiation = function () {
        document.getElementById("nonRepudiation").style.display = "inline";
        keyPair = rsaInt.generateKeys(512);
        var e = keyPair.publicKey.e;
        var n = keyPair.publicKey.n;
        var d = keyPair.privateKey.d;
        var A = 'Alice';
        var B = 'Bob';
        var C = CryptoJS.AES.encrypt($scope.message.msg, $scope.message.secret);
        var originProbe = A + '|' + B + '|' + C;
        var originProbeHash = CryptoJS.SHA256(originProbe);
        originProbeHash= bigInt(originProbeHash.toString(),16);
        originProbe = originProbeHash.modPow(d,n);
        var uncrypted = originProbe.modPow(e,n);

        var data = {
            A: 'Alice',
            B: 'Bob',
            C: C.toString(),
            originProbe: originProbe.toString(),
            eClient:e.toString(),
            nClient:n.toString()

        };
        console.log(data);
        $scope.message.proofOrigin = originProbe;
        $scope.message.crypted = C.toString();
        $http.post(url + '/nonRep', {data: data}).success(function (res) {
            compareHash(res.data, function () {
                var A = 'Alice';
                var B = 'Bob';
                var TTP = 'TTP';
                var K = $scope.message.secret;
                var concat = A + '|' + TTP + '|' + B + '|' + K;
                var hash = CryptoJS.SHA256(concat);
                hash = bigInt(hash.toString(),16);
                var originProofOfK = hash.modPow(d,n);
                var data = {
                    A: A,
                    TTP: TTP,
                    B: B,
                    K: K,
                    originProofOfK: originProofOfK.toString(),
                    eClient:e.toString(),
                    nClient:n.toString()

                };
                $http.post('https://localhost:8085/ttp', {data: data}).success(function (res) {
                    console.log('response from TTP');
                    console.log(res.data);
                    compareHashTTP(res.data, function () {

                    })
                })
            });
            })
    }

    function compareHash(info, cb) {
        console.log('Comparing hashes');
        var concat = info.B + '|' + info.A + '|' + info.C;
        var eS = bigInt(info.eServer);
        var nS= bigInt(info.nServer);
        var originHash = CryptoJS.SHA256(concat).toString();
        var originServer = bigInt(info.receptionProbe);
        var decrypted = originServer.modPow(eS,nS).toString(16);
        if(decrypted.localeCompare(originHash)==0){
            console.log('Equal hashes from proof of reception!');
            console.log(decrypted.toString(16));
            console.log(originHash.toString(16));
            cb();
        }
        else
            console.log('mismatch');
    }
    function compareHashTTP(info, cb) {
        var concat = info.TTP + '|' + info.A + '|' + info.B+ '|' + info.K;
        var eTTP = bigInt(info.eTTP);
        var nTTP= bigInt(info.nTTP);
        var originHash = CryptoJS.SHA256(concat).toString();
        var originServer = bigInt(info.proofPublication);
        var decrypted = originServer.modPow(eTTP,nTTP).toString(16);
        if(decrypted.localeCompare(originHash)==0){
            console.log('Equal hashes from proof of publication of K!');
            console.log(decrypted.toString(16));
            console.log(originHash.toString(16));
            cb();
        }
        else
            console.log('mismatch');
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
    $scope.num1 = "";
    $scope.num2 = "";
    $scope.paillier = function () {
        $http.get(url + '/paillierKeys').success(function (response) {
            var msg = $scope.num1; // convertir
            var msg2 = $scope.num2;
            var negative = false;
            var n = bigInt(response.n);
            var n2 = n.pow(2);
            var g = bigInt(response.g);
            var r1 = bigInt.randBetween(bigInt(0), n);
            var r2 = bigInt.randBetween(bigInt(0), n);
            var bi1 = (bigInt(msg).mod(n).gt(0)) ? bigInt(msg).mod(n) : bigInt(msg).mod(n).add(n);
            var bi2 = (bigInt(msg2).mod(n).gt(0)) ? bigInt(msg2).mod(n) : bigInt(msg2).mod(n).add(n) ;
            var c1 = g.modPow(bi1, n2).multiply(r1.modPow(n, n2)).mod(n2).toString(16);
            var c2 = g.modPow(bi2, n2).multiply(r2.modPow(n, n2)).mod(n2).toString(16);
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

