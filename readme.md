# BIP39 Tool

A tool for converting BIP39 mnemonic phrases to addresses and private keys.

## Online Version

https://coinomi.com/recovery-phrase-tool.html

## Standalone offline version

Download `bip39-standalone.html`

Open the file in a browser by double clicking it.

This can be compiled from source using the command `python compile.py`

## Usage

Enter your BIP39 phrase into the 'BIP39 Phrase' field, or press
'Generate Random Phrase'

If required, set the derivation path, although the defaults are quite usable.

See the table for a list of addresses generated from the phrase.

Toggle columns to blank to easily copy/paste a single column of data, eg to
import private keys into a wallet or supply someone with a list of addresses.

Click the addresses or keys to toggle view of a QR code of same address.

Click the Show QR buttons by the root key and extended public and private keys to show a qr code suitable 
for importing into a wallet on a mobile device.

The BIP32 keys can be used at [bip32.org](https://bip32.org) if desired.

## Making changes

Please do not make modifications to `bip39-standalone.html`, since they will
be overwritten by `compile.py`.

Make changes in `src/*` and apply them using the command `python compile.py`
