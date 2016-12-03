var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var bignum = require('bignum');
var rsa = require('./rsa');
var paillier = require('./paillier');
var request = require("request");
var clientSecret = 'clientSecret';
var serverSecret = 'serverSecret';
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
    console.log('+        '+msgDescod2+'        ');
    console.log('+                                  +');
    console.log("++++++++++++++++++++++++++++++++++++");
    msgSign = keys.privateKey.sign(bignum.fromBuffer(new Buffer(msgSign)));
    console.log('Firmando mensaje desde server con su privada : ' +msgSign);
    console.log('Mensaje firmado : '+msgSign);
    res.status(200).send({data: msgSign.toString(16)});
});

router.post('/blindSign', function (req, res) {
    var msgUnblinded = keys.privateKey.sign(bignum(req.body.data, 16));
    res.status(200).send({data: msgUnblinded.toString(16)});
});
router.post('/nonRep', function (req, res) {
    var B = 'Bob';
    var A = 'Alice';
    C = req.body.data.C;
    var receptionProbe = B + '|' + A + '|' + req.body.data.C;
    var recHash = CryptoJS.SHA256(receptionProbe).toString(CryptoJS.enc.Hex);
    receptionProbe = keys.privateKey.sign(bignum.fromBuffer(recHash)).toString(16);
    var data = {
        B: B,
        A: A,
        receptionProbe: receptionProbe
    };
    res.status(200).send({data: data});

});
router.post('/publicationProof', function (req, res) {
    var K = req.body.K;
    var bytes = CryptoJS.AES.decrypt(C, K);
    var plaintext = bytes.toString(CryptoJS.enc.Utf8);
    console.log(plaintext);
    res.status(200).send('OK');

});

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
    var msgDesenc = paillierKeys.privateKey.decrypt(bignum(c1, 16));
    var plaintext = msgDesenc.toString();
    var msgDesenc2 = paillierKeys.privateKey.decrypt(bignum(c2, 16));
    var plaintext2 = msgDesenc2.toString();
    var suma = bignum(c1,16).mul(bignum(c2,16)).mod(n.pow(2));
    var decryptedSum = paillierKeys.privateKey.decrypt(suma);
    var mul = bignum(c1,16).powm(bignum(plaintext2), n.pow(2));
    var decryptedmul = paillierKeys.privateKey.decrypt(mul);
    console.log('C1= '+plaintext);
    console.log('C2= '+plaintext2);
    console.log('addition ************');
    console.log(decryptedSum.toString());
    console.log('************');
    console.log('multiplication ************');
    console.log(decryptedmul.toString());
    console.log('************');
    res.status(200).send('OK');

});
module.exports = router;
