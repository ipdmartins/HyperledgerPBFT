'use strict'

const { TransactionProcessor } = require('sawtooth-sdk/processor');
const pbftWalletHandler = require('./PbftWalletHandler');

if (process.argv.length < 3) {
    console.log('missing a validator address')
    process.exit(1)
  }

// In docker, the address would be the validator's container name with port 4004
const address = process.argv[2] || 'tcp://127.0.0.1:4004'; //'tcp://localhost:4004'

const transactionProcessor = new TransactionProcessor(address);

//addHandler can receive transaction processing requests. All handlers 
//must be added prior to starting the processor.
transactionProcessor.addHandler(new pbftWalletHandler());

//start connects the transaction processor to a validator and starts 
//listening for requests and routing them to an appropriate handler.
transactionProcessor.start()

console.log('address = process.argv[2]: '+ address);

console.log('Started transaction processor');