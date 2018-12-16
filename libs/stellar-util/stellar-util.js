const createHmac = require('create-hmac');
const StellarBase = require('stellar-base');

window.stellarUtil = {

    HARDENED_OFFSET: 0x80000000,
    ED25519_CURVE: 'ed25519 seed',

    replaceDerive: (val) => val.replace("'", ''),

    getMasterKeyFromSeed: function (seed) {
        const hmac = createHmac('sha512', this.ED25519_CURVE);
        const I = hmac.update(Buffer.from(seed, 'hex')).digest();
        const IL = I.slice(0, 32);
        const IR = I.slice(32);
        return {
            key: IL,
            chainCode: IR,
        };
    },

    CKDPriv: ({key, chainCode}, index) => {
        const indexBuffer = Buffer.allocUnsafe(4);
        indexBuffer.writeUInt32BE(index, 0);
        const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer]);
        const I = createHmac('sha512', chainCode)
            .update(data)
            .digest();
        const IL = I.slice(0, 32);
        const IR = I.slice(32);
        return {
            key: IL,
            chainCode: IR,
        };
    },

    derivePath: function (path, seed) {

        const {key, chainCode} = this.getMasterKeyFromSeed(seed);
        const segments = path
            .split('/')
            .slice(1)
            .map(this.replaceDerive)
            .map(el => parseInt(el, 10));
        const result = segments.reduce((parentKeys, segment) => this.CKDPriv(parentKeys, segment + this.HARDENED_OFFSET), {key, chainCode});
        return StellarBase.Keypair.fromRawEd25519Seed(result.key);
    }
}
