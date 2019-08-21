# BIP39 Tool

A tool for converting BIP39 mnemonic phrases to addresses and private keys.

Originally based on https://github.com/iancoleman/bip39/

## Standalone offline version

Download `bip39-standalone.html` from
[the releases](https://github.com/PavlosTze/bip39/releases).

Open the file in a browser by double clicking it.

This can be compiled from source using the command `python compile.py`

## Usage

Enter your BIP39 phrase into the 'BIP39 Phrase' field, or press
'Generate Random Phrase'

If required, set the derivation path, although the defaults are quite usable.

See the table for a list of addresses generated from the phrase.

Toggle columns to blank to easily copy/paste a single column of data, eg to
import private keys into a wallet or supply someone with a list of addresses.

The BIP32 keys can be used at [bip32.org](https://bip32.org) if desired.
