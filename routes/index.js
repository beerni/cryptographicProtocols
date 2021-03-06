var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var bignum = require('bignum');
var rsa = require('./rsa');
var paillier = require('./paillier');
var secrets = require('secrets.js');
var request = require("request");
var clientSecret = 'clientSecret';
var serverSecret = 'serverSecret';
var sevrets = require('./')
var C;
var keys = rsa.generateKeys(512);
var paillierKeys;
router.get('/publickey', function (req, res) {
    res.status(200).send({
        bits: keys.publicKey.bits.toString(),
        n: keys.publicKey.n.toString(),
        e: keys.publicKey.e.toString()
    });
});
router.get('/paillierKeys', function (req, res) {
    paillierKeys = paillier.generateKeys(512);
    res.status(200).send({
        n: paillierKeys.publicKey.n.toString(),
        g: paillierKeys.publicKey.g.toString()
    });
});
router.post('/encrypt', function (req, res) {
    var msgSign = 'Hola soy el server';
    var msgDes = keys.privateKey.decrypt(bignum(req.body.data, 16));
    var msgDescod2 = msgDes.toBuffer().toString();
    console.log("++++++++++++++++++++++++++++++++++++");
    console.log('+                                  +');
    console.log('+        ' + msgDescod2 + '        ');
    console.log('+                                  +');
    console.log("++++++++++++++++++++++++++++++++++++");
    msgSign = keys.privateKey.sign(bignum.fromBuffer(new Buffer(msgSign)));
    console.log('Mensaje firmado : ' + msgSign);
    res.status(200).send({data: msgSign.toString(16)});
});

function compareHashes(info, cb) {
    var concat = info.A + '|' + info.B + '|' + info.C;
    var eC = bignum(info.eClient);
    var nC= bignum(info.nClient);
    var originHash = CryptoJS.SHA256(concat).toString();
    var originC = bignum(info.originProbe);
    var decrypted = originC.powm(eC,nC).toString(16);
    if(decrypted.localeCompare(originHash)==0){
        console.log('Equal hashes from proof of origin!');
        console.log(decrypted.toString(16));
        console.log(originHash.toString(16));
        cb();
    }
    else {
        console.log('mismatch')
    }
}
router.post('/blindSign', function (req, res) {
    var blindMessageSigned = keys.privateKey.sign(bignum(req.body.data, 16));
    console.log('Message signed: ' + blindMessageSigned);
    res.status(200).send({data: blindMessageSigned.toString(16)});
});
var cipherText;
router.post('/nonRep', function (req, res) {
    compareHashes(req.body.data, function () {
        var B = 'Bob';
        var A = 'Alice';
        var C = req.body.data.C;
        cipherText = C;
        var receptionProbe = B + '|' + A + '|' + C;
        var recHash = CryptoJS.SHA256(receptionProbe);
        recHash= bignum(recHash.toString(),16);
        receptionProbe = recHash.powm(keys.privateKey.d, keys.publicKey.n);
        console.log(receptionProbe);
        var data = {
            B: B,
            A: A,
            C:C,
            receptionProbe: receptionProbe.toString(),
            eServer:keys.publicKey.e.toString(),
            nServer:keys.publicKey.n.toString()
        };
        console.log(data);
        res.status(200).send({data: data});
    });
});
router.post('/publicationProof', function (req, res) {
    compareHashesTTP(req.body, function () {
        var K = req.body.K;
        var bytes = CryptoJS.AES.decrypt(cipherText, K);
        console.log(bytes);
        var plaintext = bytes.toString(CryptoJS.enc.Utf8);
        console.log(plaintext);
        console.log("++++++++++++++++++++++++++++++++++++");
        console.log('+                                  +');
        console.log('+        ' + plaintext + '        ');
        console.log('+                                  +');
        console.log("++++++++++++++++++++++++++++++++++++");
        res.status(200).send('OK');
    })
});

function compareHashesTTP(info, cb) {
    var concat = info.TTP + '|' + info.A + '|' + info.B + '|' + info.K;
    var eTTP = bignum(info.eTTP);
    var nTTP= bignum(info.nTTP);
    var originHash = CryptoJS.SHA256(concat).toString();
    var originC = bignum(info.proofPublication);
    var decrypted = originC.powm(eTTP,nTTP).toString(16);
    if(decrypted.localeCompare(originHash)==0){
        console.log('Equal hashes from proof of publication of K!');
        console.log(decrypted.toString(16));
        console.log(originHash.toString(16));
        cb();
    }
    else {
        console.log('mismatch')
    }
}

router.get('/token', function (req, res) {
    require('crypto').randomBytes(48, function (err, buffer) {
        var token = buffer.toString('hex');
        res.status(200).send({token: token});
    });
});

router.post('/paillierCipher', function (req, res) {
    var n = paillierKeys.publicKey.n;
    var c1 = req.body.c1;
    var c2 = req.body.c2;
    console.log(bignum(c2, 16));
    var msgDesenc = paillierKeys.privateKey.decrypt(bignum(c1, 16));
    console.log('------------');
    console.log(msgDesenc);
    var plaintext = msgDesenc.toString();
    var msgDesenc2 = paillierKeys.privateKey.decrypt(bignum(c2, 16));
    var plaintext2 = msgDesenc2.toString();
    var suma = bignum(c1, 16).mul(bignum(c2, 16)).mod(n.pow(2));
    var decryptedSum = paillierKeys.privateKey.decrypt(suma);
    var mul = bignum(c1, 16).powm(bignum(plaintext2), n.pow(2));
    var decryptedmul = paillierKeys.privateKey.decrypt(mul);
    console.log('C1= ' + plaintext);
    console.log('C2= ' + plaintext2);
    console.log('addition ************');
    console.log(decryptedSum.toString());
    console.log('************');
    console.log('multiplication ************');
    console.log(decryptedmul.toString());
    console.log('************');
    res.status(200).send('OK');

});
router.post('/msgShare', function (req, res) {

    //Combinamos las 3 claves compartidas, para obtener el mensaje.
    var comb = secrets.combine([req.body.share1, req.body.share2, req.body.share3]);

    //Para obtener el mensaje tal cual lo teniamos, deberemos pasarlo de hex a string.
    comb = secrets.hex2str(comb);

    console.log(comb);

    return res.json(comb);

});
router.post('/getShare', function (req, res) {
    //Convertimos el texto en un hexstring
    var txthex = secrets.str2hex(req.body.data);
    //Dividimos en 5 claves compartidas, con un threshold de 3
    var shares = secrets.share(txthex, 5, 3);
    console.log(shares);

    return res.json(shares);
});
module.exports = router;
