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
var fee = 150000;

var participants = function (req, res) {

    if(!lib.empty(req.query.store_id) && !lib.empty(req.query.date)){
        var query = "SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id WHERE quota.store_id = ? AND quotas.quota_date = ?";
        var params = [req.query.store_id,req.query.date];
        if(!lib.empty(req.query.session)){
            query += " AND quota_session = ?";
            params.push(req.query.session);
        }
        db.execute(query,params).then(function(rows){
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
               res.json(datas);
           }else{
               res.status(400).send({ error: "data not found" });
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
    res.json(row);
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

    db.execute(query+wh+sort+limit,params).then(function(rows){
        if(req.query.tipe=='total'){
            deferred.resolve({rc : "00" , total : rows[0].total});
        }else{
            deferred.resolve({rc : "00" , rows : rows});
        }
    });
    return deferred.promise;
};

var leaderboard = function(req,res){
    db.execute("SELECT * FROM leaderboard ORDER BY competition_date ASC").then(function(rows){
        res.json(rows);
    });
};

var score = function(req,res){
    db.execute("SELECT * FROM leaderboard ORDER BY competition_date ASC").then(function(rows){
        res.json(rows);
    });
};

var nearOutlets = function(req,res){
    //var deferred = Q.defer();
    var query = "SELECT *, ( 3959 * ACOS( COS( RADIANS(?) ) * COS( RADIANS( store_lat ) ) * COS( RADIANS( store_long ) - RADIANS(?) ) + SIN( RADIANS(?) ) * SIN( RADIANS( store_lat ) ) ) ) AS distance FROM stores HAVING distance < 25 ORDER BY distance LIMIT 0,20"
    db.execute(query,[req.query.lat,req.query.lng,req.query.lat]).then(function(rows){
        //console.log(rows);
        //deferred.resolve(rows);
        res.json(rows);
    });
    //return deferred.promise;
}

module.exports.participants = participants;
module.exports.daftar = daftar;
module.exports.leaderboard = leaderboard;
module.exports.nearOutlets = nearOutlets;