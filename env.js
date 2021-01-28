const crypto = require('crypto');

const hash = (input, length) => crypto.createHash('sha512')
  .update(input)
  .digest('hex')
  .toLowerCase()
  .slice(0, length)

const SW_FAMILY = 'PBFTwallet';
const SW_NAMESPACE = hash(SW_FAMILY).substring(0, 6);
const SW_VERSION = '1.0';

module.exports = {
    SW_FAMILY, SW_NAMESPACE, SW_VERSION, hash
}