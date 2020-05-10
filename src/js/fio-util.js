function FIObufferToPublic(pubBuf) {
  const Buffer = libs.buffer.Buffer;
  const FIO_PUBLIC_PREFIX = "FIO";

  let checksum = libs.createHash("rmd160").update(pubBuf).digest("hex").slice(0, 8);
  pubBuf = Buffer.concat([pubBuf, Buffer.from(checksum, "hex")]);
  return FIO_PUBLIC_PREFIX.concat(libs.bs58.encode(pubBuf));
}

function FIObufferToPrivate(privBuf) {
  const Buffer = libs.buffer.Buffer;
  const FIO_PRIVATE_PREFIX = "80";

  privBuf = Buffer.concat([Buffer.from(FIO_PRIVATE_PREFIX, "hex"), privBuf]);
  let tmp = libs.createHash("sha256").update(privBuf).digest();
  let checksum = libs.createHash("sha256").update(tmp).digest("hex").slice(0, 8);
  privBuf = Buffer.concat([privBuf, Buffer.from(checksum, "hex")]);
  return libs.bs58.encode(privBuf);
}