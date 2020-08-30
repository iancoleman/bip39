function EOSbufferToPublic(pubBuf) {
  const Buffer = libs.buffer.Buffer;
  const EOS_PUBLIC_PREFIX = "EOS";
  let checksum = libs.createHash("rmd160").update(pubBuf).digest("hex").slice(0, 8);
  pubBuf = Buffer.concat([pubBuf, Buffer.from(checksum, "hex")]);
  return EOS_PUBLIC_PREFIX.concat(libs.bs58.encode(pubBuf));
}

function EOSbufferToPrivate(privBuf) {
  const Buffer = libs.buffer.Buffer;
  const EOS_PRIVATE_PREFIX = "80";
  privBuf = Buffer.concat([Buffer.from(EOS_PRIVATE_PREFIX, "hex"), privBuf]);
  let tmp = libs.createHash("sha256").update(privBuf).digest();
  let checksum = libs.createHash("sha256").update(tmp).digest("hex").slice(0, 8);
  privBuf = Buffer.concat([privBuf, Buffer.from(checksum, "hex")]);
  return libs.bs58.encode(privBuf);
}
