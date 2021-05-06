function XWCbufferToAddress(pubBuf){
  const Buffer = libs.buffer.Buffer;
  const XWC_ADDRESS_PREFIX = "XWC";
  const XWC_NORMAL_ADDRESS_VERSION = "35"
  let addrData = libs.createHash("rmd160").update( libs.createHash("sha512").update(pubBuf).digest()).digest();
  let addrBuf = Buffer.concat([Buffer.from(XWC_NORMAL_ADDRESS_VERSION, "hex") ,addrData])
  let checksum = libs.createHash("rmd160").update(addrBuf).digest("hex").slice(0, 8);
  addrBuf = Buffer.concat([addrBuf, Buffer.from(checksum, "hex")]);
  return XWC_ADDRESS_PREFIX.concat(libs.bs58.encode(addrBuf));
}

function XWCbufferToPublic(pubBuf) {
  const Buffer = libs.buffer.Buffer;
  const XWC_PUBLIC_PREFIX = "XWC";
  let checksum = libs.createHash("rmd160").update(pubBuf).digest("hex").slice(0, 8);
  pubBuf = Buffer.concat([pubBuf, Buffer.from(checksum, "hex")]);
  return XWC_PUBLIC_PREFIX.concat(libs.bs58.encode(pubBuf));
}

function XWCbufferToPrivate(privBuf) {
  const Buffer = libs.buffer.Buffer;
  const XWC_PRIVATE_PREFIX = "80";
  privBuf = Buffer.concat([Buffer.from(XWC_PRIVATE_PREFIX, "hex"), privBuf]);
  let tmp = libs.createHash("sha256").update(privBuf).digest();
  let checksum = libs.createHash("sha256").update(tmp).digest("hex").slice(0, 8);
  privBuf = Buffer.concat([privBuf, Buffer.from(checksum, "hex")]);
  return libs.bs58.encode(privBuf);
}
