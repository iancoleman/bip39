(function() {

// p2wpkh

bitcoinjs.bitcoin.networks.bitcoin.p2wpkh = {
    baseNetwork: "bitcoin",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
};

// p2wpkh in p2sh

bitcoinjs.bitcoin.networks.bitcoin.p2wpkhInP2sh = {
    baseNetwork: "bitcoin",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
};

bitcoinjs.bitcoin.networks.testnet.p2wpkhInP2sh = {
    baseNetwork: "testnet",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
        public: 0x044a5262,
        private: 0x044a4e28
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

bitcoinjs.bitcoin.networks.litecoin.p2wpkhInP2sh = {
    baseNetwork: "litecoin",
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bip32: {
        public: 0x01b26ef6,
        private: 0x01b26792
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0
};

})();
