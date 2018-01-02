# 0.3.2

* Add Onixcoin
* Add Komodo
* BIP84 tab for derivation path
* CSV tab for derived addresses

# 0.3.1

* Populate entropy field with hex value used from PRNG
* Show list of word indexes
* Fix typos
* Update jquery from 2.1.1 to 3.2.1
* Update bootstrap from 3.2.0 to 3.3.7
* Move application-specific css into own file
* QR codes with accents work correctly by replacing jquery.qrcode with kjua

# 0.3.0

* Update bitcoinjs from 3.1.1 to 3.3.0
* Litecoin defaults to ltub instead of xpub
* Segwit option removed from bip32 tab
* BIP141 tab added for full segwit compatibility

# 0.2.9

* Update links from old site to new site
* Add Monacoin
* Add Bitcoin Gold
* Port test suite to selenium
* Allow more rows to be generated starting from a custom index

# 0.2.8

* Enable segwit for Litecoin
* BitPay-style addresses for Bitcoin Cash
* Use new xpub/xprv prefixes for Segwit BIP49
* Add nubits network

# 0.2.7

* Add Fujicoin
* List alternative tools
* Remove unused translations and library

# 0.2.6

* Detect and warn when entropy is filtered / discarded
* Reword entropy text to indicate using a single source only
* Add BIP49 to More Info section
* Update compile script to work across python 2 and 3
* QR Codes use correctLevel 3 instead of 2
* Source map removed from zxcvbn
* Tidy up code with consistent use of commas and semicolons

# 0.2.5

* Rename variables for clarity between BIP49 and P2WPKH Nested In P2SH
* Fix bug for validation of root key when using non-bitcoin networks
* Add option to use P2WPKH Nested In P2SH addresses on BIP32 tab

# 0.2.4

* Show error when using xpub with hardened addresses
* Allow switching litecoin prefixes between xprv and Ltpv

# 0.2.3

* Add maza coin

# 0.2.2

* Improve showing feedback for pending calculations
* Bugfix: Clear old seed when mnemonic is changed
* Add PIVX network

# 0.2.1

* BTC is the default coin
* Add myriadcoin
* Add Bitcon Cash

# 0.2.0

* BitcoinJS library upgrded to v3.1.1
* Tab order is alphabetical
* BIP44 'purpose' and 'coin' fields are readonly
* Refactor method to clear old data from the display
* BIP49 support
* Release process is documented

# 0.1.2

* Add Crown network
* Network names are displayed with currency code

# 0.1.1

* Add DASH Testnet
* Change entropy Strength to Time To Crack

# 0.1.0 2017-06-14

* Add changelog
* Display version number in top right
* Add hex prefix to ethereum keys
