/**
 * Created by Ainul Yaqin on 10/16/2015.
 */
var moment = require("moment");
var status =
{
    "log_id": 0,
    "time_trx": moment().format("YYYY-MM-DD HH:mm:ss"),
    "rc": 0,
    //"message": "",
    "reffid": "",
    "terminal": "",
    "data" : {}
};

var statusMessage = function (noerr) {
    var data_status = [
        {noerr: 100, message: 'STATUS_OK'},
        {noerr: 200, message: 'STATUS_WAITING'},
        {noerr: 300, message: 'STATUS_FILTEROK'},
        {noerr: 301, message: 'STATUS_USERNOTFOUND'},
        {noerr: 302, message: 'STATUS_INVALIDSIGNKEY'},
        {noerr: 303, message: 'STATUS_NOTENOUGHCREDIT'},
        {noerr: 304, message: 'STATUS_PRODUCTNOTFOUND'},
        {noerr: 305, message: 'STATUS_TRXIDORREFFIDNOTFOUND'},
        {noerr: 306, message: 'STATUS_CONFIGNOTFOUND'},
        {noerr: 307, message: 'STATUS_CONFIGNOTCONFIGURE'},
        {noerr: 308, message: 'STATUS_INVALIDTARGET'},
        {noerr: 309, message: 'STATUS_CANNOTTRYINSAMETARGETANDPROD'},
        {noerr: 311, message: 'STATUS_USERSUSPENDED'},
        {noerr: 312, message: 'STATUS_TARGETREJECTED'},
        {noerr: 313, message: 'STATUS_QUOTAEXCEEDED'},
        {noerr: 314, message: 'STATUS_INVALIDREFFID'},
        {noerr: 315, message: 'STATUS_SERVERPROBLEM'},
        {noerr: 316, message: 'STATUS_TRXNOTFOUND'},
        {noerr: 317, message: 'STATUS_INVALIDIPADDRESS'},
        {noerr: 380, message: 'STATUS_SYSTEMCUTOFF'},
        {noerr: 399, message: 'STATUS_SYSTEMMAINTENANCE'},
        {noerr: 400, message: 'STATUS_INQUIRY_OK'},
        {noerr: 410, message: 'STATUS_USERACTIVE'},
        {noerr: 500, message: 'STATUS_FAILED'},
        {noerr: 501, message: 'STATUS_REJECT'},
        {noerr: 502, message: 'STATUS_INVALIDREQUEST'},
        {noerr: 503, message: 'STATUS_USERNOTFOUND'},
        {noerr: 504, message: 'STATUS_PASSWORDFAILED'},
        {noerr: 505, message: 'STATUS_INVALIDSIGNATURE'},
        {noerr: 506, message: 'STATUS_INVALIDIP'},
        {noerr: 507, message: 'STATUS_NOTENOUGHCREDIT'},
        {noerr: 508, message: 'STATUS_NOAVAILABLEROUTE'},
        {noerr: 509, message: 'STATUS_ROUTINGPROBLEM'},
        {noerr: 510, message: 'STATUS_INTERNALACCFAILED'},
        {noerr: 511, message: 'STATUS_TARGETBLOCKED'},
        {noerr: 512, message: 'STATUS_REGUNKNOWN'},
        {noerr: 513, message: 'STATUS_INVALIDREFFID'},
        {noerr: 514, message: 'STATUS_USERSUSPENDED'},
        {noerr: 515, message: 'STATUS_FAILED'},
        {noerr: 516, message: 'STATUS_ACCOUNTNOTFOUND'},
        {noerr: 517, message: 'STATUS_TRXTIMEOUT'},
        {noerr: 520, message: 'STATUS_BILLALREADYPAID'},
        {noerr: 521, message: 'STATUS_BILLOVERLIMIT'},
        {noerr: 522, message: 'STATUS_BILLNOTAVAILABLE'},
        {noerr: 530, message: 'STATUS_MEMBERALREADYREGISTERED'},
        {noerr: 531, message: 'STATUS_DATANOTCOMPLETE'},
        {noerr: 540, message: 'STATUS_PROVIDERERROR'},
        {noerr: 550, message: 'STATUS_SCHEDULENOTAVAILABLE'},
        {noerr: 555, message: 'STATUS_TRXCANCELLED'},
        {noerr: 570, message: 'STATUS_INVALIDBANK'},
        {noerr: 588, message: 'STATUS_REQEXPIRED'},
        {noerr: 599, message: 'STATUS_UNDEFINEDERR'},
        {noerr: 600, message: 'STATUS_PENDING'},
        {noerr: 601, message: 'STATUS_UNKNOWN'},
        {noerr: 612, message: 'STATUS_PENDING'},
        {noerr: 699, message: 'STATUS_EMPTYRESPONSE'}
    ];
    for (i = 0; i <= data_status.length; i++) {
        //console.log(data_status[i]);
        if (data_status[i].noerr == parseInt(noerr)) {
            return data_status[i].message;
        }
    }
    return "";
};

var retStatus = function (id, noerr, reffid,terminal,data) {
    noerr = parseInt(noerr);
    status.log_id = id;
    status.rc = noerr;
    //status.message = statusMessage(noerr);
    status.reffid = reffid;
    status.terminal = terminal;
    status.data = data
    return status;
}

var tokenStatus = function (rc,message, username,password) {
    if(rc==100){
        tStatus = {
            rc : rc,
            message : message,
            token_username : username,
            token_password : password
        };
    }else{
        tStatus = {
            rc : rc,
            message : message
        };
    }
    return tStatus;
}

module.exports.status = retStatus;
module.exports.tokenStatus = tokenStatus;