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


var regOnline = function(req,res){
    registration(req,res).then(function(result){
        res.json(result.retval);
    });
};

var checkQuotas = function(store,tgl,sess){
    var deferred = Q.defer();
    //var sess = 1;
    db.execute("UPDATE quotas SET quota_space=quota_space-1 WHERE store_id = ? AND quota_date = ? AND quota_session = ? AND quota_space>0",
    [store,tgl,sess]).then(function(result){
        if(result.affectedRows==1){
            //console.log(result);
            var kembalian = {
                rc:200,
                store_id : store,
                quota_date : tgl,
                quota_session : sess
            };
            console.log(kembalian);
            deferred.resolve(kembalian);
        }else if(sess==7){
            deferred.resolve({rc:510});
        }else{
            sess++;
            checkQuotas(store,tgl,sess).then(function(hasil){
                deferred.resolve(hasil);
            });

        }
    });
    return deferred.promise;
};

var registration = function (req, res) {
    //@TODO:check quota dulu sebelum generate
    //@TODO : potong quota
    //@TODO:check peserta apakah sudah menang?
    var deferred = Q.defer();
    console.log(req.body);
    if(!lib.empty(req.body.nik)){
        var reg = {
            "registration_nik": req.body.nik,
            "registration_name": req.body.name,
            "registration_dob": lib.empty(req.body.dob)?"":req.body.dob,
            "registration_address": lib.empty(req.body.address)? "" : req.body.address,
            "registration_phone": req.body.phone,
            "registration_email": lib.empty(req.body.email)?"":req.body.email,
            "registration_password": lib.empty(req.body.password)?"":req.body.password,
            "registration_date" : moment().format("YYYY-MM-DD HH:mm:ss"),
            "store_id": lib.empty(req.body.store_id)?"":req.body.store_id,
            "competition_date": lib.empty(req.body.competition_date)?"":req.body.competition_date,
            "registration_gcm": lib.empty(req.body.gcm)?"":req.body.gcm,
            "created_date": moment().format("YYYY-MM-DD HH:mm:ss"),
            "updated_date": moment().format("YYYY-MM-DD HH:mm:ss")
        };
        db.execute("INSERT INTO registrations SET ?", reg).then(function(row){
            console.log(row);
            if(row.insertId>0){
                retval = req.body;
                retval['fee'] = fee + lib.generateFee(row.insertId);
                var uniquecode = lib.uniqueCode(row.insertId);
                retval['id'] = uniquecode;
                db.execute("UPDATE registrations SET registration_code = ? WHERE registration_id = ?",[uniquecode,row.insertId]).then(function(){
                    checkQuotas(req.body.store_id,req.body.competition_date,1).then(function(retQ){
                        console.log(retQ);
                        if(retQ.rc==200){
                            db.execute("UPDATE registrations SET competition_session = ? WHERE registration_id = ?",[retQ.quota_session,row.insertId]).then(function(){
                                deferred.resolve({
                                    rc : 200,
                                    retval : {
                                        code:200,
                                        message : "success",
                                        data:retval
                                    }
                                });
                            });
                        }else{
                            deferred.resolve({
                                rc : 400,
                                retval : {
                                    code : 400,
                                    message: "quota not available"
                                }
                            });
                        }

                    });

                });

            }else{
                deferred.resolve({
                    rc : 400,
                    retval : {
                        code : 400,
                        message: "registration failed"
                    }
                });
            }
        },function(){
            deferred.resolve({
                rc : 400,
                retval : {
                    code : 400,
                    message: "registration failed"
                }
            });
        });
    }else{
        deferred.resolve({
            rc : 400,
            retval : {
                code : 400,
                message: "registration failed, data not valid"
            }
        });
    }
    return deferred.promise;
};

var checkLocation = function(req,res){
    var deferred = Q.defer();
    qL = "SELECT * FROM stores JOIN quotas ON quotas.store_id=stores.store_id WHERE SOUNDEX(?)= SOUNDEX(store_city) AND quota_space > 0 AND quota_date = ? LIMIT 1";
    db.execute(qL,[req.body.location,req.body.competition_date]).then(function(rowL){
        //deferred.resolve(rowL);
        //console.log(rowL);
        if(rowL.length==1){
            req.body['store_id'] = rowL[0].store_id;
            registration(req,res).then(function(result){
                deferred.resolve(result);
            });
        }else{
            deferred.resolve({
                rc : 511,
                retval : { error: "tidak ada tempat, atau pilihan kota salah" }
            });
        }

    });
    return deferred.promise;
};

