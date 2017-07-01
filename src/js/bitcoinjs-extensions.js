bitcoin.networks.shadow = {
  magicPrefix: '\x19ShadowCash Signed Message:\n',
  bip32: {
    public: 0xEE80286A,
    private: 0xEE8031E8
  },
  pubKeyHash: 0x3f,
  scriptHash: 0x7d,
  wif: 0xbf,
  dustThreshold: 0,
  feePerKb: 1000,
  estimateFee: function() { return "unused in this app" },
};

bitcoin.networks.shadowtn = {
  magicPrefix: '\x19ShadowCash Signed Message:\n',
  bip32: {
    public: 0x76C0FDFB,
    private: 0x76C1077A
  },
  pubKeyHash: 0x7f,
  scriptHash: 0xc4,
  wif: 0xff,
  dustThreshold: 0,
  feePerKb: 1000,
  estimateFee: function() { return "unused in this app" },
};

bitcoin.networks.clam = {
  bip32: {
    public: 0xa8c26d64,
    private: 0xa8c17826
  },
  pubKeyHash: 0x89,
  wif: 0x85,
};

bitcoin.networks.crown = {
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  wif: 0x80,
};

bitcoin.networks.dash = {
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x4c,
  scriptHash: 0x10,
  wif: 0xcc,
};

bitcoin.networks.dashtn = {
  bip32: {
    public: 0x043587cf,
    private: 0x04358394
  },
  pubKeyHash: 0x8c,
  scriptHash: 0x13,
  wif: 0xef,
};

bitcoin.networks.game = {
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x26,
  scriptHash: 0x05,
  wif: 0xa6,
};

bitcoin.networks.namecoin = {
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x34,
  //scriptHash: 0x10,
  wif: 0x80,
};

bitcoin.networks.peercoin = {
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x37,
  //scriptHash: 0x10,
  wif: 0xb7,
};

bitcoin.networks.slimcoin = {
  bip32: {
    public: 0xef6adf10,
    private: 0xef69ea80
  },
  pubKeyHash: 0x3f,
  scriptHash: 0x7d,
  wif: 0x46,
};

bitcoin.networks.slimcointn = {
  bip32: {
    public: 0x043587CF,
    private: 0x04358394
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0x57,
};

