const edHd = require('ed25519-hd-key');
const blake2b = require('blake2b');

window.nimiqUtil = {
    getKeypair: function (path, seed) {
        const result = edHd.derivePath(path, seed);

        const publicKey = edHd.getPublicKey(result.key, false);
        const address = blake2b(32)
            .update(publicKey)
            .digest('hex')
            .slice(0, 40);

        return {
            privKey: result.key,
            pubKey: publicKey,
            address: address,
        };
    },
    dummyNetwork: {
        bip32: {public: 0, private: 0},
        messagePrefix: '\x16Nimiq Signed Message:\n',
        pubKeyHash: 0,
        scriptHash: 0,
        wif: 0,
    },
}
