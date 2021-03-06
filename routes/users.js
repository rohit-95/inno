var express = require('express');
var router = express.Router();
var Account = require('../models/account');
var Event = require('../models/event');
var userLogic = require('../logic/userLogic');
var multer = require('multer');
var http = require('http');

var upload = multer({
    dest: 'public/uploads/photoids/',
    limits: {fileSize: 10000000, files:1}
});



router.get('/details', userLogic.ensureAuthenticated, userLogic.getEvents, function (req, res) {
    res.render('details', {user: req.user, events: req.eventList});
});


router.post('/details', function (req, res) {
    Account.findOne({_id: req.user._id},
        function (err, user) {
            if(err) {
                res.render('error', {message: err.message, error: err});
            }

            first_edit = 0;

            if(user.is_new) {
                first_edit = 1;
            }
            if (user.email == null) {
                user.email = req.body.email;
            }
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.phone_no = req.body.phone_no;
            user.is_new = false;
            user.dob = req.body.dob;
            user.college = req.body.college;
            user.course = req.body.course;
            user.year = req.body.year;
            user.save(function (err, data) {
                if (err) {
                    console.log(err);
                    res.render('details', {user: req.user, edit: 'failure'})
                } else {
                    if(first_edit) {
                        var set = function(val, inno_id) {
                            if (val) {
                                console.log("Error: " + inno_id);
                            }
                        };
                        res.app.render('emails/welcome', {user: data}, function (err, html) {
                            userLogic.sendMail(data.email, "Welcome to Innovision'16!",
                                "Greetings " + data.firstName + " ,Now that you've registered for Innovision '16, we welcome you to this four dimensional journey through space-time.Your INNO ID is "+data.inno_id+". You will be able to register for events and participate in them (and probably win exciting prizes!) with this. Please carry your INNO ID and an identification proof on the days of the fest, i.e. 9th to 12th March. If you have any further queries please drop us a mail at pr.innovision.nsit@gmail.com. See you there, Team Innovision"
                                ,html, user.inno_id, set);
                        });
                    }
                    res.render('details', {user: data, edit: 'success'})
                }
            });
        });
});

router.get('/addEM', userLogic.isEM, function (req, res) {
    res.render('makeEM');
});

router.post('/addEM', userLogic.isEM, function(req, res) {
    var array = req.body.inno_ids.split(',');
    for(var i = 0; i < array.length; i++) {
        Account.findOne({inno_id: array[i]}, function(err, user) {
            if (err || !user)
                res.render('makeEM', {msg: "Failure"});
            else {
                user.is_em = true;
                user.save(function (err) {
                    if (!err)
                        res.render('makeEM', {msg: "Success"})
                    else
                        res.render('makeEM', {msg: "Failure"});
                });
            }
        })
    }
});


router.get('/oh/my/god/userInfo',function(req,res) {
    res.render('userInfo',{user:{}});
});

router.get('/userInfo', userLogic.isEM, function(req,res) {
    res.render('userInfo',{user:{}, admin: true});
});

router.post('/oh/my/god/userInfo',function(req,res) {
    if(req.body.inno_id[0] == 'I') {
        Account.findOne({inno_id:req.body.inno_id},function(err,user){

            if(!err && user) {
                res.render('userInfo', { msg: 'User Exists.', err:false, inno: true, user:user});
            } else {
                res.render('userInfo',{ msg: 'User Does Not Exist.', err:true});
            }
        });

    } else {

        http.get({
            host: 'nsit-moksha.com',
            path: '/api/account/check_user.php?user='+req.body.inno_id
        }, function(response) {
            // Continuously update stream with data
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('end', function() {

                // Data reception is done, do whatever with it!
                var parsed = JSON.parse(body);
                if(parsed.success == true) {
                    res.render('userInfo', {msg: 'User Exists.', err: false, user: parsed});
                } else {
                    res.render('userInfo', {msg: 'User Does Not Exists.', err: true, user: parsed});
                }
            });
        });


    }

});

router.get('/userInfo/:inno_id', userLogic.isEM, function(req,res) {
    Account.findOne({inno_id:req.params.inno_id},function(err,user){
        if(!err && user) {
            res.render('userInfo', { msg: 'User Exists.', err:false, inno: true, user:user, admin: true});
        } else {
            res.render('userInfo',{ msg: 'User Does Not Exist.', err:true});
        }
    });
});

router.post('/userInfo', userLogic.isEM, function(req,res) {
    Account.findOne({inno_id:req.body.inno_id},function(err,user){
        if(!err && user) {
            res.render('userInfo', { msg: 'User Exists.', err:false, inno: true, user:user});
        } else {
            res.render('userInfo',{ msg: 'User Does Not Exist.', err:true});
        }
    });
});


router.get('/photoUpload',userLogic.isEM, function(req,res) {
    res.render('photoUpload');
});

router.post('/photoUpload',userLogic.isEM, upload.single('userPhoto'), function(req,res) {
    Account.findOne({inno_id:req.body.inno_id},function(err,user){
        if(!err && user) {
            user.photoId = '/uploads/photoids/' + req.file.filename;
            user.save();
            res.render('photoUpload', {err: false, msg: 'Success'});
        } else {
            res.render('photoUpload', {err: true, msg: 'Failure'});
        }
    });

});

router.get('/photoUpload/:inno_id',function(req,res) {
    res.render('photoUpload',{inno_id:req.params.inno_id});
});



module.exports = router;
