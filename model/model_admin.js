/**
 * Created by Ainul Yaqin on 10/16/2015.
 * TODO : bikin 2 langkah transaksi
 * 1. generate token dgn batasan waktu
 * 2. owner melakukan trx dgn menggunakan token tsb
 */
var lib = require('./model_library');
var db = require("./model_db");
var reg = require("./model_reg");
var moment = require("moment");
var Q = require("q");
var getIP = require('ipware')().get_ip;
var fee = 152000;

var participants = function (req, res) {

    if (!lib.empty(req.query.store_id) && !lib.empty(req.query.date)) {
        var query = "SELECT * FROM quotas JOIN stores ON quotas.store_id = stores.store_id WHERE quota.store_id = ? AND quotas.quota_date = ?";
        var params = [req.query.store_id, req.query.date];
        if (!lib.empty(req.query.session)) {
            query += " AND quota_session = ?";
            params.push(req.query.session);
        }
        db.readQuery(query, params).then(function (rows) {
            if (rows.length) {
                var datas = {};
                for (i = 0; i < rows.length; i++) {
                    if (i == 0) {
                        var datas = {
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
                            //date : moment(rows[0]['quota_date']).format("YYYY-MM-DD"),
                            date: rows[0]['quota_date'],
                            contestant: []
                        };
                        datas.contestant.push(
                            {
                                "session": rowsComp[0]['quota_session'],
                                "no": rows[0]['competition_no'],
                                score: rowsComp[0]['competition_score'],
                                status: rowsComp[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
                            }
                        );
                    }
                }
                //res.json(datas);
                res.json({code: 200, message: "success", data: datas});
            } else {
                res.json({code: 400, message: "data not found"});
            }
        });
    }
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
                "session": rows[0]['quota_session'],
                score: rows[0]['competition_score'],
                status: rows[0]['competition_eliminated'], // 1 elimininasi, 0 blom main, 2 menang
            }
        ],

    };
    //res.json(row);
    res.json({code: 200, message: "success", data: row});
};

var daftar = function (req, res) {
    /*
     query :
     id, nik, name, page, limit, sort, sortby, type
     */
    var deferred = Q.defer();

    var sort = "";
    var limit = "";
    if (req.query.tipe == 'total') {
        var query = "SELECT count(*)as total FROM registrations LEFT JOIN stores ON registrations.store_id=stores.store_id ";
    } else {
        var query = "SELECT * FROM registrations LEFT JOIN stores ON registrations.store_id=stores.store_id ";
        if (!lib.empty(req.query.sort)) {
            var urut = "";
            if (req.query.sort == "id") {
                urut = "registrations.registration_code"
            } else if (req.query.sort == "nik") {
                urut = "registrations.registration_nik"
            } else if (req.query.sort == "name") {
                urut = "registrations.registration_name"
            } else if (req.query.sort == "phone") {
                urut = "registrations.registration_phone"
            } else if (req.query.sort == "email") {
                urut = "registrations.registration_email"
            } else if (req.query.sort == "key") {
                urut = "registrations.registration_id"
            } else if (req.query.sort == "date") {
                urut = "registrations.registration_date"
            }
            sort = " ORDER BY " + urut + " " + req.query.sortby;
        }
        var limit = " LIMIT " + (parseInt(req.query.page) * parseInt(req.query.limit)) + "," + req.query.limit;
    }


    var wh = "";
    var where = [];
    var params = [];
    if (!lib.empty(req.query.id) || !lib.empty(req.query.nik) || !lib.empty(req.query.name) || !lib.empty(req.query.email) || !lib.empty(req.query.phone)) {
        if (!lib.empty(req.query.id)) {
            where.push(" registrations.registration_code = ? ");
            params.push(req.query.id);
        }

        if (!lib.empty(req.query.nik)) {
            where.push(" registrations.registration_nik = ? ");
            params.push(req.query.nik);
        }

        if (!lib.empty(req.query.name)) {
            where.push(" registrations.registration_name like ?");
            params.push("%" + req.query.name + "%");
        }

        if (!lib.empty(req.query.phone)) {
            where.push(" registrations.registration_phone = ?");
            params.push("%" + req.query.phone + "%");
        }

        if (!lib.empty(req.query.email)) {
            where.push(" registrations.registration_email like ?");
            params.push("%" + req.query.email + "%");
        }

        wh = " WHERE " + where.join(" AND ");
    }

    db.readQuery(query + wh + sort + limit, params).then(function (rows) {
        if (req.query.tipe == 'total') {
            deferred.resolve({rc: "00", total: rows[0].total});
        } else {
            deferred.resolve({rc: "00", rows: rows});
        }
    });
    return deferred.promise;
};