var loginConfirmation = function(req,res){
    var deferred = Q.defer();
    if(!lib.empty(req.body.id)){
        db.execute("SELECT * FROM registrations WHERE registration_code = ? ", [req.body.id]).then(function(rows){
            console.log(rows);
            if(rows.length==0){
                deferred.resolve({
                    rc : 400,
                    retval : { code : 400, message: "login failed" }
                });
            }else{
                delete rows[0].registration_password;
                db.execute("SELECT * FROM stores WHERE store_id = ?",[rows[0].store_id]).then(function(rowStore){
                    var st = {};
                    if(rowStore.length==1){
                        var st = rowStore[0];
                    }
                    rows[0]['store'] = st;
                    delete rows[0].store_id;
                    deferred.resolve({
                        rc : 200,
                        retval : { code : 200, message: "success", data : rows[0]}
                    });
                });
            }
        });
    }else{
        deferred.resolve({
            rc : 400,
            retval : { code : 400, message: "registration failed" }
        });
    }
    return deferred.promise;
};

var confirmOnline = function(req,res){
    confirmation(req,res).then(function(result){
        res.json(result.retval);
    });
};

var confirmation = function(req,res){
    /*
    1. konfirmasi pembayaran merchant
    2. konfirmasi pembayaran transfer
    3. konfirmasi pembayaran melalui doku
     */
    /*
        konfirmasi
     */
    var deferred = Q.defer();
    if(!lib.empty(req.body.paymentMethod) && !lib.empty(req.body.id)){
        if(req.body.paymentMethod==1){
            //musti di cek antara mereka konfirmasi dulu dengan dapet data settlement duluan dr kfc
            //kalo konfirmasi dulu, maka update table registrasi, dan input table contestant
            db.execute("UPDATE registrations SET registration_confirmation = 1, method_id = ? , payment_reffno = ?, registration_voucher =? WHERE registration_code = ?",
                [req.body.paymentMethod,req.body.reffno,req.body.voucher,req.body.id]).then(function(row){
                if(row.affectedRows==0){
                    deferred.resolve({
                        rc : 400,
                        retval : { code : 400, message: "registration failed" }
                    });
                }else{
                    //res.json(req.body);
                    //@TODO : musti tambahin no peserta
                    //tambahin kode voucher
                    db.execute("SELECT * FROM registrations WHERE registration_code = ?",[req.body.id]).then(function(rowReg){
                        db.execute("UPDATE vouchers SET voucher_taken = 1, voucher_taken_by = ?, voucher_taken_date = now(), updated_date = now() WHERE voucher_code = ?",
                            [rowReg[0].registration_id,req.body.voucher])
                            .then(function(rowV){
                                if(rowV.affectedRows==1){
                                    db.execute("UPDATE registrations SET registration_valid = 1 WHERE registration_code = ?",[req.body.id]).then(function(){
                                        deferred.resolve({
                                            rc : 200,
                                            retval : {
                                                code : 200,
                                                message : "success",
                                                data : req.body
                                            }
                                        });
                                    })
                                }else{
                                    deferred.resolve({
                                        rc : 400,
                                        retval : { code : 400, message: "salah kode voucher" }
                                    });
                                }
                            });
                    });

                }
            });
        }else if(req.body.paymentMethod==4 || req.body.paymentMethod==5){
            db.execute("UPDATE registrations SET registration_confirmation = 1, method_id = ? , payment_reffno = ? WHERE registration_code = ?",
                [req.body.paymentMethod,req.body.reffno,req.body.id]).then(function(row){
                if(row.affectedRows==0){
                    //res.status(400).send({ error: "confirmation failed" });
                    deferred.resolve({
                        rc : 400,
                        retval : { code : 400, message: "registration failed" }
                    });
                }else{
                    //@TODO : musti tambahin no peserta
                    deferred.resolve({
                        rc : 200,
                        retval : {
                            code : 200,
                            message : "success",
                            data : req.body
                        }
                    });
                }
            });
        }else if(req.body.paymentMethod==2){
            //@TODO : pembayaran lewat doku
            db.execute("UPDATE registrations SET registration_confirmation = 1, method_id = ? WHERE registration_code = ?",
                [req.body.paymentMethod,req.body.id]).then(function(row){
                if(row.affectedRows==0){
                    //res.status(400).send({ error: "confirmation failed" });
                    deferred.resolve({
                        rc : 400,
                        retval : { code : 400, message: "registration failed" }
                    });
                }else{
                    //@TODO : musti tambahin no peserta
                    deferred.resolve({
                        rc : 200,
                        retval : {
                            code : 200,
                            message : "success",
                            data : req.body
                        }
                    });
                }
            });
        }
    }else{
        //res.status(400).send({ error: "failed" });
        deferred.resolve({
            rc : 400,
            retval : { code : 400, message: "registration failed" }
        });
    }
    return deferred.promise;
};

var status = function(req,res){
    var query = "SELECT * FROM contestants " +
        "LEFT JOIN competitions ON contestants.contestant_id=competitions.contestant_id " +
        "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
        "JOIN stores ON quotas.store_id=stores.store_id " +
        "where competitions.registration_code= ?";
    db.execute(query,[req.params.id]).then(function(rows){
        if(rows.length==1){
            var row ={
                id : req.params.id,
                nik : rows[0]['contestant_nik'],
                name : rows[0]['contestant_name'],
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
                competition_date : moment(rows[0]['quota_date']).format("YYYY-MM-DD"),
                competition_session : rows[0]['quota_session'],
            };
            res.json({ code : 200, message: "success",data:row});
        }else{
            res.status(400).send({ code : 400, message: "contestant not registered" });
        }
    });
};

