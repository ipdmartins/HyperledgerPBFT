
var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var {PbftWalletClient} = require('./PbftWalletClient') 

var urlencodedParser = bodyParser.urlencoded({ extended: false })

const pbftWalletClient = new PbftWalletClient('Depositer');
const data = { userId: pbftWalletClient.getAdrres, money: 100 }
pbftWalletClient.deposit(data);

router.get('/', function(req, res){
    res.redirect("/login");
})

//Get home view
router.get('/login', function(req, res){
    res.render('loginPage');
});

//Get main view
router.get('/home', function(req, res){
    res.render('homePage');
});

// Get Deposit view
router.get('/deposit',function(req, res){
    res.render('depositPage');
})

//Get Withdraw view
router.get('/withdraw',function(req, res){
    res.render('withdrawPage');
})

//Get Transfer View
router.get('/transfer',function(req, res){
    res.render('transferPage');
})

//Get Balance View
router.get('/balance', function(req, res){
    res.render('balancePage');
})

//recieve data from login page and save it.
router.post('/login', urlencodedParser, function(req, res){
    var userid = req.body.userId;
    res.send({done:1, userId: userid, message: "User Successfully Logged in as "+userid  });
});

//function to deposit amount in server
router.post('/deposit', function(req, res) {
    var userId = req.body.userId;
    var amount = req.body.money;
    var PbftWalletClient1 = new PbftWalletClient(userId); 
    PbftWalletClient1.deposit(amount);    
    res.send({message:"Amount "+ amount +" successfully added"});
});

//function to withdraw
router.post('/withdraw', function(req, res) {
    var userId = req.body.userId;
    var amount = req.body.money;
    var PbftWalletClient1 = new PbftWalletClient(userId);   
    PbftWalletClient1.withdraw(amount);     
    res.send({  message:"Amount "+ amount +" successfully deducted"});
});

//function to transfer money to another user
router.post('/transfer', function(req, res) {
    var userId = req.body.userId;
    var beneficiary = req.body.beneficiary;
    var amount = req.body.money;
    var client = new PbftWalletClient(userId);
    client.transfer(beneficiary, amount);    
    res.send({ message:"Amount "+ amount +" successfully added to " + beneficiary});
});

router.post('/balance', function(req, res){
    var userId = req.body.userId;
    var client = new PbftWalletClient(userId);
    var getYourBalance = client.balance();
    console.log(getYourBalance);
    getYourBalance.then(result => {res.send({ balance: result, message:"Amount " + result + " available"});});
})
module.exports = router;
