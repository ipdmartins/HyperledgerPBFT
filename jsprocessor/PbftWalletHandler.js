const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction, InternalError } = require('sawtooth-sdk/processor/exceptions')

const {SW_FAMILY, SW_NAMESPACE, SW_VERSION, hash} = require('./env')

const MIN_VALUE = 0;

function encoder(word) {
  return btoa(word);
}

function decoder(word) {
  return atob(word);  
}

//function to obtain the payload obtained from the client
const _decodeRequest = (payload) =>
  new Promise((resolve, reject) => {
    payload = payload.toString().split(',')
    if (payload.length === 2) {
      resolve({
        action: payload[0],
        amount: payload[1]
      })
    } else if (payload.length === 3) {
      resolve({
        action: payload[0],
        amount: payload[1],
        toKey: payload[2]
      })
    } else {
      let reason = new InvalidTransaction('Invalid payload serialization')
      reject(reason)
    }
  })

//function to display the errors
const _toInternalError = (err) => {
  console.log(" in error message block")
  let message = err.message ? err.message : err
  throw new InternalError(message)
}

//function to set the entries in the block using the "SetState" function
const _setEntry = (context, address, stateValue) => {
  let dataBytes = encoder(stateValue);
  let entries = {
    [address]: dataBytes
  }
  return context.setState(entries);
}

//function to make a transfer transaction
const makeTransfer = (context, senderAddress, amount, receiverAddress) => (possibleAddressValues) => {
  if (amount <= MIN_VALUE) {
    throw new InvalidTransaction('Amount is invalid')
  }

  let currentEntry = possibleAddressValues[senderAddress];
  let currentEntryTo = possibleAddressValues[receiverAddress];
  let senderBalance;
  let senderNewBalance = 0;

  let receiverBalance;
  let receiverNewBalance = 0;

  if (currentEntry == null || currentEntry == '') {
    console.log("No user (debitor)")
  }

  if (currentEntryTo == null || currentEntryTo == '') {
    console.log("No user (Creditor)")
  }

  senderBalance = decoder(currentEntry);
  senderBalance = parseInt(senderBalance);
  receiverBalance = decoder(currentEntryTo);
  receiverBalance = parseInt(receiverBalance)

  if (senderBalance < amount) {
    throw new InvalidTransaction("Not enough money to perform transfer operation")
  } else {
    console.log("Debiting amount from the sender:" + amount);
    senderNewBalance = senderBalance - amount;
    receiverNewBalance = receiverBalance + amount;
    let stateData = senderNewBalance.toString()
    _setEntry(context, senderAddress, stateData);
    stateData = receiverNewBalance.toString();
    console.log("Sender balance:" + senderNewBalance + ", Reciever balance:" + receiverNewBalance)
    return _setEntry(context, receiverAddress, stateData)
  }
}

class PbftWalletHandler extends TransactionHandler {
  constructor() {
    super(SW_FAMILY, [SW_VERSION], [SW_NAMESPACE])
  }

  apply(transactionProcessRequest, context) {
    // const senderAddress = SW_NAMESPACE + _hash(userPublicKey).substr(0, 64);

    return _decodeRequest(transactionProcessRequest.payload)
      .catch(_toInternalError)
      .then((update) => {
        let header = transactionProcessRequest.header
        let userPublicKey = header.signerPublicKey

        if (!update.action) {
          throw new InvalidTransaction('Action is required')
        }

        let amount = update.amount
        if (amount === null || amount === undefined) {
          throw new InvalidTransaction('Value is required')
        }

        amount = parseInt(amount)
        if (typeof amount !== "number" || amount <= MIN_VALUE) {
          throw new InvalidTransaction(`Value must be an integer ` + `no less than 1`)
        }
        
        // Select the action to be performed
        let actionFn
        if (update.action === 'transfer') {
          actionFn = makeTransfer
        } else if (update.action === 'balance') {
          actionFn = showBalance //?????
        }
        else {
          throw new InvalidTransaction(`Action must be create or take not ${update.action}`)
        }

        let senderAddress = SW_NAMESPACE + hash(userPublicKey).slice(-64)
        
        // this is the key obtained for the beneficiary in the payload , used only during transfer function
        let beneficiaryKey = update.toKey
        let receiverAddress
        if (beneficiaryKey != undefined) {
          receiverAddress = SW_NAMESPACE + hash(update.toKey).slice(-64)
        }

        // Get the current state, for the key's address:
        let getPromise
        if (update.action == 'transfer')
          getPromise = context.getState([senderAddress, receiverAddress])
        else
          getPromise = context.getState([senderAddress])
        let actionPromise = getPromise.then(
          actionFn(context, senderAddress, amount, receiverAddress)
        )
        return actionPromise.then(addresses => {
          if (addresses.length === 0) {
            throw new InternalError('State Error!')
          }
        })
      })
  }
}

module.exports = PbftWalletHandler;