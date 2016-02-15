/**
 * Created by Andre on 10/02/2016.
 * @TODO : logic pemilihan kota, user ditawarin untuk meng sms balik dalam pilihan kota
 *          kfc#kota#<
 */

var lib = require('./model_library');
var db = require("./model_db");
var moment = require("moment");
var reg = require("./model_reg")
var Q = require("q");
var getIP = require('ipware')().get_ip;

var incomingSms = function(req,res){
    if(!lib.empty(req.query.moid || !lib.empty(req.query.msgid))){
        var sms = {
            "sms_id": lib.empty(req.query.moid)? req.query.msgid: req.query.moid,
            "sms_from": req.query.from,
            "sms_text": req.query.text,
            "sms_time": [req.query.time.slice(0, 10), " ", req.query.time.slice(10)].join(''),
            "sms_telcoid": req.query.telcoid,
            "sms_shortCode": req.query.shortcode
        };
        db.execute("INSERT INTO sms_receive SET ?", sms).then(function(row){
            var text = sms.sms_text.split("#");
            sms["text"] = text;
            console.log(text);
            if (text[1]== "daftar"){
                req.body={
                    nik:text[2],
                    name:text[3],
                    phone : sms.sms_from,
                    store_id:1,
                    competition_date:text[5]
                }
                console.log(req.body);
                reg.registration(req, res).then(function(result){
                    if (result.rc==200){
                        //panggil function reply sms

                    }
                });
            }else if (text[1]=="bayar"){
                req.body={
                    id:text[2],
                    paymentMethod:1,
                    reffno:text[3]
                }
                reg.confirmation(req, res);
            }else if (text[1]=="menang"){
                res.json(sms);
            }else{

            }

            /* parsing dibagi   :1. daftar
                                 2. cek jadwal
                                 3. cek pemenang
            */
            //res.json(sms);
        });
    }

};

/*var responBalik = Function(req,res){

};*/

module.exports.incomingSms = incomingSms;