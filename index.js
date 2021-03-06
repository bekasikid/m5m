/**
 * Created by Ainul Yaqin on 10/16/2015.
 */
//"use strict";
var express = require('express');
var app = express();
app.enable('trust proxy',1);
//var db = require("./model/model_db");
var lib = require("./model/model_library");
var admin = require("./model/model_admin");
var sms = require("./model/model_sms");
var qs = require("querystring");
var reg = require("./model/model_reg");
var filterModel = require("./model/model_filter");
var quotas = require("./model/model_quotas");
var cors = require('cors');
var getIP = require('ipware')().get_ip;

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(cors());

app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next()
});

app.use('/logs', express.static('logs'));

/*untuk server trx*/
app.get('/', function(req, res){
    //var iseng = {
    //    baru : 0
    //};
    //console.log(lib.empty(iseng.lama));
    //var validator = require("email-validator");
    //console.log(validator.validate("email.com"));
    res.send("dev");
});

app.get("/generate",function(req,res){
    //var id = lib.uniqueCode(9999999);
    //res.send(id);
    var kodok = {
        bunting : 0
    }
    console.log(lib.empty(kodok.ngorek));
    res.send("hallo");
    //reg.rek(1);
    //res.send("sukses");
});

app.get("/kirim/:id",function(req,res){
    if(lib.whitelist(req)){
        reg.sendMail(req,res);
    }
});


app.post("/registration",function(req,res){
    if(lib.whitelist(req)){
        reg.regOnline(req,res);
    }
});

app.post("/confirmation",function(req,res){
    reg.confirmation(req,res).then(function(result){
        res.json(result.retval);
    });
});

app.post("/confirmation-mobile",function(req,res){
    //id + "\n" + method + "\n" + body + "\n" + date
    filterModel.validateReq(req,res).then(function(retval){
        if(retval==200){
            reg.confirmation(req,res).then(function(result){
                res.json(result.retval);
            });
        } else{
            res.status(401).send({ code : 401 , message: "Unauthorized" });
        }
    });
});

app.post("/login-payment",function(req,res){
    //ip ARX
    /*
     128.199.203.196
     188.166.207.104
     */
    if(lib.whitelist(req)){
        reg.loginConfirmation(req,res).then(function(row){
            //console.log(row);
            if(row.rc==200){
                res.json(row.retval);
            }else{
                res.status(401).send({ code : 401 , message: "Unauthorized" });
            }
        });
    }
});

app.get("/status/:id",function(req,res){
    reg.status(req,res);
});

app.get("/status-register/:id",function(req,res){
    reg.statusReg(req,res);
});

app.get("/history",function(req,res){
    reg.history(req,res);
});

app.get("/cities",function(req,res){
    quotas.getCities(req,res);
});

app.post("/update-participant",function(req,res){
    reg.confirmation(req,res);
});

app.get("/quota/:id/:dt",function(req,res){
    quotas.getQuotas(req,res);
});

app.get("/quota-close/:dt",function(req,res){
    quotas.closeQuota(req,res);
});

/*back office*/
app.post("/login",function(req,res){
    filterModel.validateAdmin(req,res).then(function(retval){
        if(retval.rc==200){
            //res.json(retval.row);
            res.json({ code : 200, message: "success",data:retval.row});
        } else{
            res.status(401).send({ code : 401, message: "unauthorized"});
        }
    });
});

app.get("/participants/:store/:date",function(req,res){
    admin.contestant(req,res);
});

app.get("/participants-all/:date",function(req,res){
    admin.contestantAll(req,res);
});

app.post("/update-score",function(req,res){
    admin.updateScore(req,res);
});

app.get("/leaderboard/:pos",function(req,res){
    admin.leaderboard(req,res);
});

app.get("/leaderboard-admin/:pos",function(req,res){
    admin.leaderboardAdmin(req,res);
});

app.get("/daftar",function(req,res){
    //filterModel.validateAdmin(req,res).then(function(retval){
    //    if(retval.rc==200){
            //res.json(retval.row);
            admin.daftar(req,res).then(function(rows){
                if(req.query.tipe=='total'){
                    res.send(rows.total.toString());
                }else{
                    res.json({
                        code: 200,
                        message: "success",
                        data : rows.rows
                        }
                    );
                }
            });
        //} else{
        //    res.status(401).send({ code : 401, message: "Unauthorized" });
        //}
    //});
});

app.get("/peserta",function(req,res){
    //filterModel.validateAdmin(req,res).then(function(retval){
    //    if(retval.rc==200){
    //res.json(retval.row);
    admin.peserta(req,res).then(function(rows){
        if(req.query.tipe=='total'){
            res.send(rows.total.toString());
        }else{
            res.json({
                    code: 200,
                    message: "success",
                    data : rows.rows
                }
            );
        }
    });
    //} else{
    //    res.status(401).send({ code : 401, message: "Unauthorized" });
    //}
    //});
});
app.post("/update-peserta",function(req,res){
    admin.updatePeserta(req,res);
});

app.post("/ganti-jadwal",function(req,res){
    reg.rubah(req,res);
});
/*master data*/
app.get("/payment-method",function(req,res){
    reg.paymentMethod(req,res);
});

app.get("/stores",function(req,res){
    quotas.getStores(req,res);
});

app.get("/stores-near",function(req,res){
    admin.nearOutlets(req,res);
});
/*
sms parsing
 */

app.get("/sms-receive",function(req,res){
    //202.158.19.226
    //var ip = getIP(req);
    //var ip = lib.getIP(req,ip);
    //if(ip.clientIp == "202.158.19.226"){
    //    sms.incomingSms(req,res);
    //}else{
    //    res.status(401).send({ code : 401, message: "unauthorized"});
    //}
    var telcoid = parseInt(req.query.telcoid);
    if(telcoid==2 || telcoid == 3){
        sms.incomingSms(req,res);
    }else{
        res.send("gagal");
    }


});

app.post("/sms-register",function(req,res){
    console.log(req.headers);
    reg.checkLocation(req,res).then(function(result){
        res.json(result);
    });
});

/*dashboards*/
app.get("/gdi/rekap",function(req,res){
    //if(lib.whitelist(req)){
        admin.rekapReg(req,res);
    //}

});

app.get("/rekap",function(req,res){
    if(lib.whitelist(req)){
        admin.rekapReg(req,res);
    }

});
app.get("/rekap-date",function(req,res){
    if(lib.whitelist(req)){
        admin.rekapDate(req,res);
    }

});

app.get("/rekap-cities",function(req,res){
    if(lib.whitelist(req)){
        admin.rekapCity(req,res);
    }
});

app.get("/rekap-stores",function(req,res){
    if(lib.whitelist(req)){
        admin.rekapStores(req,res);
    }
});

app.get("/manual-mandiri/:id/:mandiri",function(req,res){
    if(lib.whitelist(req)){
        admin.manualConfirm(req,res);
    }
});

app.get("/mandiri",function(req,res){
    var ip = lib.getIP(req);
    admin.mandiri(req,res).then(function(rows){
        res.json(rows);
    });
});

app.post("/mandiri-tambah",function(req,res){
    //var ip = lib.getIP(req);
    admin.mandiriTambah(req,res).then(function(rows){
        res.json(rows);
    });
});

app.get("/mandiri-not-taken",function(req,res){
    var ip = lib.getIP(req);
    admin.mandiriNotTaken(req,res).then(function(rows){
        res.json(rows);
    });
});

app.get("/ticket-resend/:id",function(req,res){
        admin.ticketResend(req,res);
});

app.listen(process.env.PORT || 3000);
