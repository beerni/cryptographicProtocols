/**
 * Created by bernatmir on 4/10/16.
 */
var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var rsa = require('./rsa');
var keys = rsa.generateKeys(512);
var http = require('http');
var bignum = require('bignum');
var request = require('request');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
router.post('/ttp', function (req, res) {
    var A='Alice';
    var B = 'Bob';
    var K=req.body.data.K;
    var TTP='TTP';
    var concat=TTP+'|'+A+'|'+B+'|'+K;
    var concatHash = CryptoJS.SHA256(concat).toString(CryptoJS.enc.Hex);
    var proofPublication= keys.privateKey.sign(bignum.fromBuffer(concatHash)).toString(16);
    var data={
        TTP:TTP,
        A:A,
        B:B,
        K:K,
        proofPublication:proofPublication
    };
    console.log(req.body);
    res.status(200).send({data:data});
    request({
        uri: "https://localhost:8080/publicationProof",
        method: "POST",
        form: data
    }, function(error, response, body) {
        console.log(error);
    });
});

module.exports = router;