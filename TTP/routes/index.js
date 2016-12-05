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
    console.log('from Alice');
    console.log(req.body);
    compareHash(req.body.data, function () {
        var A='Alice';
        var B = 'Bob';
        var K=req.body.data.K;
        var TTP='TTP';
        var concat=TTP+'|'+A+'|'+B+'|'+K;
        var concatHash = CryptoJS.SHA256(concat);
        concatHash= bignum(concatHash.toString(),16);
        var proofOfPublicationK = concatHash.powm(keys.privateKey.d, keys.publicKey.n);
        var data={
            TTP:TTP,
            A:A,
            B:B,
            K:K,
            proofPublication:proofOfPublicationK.toString(),
            eTTP:keys.publicKey.e.toString(),
            nTTP:keys.publicKey.n.toString()
        };
        res.status(200).send({data:data});
        request({
            uri: "https://localhost:8080/publicationProof",
            method: "POST",
            form: data
        }, function(error, response, body) {
            console.log(error);
        });
    });
   function compareHash(info, cb) {
       var concat = info.A + '|' + info.TTP + '|' + info.B +'|' + info.K;
       var eC = bignum(info.eClient);
       var nC= bignum(info.nClient);
       var originHash = CryptoJS.SHA256(concat).toString();
       var originServer = bignum(info.originProofOfK);
       var decrypted = originServer.powm(eC,nC).toString(16);
       if(decrypted.localeCompare(originHash)==0){
           console.log('Equal hashes from proof of K!');
           console.log(decrypted.toString(16));
           console.log(originHash.toString(16));
           cb();
       }
       else
           console.log('mismatch');
   }
});

module.exports = router;