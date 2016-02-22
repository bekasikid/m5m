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
var fee = 152000;

var participants = function (req, res) {

    if(!lib.empty(req.query.store_id) && !lib.empty(req.query.date)){
        var query = "SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id WHERE quota.store_id = ? AND quotas.quota_date = ?";
        var params = [req.query.store_id,req.query.date];
        if(!lib.empty(req.query.session)){
            query += " AND quota_session = ?";
            params.push(req.query.session);
        }
        db.readQuery(query,params).then(function(rows){
           if(rows.length){
               var datas = {};
               for(i=0;i<rows.length;i++){
                   if(i==0){
                       var datas = {
                           store : {
                               store_id: rows[0]['store_id'],
                               store_name: rows[0]['store_name'],
                               store_address: rows[0]['store_address'],
                               store_city: rows[0]['store_city'],
                               store_province: rows[0]['store_province'],
                               store_full: rows[0]['store_full'],
                               store_lat: rows[0]['store_lat'],
                               store_long: rows[0]['store_long'],
                               store_type: rows[0]['store_type']
                           },
                           //date : moment(rows[0]['quota_date']).format("YYYY-MM-DD"),
                           date : rows[0]['quota_date'],
                           contestant : []
                       };
                       datas.contestant.push(
                           {
                               "session" : rowsComp[0]['quota_session'],
                               "no" : rows[0]['competition_no'],
                               score : rowsComp[0]['competition_score'],
                               status : rowsComp[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
                           }
                       );
                   }
               }
               //res.json(datas);
               res.json({ code : 200, message: "success",data:datas});
           }else{
               res.json({ code : 400, message: "data not found"});
           }
        });
    }
    var row ={
        id : req.params.id,
        nik : rows[0]['contestant_nik'],
        name : rows[0]['contestant_name'],
        histories : [
            {
                store : {
                    store_id: rows[0]['store_id'],
                    store_name: rows[0]['store_name'],
                    store_address: rows[0]['store_address'],
                    store_city: rows[0]['store_city'],
                    store_province: rows[0]['store_province'],
                    store_full: rows[0]['store_full'],
                    store_lat: rows[0]['store_lat'],
                    store_long: rows[0]['store_long'],
                    store_type: rows[0]['store_type']
                },
                date : moment(rows[0]['quota_date']).format("YYYY-MM-DD"),
                "session" : rows[0]['quota_session'],
                score : rows[0]['competition_score'],
                status : rows[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
            }
        ],

    };
    //res.json(row);
    res.json({ code : 200, message: "success",data:row});
};

var daftar = function(req,res){
    /*
    query :
        id, nik, name, page, limit, sort, sortby, type
     */
    var deferred = Q.defer();

    var sort = "";
    var limit = "";
    if(req.query.tipe=='total'){
        var query = "SELECT count(*)as total FROM registrations LEFT JOIN stores ON registrations.store_id=stores.store_id ";
    }else{
        var query = "SELECT * FROM registrations LEFT JOIN stores ON registrations.store_id=stores.store_id ";
        if(!lib.empty(req.query.sort)){
            var urut = "";
            if(req.query.sort=="id"){
                urut = "registrations.registration_code"
            }else if(req.query.sort=="nik"){
                urut = "registrations.registration_nik"
            }else if(req.query.sort=="name"){
                urut = "registrations.registration_name"
            }else if(req.query.sort=="phone"){
                urut = "registrations.registration_phone"
            }else if(req.query.sort=="email"){
                urut = "registrations.registration_email"
            }else if(req.query.sort=="key"){
                urut = "registrations.registration_id"
            }else if(req.query.sort=="date"){
                urut = "registrations.registration_date"
            }
            sort = " ORDER BY "+urut+" "+req.query.sortby;
        }
        var limit = " LIMIT "+(parseInt(req.query.page)*parseInt(req.query.limit))+","+req.query.limit;
    }



    var wh = "";
    var where = [];
    var params = [];
    if(!lib.empty(req.query.id) || !lib.empty(req.query.nik) || !lib.empty(req.query.name)){
        if(!lib.empty(req.query.id)){
            where.push( " registrations.registration_code = ? ");
            params.push(req.query.id);
        }

        if(!lib.empty(req.query.nik)){
            where.push(" registrations.registration_nik = ? ");
            params.push(req.query.nik);
        }

        if(!lib.empty(req.query.name)){
            where.push( " registrations.registration_name like ?");
            params.push("%"+req.query.name+"%");
        }

        if(!lib.empty(req.query.phone)){
            where.push( " registrations.registration_phone = ?");
            params.push("%"+req.query.phone+"%");
        }

        if(!lib.empty(req.query.email)){
            where.push( " registrations.registration_email = ?");
            params.push("%"+req.query.email+"%");
        }

        wh = " WHERE " + where.join(" AND ");
    }

    db.readQuery(query+wh+sort+limit,params).then(function(rows){
        if(req.query.tipe=='total'){
            deferred.resolve({rc : "00" , total : rows[0].total});
        }else{
            deferred.resolve({rc : "00" , rows : rows});
        }
    });
    return deferred.promise;
};

var mandiri = function(req,res){
    var deferred = Q.defer();

    var sort = "";
    var limit = "";
    if(req.query.tipe=='total'){
        var query = "SELECT count(*)as total FROM mandiri ";
    }else{
        var query = "SELECT * FROM mandiri ";

        sort = " ORDER BY mandiri_datetime DESC";

        var limit = " LIMIT "+(parseInt(req.query.page)*parseInt(req.query.limit))+","+req.query.limit;
    }



    var wh = "";
    var where = [];
    var params = [];
    if(!lib.empty(req.query.date) || !lib.empty(req.query.fee)){
        if(!lib.empty(req.query.date)){
            where.push( " date(mandiri.mandiri_datetime) = ? ");
            params.push(req.query.date);
        }

        if(!lib.empty(req.query.fee)){
            where.push(" mandiri.mandiri_credit = ? ");
            params.push(req.query.fee);
        }
        wh = " WHERE " + where.join(" AND ");
    }

    db.readQuery(query+wh+sort+limit,params).then(function(rows){
        if(req.query.tipe=='total'){
            deferred.resolve({rc : "00" , total : rows[0].total});
        }else{
            deferred.resolve({rc : "00" , rows : rows});
        }
    });
    return deferred.promise;
};

var scores = function(req,res){
    db.readQuery("SELECT * FROM competitions " +
        "JOIN contestants ON competitions.contestant_id=contestants.contestant_id " +
        "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
        "JOIN stores ON stores.store_id=quotas.store_id " +
        "WHERE quotas.quota_date = ?" +
        "ORDER BY competitions.competition_score ASC",[req.query.date]).then(function(rows){
        var tables = [];
        for(i=0;i<rows.length;i++){
            tables.push({
                "store_id" : rows[i].store_id,
                "store" : rows[i].store_name,
                "name" : rows[i].contestant_name,
                "score" : rows[i].competition_score,
                "competition" : req.query.date,
            });
        }
        //res.json(tables);
        res.json({ code : 200, message: "success",data:tables});
    });
};

var leaderboard = function(req,res){
    if(!lib.empty(req.query.date)){
        scores(req,res);
    }else{
        db.readQuery("SELECT * FROM leaderboard " +
            "JOIN competitions ON leaderboard.competition_id = competitions.competition_id " +
            "JOIN contestants ON competitions.contestant_id=contestants.contestant_id " +
            "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
            "JOIN stores ON stores.store_id=quotas.store_id " +
            "ORDER BY competition_date ASC").then(function(rows){
            var tables = [];
            for(i=0;i<rows.length;i++){
                tables.push({
                    "store_id" : rows[i].store_id,
                    "store" : rows[i].store_name,
                    "name" : rows[i].contestant_name,
                    "score" : rows[i].competition_score,
                    "competition" : rows[i].competition_date,
                });
            }
            //res.json(tables);
            res.json({ code : 200, message: "success",data:tables});
        });
    }

};

var nearOutlets = function(req,res){
    //var deferred = Q.defer();
    var query = "SELECT *, ( 3959 * ACOS( COS( RADIANS(?) ) * COS( RADIANS( store_lat ) ) * COS( RADIANS( store_long ) - RADIANS(?) ) + SIN( RADIANS(?) ) * SIN( RADIANS( store_lat ) ) ) ) AS distance FROM stores HAVING distance < 25 ORDER BY distance LIMIT 0,20"
    db.readQuery(query,[req.query.lat,req.query.lng,req.query.lat]).then(function(rows){
        //console.log(rows);
        //deferred.resolve(rows);
        //res.json(rows);
        res.json({ code : 200, message: "success",data:rows});
    });
    //return deferred.promise;
}

var rekapReg = function(req,res){
    db.readQuery("SELECT COUNT(*)as jumlah FROM registrations").then(function(rowsJ){
        db.readQuery("SELECT COUNT(*) jumlah_bayar FROM registrations WHERE registration_valid=1").then(function(rowsB){
            var row = {
                code : 200,
                message : "success",
                data : {
                    daftar : rowsJ[0].jumlah,
                    bayar : rowsB[0].jumlah_bayar
                }
            }
            res.json(row);
        });
    });
}
module.exports.rekapReg = rekapReg;
module.exports.mandiri = mandiri;
module.exports.participants = participants;
module.exports.daftar = daftar;
module.exports.leaderboard = leaderboard;
module.exports.nearOutlets = nearOutlets;