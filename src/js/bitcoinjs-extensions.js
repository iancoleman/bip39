
function estimateFee (type) {
  return function (tx) {
    var network = networks[type]
    var baseFee = network.feePerKb
    var byteSize = tx.toBuffer().length

    var fee = baseFee * Math.ceil(byteSize / 1000)
    if (network.dustSoftThreshold === undefined) return fee

    tx.outs.forEach(function (e) {
      if (e.value < network.dustSoftThreshold) {
        fee += baseFee
      }
    })

    return fee
  }
}

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


bitcoin.networks.bitcoin = {
    magicPrefix: '\x18Bitcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    dustThreshold: 546, // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
    feePerKb: 10000, // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L53
    estimateFee: estimateFee('bitcoin')
  };
 bitcoin.networks.testnet = {
    magicPrefix: '\x18Bitcoin Signed Message:\n',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    dustThreshold: 546,
    feePerKb: 10000,
    estimateFee: estimateFee('testnet')
  };
  bitcoin.networks.litecoin = {
    magicPrefix: '\x19Litecoin Signed Message:\n',
    bip32: {
      public: 0x019da462,
      private: 0x019d9cfe
    },
    pubKeyHash: 0x30,
    scriptHash: 0x05,
    wif: 0xb0,
    dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
    dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
    feePerKb: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
    estimateFee: estimateFee('litecoin')
  };
  bitcoin.networks.dogecoin = {
    magicPrefix: '\x19Dogecoin Signed Message:\n',
    bip32: {
      public: 0x02facafd,
      private: 0x02fac398
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
    dustThreshold: 0, // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/core.h#L155-L160
    dustSoftThreshold: 100000000, // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/main.h#L62
    feePerKb: 100000000, // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/main.cpp#L58
    estimateFee: estimateFee('dogecoin')
  };
  bitcoin.networks.dash = {
    magicPrefix: '\x19DarkCoin Signed Message:\n',
    bip32: {
      public: 0x02FE52F8,
      private: 0x02FE52CC
    },
    pubKeyHash: 0x4c,
    scriptHash: 0x10,
    wif: 0xcc,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('dash')
  };
  bitcoin.networks.viacoin = {
    magicPrefix: '\x18Viacoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x47,
    scriptHash: 0x21,
    wif: 0xc7,
    dustThreshold: 560,
    dustSoftThreshold: 100000,
    feePerKb: 100000, //
    estimateFee: estimateFee('viacoin')
  };
  bitcoin.networks.viacointestnet = {
    magicPrefix: '\x18Viacoin Signed Message:\n',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x7f,
    scriptHash: 0xc4,
    wif: 0xff,
    dustThreshold: 560,
    dustSoftThreshold: 100000,
    feePerKb: 100000,
    estimateFee: estimateFee('viacointestnet')
  };
  bitcoin.networks.gamecredits = {
    magicPrefix: '\x19Gamecredits Signed Message:\n',
    bip32: {
      public: 0x019da462,
      private: 0x019d9cfe
    },
    pubKeyHash: 0x26,
    scriptHash: 0x05,
    wif: 0xA6,
    dustThreshold: 0, // https://github.com/gamers-coin/gamers-coinv3/blob/master/src/main.cpp#L358-L363
    dustSoftThreshold: 100000, // https://github.com/gamers-coin/gamers-coinv3/blob/master/src/main.cpp#L51
    feePerKb: 100000, // https://github.com/gamers-coin/gamers-coinv3/blob/master/src/main.cpp#L54
    estimateFee: estimateFee('gamecredits')
  };
  bitcoin.networks.jumbucks = {
    magicPrefix: '\x19Jumbucks Signed Message:\n',
    bip32: {
      public: 0x037a689a,
      private: 0x037a6460
    },
    pubKeyHash: 0x2b,
    scriptHash: 0x05,
    wif: 0xab,
    dustThreshold: 0,
    dustSoftThreshold: 10000,
    feePerKb: 10000,
    estimateFee: estimateFee('jumbucks')
  };
  bitcoin.networks.zetacoin = {
    magicPrefix: '\x18Zetacoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x50,
    scriptHash: 0x09,
    wif: 0xe0,
    dustThreshold: 546, // https://github.com/zetacoin/zetacoin/blob/master/src/core.h#L159
    feePerKb: 10000, // https://github.com/zetacoin/zetacoin/blob/master/src/main.cpp#L54
    estimateFee: estimateFee('zetacoin')
  };
  bitcoin.networks.nubits = {
    magicPrefix: '\x18Nu Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x19,
    scriptHash: 0x1a,
    wif: 0x96,
    dustThreshold: 100,
    feePerKb: 100,
    estimateFee: estimateFee('nubits')
  };
  bitcoin.networks.nushares = {
    magicPrefix: '\x18Nu Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x3f,
    scriptHash: 0x40,
    wif: 0x95,
    dustThreshold: 10000,
    feePerKb: 10000,
    estimateFee: estimateFee('nushares')
  };
  bitcoin.networks.blackcoin = {
    magicPrefix: '\x18BlackCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x19,
    scriptHash: 0x55,
    wif: 0x99,
    dustThreshold: 1,
    feePerKb: 10000,
    estimateFee: estimateFee('blackcoin')
  };
  bitcoin.networks.potcoin = {
    magicPrefix: '\x18PotCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 55,
    scriptHash: 5,
    wif: 183,
    dustThreshold: 1,
    feePerKb: 100000,
    estimateFee: estimateFee('potcoin')
  };
  bitcoin.networks.batacoin = {
    magicPrefix: '\x19Bata Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 25,
    scriptHash: 5,
    wif: 153,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('bata')
  };
  bitcoin.networks.feathercoin = {
    magicPrefix: '\x19Feathercoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 14,
    scriptHash: 5,
    wif: 142,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('feathercoin')
  };
  bitcoin.networks.gridcoin = {
    magicPrefix: '\x19Gridcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 62,
    scriptHash: 85,
    wif: 190,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('gridcoin')
  };
  bitcoin.networks.richcoin = {
    magicPrefix: '\x19Richcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 61,
    scriptHash: 9,
    wif: 128,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('richcoin')
  };
  bitcoin.networks.auroracoin = {
    magicPrefix: '\x19Auroracoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 23,
    scriptHash: 5,
    wif: 151,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('auroracoin')
  };
  bitcoin.networks.novacoin = {
    magicPrefix: '\x19Novacoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 8,
    scriptHash: 20,
    wif: 136,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('novacoin')
  };
  bitcoin.networks.cannacoin = {
    magicPrefix: '\x19Cannacoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 28,
    scriptHash: 5,
    wif: 189,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('cannacoin')
  };
  bitcoin.networks.clubcoin = {
    magicPrefix: '\x19Clubcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 28,
    scriptHash: 85,
    wif: 153,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('clubcoin')
  };
  bitcoin.networks.digibyte = {
    magicPrefix: '\x19Digibyte Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 30,
    scriptHash: 5,
    wif: 128,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('digitbyte')
  };
  bitcoin.networks.digitalcoin = {
    magicPrefix: '\x19Digitalcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 30,
    scriptHash: 5,
    wif: 158,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('digitalcoin')
  };
  bitcoin.networks.edrcoin = {
    magicPrefix: '\x19EDRcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 93,
    scriptHash: 28,
    wif: 221,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('edrcoin')
  };
  bitcoin.networks.egulden = {
    magicPrefix: '\x19e-Gulden Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 48,
    scriptHash: 5,
    wif: 176,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('egulden')
  };
  bitcoin.networks.gulden = {
    magicPrefix: '\x19Gulden Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 38,
    scriptHash: 5,
    wif: 166,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('gulden')
  };
  bitcoin.networks.gcrcoin = {
    magicPrefix: '\x19GCR Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 38,
    scriptHash: 97,
    wif: 154,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('gcr')
  };
  bitcoin.networks.monacoin = {
    magicPrefix: '\x19Monacoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 50,
    scriptHash: 5,
    wif: 178,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('monacoin')
  };
  bitcoin.networks.myriadcoin = {
    magicPrefix: '\x19Myriadcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 50,
    scriptHash: 9,
    wif: 178,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('myriadcoin')
  };
  bitcoin.networks.neoscoin = {
    magicPrefix: '\x19Neoscoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 53,
    scriptHash: 5,
    wif: 177,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('neoscoin')
  };
  bitcoin.networks.parkbyte = {
    magicPrefix: '\x19ParkByte Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 55,
    scriptHash: 28,
    wif: 183,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('parkbyte')
  };
  bitcoin.networks.peercoin = {
    magicPrefix: '\x19PPCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 55,
    scriptHash: 117,
    wif: 183,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('peercoin')
  };
  bitcoin.networks.pesobit = {
    magicPrefix: '\x19Pesobit Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 55,
    scriptHash: 85,
    wif: 183,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('pesobit')
  };
  bitcoin.networks.reddcoin = {
    magicPrefix: '\x19Reddcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 61,
    scriptHash: 5,
    wif: 189,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('reddcoin')
  };
  bitcoin.networks.primecoin = {
    magicPrefix: '\x19Primecoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 23,
    scriptHash: 83,
    wif: 151,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('primecoin')
  };
  bitcoin.networks.rubycoin = {
    magicPrefix: '\x19Rubycoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 60,
    scriptHash: 85,
    wif: 188,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('rubycoin')
  };
  bitcoin.networks.smileycoin = {
    magicPrefix: '\x19Smileycoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 25,
    scriptHash: 5,
    wif: 153,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('smileycoin')
  };
  bitcoin.networks.solarcoin = {
    magicPrefix: '\x19SolarCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 18,
    scriptHash: 5,
    wif: 146,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('solarcoin')
  };
  bitcoin.networks.syscoin = {
    magicPrefix: '\x19Syscoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 63,
    scriptHash: 5,
    wif: 191,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('syscoin')
  };
  bitcoin.networks.unobtanium = {
    magicPrefix: '\x19Unobtanium Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 130,
    scriptHash: 30,
    wif: 224,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('unobtanium')
  };
  bitcoin.networks.vergecoin = {
    magicPrefix: '\x19Vergecoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 30,
    scriptHash: 33,
    wif: 158,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('verge')
  };
  bitcoin.networks.vertcoin = {
    magicPrefix: '\x19Vertcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 71,
    scriptHash: 5,
    wif: 199,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('vertcoin')
  };
  bitcoin.networks.vpncoin = {
    magicPrefix: '\x19VpnCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 71,
    scriptHash: 5,
    wif: 199,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('vpncoin')
  };

bitcoin.networks.pivx = {
      magicPrefix: '\x19PIVX Signed Message:\n',
  bip32: {
    public: 0x022D2533,
    private: 0x0221312B
  },
  pubKeyHash:30,
  scriptHash:13,
  wif: 212
}


bitcoin.networks.eth = {
  bip32: {
    public: 0xffffffff,
    private: 0xffffffff
  },
  pubKeyHash: 0xff,
  wif: 0xff,  
  ethereum : true
};

bitcoin.networks.etc = {
  bip32: {
    public: 0xffffffff,
    private: 0xffffffff
  },
  pubKeyHash: 0xff,
  wif: 0xff,    
  ethereum : true
};



bitcoin.networks.abncoin = {
  magicPrefix: '\x19Abncoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:25,
  scriptHash:85,
  wif: 153
}

bitcoin.networks.asiacoin = {
  magicPrefix: '\x19Asiacoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:23,
  scriptHash:8,
  wif: 151
}

bitcoin.networks.bitcoinplus = {
  magicPrefix: '\x19Bitcoinplus Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:25,
  scriptHash:85,
  wif: 153
}

bitcoin.networks.canadaecoin = {
  magicPrefix: '\x19Canada eCoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:28,
  scriptHash:5,
  wif: 156
}

bitcoin.networks.einsteinium = {
  magicPrefix: '\x19Einsteinium Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:33,
  scriptHash:5,
  wif: 161
}

bitcoin.networks.expanse = {
  bip32: {
    public: 0xffffffff,
    private: 0xffffffff
  },
  pubKeyHash: 0xff,
  wif: 0xff,    
  ethereum : true
};

bitcoin.networks.iop = {
  magicPrefix: '\x19Internet of People Signed Message:\n',
  bip32: {
      public: 0x2780915f,
      private: 0xae3416f6
    },
  pubKeyHash:117,
  scriptHash:174,
  wif: 49
}


bitcoin.networks.ixcoin = {
  magicPrefix: '\x19Ixcoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:138,
  scriptHash:5,
  wif: 128
}

bitcoin.networks.landcoin = {
  magicPrefix: '\x19Landcoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:48,
  scriptHash:122,
  wif: 176
}

bitcoin.networks.namecoin = {
  magicPrefix: '\x19Namecoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:52,
  scriptHash:13,
  wif: 180
}

bitcoin.networks.navcoin = {
  magicPrefix: '\x19Navcoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:53,
  scriptHash:85,
  wif: 150
}

bitcoin.networks.okcash = {
  magicPrefix: '\x19Okcash Signed Message:\n',
  bip32: {
      public: 0x03cc23d7,
      private: 0x03cc1c73
    },
  pubKeyHash:55,
  scriptHash:28,
  wif: 183
}

bitcoin.networks.posw = {
  magicPrefix: '\x19POSWcoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:55,
  scriptHash:85,
  wif: 183
}

bitcoin.networks.stratis = {
  magicPrefix: '\x19Stratis Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488b2dd
    },
  pubKeyHash:63,
  scriptHash:125,
  wif: 191
}

