/**
 * Created by Ainul Yaqin on 10/18/2015.
 */
var mysql = require('mysql');
var Q = require("q");
var moment = require("moment");
var getIP = require('ipware')().get_ip;
var conn = null;
var pool = null;

var openConn = function () {
    pool = mysql.createPool({
        host: "kfc.cbseeyyassm5.ap-southeast-1.rds.amazonaws.com",
        user: "fonetix",
        password: "Fonetix1pwD",
        database: 'm5m',
        //host: 'localhost',
        //database: 'eatntreat',
        //user: 'root',
        //password: '',
        port:3306,
        dateStrings: 'date',
        connectionLimit: 400
    });
    return pool;
};

var openReadConn = function () {
    pool = mysql.createPool({
        host: "kfc-1.cbseeyyassm5.ap-southeast-1.rds.amazonaws.com:3306",
        user: "fonetix",
        password: "Fonetix1pwD",
        database: 'm5m',
        //host: 'localhost',
        //database: 'eatntreat',
        //user: 'root',
        //password: '',
        port:3306,
        dateStrings: 'date',
        connectionLimit: 400
    });
    return pool;
};

var closeConn = function (err) {

};

var execute = function (query, row) {
    var deferred = Q.defer();
    openConn();
    pool.getConnection(function (err, connPool) {
        //conn = connPool;
        console.log(query);
        console.log(row);
        connPool.query(query, row, function (err, rows) {
            connPool.destroy();
            if (err) {
                console.log(err);
                deferred.reject(err);
            } else {
                deferred.resolve(rows);
            }
        });
    });
    return deferred.promise;
};

var readQuery = function (query, row) {
    var deferred = Q.defer();
    openConn();
    pool.getConnection(function (err, connPool) {
        //conn = connPool;
        console.log(query);
        console.log(row);
        connPool.query(query, row, function (err, rows) {
            connPool.destroy();
            if (err) {
                console.log(err);
                deferred.reject(err);
            } else {
                deferred.resolve(rows);
            }
        });
    });
    return deferred.promise;
};

var requestTrx = function (unirest, url, param) {
    var deferred = Q.defer();
    unirest.post(url).header('Content-Type', 'application/json')
        .send(param).end(function (response) {
        deferred.resolve(response);
    });
    return deferred.promise;
}
function getFee (id){
    //musti mikirin kalo penuh
    var deferred = Q.defer();
    execute("UPDATE fees SET registration_id = ?, fee_taken = 1, date_taken = NOW() WHERE fee_taken = 0 ORDER BY fee_id LIMIT 1",[id]).then(function(){
        execute("SELECT * FROM fees WHERE registration_id = ?",[id]).then(function(rows){
            deferred.resolve(rows[0]);
        })
    });
    return deferred.promise;
}

module.exports.readQuery = readQuery;
module.exports.getFee = getFee;
module.exports.openConn = openConn;
module.exports.closeConn = closeConn;
module.exports.requestTrx = requestTrx;
module.exports.execute = execute;
