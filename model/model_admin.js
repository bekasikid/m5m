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
                           date : moment(rows[0]['quota_date']).format("YYYY-MM-DD"),
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

var login = function(req,res){

};


module.exports.participants = participants;