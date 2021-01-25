const crypto = require('crypto');

exports.hash = (input) => crypto.createHash('sha512')
  .update(input)
  .digest('hex')
  .toLowerCase();

const SW_FAMILY = 'PBFTwallet';
const SW_NAMESPACE = hash(SW_FAMILY).substring(0, 6);
const SW_VERSION = '1.0';

module.exports = {
    SW_FAMILY, SW_NAMESPACE, SW_VERSION
}