var statusReg = function(req,res){
    var query = "SELECT * FROM registrations " +
        "LEFT JOIN stores ON registrations.store_id=stores.store_id " +
        "where registrations.registration_code= ?";
    db.execute(query,[req.params.id]).then(function(rows){
        if(rows.length==1){
            var row ={
                id : req.params.id,
                nik : rows[0]['registration_nik'],
                name : rows[0]['registration_name'],
                store : {
                    store_id: rows[0]['store_id'],
                    store_name: rows[0]['store_name'],
                    store_address: rows[0]['store_address'],
                    store_city: rows[0]['store_city'],
                    store_province: rows[0]['store_province'],
                    store_lat: rows[0]['store_lat'],
                    store_long: rows[0]['store_long'],
                    store_type: rows[0]['store_type']
                },
                payment : rows[0]['method_id'],
                payment_name : rows[0]['payment_from'],
                reffno : rows[0]['payment_reffno'],
                competition_date : rows[0]['competition_date'],
                paid : rows[0]['registration_confirmation'],
                valid : rows[0]['registration_valid']
            };
            res.json({ code : 200, message: "success",data:row});
        }else{
            res.status(400).send({ code : 400, message: "contestant not registered" });
        }
    });
};

var history = function(req,res){
    if(!lib.empty(req.query.id)){
        var query = "SELECT * FROM contestants " +
            "JOIN competitions ON contestants.contestant_id=competitions.contestant_id " +
            "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
            "JOIN stores ON quotas.store_id=stores.store_id " +
            "where competitions.registration_code= ?";
        db.execute(query,[req.query.id]).then(function(rows){
            if(rows.length==1){
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
                            "no" : rows[0]['competition_no'],
                            "session" : rows[0]['quota_session'],
                            score : rows[0]['competition_score'],
                            status : rows[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
                        }
                    ],

                };
                res.json({ code : 200, message: "success",data:row});
            }else{
                res.status(400).send({ code : 200, message: "contestant not registered" });
            }
        });
    }else if(!lib.empty(req.query.nik)){
        var query = "SELECT * FROM contestants WHERE contestant_nik = ?";
        db.execute(query,[req.query.nik]).then(function(rows) {
            if (rows.length == 1) {
                var query = "SELECT * FROM competitions " +
                    "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
                    "JOIN stores ON quotas.store_id=stores.store_id " +
                    "where competitions.contestant_id = ?";
                db.execute(query,[rows[0].contestant_id]).then(function(rowsComp) {
                    var competitions = [];
                    for(i=0;i<rowsComp.length;i++){
                        competitions.push({
                            store : {
                                store_id: rowsComp[0]['store_id'],
                                store_name: rowsComp[0]['store_name'],
                                store_address: rowsComp[0]['store_address'],
                                store_city: rowsComp[0]['store_city'],
                                store_province: rowsComp[0]['store_province'],
                                store_full: rowsComp[0]['store_full'],
                                store_lat: rowsComp[0]['store_lat'],
                                store_long: rowsComp[0]['store_long'],
                                store_type: rowsComp[0]['store_type']
                            },
                            date : moment(rowsComp[0]['quota_date']).format("YYYY-MM-DD"),
                            "session" : rowsComp[0]['quota_session'],
                            "no" : rows[0]['competition_no'],
                            score : rowsComp[0]['competition_score'],
                            status : rowsComp[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
                        });
                    }
                    if (rows.length == 1) {
                        var row ={
                            id : req.params.id,
                            nik : rows[0]['contestant_nik'],
                            name : rows[0]['contestant_name'],
                            histories : competitions
                        };
                        res.json({ code : 200, message: "success",data:row});
                    }
                });
            }
        });
    }
};

var paymentMethod = function(req,res){
    var rows = [];
    db.execute("SELECT method_id,method_name,method_active FROM payment_method where method_active = 1").then(function(rows){
        res.json({ code : 200, message: "success",data:rows});
    });
};

var rek = function(i){
    var arr = {
        "fee_taken" : 0
    };
    db.execute("INSERT INTO fees SET ?", arr).then(function(){
        if(i<999){
            rek(i+1);
        }
    });

};


module.exports.checkLocation = checkLocation;
module.exports.regOnline = regOnline;
module.exports.registration = registration;
module.exports.loginConfirmation = loginConfirmation;
module.exports.confirmOnline = confirmOnline;
module.exports.confirmation = confirmation;
module.exports.paymentMethod = paymentMethod;
module.exports.rek = rek;
module.exports.status = status;
module.exports.statusReg = statusReg;
module.exports.history = history;
