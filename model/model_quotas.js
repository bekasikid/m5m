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

var getStores = function(req,res){
    var rows = [];
    //var where = {};
    var w = [];
    var where = " store_runner = 1 ";
    if(!lib.empty(req.query.city)){
        w.push(req.query.city);
        where +=" AND store_city = ? ";
    }
    if(!lib.empty(req.query.province)){
        w.push(req.query.province);
        if(!lib.empty(where)){ where += " AND "}
        where += " store_province = ?"
    }
    q = "SELECT * FROM stores";
    if(!lib.empty(where)) { q += " WHERE "+where}
    db.execute(q,w).then(function(rows){
        res.json(rows);
    });
};

getCities = function(req,res){
    query = "SELECT * FROM cities";
    var params = [];
    if(!lib.empty(req.query.province)){
        query += "  WHERE city_province=?";
        params = [req.query.province];
    }
    db.execute(query,params).then(function(rows){
        res.json(rows);
    });
};

var getQuotas = function(req,res){
    db.execute("SELECT * FROM stores where store_id = '"+req.params.id+"'").then(function(rows){
        if(rows.length==0){
            res.json({
                rc : "20",
                message : "no data"
            });
        }else{
            var rowsS = [];
            db.execute("SELECT quota_session,quota_space FROM quotas where store_id = '"+req.params.id+"' AND quota_date = '"+req.params.dt+"'").then(function(rowsSession){
                if(rowsSession.length==0){
                    rows[0]['session'] = rowsS;
                }else{
                    rows[0]['session'] = rowsSession;
                }
                res.json(rows[0]);
            });

        }

    });
}
module.exports.getStores = getStores;
module.exports.getQuotas = getQuotas;
module.exports.getCities = getCities;