var mandiri = function (req, res) {
    var deferred = Q.defer();
    var sort = "";
    var limit = "";
    if (req.query.tipe == 'total') {
        var query = "SELECT count(*)as total FROM mandiri ";
    } else {
        var query = "SELECT * FROM mandiri ";

        sort = " ORDER BY mandiri_datetime DESC";

        if (!lib.empty(req.query.sort)) {
            var urut = "";
            if (req.query.sort == "tgl") {
                urut = "mandiri.mandiri_datetime";
            } else if (req.query.sort == "nominal") {
                urut = "mandiri.mandiri_credit";
            }else if (req.query.sort == "id") {
                urut = "mandiri.mandiri_id";
            }
            sort = " ORDER BY " + urut + " " + req.query.sortby;
        }

        var limit = " LIMIT " + (parseInt(req.query.page) * parseInt(req.query.limit)) + "," + req.query.limit;
    }
    //
    //
    var wh = "";
    var where = [];
    var params = [];
    if (!lib.empty(req.query.tgl) || !lib.empty(req.query.nominal)) {
        if (!lib.empty(req.query.tgl)) {
            where.push(" date(mandiri.mandiri_datetime) = ? ");
            params.push(req.query.tgl);
        }

        if (!lib.empty(req.query.nominal)) {
            where.push(" mandiri.mandiri_credit = ? ");
            params.push(req.query.nominal);
        }

        console.log(lib.empty(req.query.taken));
        wh = " WHERE " + where.join(" AND ");
    }

    db.readQuery(query+wh+sort+limit,params).then(function (rows) {
        if (req.query.tipe == 'total') {
            deferred.resolve({code: 200, message : "success", total: rows[0].total});
        } else {
            deferred.resolve({code: 200, message : "success", data: rows});
        }
        //deferred.resolve({
        //    code: 200,
        //    message: "success",
        //    data: rows
        //});
    });
    return deferred.promise;
};

var mandiriNotTaken = function(req,res){
    var deferred = Q.defer();
    db.readQuery("SELECT * FROM mandiri where is_taken=0 ORDER BY mandiri_credit ASC").then(function (rows) {
        if (req.query.tipe == 'total') {
            deferred.resolve({code: 200, message : "success", total: rows[0].total});
        } else {
            deferred.resolve({code: 200, message : "success", data: rows});
        }
        //deferred.resolve({
        //    code: 200,
        //    message: "success",
        //    data: rows
        //});
    });
    return deferred.promise;
}

var scores = function (req, res) {
    db.readQuery("SELECT * FROM competitions " +
        "JOIN contestants ON competitions.contestant_id=contestants.contestant_id " +
        "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
        "JOIN stores ON stores.store_id=quotas.store_id " +
        "WHERE quotas.quota_date = ?" +
        "ORDER BY competitions.competition_score ASC", [req.query.date]).then(function (rows) {
        var tables = [];
        for (i = 0; i < rows.length; i++) {
            tables.push({
                "store_id": rows[i].store_id,
                "store": rows[i].store_name,
                "name": rows[i].contestant_name,
                "score": rows[i].competition_score,
                "competition": req.query.date,
            });
        }
        //res.json(tables);
        res.json({code: 200, message: "success", data: tables});
    });
};

var leaderboard = function (req, res) {
    if (!lib.empty(req.query.date)) {
        scores(req, res);
    } else {
        db.readQuery("SELECT * FROM leaderboard " +
            "JOIN competitions ON leaderboard.competition_id = competitions.competition_id " +
            "JOIN contestants ON competitions.contestant_id=contestants.contestant_id " +
            "JOIN quotas ON quotas.quota_id=competitions.quota_id " +
            "JOIN stores ON stores.store_id=quotas.store_id " +
            "ORDER BY competition_date ASC").then(function (rows) {
            var tables = [];
            for (i = 0; i < rows.length; i++) {
                tables.push({
                    "store_id": rows[i].store_id,
                    "store": rows[i].store_name,
                    "name": rows[i].contestant_name,
                    "score": rows[i].competition_score,
                    "competition": rows[i].competition_date,
                });
            }
            //res.json(tables);
            res.json({code: 200, message: "success", data: tables});
        });
    }

};