bitcoin.networks.zcash = {
  magicPrefix: '\x19Zcash Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:0x1cb8,
  scriptHash:0x1cbd,
  wif: 128
}

bitcoin.networks.lbry = {
  magicPrefix: '\x19LBRYcrd Signed Message:\n',
  bip32: {
      public: 0x019c354f,
      private: 0x019c3118
    },
  pubKeyHash:85,
  scriptHash:122,
  wif: 28
}

bitcoin.networks.bela = {
  magicPrefix: '\x19Belacoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:25,
  scriptHash:5,
  wif: 153
}

bitcoin.networks.britcoin = {
  magicPrefix: '\x19Britcoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:25,
  scriptHash:85,
  wif: 153
}

bitcoin.networks.compcoin = {
  magicPrefix: '\x19Compcoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:28,
  scriptHash:5,
  wif: 156
}

bitcoin.networks.zcoin = {
  magicPrefix: '\x19ZCoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:82,
  scriptHash:7,
  wif: 210
}

bitcoin.networks.insane = {
  magicPrefix: '\x19Insanecoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:102,
  scriptHash:57,
  wif: 55
}

bitcoin.networks.ultimatesecurecash = {
  magicPrefix: '\x19Ultimate Secure Cash Signed Message:\n',
  bip32: {
      public: 0xee80286a,
      private: 0xee8031e8
    },
  pubKeyHash:68,
  scriptHash:125,
  wif: 137
}

