/* base-x */

let basex = require('base-x')

/* bitcoinjs-bip38 */

let bip38 = require('bip38')

/* bitcoinjs-lib */

let bitcoin = require('bitcoinjs-lib')

/* ethereum-util */

let ethUtil = require('ethereumjs-util')

/* stellar-util */

let StellarBase = require('stellar-base');
let edHd = require('ed25519-hd-key');
let stellarUtil = {
    getKeypair: function (path, seed) {
        const result = edHd.derivePath(path, seed);
        return StellarBase.Keypair.fromRawEd25519Seed(result.key);
    },
    dummyNetwork: {
        bip32: {public: 0, private: 0},
        messagePrefix: '',
        pubKeyHash: 0,
        scriptHash: 0,
        wif: 0,
    },
}

/* exports */

module.exports = {
  basex,
  bip38,
  bitcoin,
  ethUtil,
  stellarUtil
}