var nearOutlets = function (req, res) {
    //var deferred = Q.defer();
    var query = "SELECT *, ( 3959 * ACOS( COS( RADIANS(?) ) * COS( RADIANS( store_lat ) ) * COS( RADIANS( store_long ) - RADIANS(?) ) + SIN( RADIANS(?) ) * SIN( RADIANS( store_lat ) ) ) ) AS distance FROM stores HAVING distance < 25 ORDER BY distance LIMIT 0,20"
    db.readQuery(query, [req.query.lat, req.query.lng, req.query.lat]).then(function (rows) {
        //console.log(rows);
        //deferred.resolve(rows);
        //res.json(rows);
        res.json({code: 200, message: "success", data: rows});
    });
    //return deferred.promise;
};

var rekapReg = function (req, res) {
    db.readQuery("SELECT COUNT(*)as jumlah FROM registrations").then(function (rowsJ) {
        db.readQuery("SELECT COUNT(*) jumlah_bayar FROM registrations WHERE registration_valid=1").then(function (rowsB) {
            var row = {
                code: 200,
                message: "success",
                data: {
                    daftar: rowsJ[0].jumlah,
                    bayar: rowsB[0].jumlah_bayar
                }
            }
            res.json(row);
        });
    });
};
var rekapDate = function (req, res) {
    db.readQuery("SELECT DATE(registrations.`registration_date`) tgl, COUNT(*) value FROM registrations JOIN stores ON registrations.`store_id` = stores.`store_id` JOIN cities ON stores.store_city=cities.city_code WHERE registrations.`registration_valid` = 1 GROUP BY DATE(registrations.`registration_date`) ORDER BY tgl ASC ").then(function (rows) {
        var row = {
            code: 200,
            message: "success",
            data: rows
        }
        res.json(row);
    });
};

var rekapCity = function (req, res) {
    db.readQuery("SELECT   cities.`city_id`,cities.`city_name`, COUNT(*) value FROM registrations JOIN stores ON registrations.`store_id` = stores.`store_id` JOIN cities ON stores.store_city = cities.city_code WHERE registrations.`registration_valid` = 1 GROUP BY cities.`city_id` ORDER BY cities.`city_name` ASC").then(function (rows) {
        var row = {
            code: 200,
            message: "success",
            data: rows
        }
        res.json(row);
    });
};

var rekapStores = function (req, res) {
    db.readQuery("SELECT stores.*,COUNT(*) value FROM registrations JOIN stores ON registrations.`store_id` = stores.`store_id` JOIN cities ON stores.store_city = cities.city_code WHERE registrations.`registration_valid` = 1 GROUP BY stores.`store_id` ORDER BY stores.`store_name` ASC").then(function (rows) {
        var row = {
            code: 200,
            message: "success",
            data: rows
        }
        res.json(row);
    });
};

var manualConfirm = function (req, res) {
    db.readQuery("SELECT * FROM registrations WHERE registration_code = ?", [req.params.id]).then(function (rows) {
        console.log(rows);
        if (rows.length == 1) {
            var row = rows[0];
            //update mandiri, cek dulu status registration validnya
            if (row.registration_valid == 2) {
                console.log(row.competition_date + "||" + row.competition_session);
                //kalo udah invalid, maka kembali booking quota
                //baru di sukseskan
                reg.checkQuotas(row.store_id, row.competition_date, row.competition_session).then(function (retQ) {
                    console.log(retQ);
                    if (retQ.rc == 200) {
                        if (row.method_id == 4) {
                            db.execute("UPDATE mandiri SET is_taken = 1, taken_by = ?, taken_date = ? WHERE mandiri_id = ? AND is_taken = 0", [row.registration_id, moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"), req.params.mandiri]).then(function (sukses) {
                                if (sukses.affectedRows == 1) {
                                    db.execute("UPDATE registrations SET competition_session = ?, registration_valid = 3 WHERE registration_code = ?", [retQ.quota_session, req.params.id]).then(function () {
                                        res.send("sukses");
                                    });

                                } else {
                                    res.send("gagal");
                                }

                            });
                        } else if (row.method_id == 2) {
                            db.execute("UPDATE registrations SET competition_session = ?, registration_valid = 3 WHERE registration_code = ?", [retQ.quota_session, req.params.id]).then(function () {
                                res.send("sukses");
                            });
                        }

                    }
                });
            } else if (row.registration_valid == 0) {
                //console.log(parseInt(row.method_id) == 4);
                if (row.method_id == 4) {
                    db.execute("UPDATE mandiri SET is_taken = 1, taken_by = ?, taken_date = ? WHERE mandiri_id = ? AND is_taken = 0", [row.registration_id, moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"), req.params.mandiri]).then(function (sukses) {
                        if (sukses.affectedRows == 1) {
                            db.execute("UPDATE registrations SET competition_session = ?, registration_valid = 3 WHERE registration_code = ?", [row.competition_session, req.params.id]).then(function () {
                                res.send("sukses");
                            });

                        } else {
                            res.send("gagal");
                        }

                    });
                } else if (row.method_id == 2) {
                    db.execute("UPDATE registrations SET competition_session = ?, registration_valid = 3 WHERE registration_code = ?", [row.competition_session, req.params.id]).then(function () {
                        res.send("sukses");
                    });
                }
            }
        }
    });
}

