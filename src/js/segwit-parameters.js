(function() {

// p2wpkh

libs.bitcoin.networks.bitcoin.p2wpkh = {
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

libs.bitcoin.networks.testnet.p2wpkh = {
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

libs.bitcoin.networks.regtest.p2wpkh = {
    baseNetwork: "regtest",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bcrt',
    bip32: {
        public: 0x045f1cf6,
        private: 0x045f18bc
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

// p2wpkh in p2sh

libs.bitcoin.networks.bitcoin.p2wpkhInP2sh = {
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

libs.bitcoin.networks.testnet.p2wpkhInP2sh = {
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

libs.bitcoin.networks.regtest.p2wpkhInP2sh = {
    baseNetwork: "regtest",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bcrt',
    bip32: {
        public: 0x044a5262,
        private: 0x044a4e28
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

// p2wsh

libs.bitcoin.networks.bitcoin.p2wsh = {
    baseNetwork: "bitcoin",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x02aa7ed3,
        private: 0x02aa7a99
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
};

libs.bitcoin.networks.testnet.p2wsh = {
    baseNetwork: "testnet",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
        public: 0x02575483,
        private: 0x02575048
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

libs.bitcoin.networks.regtest.p2wsh = {
    baseNetwork: "regtest",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bcrt',
    bip32: {
        public: 0x02575483,
        private: 0x02575048
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

// p2wsh in p2sh

libs.bitcoin.networks.bitcoin.p2wshInP2sh = {
    baseNetwork: "bitcoin",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x0295b43f,
        private: 0x0295b005
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
};

libs.bitcoin.networks.testnet.p2wshInP2sh = {
    baseNetwork: "testnet",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
        public: 0x024289ef,
        private: 0x024285b5
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

libs.bitcoin.networks.regtest.p2wshInP2sh = {
    baseNetwork: "regtest",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bcrt',
    bip32: {
        public: 0x024289ef,
        private: 0x024285b5
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

libs.bitcoin.networks.cranepay.p2wpkhInP2sh = {
    baseNetwork: "cranepay",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'cp',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 28,
    scriptHash: 10,
    wif: 123
};

// bech32
libs.bitcoin.networks.cranepay.p2wpkh = {
    baseNetwork: "cranepay",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'cp',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 28,
    scriptHash: 10,
    wif: 123
};




libs.bitcoin.networks.litecoin.p2wpkh = {
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

libs.bitcoin.networks.litecoin.p2wpkhInP2sh = {
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

libs.bitcoin.networks.fujicoin.p2wpkh = {
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

libs.bitcoin.networks.fujicoin.p2wpkhInP2sh = {
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

libs.bitcoin.networks.vertcoin.p2wpkh = {
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

libs.bitcoin.networks.vertcoin.p2wpkhInP2sh = {
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

libs.bitcoin.networks.bgold.p2wpkh = {
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

libs.bitcoin.networks.bgold.p2wpkhInP2sh = {
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

libs.bitcoin.networks.digibyte.p2wpkh = {
    baseNetwork: "digibyte",
    messagePrefix: 'x19DigiByte Signed Message:\n',
    bech32: 'dgb',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x3f,
    wif: 0x80
};

libs.bitcoin.networks.digibyte.p2wpkhInP2sh = {
    baseNetwork: "digibyte",
    messagePrefix: '\x19DigiByte Signed Message:\n',
    bech32: 'dgb',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x3f,
    wif: 0x80
};

libs.bitcoin.networks.blockstamp.p2wpkh = {
    baseNetwork: "blockstamp",
    messagePrefix: '\x18BlockStamp Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488B21E,
      private: 0x0488ADE4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif:  0x80,
};

libs.bitcoin.networks.blockstamp.p2wpkhInP2sh = {
    baseNetwork: "blockstamp",
    messagePrefix: '\x18BlockStamp Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488B21E,
      private: 0x0488ADE4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif:  0x80,
};

libs.bitcoin.networks.nix.p2wpkh = {
    baseNetwork: "nix",
    messagePrefix: '\x18Nix Signed Message:\n',
    bech32: 'nix',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      pubKeyHash: 0x26,
      scriptHash: 0x35,
      wif: 0x80,
};

libs.bitcoin.networks.nix.p2wpkhInP2sh = {
    baseNetwork: "nix",
    messagePrefix: '\x18Nix Signed Message:\n',
    bech32: 'nix',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      pubKeyHash: 0x26,
      scriptHash: 0x35,
      wif: 0x80,
};

libs.bitcoin.networks.cpuchain.p2wpkh = {
    baseNetwork: "cpuchain",
    messagePrefix: '\x1DCPUchain Signed Message:\n',
    bech32: 'cpu',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x1c,
    scriptHash: 0x1e,
    wif: 0x80,
};

libs.bitcoin.networks.cpuchain.p2wpkhInP2sh = {
    baseNetwork: "cpuchain",
    messagePrefix: '\x1DCPUchain Signed Message:\n',
    bech32: 'cpu',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 0x1c,
    scriptHash: 0x1e,
    wif: 0x80,
};

libs.bitcoin.networks.monkeyproject.p2wpkh = {
    baseNetwork: "monkeyproject",
	messagePrefix: 'Monkey Signed Message:\n',
	bech32: 'monkey',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488dde4
	},
	pubKeyHash: 0x33,
	scriptHash: 0x1c,
	wif: 0x37
};

libs.bitcoin.networks.monkeyproject.p2wpkhInP2sh = {
	baseNetwork: "monkeyproject",
	messagePrefix: 'Monkey Signed Message:\n',
	bech32: 'monkey',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488dde4
	},
	pubKeyHash: 0x33,
	scriptHash: 0x1c,
	wif: 0x37
};

libs.bitcoin.networks.atom.p2wpkh = {
    baseNetwork: "atom",
	messagePrefix: '\x18Bitcoin Atom Signed Message:\n',
	bech32: 'atom',
	bip32: {
		public: 0x0488B21E,
		private: 0x0488ADE4
	},
	pubKeyHash: 0x17,
	scriptHash: 0x0a,
	wif: 0x80
};

libs.bitcoin.networks.atom.p2wpkhInP2sh = {
	baseNetwork: "atom",
	messagePrefix: '\x18Bitcoin Atom Signed Message:\n',
	bech32: 'atom',
	bip32: {
		public: 0x0488B21E,
		private: 0x0488ADE4
	},
	pubKeyHash: 0x17,
	scriptHash: 0x0a,
	wif: 0x80
};

libs.bitcoin.networks.bitcore.p2wpkh = {
    baseNetwork: "bitcore",
	messagePrefix: '\x18BitCore Signed Message:\n',
	bech32: 'bitcore',
	bip32: {
		public: 0x0488B21E,
		private: 0x0488ADE4
	},
	pubKeyHash: 0x03,
	scriptHash: 0x7D,
	wif: 0x80
};

libs.bitcoin.networks.bitcore.p2wpkhInP2sh = {
	baseNetwork: "bitcore",
	messagePrefix: '\x18BitCore Signed Message:\n',
	bech32: 'bitcore',
	bip32: {
		public: 0x0488B21E,
		private: 0x0488ADE4
	},
	pubKeyHash: 0x03,
	scriptHash: 0x7D,
	wif: 0x80
};

libs.bitcoin.networks.monacoin.p2wpkh = {
    baseNetwork: "monacoin",
	messagePrefix: '\x18Monacoin Signed Message:\n',
	bech32: 'mona',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4
	},
	pubKeyHash: 0x32,
	scriptHash: 0x37,
	wif: 0xb0
};

libs.bitcoin.networks.monacoin.p2wpkhInP2sh = {
	baseNetwork: "monacoin",
	messagePrefix: '\x18Monacoin Signed Message:\n',
	bech32: 'mona',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4
	},
	pubKeyHash: 0x32,
	scriptHash: 0x37,
	wif: 0xb0
};

libs.bitcoin.networks.syscoin.p2wpkh = {
    baseNetwork: "syscoin",
	messagePrefix: '\x18Syscoin Signed Message:\n',
	bech32: 'sys',
	bip32: {
		public: 0x04b24746,
		private: 0x04b2430c
	},
	pubKeyHash: 0x3f,
	scriptHash: 0x05,
	wif: 0x80
};

libs.bitcoin.networks.syscoin.p2wpkhInP2sh = {
	baseNetwork: "syscoin",
	messagePrefix: '\x18Syscoin Signed Message:\n',
	bech32: 'sys',
	bip32: {
		public: 0x049d7cb2,
		private: 0x049d7878
	},
	pubKeyHash: 0x3f,
	scriptHash: 0x05,
	wif: 0x80
};

libs.bitcoin.networks.viacoin.p2wpkh = {
    baseNetwork: "viacoin",
	messagePrefix: '\x18Viacoin Signed Message:\n',
	bech32: 'viacoin',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4
	},
	pubKeyHash: 0x47,
	scriptHash: 0x21,
	wif: 0xc7
};

libs.bitcoin.networks.viacoin.p2wpkhInP2sh = {
	baseNetwork: "viacoin",
	messagePrefix: '\x18Viacoin Signed Message:\n',
	bech32: 'viacoin',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4
	},
	pubKeyHash: 0x47,
	scriptHash: 0x21,
	wif: 0xc7
};

libs.bitcoin.networks.dogecointestnet.p2wpkh = {
    baseNetwork: "dogecointestnet",
	messagePrefix: '\x19Dogecoin Signed Message:\n',
	bech32: 'dogecointestnet',
	bip32: {
		public: 0x043587cf,
		private: 0x04358394
	},
	pubKeyHash: 0x71,
	scriptHash: 0xc4,
	wif: 0xf1
};

libs.bitcoin.networks.dogecointestnet.p2wpkhInP2sh = {
	baseNetwork: "dogecointestnet",
	messagePrefix: '\x19Dogecoin Signed Message:\n',
	bech32: 'dogecointestnet',
	bip32: {
		public: 0x043587cf,
		private: 0x04358394
	},
	pubKeyHash: 0x71,
	scriptHash: 0xc4,
	wif: 0xf1
};

libs.bitcoin.networks.dogecointestnet.p2wpkh = {
    baseNetwork: "dogecointestnet",
	messagePrefix: '\x19Dogecoin Signed Message:\n',
	bech32: 'dogecointestnet',
	bip32: {
		public: 0x043587cf,
		private: 0x04358394
	},
	pubKeyHash: 0x71,
	scriptHash: 0xc4,
	wif: 0xf1
};

libs.bitcoin.networks.dogecointestnet.p2wpkhInP2sh = {
	baseNetwork: "dogecointestnet",
	messagePrefix: '\x19Dogecoin Signed Message:\n',
	bech32: 'dogecointestnet',
	bip32: {
		public: 0x043587cf,
		private: 0x04358394
	},
	pubKeyHash: 0x71,
	scriptHash: 0xc4,
	wif: 0xf1
};

libs.bitcoin.networks.litecointestnet.p2wpkh = {
    baseNetwork: "litecointestnet",
	messagePrefix: '\x18Litecoin Signed Message:\n',
	bech32: 'litecointestnet',
	bip32: {
		public: 0x043587cf,
		private: 0x04358394
	},
	pubKeyHash: 0x6f,
	scriptHash: 0xc4,
	wif: 0xef
};

libs.bitcoin.networks.litecointestnet.p2wpkhInP2sh = {
	baseNetwork: "litecointestnet",
	messagePrefix: '\x18Litecoin Signed Message:\n',
	bech32: 'litecointestnet',
	bip32: {
		public: 0x043587cf,
		private: 0x04358394
	},
	pubKeyHash: 0x6f,
	scriptHash: 0xc4,
	wif: 0xef
};

libs.bitcoin.networks.groestlcoin.p2wpkh = {
    baseNetwork: "groestlcoin",
    messagePrefix: '\x19GroestlCoin Signed Message:\n',
    bech32: 'grs',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x24,
    scriptHash: 0x05,
    wif: 0x80,
};

libs.bitcoin.networks.groestlcointestnet.p2wpkh = {
    baseNetwork: "groestlcointestnet",
    messagePrefix: '\x19GroestlCoin Signed Message:\n',
    bech32: 'tgrs',
    bip32: {
        public: 0x045f1cf6,
        private: 0x045f18bc
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

libs.bitcoin.networks.groestlcoin.p2wpkhInP2sh = {
    baseNetwork: "groestlcoin",
    messagePrefix: '\x19GroestlCoin Signed Message:\n',
    bech32: 'grs',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 0x24,
    scriptHash: 0x05,
    wif: 0x80,
};

libs.bitcoin.networks.groestlcointestnet.p2wpkhInP2sh = {
    baseNetwork: "groestlcointestnet",
    messagePrefix: '\x19GroestlCoin Signed Message:\n',
    bech32: 'tgrs',
    bip32: {
        public: 0x044a5262,
        private: 0x044a4e28
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

libs.bitcoin.networks.deeponion.p2wpkh = {
    baseNetwork: "deeponion",
	messagePrefix: '\x18DeepOnion Signed Message:\n',
	bech32: 'dpn',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4
	},
	pubKeyHash: 0x1f,
	scriptHash: 0x4e,
	wif: 0x9f
};

libs.bitcoin.networks.deeponion.p2wpkhInP2sh = {
	baseNetwork: "deeponion",
	messagePrefix: '\x18DeepOnion Signed Message:\n',
	bech32: 'dpn',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4
	},
	pubKeyHash: 0x1f,
	scriptHash: 0x4e,
	wif: 0x9f
};

libs.bitcoin.networks.sugarchain.p2wpkh = {
	baseNetwork: "sugarchain",
	messagePrefix: '\x1DSugarchain Signed Message:\n',
	bech32: 'sugar',
	bip32: {
		public: 0x04b24746,
		private: 0x04b2430c
	},
	pubKeyHash: 0x3f,
	scriptHash: 0x7d,
	wif: 0x80
};

libs.bitcoin.networks.sugarchain.p2wpkhInP2sh = {
	baseNetwork: "sugarchain",
	messagePrefix: '\x1DSugarchain Signed Message:\n',
	bech32: 'sugar',
	bip32: {
		public: 0x049d7cb2,
		private: 0x049d7878
	},
	pubKeyHash: 0x3f,
	scriptHash: 0x7d,
	wif: 0x80
};

libs.bitcoin.networks.sugarchaintestnet.p2wpkh = {
	baseNetwork: "sugarchaintestnet",
	messagePrefix: '\x18Sugarchain Signed Message:\n',
	bech32: 'tugar',
	bip32: {
		public: 0x045f1cf6,
		private: 0x045f18bc
	},
	pubKeyHash: 0x42,
	scriptHash: 0x80,
	wif: 0xef
};

libs.bitcoin.networks.sugarchaintestnet.p2wpkhInP2sh = {
	baseNetwork: "sugarchaintestnet",
	messagePrefix: '\x18Sugarchain Signed Message:\n',
	bech32: 'tugar',
	bip32: {
		public: 0x044a5262,
		private: 0x044a4e28
	},
	pubKeyHash: 0x42,
	scriptHash: 0x80,
	wif: 0xef
};

})();
