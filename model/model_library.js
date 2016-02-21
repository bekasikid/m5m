/**
 * Created by Ainul Yaqin on 10/31/2015.
 */
var crypto = require("crypto");
var unirest = require('unirest');
var Q = require("q");
var hash = require("hashids");
var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var debug = 1;
var getIP = require('ipware')().get_ip;

var hmacSha1 = function(text,key){
    return crypto.createHmac('sha1', key).update(text).digest('hex');
    //return crypto.createHmac('sha1', key).update(text).digest('base64');
    //var text = crypto.createHmac('sha1', key).update(text).digest('hex');
    //return new Buffer(text).toString('base64');
}

var hmacSha1Qnb = function(text,key){
    //var text = crypto.createHmac('sha1', key).update(text).digest('hex');
    //return new Buffer(text).toString('base64');
    return crypto.createHmac('sha1', key).update(text).digest('base64');
}

var sha1 = function(text){
    return text = crypto.createHash('sha1').update(text).digest('hex');
}

var md5 = function(text){
    return crypto.createHash('md5').update(text).digest("hex");
}

var contentMd5 = function(text){
    return crypto.createHash('md5').update(text).digest("base64");
    //text = crypto.createHash('md5').update(text).digest("hex");
    //return new Buffer(text).toString('base64');
}

var postRequest = function(url,headers,params){
    //console.log("start req");
    var deferred = Q.defer();
    if(debug==1){
        console.log({
            "url" : url,
            "header" : headers,
            "params" : params
        });
    }
    unirest.post(url).headers(headers).timeout(60000)
        .send(params).end(function(response){
            //console.log(response);
            deferred.resolve(response);
        });
    return deferred.promise;
}

var dateToString = function(date){
    var dt = date.split("-");
    return dt[1]+"-"+dt[2]+"-"+dt[0];
}

var stringToDate = function(str){
    var dt = str.split("-");
    return dt[2]+"-"+dt[0]+"-"+dt[1];
}

function empty(mixed_var) {
    var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, '', '0'];
    for (i = 0, len = emptyValues.length; i < len; i++) {
        if (mixed_var === emptyValues[i]) {
            return true;
        }
    }
    if (typeof mixed_var === 'object') {
        for (key in mixed_var) {
            // TODO: should we check for own properties only?
            //if (mixed_var.hasOwnProperty(key)) {
            return false;
            //}
        }
        return true;
    }
    return false;
}

function generatePassword (length) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function uniqueCode(a){
    //var char = '0123456789';
    var hashids = new hash("fun fair fastest", 6, chars);
    var id = hashids.encode(a);
    var numbers = hashids.decode(id);
    return id;
}

function generateFee (num){
    if(num<1000) {
        return num;
    }
    num = num.toString();
    console.log(num);
    panjang = num.length;
    console.log(panjang);
    addFee = num.substr(panjang-3)
    return parseInt(addFee);
}

function isset() {
    var a = arguments,
        l = a.length,
        i = 0,
        undef;

    if (l === 0) {
        throw new Error('Empty isset');
    }

    while (i !== l) {
        if (a[i] === undef || a[i] === null) {
            return false;
        }
        i++;
    }
    return true;
}

function whitelist(req){
    var ip = getIP(req);
    if(ip.clientIp == "128.199.203.196" || ip.clientIp == "188.166.207.104" || ip.clientIp == "127.0.0.1" || ip.clientIp == "::1" || true){
        return true;
    }else{
        return false;
    }
}

function number_format (number, decimals, dec_point, thousands_sep) {
    var n = number, prec = decimals;

    var toFixedFix = function (n,prec) {
        var k = Math.pow(10,prec);
        return (Math.round(n*k)/k).toString();
    };

    n = !isFinite(+n) ? 0 : +n;
    prec = !isFinite(+prec) ? 0 : Math.abs(prec);
    var sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
    var dec = (typeof dec_point === 'undefined') ? '.' : dec_point;

    var s = (prec > 0) ? toFixedFix(n, prec) : toFixedFix(Math.round(n), prec);
    //fix for IE parseFloat(0.55).toFixed(0) = 0;

    var abs = toFixedFix(Math.abs(n), prec);
    var _, i;

    if (abs >= 1000) {
        _ = abs.split(/\D/);
        i = _[0].length % 3 || 3;

        _[0] = s.slice(0,i + (n < 0)) +
            _[0].slice(i).replace(/(\d{3})/g, sep+'$1');
        s = _.join(dec);
    } else {
        s = s.replace('.', dec);
    }

    var decPos = s.indexOf(dec);
    if (prec >= 1 && decPos !== -1 && (s.length-decPos-1) < prec) {
        s += new Array(prec-(s.length-decPos-1)).join(0)+'0';
    }
    else if (prec >= 1 && decPos === -1) {
        s += dec+new Array(prec).join(0)+'0';
    }
    return s;
}

module.exports.whitelist = whitelist;
module.exports.number_format = number_format;
module.exports.empty = empty;
module.exports.isset = isset;
module.exports.postRequest = postRequest;
module.exports.hmacSha1 = hmacSha1;
module.exports.hmacSha1Qnb = hmacSha1Qnb;
module.exports.sha1 = sha1;
module.exports.md5 = md5;
module.exports.contentMd5 = contentMd5;
module.exports.dateToString = dateToString;
module.exports.stringToDate = stringToDate;
module.exports.generatePassword = generatePassword;
module.exports.uniqueCode = uniqueCode;
module.exports.generateFee = generateFee;