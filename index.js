/**
 * Created by Ainul Yaqin on 10/16/2015.
 */
//"use strict";
var express = require('express');
var app = express();

//var db = require("./model/model_db");
var lib = require("./model/model_library");
var reg = require("./model/model_reg");
var filterModel = require("./model/model_filter");
var quotas = require("./model/model_quotas");

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded



/*untuk server trx*/
app.get('/', function(req, res){
    var iseng = {
        baru : 0
    };
    console.log(lib.empty(iseng.lama));
    res.send(lib.sha1('hello world'));
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
    filterModel.validateReq(req.res).then(function(retval){
        if(retval==200){
            reg.confirmation(req,res);
        } else{
            res.status(401).send({ error: "Unauthorized" });
        }
    });
});

app.get("/status/:id",function(req,res){
    reg.status(req,res);
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
app.post("login",function(req,res){
    filterModel.validateReq(req.res).then(function(retval){
        if(retval==200){
            reg.confirmation(req,res);
        } else{
            res.status(401).send({ error: "Unauthorized" });
        }
    });
});

app.get("/participants",function(req,res){

})

/*master data*/
app.get("/payment-method",function(req,res){
    reg.paymentMethod(req,res);
});

app.get("/stores",function(req,res){
    quotas.getStores(req,res);
});

/*
sms parsing
 */

app.get("/sms-receive",function(req,res){
    sms.incomeSms(req,res);
});

app.listen(process.env.PORT || 3000);
