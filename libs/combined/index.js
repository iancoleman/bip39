/* base-x */

let basex = require('base-x')

/* bchaddrjs */

let bchaddr = require('bchaddrjs')

/* bchaddrjs slp */

let bchaddrSlp = require('bchaddrjs-slp')

/* biginteger */

let BigInteger = require('javascript-biginteger')

/* bitcoinjs-bip38 */

let bip38 = require('bip38')

/* bitcoinjs-lib */

let bitcoin = require('bitcoinjs-lib')

/* buffer */

let buffer = require('buffer');

/* elastos */
// See https://github.com/iancoleman/bip39/pull/368
// and https://github.com/johnnynanjiang/Elastos.SDK.Keypair.Javascript/tree/iancoleman-bip39

let elastosjs = require('elastos-wallet-js')

/* ethereum-util */

let ethUtil = require('ethereumjs-util')

/* fast-levenshtein */

let levenshtein = require('fast-levenshtein')

/* groestlcoin */

let groestlcoinjs = require('groestlcoinjs-lib')

/* groestlcoin bip38 */

let groestlcoinjsBip38 = require('bip38grs')

/* kjua qr codes */

let kjua = require('kjua')

/* nebulas */

let nebulas = require('nebulas')

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

/* unorm */

let unorm = require('unorm')

/* zxcvbn */

let zxcvbn = require('zxcvbn')

/* exports */

module.exports = {
  basex,
  bchaddr,
  bchaddrSlp,
  buffer,
  BigInteger,
  bip38,
  bitcoin,
  elastosjs,
  ethUtil,
  groestlcoinjs,
  groestlcoinjsBip38,
  kjua,
  levenshtein,
  nebulas,
  stellarUtil,
  unorm,
  zxcvbn
}
