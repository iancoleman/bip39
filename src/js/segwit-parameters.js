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

bitcoinjs.bitcoin.networks.testnet.p2wpkh = {
    baseNetwork: "testnet",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
        public: 0x045f1cf6,
        private: 0x045f18bc
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
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

bitcoinjs.bitcoin.networks.litecoin.p2wpkh = {
    baseNetwork: "litecoin",
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0
};

bitcoinjs.bitcoin.networks.litecoin.p2wpkhInP2sh = {
    baseNetwork: "litecoin",
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: {
        public: 0x01b26ef6,
        private: 0x01b26792
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0
};

bitcoinjs.bitcoin.networks.fujicoin.p2wpkh = {
    baseNetwork: "fujicoin",
    messagePrefix: '\x19FujiCoin Signed Message:\n',
    bech32: 'fc',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x24,
    scriptHash: 0x10,
    wif: 0xa4
};

bitcoinjs.bitcoin.networks.fujicoin.p2wpkhInP2sh = {
    baseNetwork: "fujicoin",
    messagePrefix: '\x19FujiCoin Signed Message:\n',
    bech32: 'fc',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 0x24,
    scriptHash: 0x10,
    wif: 0xa4
};

bitcoinjs.bitcoin.networks.vertcoin.p2wpkh = {
    baseNetwork: "vertcoin",
    messagePrefix: '\x18Vertcoin Signed Message:\n',
    bech32: 'vtc',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 71,
    scriptHash: 5,
    wif: 0x80
};

bitcoinjs.bitcoin.networks.vertcoin.p2wpkhInP2sh = {
    baseNetwork: "vertcoin",
    messagePrefix: '\x18Vertcoin Signed Message:\n',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 71,
    scriptHash: 5,
    wif: 0x80
};

bitcoinjs.bitcoin.networks.bgold.p2wpkh = {
    baseNetwork: "bgold",
    messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
    bech32: 'btg',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x26,
    scriptHash: 0x17,
    wif: 0x80,
};

bitcoinjs.bitcoin.networks.bgold.p2wpkhInP2sh = {
    baseNetwork: "bgold",
    messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
    bech32: 'btg',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 0x26,
    scriptHash: 0x17,
    wif: 0x80,
};

})();