var ticketResend = function (req, res) {
    db.execute("UPDATE registrations SET email_ticket = 1 WHERE registration_code = ?", [req.params.id]).then(function () {
        db.readQuery("SELECT * FROM registrations WHERE registration_code = ?", [req.params.id]).then(function (row) {
            res.json({
                code: 200,
                message: "success",
                data: {
                    id: row[0].registration_code,
                    name: row[0].registration_name,
                    confirm: row[0].registration_confirmation,
                    valid: row[0].registration_valid,
                }
            });
        });
    });
};

var updateScore = function (req, res) {
    /*
     id
     sigin
     valid
     status
     record
     image_url
     record_url
     */
    db.readQuery("SELECT * FROM competitions where competition_no = ? ", [req.body.id]).then(function (rows) {
        if (rows.length == 1) {
            db.execute("UPDATE competitions SET competition_signin = ?, competition_eliminated = ?, competition_score = ?, image_url = ?, record_url = ? WHERE competition_no = ?",
                [req.body.signin, req.body.status, req.body.record, req.body.image_url, req.body.record_url, req.body.id]).then(function () {
                res.json({
                    code: 200,
                    message: "record updated"
                });
            });
        }
    });
};

var contestant = function (req, res) {
    var q = "SELECT competitions.registration_code, competition_no as id, contestant_nik, contestant_name, contestant_email, competition_signin as signin, competition_eliminated as status, store_name, quota_session as sesi, competition_score as record, image_url, record_url FROM competitions JOIN contestants ON competitions.contestant_id = contestants.contestant_id JOIN quotas ON quotas.quota_id = competitions.quota_id JOIN stores ON stores.store_id = quotas.store_id ";
    var w = " WHERE stores.store_id = ? AND quotas.quota_date = ?";
    db.readQuery(q + w, [req.params.store, req.params.date]).then(function (rows) {
        res.json({
            code: 200,
            message: "success",
            data: rows
        });
    });
};

var contestantAll = function (req, res) {
    var q = "SELECT competitions.registration_code, " +
        "competitions.competition_no as competition_id, " +
        "contestants.contestant_nik as registration_nik, " +
        "contestants.contestant_name as registration_name, " +
        "contestants.contestant_email as registration_email, " +
        "contestants.contestant_phone as registration_phone, " +
        "competitions.competition_signin as signed_in, " +
        "competitions.competition_eliminated as id_valid, " +
        "competitions.created_date as registration_date, " +
        "quotas.store_id, " +
        "store_name, " +
        "quota_date as competition_date, " +
        "quota_session as competition_session, " +
        "competition_score as time_minutes, " +
        "competition_second as time_seconds, " +
        "competition_millisecond as time_milliseconds, " +
        "competitions.session_winner, " +
        "image_url, " +
        "record_url " +
        "FROM competitions JOIN contestants ON competitions.contestant_id = contestants.contestant_id JOIN quotas ON quotas.quota_id = competitions.quota_id JOIN stores ON stores.store_id = quotas.store_id ";
    var w = " WHERE quotas.quota_date = ?";
    db.readQuery(q + w, [req.params.date]).then(function (rows) {
        res.json({
            code: 200,
            message: "success",
            data: rows
        });
    });
};

module.exports.updateScore = updateScore;
module.exports.contestantAll = contestantAll;
module.exports.contestant = contestant;
module.exports.ticketResend = ticketResend;
module.exports.manualConfirm = manualConfirm;
module.exports.rekapStores = rekapStores;
module.exports.rekapDate = rekapDate;
module.exports.rekapCity = rekapCity;
module.exports.rekapReg = rekapReg;
module.exports.mandiriNotTaken = mandiriNotTaken;
module.exports.mandiri = mandiri;
module.exports.participants = participants;
module.exports.daftar = daftar;
module.exports.leaderboard = leaderboard;
module.exports.nearOutlets = nearOutlets;