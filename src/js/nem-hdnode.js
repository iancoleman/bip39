var createHmac = require("create-hmac");

var BigInteger = require("bigi");

function HDNode (pIL, chainCode) {
  this.pIL = pIL
  this.chainCode = chainCode
  this.depth = 0
  this.index = 0
}

HDNode.HIGHEST_BIT = 0x80000000
HDNode.LENGTH = 78
HDNode.MASTER_SECRET = Buffer.from('ed25519-keccak seed', 'utf8')

HDNode.fromSeedBuffer = function (seed) {
  if (seed.length < 16) throw new TypeError('Seed should be at least 128 bits')
  if (seed.length > 64) throw new TypeError('Seed should be at most 512 bits')

  var I = createHmac('sha512', HDNode.MASTER_SECRET).update(seed).digest()
  var IL = I.slice(0, 32)
  var IR = I.slice(32)

  var pIL = BigInteger.fromBuffer(IL)

  return new HDNode(pIL, IR)
}

HDNode.prototype.getPrivateKeyHex = function () {
  return this.pIL.toHex(32);
}

// https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#child-key-derivation-ckd-functions
HDNode.prototype.derive = function (index) {
  var isHardened = index >= HDNode.HIGHEST_BIT
  var data = Buffer.allocUnsafe(37)

  // Hardened child
  if (isHardened) {
    // data = 0x00 || ser256(kpar) || ser32(index)
    data[0] = 0x00
    this.pIL.toBuffer(32).copy(data, 1)
    data.writeUInt32BE(index, 33)

  // Normal child
  } else {
    throw new TypeError('Could not derive non-hardened child key')
  }

  var I = createHmac('sha512', this.chainCode).update(data).digest()
  var IL = I.slice(0, 32)
  var IR = I.slice(32)

  var pIL = BigInteger.fromBuffer(IL)

  var hd = new HDNode(pIL, IR)
  hd.depth = this.depth + 1
  hd.index = index

  return hd
}

HDNode.prototype.deriveHardened = function (index) {
  // Only derives hardened private keys by default
  return this.derive(index + HDNode.HIGHEST_BIT)
}

HDNode.prototype.derivePath = function (path) {
  var splitPath = path.split('/')
  if (splitPath[0] === 'm') {
    splitPath = splitPath.slice(1)
  }

  return splitPath.reduce(function (prevHd, indexStr) {
    var index
    if (indexStr.slice(-1) === "'") {
      index = parseInt(indexStr.slice(0, -1), 10)
      return prevHd.deriveHardened(index)
    } else {
      index = parseInt(indexStr, 10)
      return prevHd.derive(index)
    }
  }, this)
}

module.exports = HDNode
