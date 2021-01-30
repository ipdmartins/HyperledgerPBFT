'use strict'

const { TransactionProcessor } = require('sawtooth-sdk/processor');
const pbftWalletHandler = require('./PbftWalletHandler');

if (process.argv.length < 3) {
    console.log('missing a validator address')
    process.exit(1)
  }

// In docker, the address would be the validator's container name
// with port 4004
// const address = process.env.ADDRESS || 'tcp://127.0.0.1:4004'; //'tcp://localhost:4004'

const address = process.argv[2]

const transactionProcessor = new TransactionProcessor(address);

transactionProcessor.addHandler(new pbftWalletHandler());

transactionProcessor.start()

console.log('Started transaction processor');