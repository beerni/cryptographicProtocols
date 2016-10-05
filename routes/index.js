var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var bignum = require('bignum');
var JSONbig = require('json-bigint');
var rsa = require('./rsa');
var keys = rsa.generateKeys(512);
var http = require('http');
var request = require("request");
var clientSecret='clientSecret';
var serverSecret='serverSecret';
var C;
router.get('/publickey', function (req, res) {
    res.status(200).send({
        bits: keys.publicKey.bits.toString(),
        n: keys.publicKey.n.toString(),
        e: keys.publicKey.e.toString()
    });
});
router.post('/encrypt', function (req, res) {
    var msgSign = 'Hola soy el server';
    var msgDes = keys.privateKey.decrypt(bignum(req.body.data,16));
    var msgDescod2 = msgDes.toBuffer().toString();
    console.log('Message desencrypted = ' + msgDescod2);
    msgSign = keys.privateKey.sign(bignum.fromBuffer(new Buffer(msgSign)));
    res.status(200).send({data:msgSign.toString(16)});
});

router.post('/blindSign', function (req, res) {
    var msgUnblinded = keys.privateKey.sign(bignum(req.body.data,16));
    res.status(200).send({data:msgUnblinded.toString(16)});
});
router.post('/nonRep', function (req, res) {
    var B = 'Bob';
    var A='Alice';
    C=req.body.data.C;
    var receptionProbe=B+'|'+A+'|'+req.body.data.C;
    var recHash = CryptoJS.SHA256(receptionProbe).toString(CryptoJS.enc.Hex);
    receptionProbe= keys.privateKey.sign(bignum.fromBuffer(recHash)).toString(16);
    var data={
        B:B,
        A:A,
        receptionProbe:receptionProbe
    };
    res.status(200).send({data:data});

});
router.post('/publicationProof', function (req, res) {
    var K = req.body.K;
    console.log(K);
    console.log(C);
    var bytes  = CryptoJS.AES.decrypt(C, K);
    var plaintext = bytes.toString(CryptoJS.enc.Utf8);
    console.log(plaintext);
    res.status(200).send('HOLA');

});
module.exports = router;
