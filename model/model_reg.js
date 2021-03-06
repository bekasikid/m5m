/**
 * Created by Ainul Yaqin on 10/16/2015.
 * TODO : bikin 2 langkah transaksi
 * 1. generate token dgn batasan waktu
 * 2. owner melakukan trx dgn menggunakan token tsb
 */
var lib = require('./model_library');
var db = require("./model_db");
//var moment = require("moment");
var moment = require('moment-timezone');
var Q = require("q");
var getIP = require('ipware')().get_ip;
var fee = 152000;
var qs = require("querystring");
var validator = require("email-validator");


var regOnline = function (req, res) {
    registration(req, res).then(function (result) {
        console.log(result);
        var kode = "";
        if(result.rc==200){
            kode = result.retval.data.id;
        }
        var log_reg = {
            log_datetime : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
            registration_code : kode,
            log_request : JSON.stringify(req.body),
            log_response : JSON.stringify(result.retval),
            log_ip : lib.getIP(req)
        };
        db.execute("INSERT INTO registrations_logs SET ?",log_reg).then(function(){
            res.json(result.retval);
        });
    });
};

var storeValid =  function(store,tgl,sess){
    var deferred = Q.defer();
    db.readQuery("SELECT * FROM stores WHERE store_id = ? AND store_runner = 1",[store]).then(function(rowsStore){
        if(rowsStore.length==1){

        }
    });
    return deferred.promise;
}

