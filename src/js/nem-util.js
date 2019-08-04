const bip39 = require("bip39");
const _HDNode = require("nem-hdnode");
const nem = require("nem-sdk").default;

function getNemSeed(mnemonic, passphrase){
	const seed = bip39.mnemonicToSeed(mnemonic, passphrase);
	
	return seed;
}

function getNemRoot(seed){
	const root = _HDNode.fromSeedBuffer(seed);
	
	return root;
}

function getNemNode(root, hdKeypath){        
	const node = root.derivePath(`m/44/43'/0'/0'/0'`); /* Check this hard coded path */
	
	return node;
}

function getNemPrivKey(node){         
	const secretKey = nem.utils.convert.hex2ua_reversed(node.getPrivateKeyHex());
	const privKey = nem.utils.convert.ua2hex(secretKey);
	
	return privKey;
}

function getNemPublicKey(privateKey){         
	const keyPair = nem.crypto.keyPair.create(privateKey);
	const publicKey = keyPair.publicKey.toString();
	
	return publicKey;
}

function getNemAddress(publicKey){         
	const address = nem.model.address.toAddress(publicKey, 104); /* 104 network code for NEM */
	
	return address;
}

const nemNetworkDummyInfo = {
	bip32: {public: 0, private: 0},
	messagePrefix: '',
	pubKeyHash: 0,
	scriptHash: 0,
	wif: 0,
};