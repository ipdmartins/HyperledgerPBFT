
const {createHash} = require('crypto')
const {CryptoFactory, createContext } = require('sawtooth-sdk/signing')
const protobuf = require('sawtooth-sdk/protobuf')
const fs = require('fs')
const fetch = require('node-fetch');
const {Secp256k1PrivateKey} = require('sawtooth-sdk/signing/secp256k1')	

const {SW_FAMILY, SW_VERSION} = require('../../env')

function hash(v) {
    return createHash('sha512').update(v).digest('hex');
}

function encoder(word) {
  return btoa(word);
}

class PbftWalletClient {
    constructor(userid) {
      console.log('userid into PbftWalletClient: ' + userid)
      const privateKeyStrBuf = this.getUserPriKey(userid);
      console.log('privateKeyStrBuf into PbftWalletClient: ' + privateKeyStrBuf)
      const privateKeyStr = privateKeyStrBuf.toString().trim();
      console.log('privateKeyStr into PbftWalletClient: ' + privateKeyStr)
      const context = createContext('secp256k1');
      console.log('context into PbftWalletClient: ' + context)
      const privateKey = Secp256k1PrivateKey.fromHex(privateKeyStr);
      console.log('privateKey into PbftWalletClient: ' + privateKey)
      this.signer = new CryptoFactory(context).newSigner(privateKey);
      console.log('signer into PbftWalletClient: ' + signer)
      this.publicKey = this.signer.getPublicKey().asHex();
      console.log('this.publicKey into PbftWalletClient: ' + this.publicKey)
      this.address = hash("simplewallet").substr(0, 6) + hash(this.publicKey).substr(0, 64);
      console.log("Storing at: " + this.address);
    }
    
    balance() {
      let amount = this._send_to_rest_api(null);
      return amount;
    }
    
    transfer(user2, amount) {
      this._wrap_and_send("transfer", [amount, user2]);
    }
    
    getUserPriKey(userid) {
      console.log('getUserPriKey: ' + userid);
      console.log("Current working directory is: " + process.cwd());
      var userprivkeyfile = '/root/.sawtooth/keys/'+userid+'.priv';
      return fs.readFileSync(userprivkeyfile);
    }	
    
    getUserPubKey(userid) {
      console.log('getUserPubKey: ' + userid);
      console.log("Current working directory is: " + process.cwd());
      var userpubkeyfile = '/root/.sawtooth/keys/'+userid+'.pub';
      return fs.readFileSync(userpubkeyfile);
    }
    
    _wrap_and_send(action,values){
      var payload = ''
      const address = this.address;
      console.log("wrapping for: " + this.address);
      var inputAddressList = [address];
      var outputAddressList = [address];
      console.log('inputAddressList into PbftWalletClient: ' + inputAddressList)
      console.log('outputAddressList into PbftWalletClient: ' + outputAddressList)
      
      if (action === "transfer") {
        const pubKeyStrBuf = this.getUserPubKey(values[1]);
        console.log('pubKeyStrBuf into PbftWalletClient: ' + pubKeyStrBuf)
        const pubKeyStr = pubKeyStrBuf.toString().trim();
        console.log('pubKeyStr into PbftWalletClient: ' + pubKeyStr)
        var toAddress = hash("simplewallet").substr(0, 6) + hash(pubKeyStr).substr(0, 64);
        console.log('toAddress into PbftWalletClient: ' + toAddress)
        inputAddressList.push(toAddress);
        outputAddressList.push(toAddress);
        payload = action+","+values[0]+","+pubKeyStr;
        console.log('payload into PbftWalletClient: ' + payload)
      } else {
        payload = action+","+values[0];
        console.log('payload into PbftWalletClient: ' + payload)
      }	
      
      const payloadBytes = encoder(payload);
      console.log('payloadBytes into PbftWalletClient: ' + payloadBytes)
      const transactionHeaderBytes = protobuf.TransactionHeader.encoder({
        familyName: SW_FAMILY,
        familyVersion: SW_VERSION,
        inputs: inputAddressList,
        outputs: outputAddressList,
        signerPublicKey: this.signer.getPublicKey().asHex(),
        nonce: "" + Math.random(),
        batcherPublicKey: this.signer.getPublicKey().asHex(),
        dependencies: [],
        payloadSha512: hash(payloadBytes),
      }).finish();
      console.log('transactionHeaderBytes into PbftWalletClient: ' + transactionHeaderBytes)
      
      const transaction = protobuf.Transaction.create({
        header: transactionHeaderBytes,
        headerSignature: this.signer.sign(transactionHeaderBytes),
        payload: payloadBytes
      });
      
      const transactions = [transaction];
      console.log('transactions into PbftWalletClient: ' + transactions)
      const batchHeaderBytes = protobuf.BatchHeader.encoder({
        signerPublicKey: this.signer.getPublicKey().asHex(),
        transactionIds: transactions.map((txn) => txn.headerSignature),
      }).finish();
      console.log('batchHeaderBytes into PbftWalletClient: ' + batchHeaderBytes)
      
      const batchSignature = this.signer.sign(batchHeaderBytes);
      console.log('batchSignature into PbftWalletClient: ' + batchSignature)
      const batch = protobuf.Batch.create({
        header: batchHeaderBytes,
        headerSignature: batchSignature,
        transactions: transactions,
      });
      console.log('batch into PbftWalletClient: ' + batch)
      
      const batchListBytes = protobuf.BatchList.encoder({
        batches: [batch]
      }).finish();
      this._send_to_rest_api(batchListBytes);	
      console.log('batchListBytes into PbftWalletClient: ' + batchListBytes)
    }
    
    _send_to_rest_api(batchListBytes){
      if (batchListBytes == null) {
        var geturl = 'http://rest-api:8008/state/'+this.address
        console.log("Getting from: " + geturl);
        return fetch(geturl, {
          method: 'GET',
        })
        .then((response) => response.json())
        .then((responseJson) => {
          var data = responseJson.data;
          console.log('data into PbftWalletClient: ' + data)
          var amount = new Buffer(data, 'base64').toString();
          console.log('amount into PbftWalletClient: ' + amount)
          return amount;
        })
        .catch((error) => {
          console.error(error);
        }); 	
      } else{
        fetch('http://rest-api:8008/batches', {
 	        method: 'POST',
       	  headers: {
	          'Content-Type': 'application/octet-stream'
          },
          body: batchListBytes
        })
        .then((response) => response.json())
        .then((responseJson) => {
          console.log(responseJson);
        })
        .catch((error) => {
          console.error(error);
        }); 	
      }
    }
}
module.exports.PbftWalletClient = PbftWalletClient;
