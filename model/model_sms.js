/**
 * Created by Andre on 10/02/2016.
 */

var lib = require('./model_library');
var db = require("./model_db");
var moment = require("moment");
var reg = require("./model_reg");
var qs = require("querystring");
var Q = require("q");
var getIP = require('ipware')().get_ip;
var domainWeb ="www.eatortreat.id";
var callCenter = "08551555025";
var rekBCA = "";
var rekMandiri = "";

var incomingSms  = function(req,res){
    console.log(req.query);
    if(!lib.empty(req.query.moid || !lib.empty(req.query.msgid))){
        var smsRow = {
            "sms_provider_id" : lib.empty(req.query.moid)? req.query.msgid: req.query.moid,
            "sms_provider_id" : "infinetwork",
            "sms_from": req.query.from,
            "sms_text": req.query.text,
            "sms_time": [req.query.time.slice(0, 10), " ", req.query.time.slice(10)].join(''),
            "sms_telcoid": req.query.telcoid,
            "sms_shortCode": req.query.shortcode
        };
        db.execute("INSERT INTO sms_receive SET ?", smsRow).then(function(row){
            var words = smsRow.sms_text.toLowerCase();
            var n = str.search("#");
            var valid = 0;
            keyword = words.substr(0,4).substr(0,3);
            formatSms = "kfc#"+words.substr(4).trim();
            words = formatSms;

            if(n>0){
                valid = 1;
                var text = words.split("#");
            }else{
                var text = words.split(" ");
            }

            if(valid){
                var kata = "Pendaftaran ketik KFC DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DD/MM/YY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                res.send("4 "+responseSMS(req.query.from,kata,500));
            }else{
                if (text[1]== "daftar"){
                    if(!lib.empty(text[2])){
                        var compDate = text[5].split("/");
                        req.body={
                            nik:text[2],
                            name:text[3],
                            phone : smsRow.sms_from,
                            location:text[4],
                            competition_date: compDate[2]+"-"+compDate[1]+"-"+compDate[0]
                        };
                        console.log(req.body);
                        reg.checkLocation(req, res).then(function(result){
                            if (result.rc==200){
                                //var kata = "NO REG "+result.retval.id+". Bayar ke BCA 7060013697 Mandiri 1200002132200 Rp. "+lib.number_format(result.retval.fee,0,",",".")+" atau ke KFC terdekat. Info, syarat & ket hub 08551555025 atau www.eatortreat.id";
                                var kata = "NO REG "+result.retval.id+". Bayar ke BCA "+rekBCA+" Mandiri "+rekMandiri+" Rp. "+lib.number_format(result.retval.fee,0,",",".")+" atau ke KFC terdekat. Info, syarat & ket hub "+callCenter+" atau "+domainWeb;
                                res.send("4 "+responseSMS(req.query.from,kata,1000));
                            }else if (result.rc==511){
                                var kata = "Format salah. Info, syarat & ket hub "+callCenter+" atau "+domainWeb;
                                res.send("4 "+responseSMS(req.query.from,kata,500));
                            }
                        });
                    }else{
                        var kata = "Pendaftaran ketik KFC DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DD/MM/YY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                        res.send("4 "+responseSMS(req.query.from,kata,5000));
                    }

                }else if (text[1]=="bayar"){
                    var metode = 0;
                    if ($text[3]=='kfc'){
                        metode=1;
                    }else if ($text[3]=='mandiri'){
                        metode=4;
                    }else if ($text[3]=='bca'){
                        metode=5;
                    }

                    if(metode==0){
                        var kata = "Pembayaran ketik KFC BAYAR#(NO REG)#MANDIRI/BCA/KFC#NO STRUK kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                        res.send("4 "+responseSMS(req.query.from,kata,500));
                    }else{
                        req.body={
                            id:text[2],
                            paymentMethod:metode,
                            reffno:text[4]
                        }
                        reg.confirmation(req, res).then(function(result){
                            console.log(result);
                            if (result.rc==200){
                                //panggil function reply sms
                                var kata = "NO REG "+result.retval.id+". Bayar ke BCA "+rekBCA+" Mandiri "+rekMandiri+" Rp. "+lib.number_format(result.retval.fee,0,",",".")+" atau ke KFC terdekat. Info, syarat & ket hub "+callCenter+" atau "+domainWeb;
                                res.send("4 "+responseSMS(req.query.from,kata,1000));
                            }
                        });
                    }

                }else if (text[1]=="menang"){
                    res.json(smsRow);
                }else if (text[1]=="cara"){
                    var kata = "Pendaftaran ketik KFC DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DD/MM/YY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                    res.send("4 "+responseSMS(req.query.from,kata,5000));
                }else{
                    var kata = "Pendaftaran ketik KFC#DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DD/MM/YY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                    res.send("4 "+responseSMS(req.query.from,kata,500));
                }
            }


            /* parsing dibagi   :1. daftar
             2. cek jadwal
             3. cek pemenang
             */
            //res.json(sms);
        });
    }

};

var responseSMS = function(to,textResponse,price){
    retval = "0,"+to+","+qs.escape(textResponse)+","+"1000";
    return retval;
}

/*var responBalik = Function(req,res){

 };*/

module.exports.incomingSms  = incomingSms;