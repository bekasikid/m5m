/**
 * Created by Ainul Yaqin on 10/16/2015.
 * TODO : bikin 2 langkah transaksi
 * 1. generate token dgn batasan waktu
 * 2. owner melakukan trx dgn menggunakan token tsb
 */
var lib = require('./model_library');
var db = require("./model_db");
var moment = require("moment");
var Q = require("q");
var getIP = require('ipware')().get_ip;
var log = null;
var key = "L6TGw!_&LLFP_^DBUqr*";

var validateReq = function(req,res){
    var deferred = Q.defer();
    db.execute("SELECT * FROM registrations WHERE registration_code = ?",[req.body.id]).then(function(rows){
        //console.log(rows[0]);
        if(rows.length==1){
            if(!lib.empty(req.headers.authorization)){
                var sign = lib.hmacSha1(rows[0].registration_code+"\n"+rows[0].registration_password+"\n"+req.method+"\n"+JSON.stringify(req.body),key);
                var auth = req.headers.authorization.split(" ");
                var username = auth[1].split(":");
                if(username[0]!==rows[0].registration_code){
                    deferred.resolve(401);
                }else{
                    console.log(username[1]+"||"+sign);
                    if(username[1]==sign){
                        deferred.resolve(200);
                    }else{
                        deferred.resolve(401);
                    }
                }
            }else{
                deferred.resolve(401);
            }

        }else{
            deferred.resolve(401);
        }
    });
    return deferred.promise;
}

var validateAdmin = function(req,res){
    var deferred = Q.defer();

    var auth = req.headers.authorization.split(" ");
    var username = auth[1].split(":");

    db.execute("SELECT * FROM users LEFT JOIN stores ON users.store_id=stores.store_id WHERE user_username = ? AND users.user_active=1",[username[0]]).then(function(rows){
        if(rows.length==1){
            if(req.method=="POST"){
                var sign = lib.hmacSha1(username[0]+"\n"+key+"\n"+req.method+"\n"+JSON.stringify(req.body),rows[0].user_password);
            }else{
                var sign = lib.hmacSha1(username[0]+"\n"+key+"\n"+req.method,rows[0].user_password);
            }
            console.log(username[0]+"||"+sign);
            if(username[0]!=rows[0].user_username){
                deferred.resolve({"rc":401});
            }else{
                console.log(username[1]+"||"+sign);
                if(username[1]==sign){
                    delete rows[0].user_password;
                    deferred.resolve({"rc":200,row:rows[0]});
                }else{
                    console.log({"rc":401});
                    deferred.resolve({"rc":401});
                }
            }
        }else{
            deferred.resolve({"rc":401});
        }
    });
    return deferred.promise;
}

var checkWhiteList = function (connection, req) {
    var ip = getIP(req);
    return db.execute("SELECT * FROM whitelist WHERE list_ip = ?", [ip.clientIp]);
}

module.exports.validateReq = validateReq;
module.exports.validateAdmin = validateAdmin;

