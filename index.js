/**
 * Created by Ainul Yaqin on 10/16/2015.
 */
//"use strict";
var express = require('express');
var app = express();

//var db = require("./model/model_db");
var lib = require("./model/model_library");
var admin = require("./model/model_admin");
var sms = require("./model/model_sms");
var qs = require("querystring");
var reg = require("./model/model_reg");
var filterModel = require("./model/model_filter");
var quotas = require("./model/model_quotas");
var cors = require('cors')

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(cors());


/*untuk server trx*/
app.get('/', function(req, res){
    //var iseng = {
    //    baru : 0
    //};
    //console.log(lib.empty(iseng.lama));
    res.send(qs.escape("hallo gw ainul keren"));
});

app.get("/generate",function(req,res){
    var id = lib.uniqueCode(9999999);
    res.send(id);
    //reg.rek(1);
    //res.send("sukses");
});


app.post("/registration",function(req,res){
    reg.regOnline(req,res);
});

app.post("/confirmation",function(req,res){
    reg.confirmation(req,res);
});

app.post("/confirmation-mobile",function(req,res){
    //id + "\n" + method + "\n" + body + "\n" + date
    filterModel.validateReq(req,res).then(function(retval){
        if(retval==200){
            reg.confirmation(req,res);
        } else{
            res.status(401).send({ error: "Unauthorized" });
        }
    });
});

app.post("/login-payment",function(req,res){
    filterModel.validateReq(req,res).then(function(retval){
        if(retval==200){
            reg.loginConfirmation(req,res).then(function(row){
                console.log(row);
                if(row.rc==200){
                    res.json(row.retval);
                }else{
                    res.status(401).send({ error: "Unauthorized" });
                }
            });
        } else{
            res.status(401).send({ error: "Unauthorized" });
        }
    });
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

/*back office*/
app.post("/login",function(req,res){
    filterModel.validateAdmin(req,res).then(function(retval){
        if(retval.rc==200){
            res.json(retval.row);
        } else{
            res.status(401).send({ error: "Unauthorized" });
        }
    });
});

app.get("/participants",function(req,res){

});
app.get("/leaderboard",function(req,res){
    admin.leaderboard(req,res);
});

app.get("/daftar",function(req,res){
    filterModel.validateAdmin(req,res).then(function(retval){
        if(retval.rc==200){
            //res.json(retval.row);
            admin.daftar(req,res).then(function(rows){
                if(req.query.tipe=='total'){
                    res.send(rows.total.toString());
                }else{
                    res.json(rows.rows);
                }
            });
        } else{
            res.status(401).send({ error: "Unauthorized" });
        }
    });
});

app.post("/update-score",function(req,res){
    //admin.score(req,res);
    //console.log(re)
    filterModel.validateAdmin(req,res).then(function(retval){
        if(retval.rc==200){
            res.json(req.body);
        }else{
            res.send("gagal");
        }
    });
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
    sms.incomingSms(req,res);
});

app.listen(process.env.PORT || 3000);
