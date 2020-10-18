const NanoBase = require('nanocurrency-web');

window.nanoUtil = {
    getKeypair: function (index, seed) {
        const accounts = NanoBase.wallet.accounts(seed, index, index)
        return {privKey: accounts[0].privateKey, pubKey: accounts[0].publicKey, address: accounts[0].address};
    },
    dummyNetwork: {
        bip32: {public: 0, private: 0},
        messagePrefix: '',
        pubKeyHash: 0,
        scriptHash: 0,
        wif: 0,
    },
}
