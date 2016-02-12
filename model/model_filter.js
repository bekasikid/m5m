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
        if(rows.length==1){
            var sign = lib.hmacSha1(req.body.id+"\n"+req.method+"\n"+JSON.stringify(req.body)+"\n"+req.headers.date,key);
            var auth = req.headers.authorization.split(":");
            var username = auth[0].split(" ");
            if(username[0]!==req.body.id){
                //res.status(401).send({ error: "Unauthorized" });
                deferred.resolve(401);
            }else{
                if(username[1]==sign){
                    //res.status(401).send({ error: "Unauthorized" });
                    deferred.resolve(200);
                }else{
                    deferred.resolve(401);
                }
            }
        }else{
            //res.status(401).send({ error: "Unauthorized" });
            deferred.resolve(401);
        }
    });
    return deferred.promise;
}

var checkWhiteList = function (connection, req) {
    var ip = getIP(req);
    //console.log ("SELECT * FROM whitelist WHERE list_ip = ?"+ip.clientIp);
    return query.execute(connection, "SELECT * FROM whitelist WHERE list_ip = ?", [ip.clientIp]);
}

module.exports.validateReq = validateReq;

