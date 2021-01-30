const axios = require('axios').default
const {createContext, CryptoFactory} = require('sawtooth-sdk/signing')
const {createHash} = require('crypto')
const {protobuf} = require('sawtooth-sdk')
const cbor = require('cbor')

const {SW_FAMILY, SW_NAMESPACE, SW_VERSION, hash} = require('../env')
const context = createContext('secp256k1')
const privateKey = context.newRandomPrivateKey()
const signer = new CryptoFactory(context).newSigner(privateKey)

let signature;

const payload = {
    Verb: 'set',
    Name: 'foo',
    Value: 42
}

const senderAddress = SW_NAMESPACE + hash("userPublicKey").substr(0, 64);

const payloadBytes = cbor.encode(payload)
// const payloadBytes = Buffer.from(JSON.stringify(payload)) alternatively

const transactionHeaderBytes = protobuf.TransactionHeader.encode({
    familyName: SW_FAMILY,
    familyVersion: SW_VERSION,
    inputs: [senderAddress],
    outputs: [senderAddress],
    signerPublicKey: signer.getPublicKey().asHex(),
    // In this example, we're signing the batch with the same private key,
    // but the batch can be signed by another party, in which case, the
    // public key will need to be associated with that key.
    batcherPublicKey: signer.getPublicKey().asHex(),
    // In this example, there are no dependencies.  This list should include
    // an previous transaction header signatures that must be applied for
    // this transaction to successfully commit.
    // For example,
    // dependencies: ['540a6803971d1880ec73a96cb97815a95d374cbad5d865925e5aa0432fcf1931539afe10310c122c5eaae15df61236079abbf4f258889359c4d175516934484a'],
    dependencies: [],
    payloadSha512: createHash('sha512').update(payloadBytes).digest('hex')
}).finish()

signature = signer.sign(transactionHeaderBytes)

const transaction = protobuf.Transaction.create({
    header: transactionHeaderBytes,
    headerSignature: signature,
    payload: payloadBytes
})

const transactions = [transaction]

const batchHeaderBytes = protobuf.BatchHeader.encode({
    signerPublicKey: signer.getPublicKey().asHex(),
    transactionIds: transactions.map((txn) => txn.headerSignature),
}).finish()

signature = signer.sign(batchHeaderBytes)

const batch = protobuf.Batch.create({
    header: batchHeaderBytes,
    headerSignature: signature,
    transactions: transactions
})

const batchListBytes = protobuf.BatchList.encode({
    batches: [batch]
}).finish()



axios.post('http://localhost:8008/batches', batchListBytes, {
    headers: {'Content-Type': 'application/octet-stream'}
}).then(Response => {
    console.log(Response.data)
}).catch(error => {
    console.log(error)
})