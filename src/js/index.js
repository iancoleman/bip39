(function() {

    var mnemonic = new Mnemonic("english");
    var bip32RootKey = null;
    var bip32ExtendedKey = null;
    var network = bitcoin.networks.bitcoin;
    var addressRowTemplate = $("#address-row-template");

    var showIndex = true;
    var showAddress = true;
    var showPubKey = true;
    var showPrivKey = true;

    var phraseChangeTimeoutEvent = null;

    var DOM = {};
    DOM.network = $(".network");
    DOM.phraseNetwork = $("#network-phrase");
    DOM.phrase = $(".phrase");
    DOM.passphrase = $(".passphrase");
    DOM.generate = $(".generate");
    DOM.rootKey = $(".root-key");
    DOM.extendedPrivKey = $(".extended-priv-key");
    DOM.extendedPubKey = $(".extended-pub-key");
    DOM.bip32tab = $("#bip32-tab");
    DOM.bip44tab = $("#bip44-tab");
    DOM.bip32panel = $("#bip32");
    DOM.bip44panel = $("#bip44");
    DOM.bip32path = $("#bip32-path");
    DOM.bip44path = $("#bip44-path");
    DOM.bip44purpose = $("#bip44 .purpose");
    DOM.bip44coin = $("#bip44 .coin");
    DOM.bip44account = $("#bip44 .account");
    DOM.bip44change = $("#bip44 .change");
    DOM.strength = $(".strength");
    DOM.addresses = $(".addresses");
    DOM.rowsToAdd = $(".rows-to-add");
    DOM.more = $(".more");
    DOM.feedback = $(".feedback");
    DOM.tab = $(".derivation-type a");
    DOM.indexToggle = $(".index-toggle");
    DOM.addressToggle = $(".address-toggle");
    DOM.publicKeyToggle = $(".public-key-toggle");
    DOM.privateKeyToggle = $(".private-key-toggle");

    var derivationPath = $(".tab-pane.active .path").val();

    function init() {
        // Events
        DOM.network.on("change", networkChanged);
        DOM.phrase.on("input", delayedPhraseChanged);
        DOM.passphrase.on("input", delayedPhraseChanged);
        DOM.generate.on("click", generateClicked);
        DOM.more.on("click", showMore);
        DOM.bip32path.on("input", bip32Changed);
        DOM.bip44purpose.on("input", bip44Changed);
        DOM.bip44coin.on("input", bip44Changed);
        DOM.bip44account.on("input", bip44Changed);
        DOM.bip44change.on("input", bip44Changed);
        DOM.tab.on("click", tabClicked);
        DOM.indexToggle.on("click", toggleIndexes);
        DOM.addressToggle.on("click", toggleAddresses);
        DOM.publicKeyToggle.on("click", togglePublicKeys)
        DOM.privateKeyToggle.on("click", togglePrivateKeys);
        disableForms();
        hidePending();
        hideValidationError();
        populateNetworkSelect();
    }

    // Event handlers

    function networkChanged(e) {
        var network = e.target.value;
        networks[network].onSelect();
        setBip44DerivationPath();
        delayedPhraseChanged();
    }

    function delayedPhraseChanged() {
        hideValidationError();
        showPending();
        if (phraseChangeTimeoutEvent != null) {
            clearTimeout(phraseChangeTimeoutEvent);
        }
        phraseChangeTimeoutEvent = setTimeout(phraseChanged, 400);
    }

    function phraseChanged() {
        showPending();
        hideValidationError();
        // Get the mnemonic phrase
        var phrase = DOM.phrase.val();
        var passphrase = DOM.passphrase.val();
        var errorText = findPhraseErrors(phrase);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        // Get the derivation path
        var errorText = findDerivationPathErrors();
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        // Calculate and display
        calcBip32Seed(phrase, passphrase, derivationPath);
        displayBip32Info();
        hidePending();
    }

    function generateClicked() {
        clearDisplay();
        showPending();
        setTimeout(function() {
            var phrase = generateRandomPhrase();
            if (!phrase) {
                return;
            }
            phraseChanged();
        }, 50);
    }

    function tabClicked(e) {
        var activePath = $(e.target.getAttribute("href") + " .path");
        derivationPath = activePath.val();
        derivationChanged();
    }

    function derivationChanged() {
        delayedPhraseChanged();
    }

    function bip32Changed() {
        derivationPath = DOM.bip32path.val();
        derivationChanged();
    }

    function bip44Changed() {
        setBip44DerivationPath();
        derivationChanged();
    }

    function toggleIndexes() {
        showIndex = !showIndex;
        $("td.index span").toggleClass("invisible");
    }

    function toggleAddresses() {
        showAddress = !showAddress;
        $("td.address span").toggleClass("invisible");
    }

    function togglePublicKeys() {
        showPubKey = !showPubKey;
        $("td.pubkey span").toggleClass("invisible");
    }

    function togglePrivateKeys() {
        showPrivKey = !showPrivKey;
        $("td.privkey span").toggleClass("invisible");
    }

    // Private methods

    function generateRandomPhrase() {
        if (!hasStrongRandom()) {
            var errorText = "This browser does not support strong randomness";
            showValidationError(errorText);
            return;
        }
        var numWords = parseInt(DOM.strength.val());
        var strength = numWords / 3 * 32;
        var words = mnemonic.generate(strength);
        DOM.phrase.val(words);
        return words;
    }

    function calcBip32Seed(phrase, passphrase, path) {
        var seed = mnemonic.toSeed(makeProperPhrase(phrase), passphrase);
        bip32RootKey = bitcoin.HDNode.fromSeedHex(seed, network);
        bip32ExtendedKey = bip32RootKey;
        // Derive the key from the path
        var pathBits = path.split("/");
        for (var i=0; i<pathBits.length; i++) {
            var bit = pathBits[i];
            var index = parseInt(bit);
            if (isNaN(index)) {
                continue;
            }
            var hardened = bit[bit.length-1] == "'";
            if (hardened) {
                bip32ExtendedKey = bip32ExtendedKey.deriveHardened(index);
            }
            else {
                bip32ExtendedKey = bip32ExtendedKey.derive(index);
            }
        }
    }

    function showValidationError(errorText) {
        DOM.feedback
            .text(errorText)
            .show();
    }

    function hideValidationError() {
        DOM.feedback
            .text("")
            .hide();
    }

    function makeProperPhrase(phrase) {
        // TODO make this right
        // Preprocess the words
        phrase = mnemonic.normalizeString(phrase);
        var parts = phrase.split(" ");
        var proper = [];
        for (var i=0; i<parts.length; i++) {
            var part = parts[i];
            if (part.length > 0) {
                // TODO check that lowercasing is always valid to do
                proper.push(part.toLowerCase());
            }
        }
        // TODO some levenstein on the words
        return proper.join(' ');
    }

    function findPhraseErrors(phrase) {
        properPhrase = makeProperPhrase(phrase);
        // Check the words are valid
        var isValid = mnemonic.check(properPhrase);
        if (!isValid) {
            return "Invalid mnemonic";
        }
        return false;
    }

    function findDerivationPathErrors(path) {
        // TODO
        return false;
    }

    function displayBip32Info() {
        // Display the key
        var rootKey = bip32RootKey.toBase58();
        DOM.rootKey.val(rootKey);
        var extendedPrivKey = bip32ExtendedKey.toBase58();
        DOM.extendedPrivKey.val(extendedPrivKey);
        var extendedPubKey = bip32ExtendedKey.toBase58(false);
        DOM.extendedPubKey.val(extendedPubKey);
        // Display the addresses and privkeys
        clearAddressesList();
        displayAddresses(0, 20);
    }

    function displayAddresses(start, total) {
        for (var i=0; i<total; i++) {
            var index = i + start;
            new TableRow(index);
        }
    }

    function TableRow(index) {

        function init() {
            calculateValues();
        }

        function calculateValues() {
            setTimeout(function() {
                var key = bip32ExtendedKey.derive(index);
                var address;
                if (!network.ethereum) { 
                    address = key.getAddress().toString();                
                }
                else {
                    var pubData = new bitcoin.ECKey(key.privKey.d, false).pub.toHex();
                    var buffer = new ArrayBuffer(64);
                    var view = new Uint8Array(buffer);
                    var offset = 0;
                    for (var i=2; i<pubData.length; i += 2) {
                        view[offset++] = parseInt(pubData.substr(i, 2), 16);
                    }
                    var addressHex = keccak_256(buffer).substr(24).toLowerCase();
                    var checksum = keccak_256(addressHex)
                    var address = "0x";
                    for (var i = 0; i < addressHex.length; i++) {
                        if (parseInt(checksum[i], 16) >= 8) {
                          address += addressHex[i].toUpperCase()
                        } else {
                          address += addressHex[i]
                        }
                    }
                }
                var privkey;

                var pubkey = key.pubKey.toHex();
                if (!network.ethereum) {
                    privkey = key.privKey.toWIF(network);
                }
                else {
                    privkey = "0x" + key.privKey.d.toString(16);
                    pubkey = "0x" + pubkey;
                }
                addAddressToList(index, address, pubkey, privkey);
            }, 50)
        }

        init();

    }

    function showMore() {
        var start = DOM.addresses.children().length;
        var rowsToAdd = parseInt(DOM.rowsToAdd.val());
        if (isNaN(rowsToAdd)) {
            rowsToAdd = 20;
            DOM.rowsToAdd.val("20");
        }
        if (rowsToAdd > 200) {
            var msg = "Generating " + rowsToAdd + " rows could take a while. ";
            msg += "Do you want to continue?";
            if (!confirm(msg)) {
                return;
            }
        }
        displayAddresses(start, rowsToAdd);
    }

    function clearDisplay() {
        clearAddressesList();
        clearKey();
        hideValidationError();
    }

    function clearAddressesList() {
        DOM.addresses.empty();
    }

    function clearKey() {
        DOM.rootKey.val("");
        DOM.extendedPrivKey.val("");
        DOM.extendedPubKey.val("");
    }

    function addAddressToList(index, address, pubkey, privkey) {
        var row = $(addressRowTemplate.html());
        // Elements
        var indexCell = row.find(".index span");
        var addressCell = row.find(".address span");
        var pubkeyCell = row.find(".pubkey span");
        var privkeyCell = row.find(".privkey span");
        // Content
        var indexText = derivationPath + "/" + index;
        indexCell.text(indexText);
        addressCell.text(address);
        pubkeyCell.text(pubkey)
        privkeyCell.text(privkey);
        // Visibility
        if (!showIndex) {
            indexCell.addClass("invisible");
        }
        if (!showAddress) {
            addressCell.addClass("invisible");
        }
        if (!showPubKey) {
            pubkeyCell.addClass("invisible");
        }
        if (!showPrivKey) {
            privkeyCell.addClass("invisible");
        }
        DOM.addresses.append(row);
    }

    function hasStrongRandom() {
        return 'crypto' in window && window['crypto'] !== null;
    }

    function disableForms() {
        $("form").on("submit", function(e) {
            e.preventDefault();
        });
    }

    function setBip44DerivationPath() {
        var purpose = parseIntNoNaN(DOM.bip44purpose.val(), 44);
        var coin = parseIntNoNaN(DOM.bip44coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip44account.val(), 0);
        var change = parseIntNoNaN(DOM.bip44change.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'";
        if (!network.ethereum) {
            path += "/" + change;
        }
        DOM.bip44path.val(path);
        derivationPath = DOM.bip44path.val();
    }

    function parseIntNoNaN(val, defaultVal) {
        var v = parseInt(val);
        if (isNaN(v)) {
            return defaultVal;
        }
        return v;
    }

    function showPending() {
        DOM.feedback
            .text("Calculating...")
            .show();
    }

    function hidePending() {
        DOM.feedback
            .text("")
            .hide();
    }



    function populateNetworkSelect() {
        networks = networks.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} ); 

        for (var i=0; i<networks.length; i++) {
            var network = networks[i];
            var option = $("<option>");
            option.attr("value", i);
            option.text(network.name);
            DOM.phraseNetwork.append(option);
        }
    }

    var networks = [

        {
            name: "Auroracoin",
            onSelect: function() {
                network = bitcoin.networks.auroracoin;
                DOM.bip44coin.val(85);
            },
        },
        {
            name: "Bata",
            onSelect: function() {
                network = bitcoin.networks.batacoin;
                DOM.bip44coin.val(89);
            },
        },
        {
            name: "Bitcoin",
            onSelect: function() {
                network = bitcoin.networks.bitcoin;
                DOM.bip44coin.val(0);
            },
        },
        {
            name: "Blackcoin",
            onSelect: function() {
                network = bitcoin.networks.blackcoin;
                DOM.bip44coin.val(10);
            },
        },
        {
            name: "Bitcoin Testnet",
            onSelect: function() {
                network = bitcoin.networks.testnet;
                DOM.bip44coin.val(1);
            },
        },
        {
            name: "Clams",
            onSelect: function() {
                network = bitcoin.networks.clam;
                DOM.bip44coin.val(23);
            },
        },
        {
            name: "Dash",
            onSelect: function() {
                network = bitcoin.networks.dash;
                DOM.bip44coin.val(5);
            },
        },
        {
            name: "Dogecoin",
            onSelect: function() {
                network = bitcoin.networks.dogecoin;
                DOM.bip44coin.val(3);
            },
        },
        {
            name: "NuBits",
            onSelect: function() {
                network = bitcoin.networks.nubits;
                DOM.bip44coin.val(12);
            },
        },
        {
            name: "NuShares",
            onSelect: function() {
                network = bitcoin.networks.nushares;
                DOM.bip44coin.val(11);
            },
        },
        {
            name: "Litecoin",
            onSelect: function() {
                network = bitcoin.networks.litecoin;
                DOM.bip44coin.val(2);
            },
        },
        {
            name: "Potcoin",
            onSelect: function() {
                network = bitcoin.networks.potcoin;
                DOM.bip44coin.val(81);
            },
        },
        {
            name: "Feathercoin",
            onSelect: function() {
                network = bitcoin.networks.feathercoin;
                DOM.bip44coin.val(8);
            },
        },
        {
            name: "Gridcoin",
            onSelect: function() {
                network = bitcoin.networks.gridcoin;
                DOM.bip44coin.val(84);
            },
        },
        {
            name: "Novacoin",
            onSelect: function() {
                network = bitcoin.networks.novacoin;
                DOM.bip44coin.val(50);
            },
        },
        {
            name: "Cannacoin",
            onSelect: function() {
                network = bitcoin.networks.cannacoin;
                DOM.bip44coin.val(19);
            },
        },
        {
            name: "Clubcoin",
            onSelect: function() {
                network = bitcoin.networks.clubcoin;
                DOM.bip44coin.val(79);
            },
        },
        {
            name: "Digibyte",
            onSelect: function() {
                network = bitcoin.networks.digibyte;
                DOM.bip44coin.val(20);
            },
        },
        {
            name: "Digitalcoin",
            onSelect: function() {
                network = bitcoin.networks.digitalcoin;
                DOM.bip44coin.val(18);
            },
        },
        {
            name: "EDRCoin",
            onSelect: function() {
                network = bitcoin.networks.edrcoin;
                DOM.bip44coin.val(56);
            },
        },
        {
            name: "e-Gulden",
            onSelect: function() {
                network = bitcoin.networks.egulden;
                DOM.bip44coin.val(2);
            },
        },
        {
            name: "Gulden",
            onSelect: function() {
                network = bitcoin.networks.gulden;
                DOM.bip44coin.val(87);
            },
        },
        {
            name: "GCRCoin",
            onSelect: function() {
                network = bitcoin.networks.gcrcoin;
                DOM.bip44coin.val(49);
            },
        },
        {
            name: "Jumbucks",
            onSelect: function() {
                network = bitcoin.networks.jumbucks;
                DOM.bip44coin.val(26);
            },
        },
        {
            name: "Monacoin",
            onSelect: function() {
                network = bitcoin.networks.monacoin;
                DOM.bip44coin.val(22);
            },
        },
        {
            name: "Myriadcoin",
            onSelect: function() {
                network = bitcoin.networks.myriadcoin;
                DOM.bip44coin.val(90);
            },
        },
        {
            name: "Neoscoin",
            onSelect: function() {
                network = bitcoin.networks.neoscoin;
                DOM.bip44coin.val(25);
            },
        },
        {
            name: "ParkByte",
            onSelect: function() {
                network = bitcoin.networks.parkbyte;
                DOM.bip44coin.val(36);
            },
        },
        {
            name: "Peercoin",
            onSelect: function() {
                network = bitcoin.networks.peercoin;
                DOM.bip44coin.val(6);
            },
        },
        {
            name: "Pesobit",
            onSelect: function() {
                network = bitcoin.networks.pesobit;
                DOM.bip44coin.val(62);
            },
        },
        {
            name: "Primecoin",
            onSelect: function() {
                network = bitcoin.networks.primecoin;
                DOM.bip44coin.val(24);
            },
        },
        {
            name: "Reddcoin",
            onSelect: function() {
                network = bitcoin.networks.reddcoin;
                DOM.bip44coin.val(4);
            },
        },
        {
            name: "Rubycoin",
            onSelect: function() {
                network = bitcoin.networks.rubycoin;
                DOM.bip44coin.val(16);
            },
        },
                {
            name: "ShadowCash",
            onSelect: function() {
                network = bitcoin.networks.shadow;
                DOM.bip44coin.val(35);
            },
        },
        {
            name: "ShadowCash Testnet",
            onSelect: function() {
                network = bitcoin.networks.shadowtn;
                DOM.bip44coin.val(1);
            },
        },
        {
            name: "Smileycoin",
            onSelect: function() {
                network = bitcoin.networks.smileycoin;
                DOM.bip44coin.val(59);
            },
        },
        {
            name: "Solarcoin",
            onSelect: function() {
                network = bitcoin.networks.solarcoin;
                DOM.bip44coin.val(58);
            },
        },
        {
            name: "Syscoin",
            onSelect: function() {
                network = bitcoin.networks.syscoin;
                DOM.bip44coin.val(57);
            },
        },
        {
            name: "Unobtanium",
            onSelect: function() {
                network = bitcoin.networks.unobtanium;
                DOM.bip44coin.val(92);
            },
        },
        {
            name: "Vergecoin",
            onSelect: function() {
                network = bitcoin.networks.vergecoin;
                DOM.bip44coin.val(77);
            },
        },
        {
            name: "Vertcoin",
            onSelect: function() {
                network = bitcoin.networks.vertcoin;
                DOM.bip44coin.val(28);
            },
        },
                {
            name: "Viacoin",
            onSelect: function() {
                network = bitcoin.networks.viacoin;
                DOM.bip44coin.val(14);
            },
        },
        {
            name: "Viacoin Testnet",
            onSelect: function() {
                network = bitcoin.networks.viacointestnet;
                DOM.bip44coin.val(1);
            },
        },
        {
            name: "Vpncoin",
            onSelect: function() {
                network = bitcoin.networks.vpncoin;
                DOM.bip44coin.val(33);
            },
        },
        {
            name: "Richcoin",
            onSelect: function() {
                network = bitcoin.networks.richcoin;
                DOM.bip44coin.val(80);
            },
        },
        {
            name: "Ethereum",
            onSelect: function() {
                network = bitcoin.networks.eth;
                DOM.bip44coin.val(60);
            },
        },
        {
            name: "Ethereum Classic",
            onSelect: function() {
                network = bitcoin.networks.etc;
                DOM.bip44coin.val(61);
            },
        },
        {
            name: "PIVX",
            onSelect: function() {
                network = bitcoin.networks.pivx;
                DOM.bip44coin.val(119);
            },
        },
        {
            name: "Abncoin",
            onSelect: function() {
                network = bitcoin.networks.abncoin;
                DOM.bip44coin.val(141);
            },
        },
        {
            name: "Asiancoin",
            onSelect: function() {
                network = bitcoin.networks.asiacoin;
                DOM.bip44coin.val(51);
            },
        },
        {
            name: "BitcoinPlus",
            onSelect: function() {
                network = bitcoin.networks.bitcoinplus;
                DOM.bip44coin.val(65);
            },
        },
        {
            name: "Canada eCoin",
            onSelect: function() {
                network = bitcoin.networks.canadaecoin;
                DOM.bip44coin.val(34);
            },
        },
        {
            name: "Einsteinium",
            onSelect: function() {
                network = bitcoin.networks.einsteinium;
                DOM.bip44coin.val(41);
            },
        },
        {
            name: "Expanse",
            onSelect: function() {
                network = bitcoin.networks.expanse;
                DOM.bip44coin.val(40);
            },
        },
        {
            name: "Gamecredits",
            onSelect: function() {
                network = bitcoin.networks.gamecredits;
                DOM.bip44coin.val(101);
            },
        },
        {
            name: "Internet of People",
            onSelect: function() {
                network = bitcoin.networks.iop;
                DOM.bip44coin.val(66);
            },
        },
        {
            name: "IXCoin",
            onSelect: function() {
                network = bitcoin.networks.ixcoin;
                DOM.bip44coin.val(86);
            },
        },
        {
            name: "Landcoin",
            onSelect: function() {
                network = bitcoin.networks.landcoin;
                DOM.bip44coin.val(63);
            },
        },
        {
            name: "Namecoin",
            onSelect: function() {
                network = bitcoin.networks.namecoin;
                DOM.bip44coin.val(7);
            },
        },
        {
            name: "Navcoin",
            onSelect: function() {
                network = bitcoin.networks.navcoin;
                DOM.bip44coin.val(130);
            },
        },
        {
            name: "OKCash",
            onSelect: function() {
                network = bitcoin.networks.okcash;
                DOM.bip44coin.val(69);
            },
        },
        {
            name: "POSWcoin",
            onSelect: function() {
                network = bitcoin.networks.posw;
                DOM.bip44coin.val(47);
            },
        },
        {
            name: "Stratis",
            onSelect: function() {
                network = bitcoin.networks.stratis;
                DOM.bip44coin.val(105);
            },
        },
        {
            name: "ZCash",
            onSelect: function() {
                network = bitcoin.networks.zcash;
                DOM.bip44coin.val(133);
            },
        },
        {
            name: "Bela",
            onSelect: function() {
                network = bitcoin.networks.bela;
                DOM.bip44coin.val(73);
            },
        },
        {
            name: "Britcoin",
            onSelect: function() {
                network = bitcoin.networks.britcoin;
                DOM.bip44coin.val(70);
            },
        },
        {
            name: "Compcoin",
            onSelect: function() {
                network = bitcoin.networks.compcoin;
                DOM.bip44coin.val(74);
            },
        },
        {
            name: "LBRY",
            onSelect: function() {
                network = bitcoin.networks.lbry;
                DOM.bip44coin.val(140);
            },
        },
        {
            name: "ZCoin",
            onSelect: function() {
                network = bitcoin.networks.zcoin;
                DOM.bip44coin.val(136);
            },
        },
        {
            name: "Insane",
            onSelect: function() {
                network = bitcoin.networks.insane;
                DOM.bip44coin.val(68);
            },
        },
        {
            name: "Ultimatesecurecash",
            onSelect: function() {
                network = bitcoin.networks.ultimatesecurecash;
                DOM.bip44coin.val(112);
            },
        },
        {
            name: "Neurocoin",
            onSelect: function() {
                network = bitcoin.networks.neurocoin;
                DOM.bip44coin.val(110);
            },
        },
        {
            name: "Hempcoin",
            onSelect: function() {
                network = bitcoin.networks.hempcoin;
                DOM.bip44coin.val(113);
            },
        },
        {
            name: "Linxcoin",
            onSelect: function() {
                network = bitcoin.networks.linxcoin;
                DOM.bip44coin.val(114);
            },
        },
        {
            name: "Ecoin",
            onSelect: function() {
                network = bitcoin.networks.ecoin;
                DOM.bip44coin.val(115);
            },
        },
        {
            name: "Denarius",
            onSelect: function() {
                network = bitcoin.networks.denarius;
                DOM.bip44coin.val(116);
            },
        },
        {
            name: "Pinkcoin",
            onSelect: function() {
                network = bitcoin.networks.pinkcoin;
                DOM.bip44coin.val(117);
            },
        },
        {
            name: "Flashcoin",
            onSelect: function() {
                network = bitcoin.networks.flashcoin;
                DOM.bip44coin.val(120);
            },
        },
        {
            name: "Defcoin",
            onSelect: function() {
                network = bitcoin.networks.defcoin;
                DOM.bip44coin.val(1337);
            },
        },
        {
            name: "Zencash",
            onSelect: function() {
                network = bitcoin.networks.zencash;
                DOM.bip44coin.val(121);
            },
        },
        {
            name: "Putincoin",
            onSelect: function() {
                network = bitcoin.networks.putincoin;
                DOM.bip44coin.val(122);
            },
        },
        {
            name: "Smartcash",
            onSelect: function() {
                network = bitcoin.networks.smartcash;
                DOM.bip44coin.val(125);
            },
        },
        {
            name: "Fujicoin",
            onSelect: function() {
                network = bitcoin.networks.fujicoin;
                DOM.bip44coin.val(75);
            },
        },
        {
            name: "Link",
            onSelect: function() {
                network = bitcoin.networks.link;
                DOM.bip44coin.val(76);
            },
        },
        {
            name: "Voxels",
            onSelect: function() {
                network = bitcoin.networks.voxels;
                DOM.bip44coin.val(126);
            },
        },
        {
            name: "Crown",
            onSelect: function() {
                network = bitcoin.networks.crown;
                DOM.bip44coin.val(72);
            },
        },
        {
            name: "Vcash",
            onSelect: function() {
                network = bitcoin.networks.vcash;
                DOM.bip44coin.val(127);
            },
        },
        {
            name: "Bridgecoin",
            onSelect: function() {
                network = bitcoin.networks.bridgecoin;
                DOM.bip44coin.val(148);
            },
        },
        {
            name: "Bitsend",
            onSelect: function() {
                network = bitcoin.networks.bitsend;
                DOM.bip44coin.val(91);
            },
        },
        {
            name: "Bitcore",
            onSelect: function() {
                network = bitcoin.networks.bitcore;
                DOM.bip44coin.val(150);
            },
        },
        {
            name: "Europecoin",
            onSelect: function() {
                network = bitcoin.networks.europecoin;
                DOM.bip44coin.val(151);
            },
        },
        {
            name: "Toacoin",
            onSelect: function() {
                network = bitcoin.networks.toacoin;
                DOM.bip44coin.val(159);
            },
        },
        {
            name: "Diamond",
            onSelect: function() {
                network = bitcoin.networks.diamond;
                DOM.bip44coin.val(158);
            },
        },
        {
            name: "Adcoin",
            onSelect: function() {
                network = bitcoin.networks.adcoin;
                DOM.bip44coin.val(161);
            },
        },
    ]

    init();

})();
