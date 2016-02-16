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
        //host: "kfc.cbseeyyassm5.ap-southeast-1.rds.amazonaws.com",
        //user: "fonetix",
        //password: "Fonetix1pwD",
        //database: 'kfc',
        host: 'localhost',
        database: 'eatntreat',
        user: 'root',
        password: '',
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



module.exports.openConn = openConn;
module.exports.closeConn = closeConn;
module.exports.requestTrx = requestTrx;
module.exports.execute = execute;
