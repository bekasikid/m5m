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
var domainWeb ="www.menang5miliar.com";
var getIP = require('ipware')().get_ip;
var callCenter = "08551555025";
var rekBCA = "";
var rekMandiri = "1240007326987 AN PT.GLOBAL DINAMIKA INTERNUSA";
var keyword = "kfc";

var responseSMS = function(to,textResponse,price){
    retval = "0,"+to+","+qs.escape(textResponse)+","+price;
    return retval;
};

var incomingSms  = function(req,res){
    console.log(req.query);
    if(!lib.empty(req.query.moid || !lib.empty(req.query.msgid))){
        var ip = getIP(req);
        var smsRow = {
            "provider_id" : lib.empty(req.query.moid)? req.query.msgid: req.query.moid,
            "provider" : "infinetwork",
            "sms_from": req.query.from,
            "sms_text": req.query.text,
            "sms_time" : moment(req.query.time,"YYYY-MM-DDHH:mm:ss").format("YYYY-MM-DD HH:mm:ss"),
            "sms_telcoid": req.query.telcoid,
            "sms_shortCode": req.query.shortcode,
            "query_param" : JSON.stringify(req.query),
            "ip_sender" : ip.clientIp
        };
        db.execute("INSERT INTO sms_receive SET ?", smsRow).then(function(row){
            //console.log(row);
            var words = smsRow.sms_text.toLowerCase();
            console.log(words);
            //var n = words.search("#");
            var valid = true;
            keyword = words.substr(0,4).substr(0,3);
            formatSms = "kfc#"+words.substr(4).trim();
            words = formatSms;
            console.log(words);
            //words = words.toLowerCase();
            //if(n>0){
            //    valid = 1;
                var text = words.split("#");
            //}else{ http://localhost:3000/sms-receive?from=085711226429&text=kfc%23daftar%2312312312313%23andree%23bandung%232016-03-22&time=2016-02-1222%3A00%3A00&moid=4&shortcode=85899&telcoid=1
            //    var text = words.split(" ");
            //}

            //console.log(text);
            if(!valid){
                var kata = "Pendaftaran ketik "+keyword+" DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DD/MM/YY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                //res.send("4 "+responseSMS(req.query.from,kata,500));
                res.send(responseSMS(req.query.from,kata,500));
            }else{
                console.log(text);
                if (text[1]== "daftar"){
                    if(!lib.empty(text[2])){
                        if(moment(text[5],"DDMMYYYY").isValid()){
                            req.body={
                                nik:text[2],
                                name:text[3],
                                phone : smsRow.sms_from,
                                location:text[4],
                                reg_from : "SMS",
                                competition_date: moment(text[5],"DDMMYYYY").format("YYYY-MM-DD")
                            };
                            console.log(req.body);
                            reg.checkLocation(req, res).then(function(result){
                                if (result.rc==200){
                                    var kata = "NO REG "+result.retval.data.id+", pembayaran dilakukan di outlet KFC terdekat. Info, syarat&ket hub "+callCenter+" atau "+domainWeb;
                                    res.send(responseSMS(req.query.from,kata,1000));
                                }else if (result.rc==511){
                                    var kata = "Format salah. Info, syarat & ket hub "+callCenter+" atau "+domainWeb;
                                    res.send(responseSMS(req.query.from,kata,500));
                                }
                            });
                        }else{
                            var kata = "Salah memasukkan tanggal, cth tgl 03032016 untuk ikut pada tanggal 3 Maret. Info, syarat & ket hub "+callCenter+" atau "+domainWeb;
                            res.send(responseSMS(req.query.from,kata,500));
                        }

                    }else{
                        var kata = "Pendaftaran ketik "+keyword+" DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DDMMYY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                        res.send(responseSMS(req.query.from,kata,1000));
                    }

                }else if (text[1]=="bayar"){
                    //var metode = 0;
                    //if ($text[3]=='kfc'){
                    //    metode=1;
                    //}
                    //else if ($text[3]=='mandiri'){
                    //    metode=4;
                    //}else if ($text[3]=='bca'){
                    //    metode=5;
                    //}

                    //if(metode==0){
                    //    //var kata = "Pembayaran ketik "+keyword+" BAYAR#(NO REG)#MANDIRI/BCA/KFC#NO STRUK kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                    //    var kata = "Pembayaran ketik "+keyword+" BAYAR#NO.REG#KodeVoucher#KodeBayar kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                    //    //res.send("4 "+responseSMS(req.query.from,kata,500));
                    //    res.send(responseSMS(req.query.from,kata,500));
                    //}else{
                        req.body={
                            id:text[2],
                            paymentMethod:1,
                            reffno:text[4],
                            voucher:text[3]
                        };
                        reg.confirmation(req, res).then(function(result){
                            console.log(result);
                            if (result.rc==200){
                                //panggil function reply sms
                                var jam = "12:45";
                                if(result.retval.data.session==4 || result.retval.data.session==5) {
                                    jam = "13:45";
                                }else if(result.retval.data.session==6 || result.retval.data.session==7) {
                                    jam = "14:45";
                                }
                                var tgl = moment(result.retval.data.date,"YYYY-MM-DD").format("DD/MM/YYYY")
                                var kata = "NO "+result.retval.data.no+", KFC "+result.retval.data.store+", tgl "+tgl+", jam "+jam+". datang tepat waktu,tunjukkan sms ini dan tanda pengenal";
                                res.send(responseSMS(req.query.from,kata,1000));
                            }else{
                                var kata = "Konfirmasi pembayaran tidak berhasil. Hub "+callCenter+" atau "+domainWeb;
                                res.send(responseSMS(req.query.from,kata,1000));
                            }
                        });
                    //}
                }else if (text[1]=="menang"){
                    res.json(smsRow);
                }else if (text[1]=="cara"){
                    var kata = "Pendaftaran ketik "+keyword+" DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DD/MM/YY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                    //res.send("4 "+responseSMS(req.query.from,kata,500));
                    res.send(responseSMS(req.query.from,kata,500));
                }else{
                    var kata = "Pendaftaran ketik "+keyword+"#DAFTAR#NO ID#NAMA LENGKAP#KOTA PILIHAN#TANGGAL TANDING PILIHAN DD/MM/YY kirim ke 95899, atau hub "+callCenter+" atau "+domainWeb;
                    //res.send("4 "+responseSMS(req.query.from,kata,500));
                    res.send(responseSMS(req.query.from,kata,500));
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

/*var responBalik = Function(req,res){

 };*/

module.exports.incomingSms  = incomingSms;