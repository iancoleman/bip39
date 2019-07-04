const StellarBase = require('stellar-base');
const edHd = require('ed25519-hd-key');

window.stellarUtil = {
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
