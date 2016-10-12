/**
 * Created by bernatmir on 4/10/16.
 */
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var routes = require('./routes/index');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var https = require('https');


var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use('/', routes);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


var options = {
    key: fs.readFileSync('ttp-key.pem'),
    cert: fs.readFileSync('ttp-cert.pem')
};


https.createServer(options, app).listen(8085, function () {
    console.log('Started!');
});
module.exports = app;

/*var server = require('http').Server(app);

// Start server
server.listen(8085, function() {
    console.log("TTP running on http://localhost:8085");
});*/