var checkQuotas = function (store, tgl, sess) {
    //musti validasi h-5
    //console.log(store+"||"+tgl+"||"+sess+"||");
    //console.log(moment(tgl, "YYYY-MM-DD").format("x"));
    var akhir = parseInt (moment(tgl, "YYYY-MM-DD").format("X"));
    var awal = parseInt(moment().format("X"));
    var detik = 5*24*60*60;
    //console.log("Hasil : "+(akhir-awal)+"||"+detik);
    var deferred = Q.defer();
    //var sess = 1;
    db.readQuery("SELECT * FROM stores WHERE store_id = ? AND store_runner = 1",[store]).then(function(rowsStore){
        if(rowsStore.length==1){
            db.execute("UPDATE quotas SET quota_space=quota_space-1 WHERE store_id = ? AND quota_date = ? AND quota_session = ? AND quota_space>0 AND quota_open = 1",
                [store, tgl, sess]).then(function (result) {
                if (result.affectedRows == 1) {
                    //console.log(result);
                    db.readQuery("SELECT * FROM quotas WHERE store_id = ? AND quota_date = ? AND quota_session = ?", [store, tgl, sess]).then(function (rowsQ) {
                        var kembalian = {
                            rc: 200,
                            quota_id: rowsQ[0].quota_id,
                            store_id: store,
                            quota_date: tgl,
                            quota_session: sess
                        };
                        deferred.resolve(kembalian);
                    });

                } else if (sess == 7) {
                    deferred.resolve({rc: 510});
                } else {
                    sess++;
                    checkQuotas(store, tgl, sess).then(function (hasil) {
                        deferred.resolve(hasil);
                    });

                }
            });
        }else{
            deferred.resolve({rc: 400});
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

    if (!lib.empty(req.body.email)) {
        if (!validator.validate(req.body.email)) {
            delete req.body.nik;
            deferred.resolve({
                rc: 400,
                retval: {
                    code: 400,
                    message: "Pendaftaran gagal, data tidak lengkap"
                }
            });
        }
    }


    if (!lib.empty(req.body.nik)) {
        var reg = {
            "registration_nik": req.body.nik,
            "registration_name": qs.unescape(req.body.name),
            "registration_dob": lib.empty(req.body.dob) ? "" : req.body.dob,
            "registration_address": lib.empty(req.body.address) ? "" : req.body.address,
            "registration_phone": req.body.phone,
            "registration_email": lib.empty(req.body.email) ? "" : qs.unescape(req.body.email),
            "registration_password": lib.empty(req.body.password) ? "" : req.body.password,
            "registration_date": moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
            "store_id": lib.empty(req.body.store_id) ? "" : req.body.store_id,
            "competition_date": lib.empty(req.body.competition_date) ? "" : req.body.competition_date,
            "competition_session": lib.empty(req.body.competition_session) ? 1 : req.body.competition_session,
            "registration_method": lib.empty(req.body.reg_from) ? "Online" : req.body.reg_from,
            "registration_gcm": lib.empty(req.body.gcm) ? "" : req.body.gcm,
            "created_date": moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
            "updated_date": moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
            "ip_req" : lib.getIP(req)
        };
        db.execute("INSERT INTO registrations SET ?", reg).then(function (row) {
            //console.log(row);
            if (row.insertId > 0) {
                retval = req.body;
                //retval['fee'] = fee + lib.generateFee(row.insertId);
                var uniquecode = lib.uniqueCode(row.insertId);
                retval['id'] = uniquecode;
                db.execute("UPDATE registrations SET registration_fee = ?, registration_code = ? WHERE registration_id = ?", [retval['fee'], uniquecode, row.insertId]).then(function () {
                    checkQuotas(req.body.store_id, req.body.competition_date, reg.competition_session).then(function (retQ) {
                        console.log(retQ);
                        console.log("halllooo");
                        if (retQ.rc == 200) {
                            db.execute("UPDATE registrations SET competition_session = ? WHERE registration_id = ?", [retQ.quota_session, row.insertId]).then(function () {
                                deferred.resolve({
                                    rc: 200,
                                    retval: {
                                        code: 200,
                                        message: "success",
                                        data: retval
                                    }
                                });
                            });
                        } else {
                            //console.log("gagal son");
                            deferred.resolve({
                                rc: 400,
                                retval: {
                                    code: 400,
                                    message: "Quota tidak tersedia, pilih jadwal yang lain"
                                }
                            });
                        }

                    });

                });

            } else {
                deferred.resolve({
                    rc: 400,
                    retval: {
                        code: 400,
                        message: "Pendaftaran gagal"
                    }
                });
            }
        }, function () {
            deferred.resolve({
                rc: 400,
                retval: {
                    code: 400,
                    message: "Pendaftaran gagal"
                }
            });
        });
    } else {
        deferred.resolve({
            rc: 400,
            retval: {
                code: 400,
                message: "Pendaftaran gagal, data tidak lengkap"
            }
        });
    }
    return deferred.promise;
};

var checkLocation = function (req, res) {
    var deferred = Q.defer();
    qL = "SELECT * FROM stores JOIN quotas ON quotas.store_id=stores.store_id WHERE SOUNDEX(?)= SOUNDEX(store_city) AND quota_space > 0 AND quota_date = ? AND store_runner = 1 LIMIT 1";
    db.readQuery(qL, [req.body.location, req.body.competition_date]).then(function (rowL) {
        //deferred.resolve(rowL);
        //console.log(rowL);
        if (rowL.length == 1) {
            req.body['store_id'] = rowL[0].store_id;
            registration(req, res).then(function (result) {
                deferred.resolve(result);
            });
        } else {
            deferred.resolve({
                rc: 511,
                retval: {error: "tidak ada tempat, atau pilihan kota salah"}
            });
        }

    });
    return deferred.promise;
};

var loginConfirmation = function (req, res) {
    var deferred = Q.defer();
    if (!lib.empty(req.body.id)) {
        db.readQuery("SELECT * FROM registrations WHERE registration_code = ? ", [req.body.id]).then(function (rows) {
            console.log(rows);
            if (rows.length == 0) {
                deferred.resolve({
                    rc: 400,
                    retval: {code: 400, message: "login failed"}
                });
            } else {
                delete rows[0].registration_password;
                db.execute("SELECT * FROM stores WHERE store_id = ?", [rows[0].store_id]).then(function (rowStore) {
                    var st = {};
                    if (rowStore.length == 1) {
                        var st = rowStore[0];
                    }
                    rows[0]['store'] = st;
                    delete rows[0].store_id;
                    rows[0]['registration_fee'] = fee + lib.generateFee(rows[0]['registration_id']);
                    deferred.resolve({
                        rc: 200,
                        retval: {code: 200, message: "success", data: rows[0]}
                    });
                });
            }
        });
    } else {
        deferred.resolve({
            rc: 400,
            retval: {code: 400, message: "Pendaftaran gagal"}
        });
    }
    return deferred.promise;
};

var sendMail = function (req, res) {
    //db.readQuery("SELECT * FROM registrations JOIN stores ON registrations.store_id = stores.store_id WHERE registration_code = ?",
    //    [req.params.id]).then(function (row) {
    //    db.execute("UPDATE registrations SET email_payment = 1 WHERE registration_code = ? AND email_payment = 0", [req.params.id]).then(function (resultUpdate) {
    //        if (resultUpdate.affectedRows == 1) {
    //            console.log(row);
    //            var fs = require('fs');
    //            fs.readFile('notif.html', function (err, data) {
    //                //if (err) {
    //                //    throw err;
    //                //}
    //                //console.log(data.toString());
    //                str = data.toString();
    //                var emailText = str.replace("{{nodaftar}}", row[0]['registration_code']);
    //                var emailText = emailText.replace("{{noktp}}", row[0]['registration_nik']);
    //                var emailText = emailText.replace("{{nama}}", row[0]['registration_name']);
    //                var emailText = emailText.replace("{{lokasi}}", row[0]['store_name']);
    //                var emailText = emailText.replace("{{tanggal}}", moment(row[0]['competition_date'],"YYYY-MM-DD").tz("Asia/Jakarta").format("DD/MM/YYYY"));
    //                var jam = "12:45";
    //                if(row[0]['competition_session']==4 || row[0]['competition_session']==5){
    //                    var jam = "13:45";
    //                }else if(row[0]['competition_session']==6 || row[0]['competition_session']==7){
    //                    var jam = "14:45";
    //                }
    //                var emailText = emailText.replace("{{jam}}", jam);
    //
    //                var emailText = emailText.replace("{{nominal}}", lib.number_format((150000 + lib.generateFee(row[0]['registration_id'])), 0, ",", "."));
    //                var emailText = emailText.replace(/{{total}}/g, lib.number_format((150000 + 2000 + lib.generateFee(row[0]['registration_id'])), 0, ",", "."));
    //                //var emailText = emailText.replace("{{ingat}}", lib.number_format((150000 + 2000 + lib.generateFee(row[0]['registration_id'])), 0, ",", "."));
    //
    //                var sendgrid = require("sendgrid")("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");
    //                var email = new sendgrid.Email();
    //
    //                email.addTo(row[0]['registration_email']);
    //                email.setFrom("info@menang5miliar.com");
    //                email.setFromName("Menang 5 Miliar");
    //                email.setSubject("Pembayaran Program Balap Makan Ayam");
    //                email.setHtml(emailText);
    //
    //                sendgrid.send(email, function (err, result) {
    //                    var fs = require('fs');
    //                    var stream = fs.createWriteStream("./logs/mail/" + moment().tz("Asia/Jakarta").format("YYYY-MM-DD") + "-send-payment.txt", {'flags': 'a'});
    //                    stream.once('open', function (fd) {
    //                        stream.write(moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss") + "||" + JSON.stringify(result) + "\n");
    //                        stream.end();
    //                    });
    //                });
                    res.send("sukses");
    //            });
    //        }else{
    //            res.send("gagal");
    //        }
    //    });
    //
    //});

}

var confirmOnline = function (req, res) {
    confirmation(req, res).then(function (result) {
        res.json(result.retval);
    });
};

var confirmation = function (req, res) {
    /*
     1. konfirmasi pembayaran merchant
     2. konfirmasi pembayaran transfer
     3. konfirmasi pembayaran melalui doku
     */
    /*
     konfirmasi
     */
    var deferred = Q.defer();
    if (!lib.empty(req.body.paymentMethod) && !lib.empty(req.body.id)) {
        if (req.body.paymentMethod == 1) {
            //musti di cek antara mereka konfirmasi dulu dengan dapet data settlement duluan dr kfc
            //kalo konfirmasi dulu, maka update table registrasi, dan input table contestant
            db.execute("UPDATE registrations SET registration_confirmation = 1, method_id = ? , payment_reffno = ?, registration_voucher =? WHERE registration_code = ? AND registration_valid in (0,2)",
                [req.body.paymentMethod, req.body.reffno, req.body.voucher, req.body.id]).then(function (row) {
                if (row.affectedRows == 0) {
                    db.readQuery("SELECT * FROM competitions JOIN contestants ON competitions.contestant_id = contestants.contestant_id JOIN quotas ON competitions.quota_id = quotas.quota_id JOIN stores ON quotas.store_id = stores.store_id  WHERE competitions.registration_code = ?", [req.body.id]).then(function(rowsCompetition){
                        if(rowsCompetition.length==1){
                            if(req.body.reg_from=="SMS"){
                                deferred.resolve({
                                    rc: 410,
                                    retval: {
                                        code: 410,
                                        message: "success",
                                        data: {
                                            id: req.body.id,
                                            no: rowsCompetition[0].competition_no,
                                            store: rowsCompetition[0].store_name,
                                            "date": rowsCompetition[0].quota_date,
                                            "session": rowsCompetition[0].quota_session
                                        }
                                    }
                                });
                            }else{
                                deferred.resolve({
                                    rc: 200,
                                    retval: {
                                        code: 200,
                                        message: "success",
                                        data: {
                                            id: req.body.id,
                                            no: rowsCompetition[0].competition_no,
                                            store: rowsCompetition[0].store_name,
                                            "date": rowsCompetition[0].quota_date,
                                            "session": rowsCompetition[0].quota_session
                                        }
                                    }
                                });
                            }

                        }else{
                            db.readQuery("SELECT * FROM registrations WHERE registration_code = ?", [req.body.id]).then(function (rowReg) {
                                //@TODO : tambahin filter quota msh buka ato tidak
                                db.execute("UPDATE vouchers SET voucher_taken = 1, voucher_taken_by = ?, voucher_taken_date = ?, updated_date = now() WHERE voucher_code = ? AND voucher_taken=0",
                                    [rowReg[0].registration_id, moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"), req.body.voucher])
                                    .then(function (rowV) {
                                        if (rowV.affectedRows == 1) {
                                            db.execute("UPDATE registrations SET registration_valid = 1 WHERE registration_code = ?", [req.body.id]).then(function () {
                                                //proses tambah peserta
                                                db.readQuery("SELECT * FROM contestants WHERE contestant_nik = ? AND contestant_name =?",[rowReg[0].registration_nik,rowReg[0].registration_name]).then(function(rowCon){
                                                    if(rowCon.length==0){
                                                        var cont = {
                                                            contestant_nik : rowReg[0].registration_nik,
                                                            contestant_name : rowReg[0].registration_name,
                                                            contestant_phone : rowReg[0].registration_phone,
                                                            created_date : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
                                                        };
                                                        db.execute("INSERT INTO contestants SET ? ",cont).then(function(resCont){
                                                            db.readQuery("SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id WHERE quotas.quota_date = ? AND quotas.quota_session = ? AND quotas.store_id = ?",
                                                                [rowReg[0].competition_date,rowReg[0].competition_session,rowReg[0].store_id]).then(function(rowsQuota){
                                                                db.readQuery("SELECT * FROM competitions WHERE registration_code = ?",[req.body.id]).then(function(rowsComp){
                                                                    console.log(rowsComp);
                                                                    if(rowsComp.length==0){
                                                                        var compRow = {
                                                                            quota_id : rowsQuota[0].quota_id,
                                                                            contestant_id : resCont.insertId,
                                                                            registration_code : req.body.id,
                                                                            competition_no : rowReg[0].store_id + lib.str_pad(rowReg[0].registration_id, 5, "0", "STR_PAD_LEFT"),
                                                                            created_date : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
                                                                        };
                                                                        console.log(compRow);
                                                                        db.execute("INSERT INTO competitions SET ?",compRow).then(function(){
                                                                            db.execute("UPDATE registrations SET email_ticket = 1 WHERE registration_code = ?", [req.body.id]).then(function () {
                                                                                deferred.resolve({
                                                                                    rc: 200,
                                                                                    retval: {
                                                                                        code: 200,
                                                                                        message: "success",
                                                                                        data: {
                                                                                            id : req.body.id,
                                                                                            no : compRow.competition_no,
                                                                                            store : rowsQuota[0].store_name,
                                                                                            "date" : rowsQuota[0].quota_date,
                                                                                            "session" : rowsQuota[0].quota_session
                                                                                        }
                                                                                    }
                                                                                });
                                                                            });
                                                                        })
                                                                    }else{
                                                                        deferred.resolve({
                                                                            rc: 400,
                                                                            retval: {
                                                                                code: 421,
                                                                                message: "Peserta sudah terdaftar",
                                                                                data: req.body
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            });
                                                        });
                                                    }else{
                                                        db.readQuery("SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id WHERE quotas.quota_date = ? AND quotas.quota_session = ? AND quotas.store_id = ?",[rowReg[0].competition_date,rowReg[0].competition_session,rowReg[0].store_id]).then(function(rowsQuota){
                                                            db.readQuery("SELECT * FROM competitions WHERE registration_code = ?",[req.body.id]).then(function(rowsComp){
                                                                console.log(rowsComp);
                                                                if(rowsComp.length==0){
                                                                    console.log(rowsComp.length);
                                                                    var compRow = {
                                                                        quota_id : rowsQuota[0].quota_id,
                                                                        contestant_id : rowCon[0].contestant_id,
                                                                        registration_code : req.body.id,
                                                                        competition_no : rowReg[0].store_id + lib.str_pad(rowReg[0].registration_id, 5, "0", "STR_PAD_LEFT"),
                                                                        created_date : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
                                                                    };
                                                                    console.log(compRow);
                                                                    db.execute("INSERT INTO competitions SET ?",compRow).then(function(){
                                                                        db.execute("UPDATE registrations SET email_ticket = 1 WHERE registration_code = ?", [req.body.id]).then(function () {
                                                                            deferred.resolve({
                                                                                rc: 200,
                                                                                retval: {
                                                                                    code: 200,
                                                                                    message: "success",
                                                                                    data: {
                                                                                        id : req.body.id,
                                                                                        no : compRow.competition_no,
                                                                                        store : rowsQuota[0].store_name,
                                                                                        "date" : rowsQuota[0].quota_date,
                                                                                        "session" : rowsQuota[0].quota_session
                                                                                    }
                                                                                }
                                                                            });
                                                                        });
                                                                    })
                                                                }else{
                                                                    deferred.resolve({
                                                                        rc: 400,
                                                                        retval: {
                                                                            code: 421,
                                                                            message: "Peserta sudah terdaftar",
                                                                            data: req.body
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        });
                                                    }
                                                });
                                            })
                                        } else {
                                            deferred.resolve({
                                                rc: 400,
                                                retval: {code: 450, message: "salah kode voucher"}
                                            });
                                        }
                                    });
                            });
                        }
                    });
                } else {
                    db.readQuery("SELECT * FROM registrations WHERE registration_code = ?", [req.body.id]).then(function (rowReg) {
                        db.execute("UPDATE vouchers SET voucher_taken = 1, voucher_taken_by = ?, voucher_taken_date = ?, updated_date = now() WHERE voucher_code = ? AND voucher_taken=0",
                            [rowReg[0].registration_id, moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"), req.body.voucher])
                            .then(function (rowV) {
                                if (rowV.affectedRows == 1) {
                                    db.execute("UPDATE registrations SET registration_valid = 1 WHERE registration_code = ?", [req.body.id]).then(function () {
                                        //proses tambah peserta
                                        db.readQuery("SELECT * FROM contestants WHERE contestant_nik = ? AND contestant_name =?",[rowReg[0].registration_nik,rowReg[0].registration_name]).then(function(rowCon){
                                            if(rowCon.length==0){
                                                var cont = {
                                                    contestant_nik : rowReg[0].registration_nik,
                                                    contestant_name : rowReg[0].registration_name,
                                                    contestant_phone : rowReg[0].registration_phone,
                                                    created_date : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
                                                };
                                                db.execute("INSERT INTO contestants SET ? ",cont).then(function(resCont){
                                                    db.readQuery("SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id WHERE quotas.quota_date = ? AND quotas.quota_session = ? AND quotas.store_id = ?",
                                                        [rowReg[0].competition_date,rowReg[0].competition_session,rowReg[0].store_id]).then(function(rowsQuota){
                                                        db.readQuery("SELECT * FROM competitions WHERE registration_code = ?",[req.body.id]).then(function(rowsComp){
                                                            console.log(rowsComp);
                                                           if(rowsComp.length==0){
                                                               var compRow = {
                                                                   quota_id : rowsQuota[0].quota_id,
                                                                   contestant_id : resCont.insertId,
                                                                   registration_code : req.body.id,
                                                                   competition_no : rowReg[0].store_id + lib.str_pad(rowReg[0].registration_id, 5, "0", "STR_PAD_LEFT"),
                                                                   created_date : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
                                                               };
                                                               console.log(compRow);
                                                               db.execute("INSERT INTO competitions SET ?",compRow).then(function(){
                                                                   db.execute("UPDATE registrations SET email_ticket = 1 WHERE registration_code = ?", [req.body.id]).then(function () {
                                                                       deferred.resolve({
                                                                           rc: 200,
                                                                           retval: {
                                                                               code: 200,
                                                                               message: "success",
                                                                               data: {
                                                                                   id : req.body.id,
                                                                                   no : compRow.competition_no,
                                                                                   store : rowsQuota[0].store_name,
                                                                                   "date" : rowsQuota[0].quota_date,
                                                                                   "session" : rowsQuota[0].quota_session
                                                                               }
                                                                           }
                                                                       });
                                                                   });
                                                               })
                                                           }else{
                                                               deferred.resolve({
                                                                   rc: 400,
                                                                   retval: {
                                                                       code: 421,
                                                                       message: "Peserta sudah terdaftar",
                                                                       data: req.body
                                                                   }
                                                               });
                                                           }
                                                        });
                                                    });
                                                });
                                            }else{
                                                db.readQuery("SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id WHERE quotas.quota_date = ? AND quotas.quota_session = ? AND quotas.store_id = ?",[rowReg[0].competition_date,rowReg[0].competition_session,rowReg[0].store_id]).then(function(rowsQuota){
                                                    db.readQuery("SELECT * FROM competitions WHERE registration_code = ?",[req.body.id]).then(function(rowsComp){
                                                        console.log(rowsComp);
                                                        if(rowsComp.length==0){
                                                            console.log(rowsComp.length);
                                                            var compRow = {
                                                                quota_id : rowsQuota[0].quota_id,
                                                                contestant_id : rowCon[0].contestant_id,
                                                                registration_code : req.body.id,
                                                                competition_no : rowReg[0].store_id + lib.str_pad(rowReg[0].registration_id, 5, "0", "STR_PAD_LEFT"),
                                                                created_date : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
                                                            };
                                                            console.log(compRow);
                                                            db.execute("INSERT INTO competitions SET ?",compRow).then(function(){
                                                                db.execute("UPDATE registrations SET email_ticket = 1 WHERE registration_code = ?", [req.body.id]).then(function () {
                                                                    deferred.resolve({
                                                                        rc: 200,
                                                                        retval: {
                                                                            code: 200,
                                                                            message: "success",
                                                                            data: {
                                                                                id : req.body.id,
                                                                                no : compRow.competition_no,
                                                                                store : rowsQuota[0].store_name,
                                                                                "date" : rowsQuota[0].quota_date,
                                                                                "session" : rowsQuota[0].quota_session
                                                                            }
                                                                        }
                                                                    });
                                                                });
                                                            })
                                                        }else{
                                                            deferred.resolve({
                                                                rc: 400,
                                                                retval: {
                                                                    code: 421,
                                                                    message: "Peserta sudah terdaftar",
                                                                    data: req.body
                                                                }
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    })
                                } else {
                                    deferred.resolve({
                                        rc: 400,
                                        retval: {code: 450, message: "salah kode voucher"}
                                    });
                                }
                            });
                    });

                }
            });
        } else if (req.body.paymentMethod == 4 || req.body.paymentMethod == 5) {
            db.execute("UPDATE registrations SET registration_confirmation = 1, method_id = ? , payment_reffno = ? WHERE registration_code = ? AND registration_confirmation = 0",
                [req.body.paymentMethod, req.body.reffno, req.body.id]).then(function (row) {
                if (row.affectedRows == 0) {
                    deferred.resolve({
                        rc: 200,
                        retval: {code: 410, message: "Sudah Melakukan Konfirmasi"}
                    });
                } else {
                    //@TODO : musti tambahin no peserta
                    deferred.resolve({
                        rc: 200,
                        retval: {
                            code: 200,
                            message: "success",
                            data: req.body
                        }
                    });
                }
            });
        } else if (req.body.paymentMethod == 2) {
            //@TODO : pembayaran lewat doku
            db.execute("UPDATE registrations SET registration_confirmation = 1, method_id = ? WHERE registration_code = ? AND registration_confirmation = 0",
                [req.body.paymentMethod, req.body.id]).then(function (row) {
                if (row.affectedRows == 0) {
                    //res.status(400).send({ error: "confirmation failed" });
                    deferred.resolve({
                        rc: 400,
                        retval: {code: 400, message: "Sudah Melakukan Konfirmasi"}
                    });
                } else {
                    //@TODO : musti tambahin no peserta
                    deferred.resolve({
                        rc: 200,
                        retval: {
                            code: 200,
                            message: "success",
                            data: req.body
                        }
                    });
                }
            });
        }
    } else {
        //res.status(400).send({ error: "failed" });
        deferred.resolve({
            rc: 400,
            retval: {code: 400, message: "Konfirmasi Tidak Berhasil"}
        });
    }
    return deferred.promise;
};

var status = function (req, res) {
    var query = "SELECT * FROM contestants " +
        "LEFT JOIN competitions ON contestants.contestant_id=competitions.contestant_id " +
        "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
        "JOIN stores ON quotas.store_id=stores.store_id " +
        "where competitions.registration_code= ?";
    db.readQuery(query, [req.params.id]).then(function (rows) {
        if (rows.length == 1) {
            var row = {
                id: req.params.id,
                nik: rows[0]['contestant_nik'],
                name: rows[0]['contestant_name'],
                store: {
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
                competition_date: moment(rows[0]['quota_date']).format("YYYY-MM-DD"),
                competition_session: rows[0]['quota_session'],
            };
            res.json({code: 200, message: "success", data: row});
        } else {
            res.status(400).send({code: 400, message: "Peserta belum terdaftar"});
        }
    });
};

var statusReg = function (req, res) {
    var query = "SELECT * FROM registrations LEFT JOIN competitions ON registrations.registration_code = competitions.registration_code  " +
        "LEFT JOIN stores ON registrations.store_id=stores.store_id " +
        "where registrations.registration_code= ?";
    db.readQuery(query, [req.params.id]).then(function (rows) {
        if (rows.length == 1) {
            if(lib.empty(rows[0].competition_id)){
                qStores = "SELECT * FROM stores JOIN cities ON stores.store_city = cities.city_code WHERE store_id = ?";
                pStores = [rows[0].store_id];
            }else{
                qStores = "SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id JOIN cities ON stores.store_city = cities.city_code WHERE quotas.quota_id = ?";
                pStores = [rows[0].quota_id];
            }
            db.readQuery(qStores,pStores).then(function(rowsStore){
                var row = {
                    id: req.params.id,
                    nik: rows[0]['registration_nik'],
                    name: rows[0]['registration_name'],
                    store: {
                        store_id: rowsStore[0]['store_id'],
                        store_name: rowsStore[0]['store_name'],
                        store_address: rowsStore[0]['store_address'],
                        store_city: rowsStore[0]['city_name'],
                        store_province: rowsStore[0]['city_province'],
                        store_lat: rowsStore[0]['store_lat'],
                        store_long: rowsStore[0]['store_long'],
                        store_type: rowsStore[0]['store_type']
                    },
                    payment: rows[0]['method_id'],
                    //payment_name: rows[0]['payment_from'],
                    //reffno: rows[0]['payment_reffno'],
                    competition_date: rows[0]['competition_date'],
                    competition_no: rows[0]['competition_no']
                    //paid: rows[0]['registration_confirmation'],
                    //valid: rows[0]['registration_valid']
                };
                res.json({code: 200, message: "success", data: row});
            });

        } else {
            res.status(400).send({code: 400, message: "Peserta belum terdaftar"});
        }
    });
};

var history = function (req, res) {
    if (!lib.empty(req.query.id)) {
        var query = "SELECT * FROM contestants " +
            "JOIN competitions ON contestants.contestant_id=competitions.contestant_id " +
            "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
            "JOIN stores ON quotas.store_id=stores.store_id " +
            "where competitions.registration_code= ?";
        db.readQuery(query, [req.query.id]).then(function (rows) {
            if (rows.length == 1) {
                var row = {
                    id: req.params.id,
                    nik: rows[0]['contestant_nik'],
                    name: rows[0]['contestant_name'],
                    histories: [
                        {
                            store: {
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
                            date: moment(rows[0]['quota_date']).format("YYYY-MM-DD"),
                            "no": rows[0]['competition_no'],
                            "session": rows[0]['quota_session'],
                            score: rows[0]['competition_score'],
                            status: rows[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
                        }
                    ],

                };
                res.json({code: 200, message: "success", data: row});
            } else {
                res.status(400).send({code: 200, message: "Peserta belum terdaftar"});
            }
        });
    } else if (!lib.empty(req.query.nik)) {
        var query = "SELECT * FROM contestants WHERE contestant_nik = ?";
        db.readQuery(query, [req.query.nik]).then(function (rows) {
            if (rows.length == 1) {
                var query = "SELECT * FROM competitions " +
                    "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
                    "JOIN stores ON quotas.store_id=stores.store_id " +
                    "where competitions.contestant_id = ?";
                db.readQuery(query, [rows[0].contestant_id]).then(function (rowsComp) {
                    var competitions = [];
                    for (i = 0; i < rowsComp.length; i++) {
                        competitions.push({
                            store: {
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
                            date: moment(rowsComp[0]['quota_date']).format("YYYY-MM-DD"),
                            "session": rowsComp[0]['quota_session'],
                            "no": rows[0]['competition_no'],
                            score: rowsComp[0]['competition_score'],
                            status: rowsComp[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
                        });
                    }
                    if (rows.length == 1) {
                        var row = {
                            id: req.params.id,
                            nik: rows[0]['contestant_nik'],
                            name: rows[0]['contestant_name'],
                            histories: competitions
                        };
                        res.json({code: 200, message: "success", data: row});
                    }
                });
            }
        });
    }
};

var paymentMethod = function (req, res) {
    var rows = [];
    db.readQuery("SELECT method_id,method_name,method_active FROM payment_method where method_active = 1").then(function (rows) {
        res.json({code: 200, message: "success", data: rows});
    });
};

var rek = function (i) {
    var arr = {
        "fee_taken": 0
    };
    db.execute("INSERT INTO fees SET ?", arr).then(function () {
        if (i < 999) {
            rek(i + 1);
        }
    });

};


var rubah = function (req, res) {
    db.readQuery("SELECT * FROM competitions WHERE registration_code = ?", [req.body.id]).then(function (rows) {
        console.log(rows);
        if(rows.length==1){
            checkQuotas(req.body.store_id, req.body.date, req.body.session_id).then(function (rowQ) {
                console.log(rowQ);
                if (rowQ.rc == 200) {
                    db.execute("UPDATE quotas SET quota_space = quota_space + 1 WHERE quota_id = ?", [rows[0].quota_id]).then(function () {
                        db.execute("UPDATE competitions SET quota_id = ? WHERE registration_code = ?", [rowQ.quota_id,req.body.id]).then(function () {
                            //sendmail perubahan
                            console.log(rowQ);
                            db.execute("UPDATE registrations SET competition_session = ?, email_ticket = 1 WHERE registration_code = ?",[rowQ.quota_session,req.body.id]).then(function(rows){
                                res.send("success");
                            });
                        });
                    });
                }
            });
        }else{
            db.readQuery("SELECT * FROM registrations WHERE registration_code = ?", [req.body.id]).then(function (rowsReg) {
                if(rowsReg[0].registration_valid==0){
                    checkQuotas(req.body.store_id, req.body.date, req.body.session_id).then(function (rowQ) {
                        if (rowQ.rc == 200) {
                            db.execute("UPDATE quotas SET quota_space = quota_space + 1 WHERE quota_id = ?", [rows[0].quota_id]).then(function () {
                                db.execute("UPDATE registrations SET competition_date = ?, competition_session = ?, store_id  = ? WHERE registration_code = ?",[req.body.date,req.body.session_id,req.body.store_id,req.body.id]).then(function(rows){
                                    res.send("success");
                                });
                            });
                        }
                    });
                }else if(rowsReg[0].registration_valid==2){
                    db.execute("UPDATE registrations SET competition_date = ?, competition_session = ?, store_id  = ? WHERE registration_code = ?",[req.body.date,req.body.session_id,req.body.store_id,req.body.id]).then(function(rows){
                        res.send("success");
                    });
                }

            });
        }
    });
};

module.exports.checkQuotas = checkQuotas;
module.exports.rubah = rubah;
module.exports.sendMail = sendMail;
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
