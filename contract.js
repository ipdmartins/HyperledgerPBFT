const { TransactionProcessor } = require('sawtooth-sdk/processor');

const pbftWalletHandler = require('./PbftWalletHandler');

// In docker, the address would be the validator's container name
// with port 4004
const address = process.env.ADDRESS || 'tcp://127.0.0.1:4004'; //'tcp://localhost:4004'

const transactionProcessor = new TransactionProcessor(address);

transactionProcessor.addHandler(new pbftWalletHandler());

transactionProcessor.start()

console.log('Started transaction processor');