bitcoin.networks.neurocoin = {
  magicPrefix: '\x19PPCoin Signed Message:\n',
  bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
  pubKeyHash:53,
  scriptHash:117,
  wif: 181
}

bitcoin.networks.hempcoin = {
    magicPrefix: '\x19Hempcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 40,
    scriptHash: 8,
    wif: 168
}

bitcoin.networks.linxcoin = {
    magicPrefix: '\x19LinX Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 75,
    scriptHash: 5,
    wif: 203,
}

bitcoin.networks.ecoin = {
    magicPrefix: '\x19eCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 92,
    scriptHash: 20,
    wif: 220,
}

bitcoin.networks.denarius = {
    magicPrefix: '\x19Denarius Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 30,
    scriptHash: 90,
    wif: 158,
}

bitcoin.networks.pinkcoin = {
    magicPrefix: '\x19Pinkcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 3,
    scriptHash: 28,
    wif: 131,
}

bitcoin.networks.flashcoin = {
    magicPrefix: '\x19Flashcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 68,
    scriptHash: 130,
    wif: 196,
}

bitcoin.networks.defcoin = {
    magicPrefix: '\x19defcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 30,
    scriptHash: 5,
    wif: 158,
}

bitcoin.networks.putincoin = {
    magicPrefix: '\x19PutinCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 55,
    scriptHash: 20,
    wif: 183,
}

bitcoin.networks.zencash = {
    magicPrefix: '\x19Zcash Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x2089,
    scriptHash: 0x2096,
    wif: 128,
}

bitcoin.networks.smartcash = {
    magicPrefix: '\x19SmartCash Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 63,
    scriptHash: 18,
    wif: 191,
}

bitcoin.networks.fujicoin = {
    magicPrefix: '\x19Fujicoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 36,
    scriptHash: 16,
    wif: 164,
}

bitcoin.networks.link = {
  bip32: {
    public: 0xffffffff,
    private: 0xffffffff
  },
  pubKeyHash: 0xff,
  wif: 0xff,    
  ethereum : true
}

bitcoin.networks.voxels = {
    magicPrefix: '\x19Voxels Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 70,
    scriptHash: 5,
    wif: 198,
}

bitcoin.networks.crown = {
    magicPrefix: '\x19Crown Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0,
    scriptHash: 28,
    wif: 128,
}

bitcoin.networks.vcash = {
    magicPrefix: '\x19Vcash Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 71,
    scriptHash: 8,
    wif: 199,
}

bitcoin.networks.bridgecoin = {
    magicPrefix: '\x19bridgecoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 27,
    scriptHash: 50,
    wif: 176,
}

bitcoin.networks.bitsend = {
    magicPrefix: '\x19Bitsend Signed Message:\n',
    bip32: {
      public: 0x02FE52F8,
      private: 0x02FE52CC
    },
    pubKeyHash: 102,
    scriptHash: 5,
    wif: 204,
    dustThreshold: 0,
    dustSoftThreshold: 0,
    feePerKb: 0,
    estimateFee: estimateFee('dash')
  }

bitcoin.networks.bitcore = {
    magicPrefix: '\x19BitCore Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0,
    scriptHash: 5,
    wif: 128,
}

bitcoin.networks.europecoin = {
    magicPrefix: '\x19Bitcoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 33,
    scriptHash: 5,
    wif: 168,
}

bitcoin.networks.toacoin = {
    magicPrefix: '\x19TOA Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 65,
    scriptHash: 23,
    wif: 193,
}

bitcoin.networks.diamond = {
    magicPrefix: '\x19Diamond Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 90,
    scriptHash: 8,
    wif: 218,
}

bitcoin.networks.adcoin = {
    magicPrefix: '\x19AdCoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 23,
    scriptHash: 5,
    wif: 151,
}

