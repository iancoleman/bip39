(function() {

    // mnemonics is populated as required by getLanguage
    var mnemonics = { "english": new Mnemonic("english") };
    var mnemonic = mnemonics["english"];
    var seed = null;
    var bip32RootKey = null;
    var bip32ExtendedKey = null;
    var network = bitcoinjs.bitcoin.networks.bitcoin;
    var addressRowTemplate = $("#address-row-template");

    var showIndex = true;
    var showAddress = true;
    var showPubKey = true;
    var showPrivKey = true;
    var showQr = false;
    var litecoinUseLtub = true;

    var entropyChangeTimeoutEvent = null;
    var phraseChangeTimeoutEvent = null;
    var rootKeyChangedTimeoutEvent = null;

    var generationProcesses = [];

    var DOM = {};
    DOM.privacyScreenToggle = $(".privacy-screen-toggle");
    DOM.network = $(".network");
    DOM.bip32Client = $("#bip32-client");
    DOM.phraseNetwork = $("#network-phrase");
    DOM.useEntropy = $(".use-entropy");
    DOM.entropyContainer = $(".entropy-container");
    DOM.entropy = $(".entropy");
    DOM.entropyFiltered = DOM.entropyContainer.find(".filtered");
    DOM.entropyType = DOM.entropyContainer.find(".type");
    DOM.entropyCrackTime = DOM.entropyContainer.find(".crack-time");
    DOM.entropyEventCount = DOM.entropyContainer.find(".event-count");
    DOM.entropyBits = DOM.entropyContainer.find(".bits");
    DOM.entropyBitsPerEvent = DOM.entropyContainer.find(".bits-per-event");
    DOM.entropyWordCount = DOM.entropyContainer.find(".word-count");
    DOM.entropyBinary = DOM.entropyContainer.find(".binary");
    DOM.entropyWordIndexes = DOM.entropyContainer.find(".word-indexes");
    DOM.entropyChecksum = DOM.entropyContainer.find(".checksum");
    DOM.entropyMnemonicLength = DOM.entropyContainer.find(".mnemonic-length");
    DOM.entropyWeakEntropyOverrideWarning = DOM.entropyContainer.find(".weak-entropy-override-warning");
    DOM.entropyFilterWarning = DOM.entropyContainer.find(".filter-warning");
    DOM.phrase = $(".phrase");
    DOM.passphrase = $(".passphrase");
    DOM.generateContainer = $(".generate-container");
    DOM.generate = $(".generate");
    DOM.seed = $(".seed");
    DOM.rootKey = $(".root-key");
    DOM.litecoinLtubContainer = $(".litecoin-ltub-container");
    DOM.litecoinUseLtub = $(".litecoin-use-ltub");
    DOM.extendedPrivKey = $(".extended-priv-key");
    DOM.extendedPubKey = $(".extended-pub-key");
    DOM.bip32tab = $("#bip32-tab");
    DOM.bip44tab = $("#bip44-tab");
    DOM.bip49tab = $("#bip49-tab");
    DOM.bip84tab = $("#bip84-tab");
    DOM.bip141tab = $("#bip141-tab");
    DOM.bip32panel = $("#bip32");
    DOM.bip44panel = $("#bip44");
    DOM.bip49panel = $("#bip49");
    DOM.bip32path = $("#bip32-path");
    DOM.bip44path = $("#bip44-path");
    DOM.bip44purpose = $("#bip44 .purpose");
    DOM.bip44coin = $("#bip44 .coin");
    DOM.bip44account = $("#bip44 .account");
    DOM.bip44accountXprv = $("#bip44 .account-xprv");
    DOM.bip44accountXpub = $("#bip44 .account-xpub");
    DOM.bip44change = $("#bip44 .change");
    DOM.bip49unavailable = $("#bip49 .unavailable");
    DOM.bip49available = $("#bip49 .available");
    DOM.bip49path = $("#bip49-path");
    DOM.bip49purpose = $("#bip49 .purpose");
    DOM.bip49coin = $("#bip49 .coin");
    DOM.bip49account = $("#bip49 .account");
    DOM.bip49accountXprv = $("#bip49 .account-xprv");
    DOM.bip49accountXpub = $("#bip49 .account-xpub");
    DOM.bip49change = $("#bip49 .change");
    DOM.bip84unavailable = $("#bip84 .unavailable");
    DOM.bip84available = $("#bip84 .available");
    DOM.bip84path = $("#bip84-path");
    DOM.bip84purpose = $("#bip84 .purpose");
    DOM.bip84coin = $("#bip84 .coin");
    DOM.bip84account = $("#bip84 .account");
    DOM.bip84accountXprv = $("#bip84 .account-xprv");
    DOM.bip84accountXpub = $("#bip84 .account-xpub");
    DOM.bip84change = $("#bip84 .change");
    DOM.bip141unavailable = $("#bip141 .unavailable");
    DOM.bip141available = $("#bip141 .available");
    DOM.bip141path = $("#bip141-path");
    DOM.bip141semantics = $(".bip141-semantics");
    DOM.generatedStrength = $(".generate-container .strength");
    DOM.generatedStrengthWarning = $(".generate-container .warning");
    DOM.hardenedAddresses = $(".hardened-addresses");
    DOM.bitcoinCashAddressTypeContainer = $(".bch-addr-type-container");
    DOM.bitcoinCashAddressType = $("[name=bch-addr-type]")
    DOM.useBip38 = $(".use-bip38");
    DOM.bip38Password = $(".bip38-password");
    DOM.addresses = $(".addresses");
    DOM.csvTab = $("#csv-tab a");
    DOM.csv = $(".csv");
    DOM.rowsToAdd = $(".rows-to-add");
    DOM.more = $(".more");
    DOM.moreRowsStartIndex = $(".more-rows-start-index");
    DOM.feedback = $(".feedback");
    DOM.tab = $(".derivation-type a");
    DOM.indexToggle = $(".index-toggle");
    DOM.addressToggle = $(".address-toggle");
    DOM.publicKeyToggle = $(".public-key-toggle");
    DOM.privateKeyToggle = $(".private-key-toggle");
    DOM.languages = $(".languages a");
    DOM.qrContainer = $(".qr-container");
    DOM.qrHider = DOM.qrContainer.find(".qr-hider");
    DOM.qrImage = DOM.qrContainer.find(".qr-image");
    DOM.qrHint = DOM.qrContainer.find(".qr-hint");
    DOM.showQrEls = $("[data-show-qr]");

    function init() {
        // Events
        DOM.privacyScreenToggle.on("change", privacyScreenToggled);
        DOM.generatedStrength.on("change", generatedStrengthChanged);
        DOM.network.on("change", networkChanged);
        DOM.bip32Client.on("change", bip32ClientChanged);
        DOM.useEntropy.on("change", setEntropyVisibility);
        DOM.entropy.on("input", delayedEntropyChanged);
        DOM.entropyMnemonicLength.on("change", entropyChanged);
        DOM.phrase.on("input", delayedPhraseChanged);
        DOM.passphrase.on("input", delayedPhraseChanged);
        DOM.generate.on("click", generateClicked);
        DOM.more.on("click", showMore);
        DOM.rootKey.on("input", delayedRootKeyChanged);
        DOM.litecoinUseLtub.on("change", litecoinUseLtubChanged);
        DOM.bip32path.on("input", calcForDerivationPath);
        DOM.bip44account.on("input", calcForDerivationPath);
        DOM.bip44change.on("input", calcForDerivationPath);
        DOM.bip49account.on("input", calcForDerivationPath);
        DOM.bip49change.on("input", calcForDerivationPath);
        DOM.bip84account.on("input", calcForDerivationPath);
        DOM.bip84change.on("input", calcForDerivationPath);
        DOM.bip141path.on("input", calcForDerivationPath);
        DOM.bip141semantics.on("change", tabChanged);
        DOM.tab.on("shown.bs.tab", tabChanged);
        DOM.hardenedAddresses.on("change", calcForDerivationPath);
        DOM.useBip38.on("change", calcForDerivationPath);
        DOM.bip38Password.on("change", calcForDerivationPath);
        DOM.indexToggle.on("click", toggleIndexes);
        DOM.addressToggle.on("click", toggleAddresses);
        DOM.publicKeyToggle.on("click", togglePublicKeys);
        DOM.privateKeyToggle.on("click", togglePrivateKeys);
        DOM.csvTab.on("click", updateCsv);
        DOM.languages.on("click", languageChanged);
        DOM.bitcoinCashAddressType.on("change", bitcoinCashAddressTypeChange);
        setQrEvents(DOM.showQrEls);
        disableForms();
        hidePending();
        hideValidationError();
        populateNetworkSelect();
        populateClientSelect();
    }

    // Event handlers

    function generatedStrengthChanged() {
        var strength = parseInt(DOM.generatedStrength.val());
        if (strength < 12) {
            DOM.generatedStrengthWarning.removeClass("hidden");
        }
        else {
            DOM.generatedStrengthWarning.addClass("hidden");
        }
    }

    function networkChanged(e) {
        clearDerivedKeys();
        clearAddressesList();
        DOM.litecoinLtubContainer.addClass("hidden");
        DOM.bitcoinCashAddressTypeContainer.addClass("hidden");
        var networkIndex = e.target.value;
        var network = networks[networkIndex];
        network.onSelect();
        adjustNetworkForSegwit();
        if (seed != null) {
            phraseChanged();
        }
        else {
            rootKeyChanged();
        }
    }

    function bip32ClientChanged(e) {
        var clientIndex = DOM.bip32Client.val();
        if (clientIndex == "custom") {
            DOM.bip32path.prop("readonly", false);
        }
        else {
            DOM.bip32path.prop("readonly", true);
            clients[clientIndex].onSelect();
            if (seed != null) {
                phraseChanged();
            }
            else {
                rootKeyChanged();
            }
        }
    }

    function setEntropyVisibility() {
        if (isUsingOwnEntropy()) {
            DOM.entropyContainer.removeClass("hidden");
            DOM.generateContainer.addClass("hidden");
            DOM.phrase.prop("readonly", true);
            DOM.entropy.focus();
            entropyChanged();
        }
        else {
            DOM.entropyContainer.addClass("hidden");
            DOM.generateContainer.removeClass("hidden");
            DOM.phrase.prop("readonly", false);
            hidePending();
        }
    }

    function delayedPhraseChanged() {
        hideValidationError();
        seed = null;
        bip32RootKey = null;
        bip32ExtendedKey = null;
        clearAddressesList();
        showPending();
        if (phraseChangeTimeoutEvent != null) {
            clearTimeout(phraseChangeTimeoutEvent);
        }
        phraseChangeTimeoutEvent = setTimeout(phraseChanged, 400);
    }

    function phraseChanged() {
        showPending();
        setMnemonicLanguage();
        // Get the mnemonic phrase
        var phrase = DOM.phrase.val();
        var errorText = findPhraseErrors(phrase);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        // Calculate and display
        var passphrase = DOM.passphrase.val();
        calcBip32RootKeyFromSeed(phrase, passphrase);
        calcForDerivationPath();
        // Show the word indexes
        showWordIndexes();
    }

    function tabChanged() {
        showPending();
        adjustNetworkForSegwit();
        var phrase = DOM.phrase.val();
        if (phrase != "") {
            // Calculate and display for mnemonic
            var errorText = findPhraseErrors(phrase);
            if (errorText) {
                showValidationError(errorText);
                return;
            }
            // Calculate and display
            var passphrase = DOM.passphrase.val();
            calcBip32RootKeyFromSeed(phrase, passphrase);
        }
        else {
            // Calculate and display for root key
            var rootKeyBase58 = DOM.rootKey.val();
            var errorText = validateRootKey(rootKeyBase58);
            if (errorText) {
                showValidationError(errorText);
                return;
            }
            // Calculate and display
            calcBip32RootKeyFromBase58(rootKeyBase58);
        }
        calcForDerivationPath();
    }

    function delayedEntropyChanged() {
        hideValidationError();
        showPending();
        if (entropyChangeTimeoutEvent != null) {
            clearTimeout(entropyChangeTimeoutEvent);
        }
        entropyChangeTimeoutEvent = setTimeout(entropyChanged, 400);
    }

    function entropyChanged() {
        // If blank entropy, clear mnemonic, addresses, errors
        if (DOM.entropy.val().trim().length == 0) {
            clearDisplay();
            clearEntropyFeedback();
            DOM.phrase.val("");
            showValidationError("Blank entropy");
            return;
        }
        // Get the current phrase to detect changes
        var phrase = DOM.phrase.val();
        // Set the phrase from the entropy
        setMnemonicFromEntropy();
        // Recalc addresses if the phrase has changed
        var newPhrase = DOM.phrase.val();
        if (newPhrase != phrase) {
            if (newPhrase.length == 0) {
                clearDisplay();
            }
            else {
                phraseChanged();
            }
        }
        else {
            hidePending();
        }
    }

    function delayedRootKeyChanged() {
        // Warn if there is an existing mnemonic or passphrase.
        if (DOM.phrase.val().length > 0 || DOM.passphrase.val().length > 0) {
            if (!confirm("This will clear existing mnemonic and passphrase")) {
                DOM.rootKey.val(bip32RootKey);
                return
            }
        }
        hideValidationError();
        showPending();
        // Clear existing mnemonic and passphrase
        DOM.phrase.val("");
        DOM.passphrase.val("");
        seed = null;
        if (rootKeyChangedTimeoutEvent != null) {
            clearTimeout(rootKeyChangedTimeoutEvent);
        }
        rootKeyChangedTimeoutEvent = setTimeout(rootKeyChanged, 400);
    }

    function rootKeyChanged() {
        showPending();
        hideValidationError();
        var rootKeyBase58 = DOM.rootKey.val();
        var errorText = validateRootKey(rootKeyBase58);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        // Calculate and display
        calcBip32RootKeyFromBase58(rootKeyBase58);
        calcForDerivationPath();
    }

    function litecoinUseLtubChanged() {
        litecoinUseLtub = DOM.litecoinUseLtub.prop("checked");
        if (litecoinUseLtub) {
            network = bitcoinjs.bitcoin.networks.litecoin;
        }
        else {
            network = bitcoinjs.bitcoin.networks.litecoinXprv;
        }
        phraseChanged();
    }

    function calcForDerivationPath() {
        clearDerivedKeys();
        clearAddressesList();
        showPending();
        // Don't show segwit if it's selected but network doesn't support it
        if (segwitSelected() && !networkHasSegwit()) {
            showSegwitUnavailable();
            hidePending();
            return;
        }
        showSegwitAvailable();
        // Get the derivation path
        var derivationPath = getDerivationPath();
        var errorText = findDerivationPathErrors(derivationPath);
        if (errorText) {
            showValidationError(errorText);
            return;
        }
        bip32ExtendedKey = calcBip32ExtendedKey(derivationPath);
        if (bip44TabSelected()) {
            displayBip44Info();
        }
        else if (bip49TabSelected()) {
            displayBip49Info();
        }
        else if (bip84TabSelected()) {
            displayBip84Info();
        }
        displayBip32Info();
    }

    function generateClicked() {
        if (isUsingOwnEntropy()) {
            return;
        }
        clearDisplay();
        showPending();
        setTimeout(function() {
            setMnemonicLanguage();
            var phrase = generateRandomPhrase();
            if (!phrase) {
                return;
            }
            phraseChanged();
        }, 50);
    }

    function languageChanged() {
        setTimeout(function() {
            setMnemonicLanguage();
            if (DOM.phrase.val().length > 0) {
                var newPhrase = convertPhraseToNewLanguage();
                DOM.phrase.val(newPhrase);
                phraseChanged();
            }
            else {
                DOM.generate.trigger("click");
            }
        }, 50);
    }

    function bitcoinCashAddressTypeChange() {
        phraseChanged();
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

    function privacyScreenToggled() {
        // private-data contains elements added to DOM at runtime
        // so catch all by adding visual privacy class to the root of the DOM
        if (DOM.privacyScreenToggle.prop("checked")) {
            $("body").addClass("visual-privacy");
        }
        else {
            $("body").removeClass("visual-privacy");
        }
    }

    // Private methods

    function generateRandomPhrase() {
        if (!hasStrongRandom()) {
            var errorText = "This browser does not support strong randomness";
            showValidationError(errorText);
            return;
        }
        // get the amount of entropy to use
        var numWords = parseInt(DOM.generatedStrength.val());
        var strength = numWords / 3 * 32;
        var buffer = new Uint8Array(strength / 8);
        // create secure entropy
        var data = crypto.getRandomValues(buffer);
        // show the words
        var words = mnemonic.toMnemonic(data);
        DOM.phrase.val(words);
        // show the entropy
        var entropyHex = uint8ArrayToHex(data);
        DOM.entropy.val(entropyHex);
        // ensure entropy fields are consistent with what is being displayed
        DOM.entropyMnemonicLength.val("raw");
        return words;
    }

    function calcBip32RootKeyFromSeed(phrase, passphrase) {
        seed = mnemonic.toSeed(phrase, passphrase);
        bip32RootKey = bitcoinjs.bitcoin.HDNode.fromSeedHex(seed, network);
    }

    function calcBip32RootKeyFromBase58(rootKeyBase58) {
        // try parsing with various segwit network params since this extended
        // key may be from any one of them.
        if (networkHasSegwit()) {
            var n = network;
            if ("baseNetwork" in n) {
                n = bitcoinjs.bitcoin.networks[n.baseNetwork];
            }
            // try parsing using base network params
            try {
                bip32RootKey = bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, n);
                return;
            }
            catch (e) {}
            // try parsing using p2wpkh params
            if ("p2wpkh" in n) {
                try {
                    bip32RootKey = bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, n.p2wpkh);
                    return;
                }
                catch (e) {}
            }
            // try parsing using p2wpkh-in-p2sh network params
            if ("p2wpkhInP2sh" in n) {
                try {
                    bip32RootKey = bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, n.p2wpkhInP2sh);
                    return;
                }
                catch (e) {}
            }
        }
        // try the network params as currently specified
        bip32RootKey = bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, network);
    }

    function calcBip32ExtendedKey(path) {
        // Check there's a root key to derive from
        if (!bip32RootKey) {
            return bip32RootKey;
        }
        var extendedKey = bip32RootKey;
        // Derive the key from the path
        var pathBits = path.split("/");
        for (var i=0; i<pathBits.length; i++) {
            var bit = pathBits[i];
            var index = parseInt(bit);
            if (isNaN(index)) {
                continue;
            }
            var hardened = bit[bit.length-1] == "'";
            var isPriv = !(extendedKey.isNeutered());
            var invalidDerivationPath = hardened && !isPriv;
            if (invalidDerivationPath) {
                extendedKey = null;
            }
            else if (hardened) {
                extendedKey = extendedKey.deriveHardened(index);
            }
            else {
                extendedKey = extendedKey.derive(index);
            }
        }
        return extendedKey
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

    function findPhraseErrors(phrase) {
        // Preprocess the words
        phrase = mnemonic.normalizeString(phrase);
        var words = phraseToWordArray(phrase);
        // Detect blank phrase
        if (words.length == 0) {
            return "Blank mnemonic";
        }
        // Check each word
        for (var i=0; i<words.length; i++) {
            var word = words[i];
            var language = getLanguage();
            if (WORDLISTS[language].indexOf(word) == -1) {
                console.log("Finding closest match to " + word);
                var nearestWord = findNearestWord(word);
                return word + " not in wordlist, did you mean " + nearestWord + "?";
            }
        }
        // Check the words are valid
        var properPhrase = wordArrayToPhrase(words);
        var isValid = mnemonic.check(properPhrase);
        if (!isValid) {
            return "Invalid mnemonic";
        }
        return false;
    }

    function validateRootKey(rootKeyBase58) {
        // try various segwit network params since this extended key may be from
        // any one of them.
        if (networkHasSegwit()) {
            var n = network;
            if ("baseNetwork" in n) {
                n = bitcoinjs.bitcoin.networks[n.baseNetwork];
            }
            // try parsing using base network params
            try {
                bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, n);
                return "";
            }
            catch (e) {}
            // try parsing using p2wpkh params
            if ("p2wpkh" in n) {
                try {
                    bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, n.p2wpkh);
                    return "";
                }
                catch (e) {}
            }
            // try parsing using p2wpkh-in-p2sh network params
            if ("p2wpkhInP2sh" in n) {
                try {
                    bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, n.p2wpkhInP2sh);
                    return "";
                }
                catch (e) {}
            }
        }
        // try the network params as currently specified
        try {
            bitcoinjs.bitcoin.HDNode.fromBase58(rootKeyBase58, network);
        }
        catch (e) {
            return "Invalid root key";
        }
        return "";
    }

    function getDerivationPath() {
        if (bip44TabSelected()) {
            var purpose = parseIntNoNaN(DOM.bip44purpose.val(), 44);
            var coin = parseIntNoNaN(DOM.bip44coin.val(), 0);
            var account = parseIntNoNaN(DOM.bip44account.val(), 0);
            var change = parseIntNoNaN(DOM.bip44change.val(), 0);
            var path = "m/";
            path += purpose + "'/";
            path += coin + "'/";
            path += account + "'/";
            path += change;
            DOM.bip44path.val(path);
            var derivationPath = DOM.bip44path.val();
            console.log("Using derivation path from BIP44 tab: " + derivationPath);
            return derivationPath;
        }
        else if (bip49TabSelected()) {
            var purpose = parseIntNoNaN(DOM.bip49purpose.val(), 49);
            var coin = parseIntNoNaN(DOM.bip49coin.val(), 0);
            var account = parseIntNoNaN(DOM.bip49account.val(), 0);
            var change = parseIntNoNaN(DOM.bip49change.val(), 0);
            var path = "m/";
            path += purpose + "'/";
            path += coin + "'/";
            path += account + "'/";
            path += change;
            DOM.bip49path.val(path);
            var derivationPath = DOM.bip49path.val();
            console.log("Using derivation path from BIP49 tab: " + derivationPath);
            return derivationPath;
        }
        else if (bip84TabSelected()) {
            var purpose = parseIntNoNaN(DOM.bip84purpose.val(), 84);
            var coin = parseIntNoNaN(DOM.bip84coin.val(), 0);
            var account = parseIntNoNaN(DOM.bip84account.val(), 0);
            var change = parseIntNoNaN(DOM.bip84change.val(), 0);
            var path = "m/";
            path += purpose + "'/";
            path += coin + "'/";
            path += account + "'/";
            path += change;
            DOM.bip84path.val(path);
            var derivationPath = DOM.bip84path.val();
            console.log("Using derivation path from BIP84 tab: " + derivationPath);
            return derivationPath;
        }
        else if (bip32TabSelected()) {
            var derivationPath = DOM.bip32path.val();
            console.log("Using derivation path from BIP32 tab: " + derivationPath);
            return derivationPath;
        }
        else if (bip141TabSelected()) {
            var derivationPath = DOM.bip141path.val();
            console.log("Using derivation path from BIP141 tab: " + derivationPath);
            return derivationPath;
        }
        else {
            console.log("Unknown derivation path");
        }
    }

    function findDerivationPathErrors(path) {
        // TODO is not perfect but is better than nothing
        // Inspired by
        // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors
        // and
        // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#extended-keys
        var maxDepth = 255; // TODO verify this!!
        var maxIndexValue = Math.pow(2, 31); // TODO verify this!!
        if (path[0] != "m") {
            return "First character must be 'm'";
        }
        if (path.length > 1) {
            if (path[1] != "/") {
                return "Separator must be '/'";
            }
            var indexes = path.split("/");
            if (indexes.length > maxDepth) {
                return "Derivation depth is " + indexes.length + ", must be less than " + maxDepth;
            }
            for (var depth = 1; depth<indexes.length; depth++) {
                var index = indexes[depth];
                var invalidChars = index.replace(/^[0-9]+'?$/g, "")
                if (invalidChars.length > 0) {
                    return "Invalid characters " + invalidChars + " found at depth " + depth;
                }
                var indexValue = parseInt(index.replace("'", ""));
                if (isNaN(depth)) {
                    return "Invalid number at depth " + depth;
                }
                if (indexValue > maxIndexValue) {
                    return "Value of " + indexValue + " at depth " + depth + " must be less than " + maxIndexValue;
                }
            }
        }
        // Check root key exists or else derivation path is useless!
        if (!bip32RootKey) {
            return "No root key";
        }
        // Check no hardened derivation path when using xpub keys
        var hardenedPath = path.indexOf("'") > -1;
        var hardenedAddresses = bip32TabSelected() && DOM.hardenedAddresses.prop("checked");
        var hardened = hardenedPath || hardenedAddresses;
        var isXpubkey = bip32RootKey.isNeutered();
        if (hardened && isXpubkey) {
            return "Hardened derivation path is invalid with xpub key";
        }
        return false;
    }

    function displayBip44Info() {
        // Get the derivation path for the account
        var purpose = parseIntNoNaN(DOM.bip44purpose.val(), 44);
        var coin = parseIntNoNaN(DOM.bip44coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip44account.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        // Calculate the account extended keys
        var accountExtendedKey = calcBip32ExtendedKey(path);
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();
        // Display the extended keys
        DOM.bip44accountXprv.val(accountXprv);
        DOM.bip44accountXpub.val(accountXpub);
    }

    function displayBip49Info() {
        // Get the derivation path for the account
        var purpose = parseIntNoNaN(DOM.bip49purpose.val(), 49);
        var coin = parseIntNoNaN(DOM.bip49coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip49account.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        // Calculate the account extended keys
        var accountExtendedKey = calcBip32ExtendedKey(path);
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();
        // Display the extended keys
        DOM.bip49accountXprv.val(accountXprv);
        DOM.bip49accountXpub.val(accountXpub);
    }

    function displayBip84Info() {
        // Get the derivation path for the account
        var purpose = parseIntNoNaN(DOM.bip84purpose.val(), 84);
        var coin = parseIntNoNaN(DOM.bip84coin.val(), 0);
        var account = parseIntNoNaN(DOM.bip84account.val(), 0);
        var path = "m/";
        path += purpose + "'/";
        path += coin + "'/";
        path += account + "'/";
        // Calculate the account extended keys
        var accountExtendedKey = calcBip32ExtendedKey(path);
        var accountXprv = accountExtendedKey.toBase58();
        var accountXpub = accountExtendedKey.neutered().toBase58();
        // Display the extended keys
        DOM.bip84accountXprv.val(accountXprv);
        DOM.bip84accountXpub.val(accountXpub);
    }

    function displayBip32Info() {
        // Display the key
        DOM.seed.val(seed);
        var rootKey = bip32RootKey.toBase58();
        DOM.rootKey.val(rootKey);
        var xprvkeyB58 = "NA";
        if (!bip32ExtendedKey.isNeutered()) {
            xprvkeyB58 = bip32ExtendedKey.toBase58();
        }
        var extendedPrivKey = xprvkeyB58;
        DOM.extendedPrivKey.val(extendedPrivKey);
        var extendedPubKey = bip32ExtendedKey.neutered().toBase58();
        DOM.extendedPubKey.val(extendedPubKey);
        // Display the addresses and privkeys
        clearAddressesList();
        var initialAddressCount = parseInt(DOM.rowsToAdd.val());
        displayAddresses(0, initialAddressCount);
    }

    function displayAddresses(start, total) {
        generationProcesses.push(new (function() {

            var rows = [];

            this.stop = function() {
                for (var i=0; i<rows.length; i++) {
                    rows[i].shouldGenerate = false;
                }
                hidePending();
            }

            for (var i=0; i<total; i++) {
                var index = i + start;
                var isLast = i == total - 1;
                rows.push(new TableRow(index, isLast));
            }

        })());
    }

    function segwitSelected() {
        return bip49TabSelected() || bip84TabSelected() || bip141TabSelected();
    }

    function p2wpkhSelected() {
        return bip84TabSelected() ||
                bip141TabSelected() && DOM.bip141semantics.val() == "p2wpkh";
    }

    function p2wpkhInP2shSelected() {
        return bip49TabSelected() ||
            (bip141TabSelected() && DOM.bip141semantics.val() == "p2wpkh-p2sh");
    }

    function TableRow(index, isLast) {

        var self = this;
        this.shouldGenerate = true;
        var useHardenedAddresses = DOM.hardenedAddresses.prop("checked");
        var useBip38 = DOM.useBip38.prop("checked");
        var bip38password = DOM.bip38Password.val();
        var isSegwit = segwitSelected();
        var segwitAvailable = networkHasSegwit();
        var isP2wpkh = p2wpkhSelected();
        var isP2wpkhInP2sh = p2wpkhInP2shSelected();

        function init() {
            calculateValues();
        }

        function calculateValues() {
            setTimeout(function() {
                if (!self.shouldGenerate) {
                    return;
                }
                // derive HDkey for this row of the table
                var key = "NA";
                if (useHardenedAddresses) {
                    key = bip32ExtendedKey.deriveHardened(index);
                }
                else {
                    key = bip32ExtendedKey.derive(index);
                }
                // bip38 requires uncompressed keys
                // see https://github.com/iancoleman/bip39/issues/140#issuecomment-352164035
                var keyPair = key.keyPair;
                var useUncompressed = useBip38;
                if (useUncompressed) {
                    keyPair = new bitcoinjs.bitcoin.ECPair(keyPair.d, null, { network: network, compressed: false });
                }
                // get address
                var address = keyPair.getAddress().toString();
                // get privkey
                var hasPrivkey = !key.isNeutered();
                var privkey = "NA";
                if (hasPrivkey) {
                    privkey = keyPair.toWIF();
                    // BIP38 encode private key if required
                    if (useBip38) {
                        privkey = bitcoinjsBip38.encrypt(keyPair.d.toBuffer(), false, bip38password, function(p) {
                            console.log("Progressed " + p.percent.toFixed(1) + "% for index " + index);
                        });
                    }
                }
                // get pubkey
                var pubkey = keyPair.getPublicKeyBuffer().toString('hex');
                var indexText = getDerivationPath() + "/" + index;
                if (useHardenedAddresses) {
                    indexText = indexText + "'";
                }
                // Ethereum values are different
                if ((networks[DOM.network.val()].name == "ETH - Ethereum")
                    || (networks[DOM.network.val()].name == "ETC - Ethereum Classic")
                    || (networks[DOM.network.val()].name == "PIRL - Pirl")
                    || (networks[DOM.network.val()].name == "MIX - MIX")
                    || (networks[DOM.network.val()].name == "MUSIC - Musicoin")
                    || (networks[DOM.network.val()].name == "POA - Poa")
                    || (networks[DOM.network.val()].name == "EXP - Expanse")
                    || (networks[DOM.network.val()].name == "CLO - Callisto")) {
                    var privKeyBuffer = keyPair.d.toBuffer(32);
                    privkey = privKeyBuffer.toString('hex');
                    var addressBuffer = ethUtil.privateToAddress(privKeyBuffer);
                    var hexAddress = addressBuffer.toString('hex');
                    var checksumAddress = ethUtil.toChecksumAddress(hexAddress);
                    address = ethUtil.addHexPrefix(checksumAddress);
                    privkey = ethUtil.addHexPrefix(privkey);
                    pubkey = ethUtil.addHexPrefix(pubkey);
                }
                // Ripple values are different
                if (networks[DOM.network.val()].name == "XRP - Ripple") {
                    privkey = convertRipplePriv(privkey);
                    address = convertRippleAdrr(address);
                }
                // Bitcoin Cash address format may vary
                if (networks[DOM.network.val()].name == "BCH - Bitcoin Cash") {
                    var bchAddrType = DOM.bitcoinCashAddressType.filter(":checked").val();
                    if (bchAddrType == "cashaddr") {
                        address = bchaddr.toCashAddress(address);
                    }
                    else if (bchAddrType == "bitpay") {
                        address = bchaddr.toBitpayAddress(address);
                    }
                }
                // Segwit addresses are different
                if (isSegwit) {
                    if (!segwitAvailable) {
                        return;
                    }
                    if (isP2wpkh) {
                        var keyhash = bitcoinjs.bitcoin.crypto.hash160(key.getPublicKeyBuffer());
                        var scriptpubkey = bitcoinjs.bitcoin.script.witnessPubKeyHash.output.encode(keyhash);
                        address = bitcoinjs.bitcoin.address.fromOutputScript(scriptpubkey, network)
                    }
                    else if (isP2wpkhInP2sh) {
                        var keyhash = bitcoinjs.bitcoin.crypto.hash160(key.getPublicKeyBuffer());
                        var scriptsig = bitcoinjs.bitcoin.script.witnessPubKeyHash.output.encode(keyhash);
                        var addressbytes = bitcoinjs.bitcoin.crypto.hash160(scriptsig);
                        var scriptpubkey = bitcoinjs.bitcoin.script.scriptHash.output.encode(addressbytes);
                        address = bitcoinjs.bitcoin.address.fromOutputScript(scriptpubkey, network)
                    }
                }
                addAddressToList(indexText, address, pubkey, privkey);
                if (isLast) {
                    hidePending();
                    updateCsv();
                }
            }, 50)
        }

        init();

    }

    function showMore() {
        var rowsToAdd = parseInt(DOM.rowsToAdd.val());
        if (isNaN(rowsToAdd)) {
            rowsToAdd = 20;
            DOM.rowsToAdd.val("20");
        }
        var start = parseInt(DOM.moreRowsStartIndex.val())
        if (isNaN(start)) {
            start = lastIndexInTable() + 1;
        }
        else {
            var newStart = start + rowsToAdd;
            DOM.moreRowsStartIndex.val(newStart);
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
        clearKeys();
        hideValidationError();
    }

    function clearAddressesList() {
        DOM.addresses.empty();
        DOM.csv.val("");
        stopGenerating();
    }

    function stopGenerating() {
        while (generationProcesses.length > 0) {
            var generation = generationProcesses.shift();
            generation.stop();
        }
    }

    function clearKeys() {
        clearRootKey();
        clearDerivedKeys();
    }

    function clearRootKey() {
        DOM.rootKey.val("");
    }

    function clearDerivedKeys() {
        DOM.extendedPrivKey.val("");
        DOM.extendedPubKey.val("");
        DOM.bip44accountXprv.val("");
        DOM.bip44accountXpub.val("");
    }

    function addAddressToList(indexText, address, pubkey, privkey) {
        var row = $(addressRowTemplate.html());
        // Elements
        var indexCell = row.find(".index span");
        var addressCell = row.find(".address span");
        var pubkeyCell = row.find(".pubkey span");
        var privkeyCell = row.find(".privkey span");
        // Content
        indexCell.text(indexText);
        addressCell.text(address);
        pubkeyCell.text(pubkey);
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
        var rowShowQrEls = row.find("[data-show-qr]");
        setQrEvents(rowShowQrEls);
    }

    function hasStrongRandom() {
        return 'crypto' in window && window['crypto'] !== null;
    }

    function disableForms() {
        $("form").on("submit", function(e) {
            e.preventDefault();
        });
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

    function findNearestWord(word) {
        var language = getLanguage();
        var words = WORDLISTS[language];
        var minDistance = 99;
        var closestWord = words[0];
        for (var i=0; i<words.length; i++) {
            var comparedTo = words[i];
            if (comparedTo.indexOf(word) == 0) {
                return comparedTo;
            }
            var distance = Levenshtein.get(word, comparedTo);
            if (distance < minDistance) {
                closestWord = comparedTo;
                minDistance = distance;
            }
        }
        return closestWord;
    }

    function hidePending() {
        DOM.feedback
            .text("")
            .hide();
    }

    function populateNetworkSelect() {
        for (var i=0; i<networks.length; i++) {
            var network = networks[i];
            var option = $("<option>");
            option.attr("value", i);
            option.text(network.name);
            if (network.name == "BTC - Bitcoin") {
                option.prop("selected", true);
            }
            DOM.phraseNetwork.append(option);
        }
    }

    function populateClientSelect() {
        for (var i=0; i<clients.length; i++) {
            var client = clients[i];
            var option = $("<option>");
            option.attr("value", i);
            option.text(client.name);
            DOM.bip32Client.append(option);
        }
    }

    function getLanguage() {
        var defaultLanguage = "english";
        // Try to get from existing phrase
        var language = getLanguageFromPhrase();
        // Try to get from url if not from phrase
        if (language.length == 0) {
            language = getLanguageFromUrl();
        }
        // Default to English if no other option
        if (language.length == 0) {
            language = defaultLanguage;
        }
        return language;
    }

    function getLanguageFromPhrase(phrase) {
        // Check if how many words from existing phrase match a language.
        var language = "";
        if (!phrase) {
            phrase = DOM.phrase.val();
        }
        if (phrase.length > 0) {
            var words = phraseToWordArray(phrase);
            var languageMatches = {};
            for (l in WORDLISTS) {
                // Track how many words match in this language
                languageMatches[l] = 0;
                for (var i=0; i<words.length; i++) {
                    var wordInLanguage = WORDLISTS[l].indexOf(words[i]) > -1;
                    if (wordInLanguage) {
                        languageMatches[l]++;
                    }
                }
                // Find languages with most word matches.
                // This is made difficult due to commonalities between Chinese
                // simplified vs traditional.
                var mostMatches = 0;
                var mostMatchedLanguages = [];
                for (var l in languageMatches) {
                    var numMatches = languageMatches[l];
                    if (numMatches > mostMatches) {
                        mostMatches = numMatches;
                        mostMatchedLanguages = [l];
                    }
                    else if (numMatches == mostMatches) {
                        mostMatchedLanguages.push(l);
                    }
                }
            }
            if (mostMatchedLanguages.length > 0) {
                // Use first language and warn if multiple detected
                language = mostMatchedLanguages[0];
                if (mostMatchedLanguages.length > 1) {
                    console.warn("Multiple possible languages");
                    console.warn(mostMatchedLanguages);
                }
            }
        }
        return language;
    }

    function getLanguageFromUrl() {
        for (var language in WORDLISTS) {
            if (window.location.hash.indexOf(language) > -1) {
                return language;
            }
        }
        return "";
    }

    function setMnemonicLanguage() {
        var language = getLanguage();
        // Load the bip39 mnemonic generator for this language if required
        if (!(language in mnemonics)) {
            mnemonics[language] = new Mnemonic(language);
        }
        mnemonic = mnemonics[language];
    }

    function convertPhraseToNewLanguage() {
        var oldLanguage = getLanguageFromPhrase();
        var newLanguage = getLanguageFromUrl();
        var oldPhrase = DOM.phrase.val();
        var oldWords = phraseToWordArray(oldPhrase);
        var newWords = [];
        for (var i=0; i<oldWords.length; i++) {
            var oldWord = oldWords[i];
            var index = WORDLISTS[oldLanguage].indexOf(oldWord);
            var newWord = WORDLISTS[newLanguage][index];
            newWords.push(newWord);
        }
        newPhrase = wordArrayToPhrase(newWords);
        return newPhrase;
    }

    // TODO look at jsbip39 - mnemonic.splitWords
    function phraseToWordArray(phrase) {
        var words = phrase.split(/\s/g);
        var noBlanks = [];
        for (var i=0; i<words.length; i++) {
            var word = words[i];
            if (word.length > 0) {
                noBlanks.push(word);
            }
        }
        return noBlanks;
    }

    // TODO look at jsbip39 - mnemonic.joinWords
    function wordArrayToPhrase(words) {
        var phrase = words.join(" ");
        var language = getLanguageFromPhrase(phrase);
        if (language == "japanese") {
            phrase = words.join("\u3000");
        }
        return phrase;
    }

    function isUsingOwnEntropy() {
        return DOM.useEntropy.prop("checked");
    }

    function setMnemonicFromEntropy() {
        clearEntropyFeedback();
        // Get entropy value
        var entropyStr = DOM.entropy.val();
        // Work out minimum base for entropy
        var entropy = Entropy.fromString(entropyStr);
        if (entropy.binaryStr.length == 0) {
            return;
        }
        // Show entropy details
        showEntropyFeedback(entropy);
        // Use entropy hash if not using raw entropy
        var bits = entropy.binaryStr;
        var mnemonicLength = DOM.entropyMnemonicLength.val();
        if (mnemonicLength != "raw") {
            // Get bits by hashing entropy with SHA256
            var hash = sjcl.hash.sha256.hash(entropy.cleanStr);
            var hex = sjcl.codec.hex.fromBits(hash);
            bits = BigInteger.parse(hex, 16).toString(2);
            while (bits.length % 256 != 0) {
                bits = "0" + bits;
            }
            // Truncate hash to suit number of words
            mnemonicLength = parseInt(mnemonicLength);
            var numberOfBits = 32 * mnemonicLength / 3;
            bits = bits.substring(0, numberOfBits);
            // show warning for weak entropy override
            if (mnemonicLength / 3 * 32 > entropy.binaryStr.length) {
                DOM.entropyWeakEntropyOverrideWarning.removeClass("hidden");
            }
            else {
                DOM.entropyWeakEntropyOverrideWarning.addClass("hidden");
            }
        }
        else {
            // hide warning for weak entropy override
            DOM.entropyWeakEntropyOverrideWarning.addClass("hidden");
        }
        // Discard trailing entropy
        var bitsToUse = Math.floor(bits.length / 32) * 32;
        var start = bits.length - bitsToUse;
        var binaryStr = bits.substring(start);
        // Convert entropy string to numeric array
        var entropyArr = [];
        for (var i=0; i<binaryStr.length / 8; i++) {
            var byteAsBits = binaryStr.substring(i*8, i*8+8);
            var entropyByte = parseInt(byteAsBits, 2);
            entropyArr.push(entropyByte)
        }
        // Convert entropy array to mnemonic
        var phrase = mnemonic.toMnemonic(entropyArr);
        // Set the mnemonic in the UI
        DOM.phrase.val(phrase);
        // Show the word indexes
        showWordIndexes();
        // Show the checksum
        showChecksum();
    }

    function clearEntropyFeedback() {
        DOM.entropyCrackTime.text("...");
        DOM.entropyType.text("");
        DOM.entropyWordCount.text("0");
        DOM.entropyEventCount.text("0");
        DOM.entropyBitsPerEvent.text("0");
        DOM.entropyBits.text("0");
        DOM.entropyFiltered.html("&nbsp;");
        DOM.entropyBinary.html("&nbsp;");
    }

    function showEntropyFeedback(entropy) {
        var numberOfBits = entropy.binaryStr.length;
        var timeToCrack = "unknown";
        try {
            var z = zxcvbn(entropy.base.parts.join(""));
            timeToCrack = z.crack_times_display.offline_fast_hashing_1e10_per_second;
            if (z.feedback.warning != "") {
                timeToCrack = timeToCrack + " - " + z.feedback.warning;
            };
        }
        catch (e) {
            console.log("Error detecting entropy strength with zxcvbn:");
            console.log(e);
        }
        var entropyTypeStr = getEntropyTypeStr(entropy);
        var wordCount = Math.floor(numberOfBits / 32) * 3;
        var bitsPerEvent = entropy.bitsPerEvent.toFixed(2);
        var spacedBinaryStr = addSpacesEveryElevenBits(entropy.binaryStr);
        DOM.entropyFiltered.html(entropy.cleanHtml);
        DOM.entropyType.text(entropyTypeStr);
        DOM.entropyCrackTime.text(timeToCrack);
        DOM.entropyEventCount.text(entropy.base.ints.length);
        DOM.entropyBits.text(numberOfBits);
        DOM.entropyWordCount.text(wordCount);
        DOM.entropyBinary.text(spacedBinaryStr);
        DOM.entropyBitsPerEvent.text(bitsPerEvent);
        // detect and warn of filtering
        var rawNoSpaces = DOM.entropy.val().replace(/\s/g, "");
        var cleanNoSpaces = entropy.cleanStr.replace(/\s/g, "");
        var isFiltered = rawNoSpaces.length != cleanNoSpaces.length;
        if (isFiltered) {
            DOM.entropyFilterWarning.removeClass('hidden');
        }
        else {
            DOM.entropyFilterWarning.addClass('hidden');
        }
    }

    function getEntropyTypeStr(entropy) {
        var typeStr = entropy.base.str;
        // Add some detail if these are cards
        if (entropy.base.asInt == 52) {
            var cardDetail = []; // array of message strings
            // Detect duplicates
            var dupes = [];
            var dupeTracker = {};
            for (var i=0; i<entropy.base.parts.length; i++) {
                var card = entropy.base.parts[i];
                var cardUpper = card.toUpperCase();
                if (cardUpper in dupeTracker) {
                    dupes.push(card);
                }
                dupeTracker[cardUpper] = true;
            }
            if (dupes.length > 0) {
                var dupeWord = "duplicates";
                if (dupes.length == 1) {
                    dupeWord = "duplicate";
                }
                var msg = dupes.length + " " + dupeWord + ": " + dupes.slice(0,3).join(" ");
                if (dupes.length > 3) {
                    msg += "...";
                }
                cardDetail.push(msg);
            }
            // Detect full deck
            var uniqueCards = [];
            for (var uniqueCard in dupeTracker) {
                uniqueCards.push(uniqueCard);
            }
            if (uniqueCards.length == 52) {
                cardDetail.unshift("full deck");
            }
            // Detect missing cards
            var values = "A23456789TJQK";
            var suits = "CDHS";
            var missingCards = [];
            for (var i=0; i<suits.length; i++) {
                for (var j=0; j<values.length; j++) {
                    var card = values[j] + suits[i];
                    if (!(card in dupeTracker)) {
                        missingCards.push(card);
                    }
                }
            }
            // Display missing cards if six or less, ie clearly going for full deck
            if (missingCards.length > 0 && missingCards.length <= 6) {
                var msg = missingCards.length + " missing: " + missingCards.slice(0,3).join(" ");
                if (missingCards.length > 3) {
                    msg += "...";
                }
                cardDetail.push(msg);
            }
            // Add card details to typeStr
            if (cardDetail.length > 0) {
                typeStr += " (" + cardDetail.join(", ") + ")";
            }
        }
        return typeStr;
    }

    function setQrEvents(els) {
        els.on("mouseenter", createQr);
        els.on("mouseleave", destroyQr);
        els.on("click", toggleQr);
    }

    function createQr(e) {
        var content = e.target.textContent || e.target.value;
        if (content) {
            var qrEl = kjua({
                text: content,
                render: "canvas",
                size: 310,
                ecLevel: 'H',
            });
            DOM.qrImage.append(qrEl);
            if (!showQr) {
                DOM.qrHider.addClass("hidden");
            }
            else {
                DOM.qrHider.removeClass("hidden");
            }
            DOM.qrContainer.removeClass("hidden");
        }
    }

    function destroyQr() {
        DOM.qrImage.text("");
        DOM.qrContainer.addClass("hidden");
    }

    function toggleQr() {
        showQr = !showQr;
        DOM.qrHider.toggleClass("hidden");
        DOM.qrHint.toggleClass("hidden");
    }

    function bip44TabSelected() {
        return DOM.bip44tab.hasClass("active");
    }

    function bip32TabSelected() {
        return DOM.bip32tab.hasClass("active");
    }

    function networkHasSegwit() {
        var n = network;
        if ("baseNetwork" in network) {
            n = bitcoinjs.bitcoin.networks[network.baseNetwork];
        }
        // check if only p2wpkh params are required
        if (p2wpkhSelected()) {
            return "p2wpkh" in n;
        }
        // check if only p2wpkh-in-p2sh params are required
        else if (p2wpkhInP2shSelected()) {
            return "p2wpkhInP2sh" in n;
        }
        // require both if it's unclear which params are required
        return "p2wpkh" in n && "p2wpkhInP2sh" in n;
    }

    function bip49TabSelected() {
        return DOM.bip49tab.hasClass("active");
    }

    function bip84TabSelected() {
        return DOM.bip84tab.hasClass("active");
    }

    function bip141TabSelected() {
        return DOM.bip141tab.hasClass("active");
    }

    function setHdCoin(coinValue) {
        DOM.bip44coin.val(coinValue);
        DOM.bip49coin.val(coinValue);
        DOM.bip84coin.val(coinValue);
    }

    function showSegwitAvailable() {
        DOM.bip49unavailable.addClass("hidden");
        DOM.bip49available.removeClass("hidden");
        DOM.bip84unavailable.addClass("hidden");
        DOM.bip84available.removeClass("hidden");
        DOM.bip141unavailable.addClass("hidden");
        DOM.bip141available.removeClass("hidden");
    }

    function showSegwitUnavailable() {
        DOM.bip49available.addClass("hidden");
        DOM.bip49unavailable.removeClass("hidden");
        DOM.bip84available.addClass("hidden");
        DOM.bip84unavailable.removeClass("hidden");
        DOM.bip141available.addClass("hidden");
        DOM.bip141unavailable.removeClass("hidden");
    }

    function adjustNetworkForSegwit() {
        // If segwit is selected the xpub/xprv prefixes need to be adjusted
        // to avoid accidentally importing BIP49 xpub to BIP44 watch only
        // wallet.
        // See https://github.com/iancoleman/bip39/issues/125
        var segwitNetworks = null;
        // if a segwit network is alread selected, need to use base network to
        // look up new parameters
        if ("baseNetwork" in network) {
            network = bitcoinjs.bitcoin.networks[network.baseNetwork];
        }
        // choose the right segwit params
        if (p2wpkhSelected() && "p2wpkh" in network) {
            network = network.p2wpkh;
        }
        else if (p2wpkhInP2shSelected() && "p2wpkhInP2sh" in network) {
            network = network.p2wpkhInP2sh;
        }
    }

    function lastIndexInTable() {
        var pathText = DOM.addresses.find(".index").last().text();
        var pathBits = pathText.split("/");
        var lastBit = pathBits[pathBits.length-1];
        var lastBitClean = lastBit.replace("'", "");
        return parseInt(lastBitClean);
    }

    function uint8ArrayToHex(a) {
        var s = ""
        for (var i=0; i<a.length; i++) {
            var h = a[i].toString(16);
            while (h.length < 2) {
                h = "0" + h;
            }
            s = s + h;
        }
        return s;
    }

    function showWordIndexes() {
        var phrase = DOM.phrase.val();
        var words = phraseToWordArray(phrase);
        var wordIndexes = [];
        var language = getLanguage();
        for (var i=0; i<words.length; i++) {
            var word = words[i];
            var wordIndex = WORDLISTS[language].indexOf(word);
            wordIndexes.push(wordIndex);
        }
        var wordIndexesStr = wordIndexes.join(", ");
        DOM.entropyWordIndexes.text(wordIndexesStr);
    }

    function showChecksum() {
        var phrase = DOM.phrase.val();
        var words = phraseToWordArray(phrase);
        var checksumBitlength = words.length / 3;
        var checksum = "";
        var binaryStr = "";
        var language = getLanguage();
        for (var i=words.length-1; i>=0; i--) {
            var word = words[i];
            var wordIndex = WORDLISTS[language].indexOf(word);
            var wordBinary = wordIndex.toString(2);
            while (wordBinary.length < 11) {
                wordBinary = "0" + wordBinary;
            }
            var binaryStr = wordBinary + binaryStr;
            if (binaryStr.length >= checksumBitlength) {
                var start = binaryStr.length - checksumBitlength;
                var end = binaryStr.length;
                checksum = binaryStr.substring(start, end);
                // add spaces so the last group is 11 bits, not the first
                checksum = checksum.split("").reverse().join("")
                checksum = addSpacesEveryElevenBits(checksum);
                checksum = checksum.split("").reverse().join("")
                break;
            }
        }
        DOM.entropyChecksum.text(checksum);
    }

    function updateCsv() {
        var tableCsv = "path,address,public key,private key\n";
        var rows = DOM.addresses.find("tr");
        for (var i=0; i<rows.length; i++) {
            var row = $(rows[i]);
            var cells = row.find("td");
            for (var j=0; j<cells.length; j++) {
                var cell = $(cells[j]);
                if (!cell.children().hasClass("invisible")) {
                    tableCsv = tableCsv + cell.text();
                }
                if (j != cells.length - 1) {
                    tableCsv = tableCsv + ",";
                }
            }
            tableCsv = tableCsv + "\n";
        }
        DOM.csv.val(tableCsv);
    }

    function addSpacesEveryElevenBits(binaryStr) {
        return binaryStr.match(/.{1,11}/g).join(" ");
    }

    var networks = [
        {
            name: "AC - Asiacoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.asiacoin;
                setHdCoin(51);
            },
        },
        {
            name: "ACC - Adcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.adcoin;
                setHdCoin(161);
            },
        },
        {
            name: "AUR - Auroracoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.auroracoin;
                setHdCoin(85);
            },
        },
        {
            name: "AXE - Axe",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.axe;
                setHdCoin(4242);
            },
        },
        {
            name: "BCA - Bitcoin Atom",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.atom;
                setHdCoin(185);
            },
        },
        {
            name: "BCH - Bitcoin Cash",
            onSelect: function() {
                DOM.bitcoinCashAddressTypeContainer.removeClass("hidden");
                setHdCoin(145);
            },
        },
        {
            name: "BEET - Beetlecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.beetlecoin;
                setHdCoin(800);
            },
        },
        {
            name: "BELA - Belacoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.belacoin;
                setHdCoin(73);
            },
        },
        {
            name: "BLK - BlackCoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.blackcoin;
                setHdCoin(10);
            },
        },
        {
            name: "BRIT - Britcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.britcoin;
                setHdCoin(70);
            },
        },
        {
            name: "BSD - Bitsend",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitsend;
                setHdCoin(91);
            },
        },
        {
            name: "BTA - Bata",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bata;
                setHdCoin(89);
            },
        },
        {
            name: "BTC - Bitcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(0);
            },
        },
        {
            name: "BTC - Bitcoin Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.testnet;
                setHdCoin(1);
            },
        },
        {
            name: "BTCP - Bitcoin Private",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoinprivate;
                setHdCoin(183);
            },
        },
        {
            name: "BTCZ - Bitcoinz",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoinz;
                setHdCoin(177);
            },
        },
        {
            name: "BTDX - BitCloud",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcloud;
                setHdCoin(218);
            },
        },
        {
            name: "BTG - Bitcoin Gold",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bgold;
                setHdCoin(156);
            },
        },
        {
            name: "BTX - Bitcore",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcore;
                setHdCoin(160);
            },
        },
        {
            name: "CCN - Cannacoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.cannacoin;
                setHdCoin(19);
            },
        },
        {
            name: "CESC - Cryptoescudo",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.cannacoin;
                setHdCoin(111);
            },
        },
        {
            name: "CDN - Canadaecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.canadaecoin;
                setHdCoin(34);
            },
        },
        {
            name: "CLAM - Clams",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.clam;
                setHdCoin(23);
            },
        },
        {
            name: "CLO - Callisto",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(820);
            },
        },
        {
            name: "CLUB - Clubcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.clubcoin;
                setHdCoin(79);
            },
        },
        {
            name: "CMP - Compcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.compcoin;
                setHdCoin(71);
            },
        },
        {
            name: "CRAVE - Crave",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.crave;
                setHdCoin(186);
            },
        },
        {
            name: "CRW - Crown",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.crown;
                setHdCoin(72);
            },
        },
        {
            name: "DASH - Dash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.dash;
                setHdCoin(5);
            },
        },
        {
            name: "DASH - Dash Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.dashtn;
                setHdCoin(1);
            },
        },
        {
            name: "DFC - Defcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.defcoin;
                setHdCoin(1337);
            },
        },
        {
            name: "DGB - Digibyte",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.digibyte;
                setHdCoin(20);
            },
        },
        {
            name: "DGC - Digitalcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.digitalcoin;
                setHdCoin(18);
            },
        },
        {
            name: "DMD - Diamond",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.diamond;
                setHdCoin(152);
            },
        },
        {
            name: "DNR - Denarius",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.denarius;
                setHdCoin(116);
            },
        },
        {
            name: "DOGE - Dogecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.dogecoin;
                setHdCoin(3);
            },
        },
        {
            name: "ECN - Ecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.ecoin;
                setHdCoin(115);
            },
        },
        {
            name: "EDRC - Edrcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.edrcoin;
                setHdCoin(56);
            },
        },
        {
            name: "EFL - Egulden",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.egulden;
                setHdCoin(78);
            },
        },
        {
            name: "EMC2 - Einsteinium",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.einsteinium;
                setHdCoin(41);
            },
        },
        {
            name: "ERC - Europecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.europecoin;
                setHdCoin(151);
            },
        },
        {
            name: "ETC - Ethereum Classic",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(61);
            },
        },
        {
            name: "ETH - Ethereum",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(60);
            },
        },
        {
            name: "EXCL - Exclusivecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.exclusivecoin;
                setHdCoin(190);
            },
        },
        {
            name: "EXCC - ExchangeCoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.exchangecoin;
                setHdCoin(0);
            },
        },
        {
            name: "EXP - Expanse",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(40);
            },
        },
        {
            name: "FJC - Fujicoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.fujicoin;
                setHdCoin(75);
            },
        },
        {
            name: "FLASH - Flashcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.flashcoin;
                setHdCoin(120);
            },
        },
        {
            name: "FRST - Firstcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.firstcoin;
                setHdCoin(167);
            },
        },
        {
            name: "FTC - Feathercoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.feathercoin;
                setHdCoin(8);
            },
        },
        {
            name: "GAME - GameCredits",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.game;
                setHdCoin(101);
            },
        },
        {
            name: "GBX - Gobyte",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.gobyte;
                setHdCoin(176);
            },
        },
        {
            name: "GCR - GCRCoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.gcr;
                setHdCoin(79);
            },
        },
        {
            name: "GRC - Gridcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.gridcoin;
                setHdCoin(84);
            },
        },
        {
            name: "HNC - Helleniccoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.helleniccoin;
                setHdCoin(168);
            },
        },
		{
            name: "HUSH - Hush",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.hush;
                setHdCoin(197);
            },
        },
        {
            name: "INSN - Insane",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.insane;
                setHdCoin(68);
            },
        },
        {
            name: "IOP - Iop",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.iop;
                setHdCoin(66);
            },
        },
        {
            name: "IXC - Ixcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.ixcoin;
                setHdCoin(86);
            },
        },
        {
            name: "JBS - Jumbucks",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.jumbucks;
                setHdCoin(26);
            },
        },
        {
            name: "KMD - Komodo",
            bip49available: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.komodo;
                setHdCoin(141);
            },
        },
        {
            name: "KOBO - Kobocoin",
            bip49available: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.kobocoin;
                setHdCoin(196);
            },
        },
        {
            name: "LBC - Library Credits",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.lbry;
                setHdCoin(140);
            },
        },
        {
            name: "LCC - Litecoincash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.litecoincash;
                setHdCoin(192);
            },
        },
        {
            name: "LDCN - Landcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.landcoin;
                setHdCoin(63);
            },
        },
        {
            name: "LINX - Linx",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.linx;
                setHdCoin(114);
            },
        },
        {
            name: "LTC - Litecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.litecoin;
                setHdCoin(2);
                DOM.litecoinLtubContainer.removeClass("hidden");
            },
        },
        {
            name: "LYNX - Lynx",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.lynx;
                setHdCoin(191);
            },
        },
        {
            name: "MAZA - Maza",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.maza;
                setHdCoin(13);
            },
        },
        {
            name: "MEC - Megacoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.megacoin;
                setHdCoin(217);
            },
        },
        {
            name: "MIX - MIX",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(76);
            },
        },
        {
            name: "MNX - Minexcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.minexcoin;
                setHdCoin(182);
            },
        },
        {
            name: "MONA - Monacoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.monacoin,
                setHdCoin(22);
            },
        },
        {
            name: "MUSIC - Musicoin",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(184);
            },
        },
        {
            name: "NAV - Navcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.navcoin;
                setHdCoin(130);
            },
        },
        {
            name: "NEBL - Neblio",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.neblio;
                setHdCoin(146);
            },
        },
        {
            name: "NEOS - Neoscoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.neoscoin;
                setHdCoin(25);
            },
        },
        {
            name: "NLG - Gulden",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.gulden;
                setHdCoin(87);
            },
        },
        {
            name: "NMC - Namecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.namecoin;
                setHdCoin(7);
            },
        },
        {
            name: "NRG - Energi",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.energi;
                setHdCoin(204);
            },
        },
        {
            name: "NRO - Neurocoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.neurocoin;
                setHdCoin(110);
            },
        },
        {
            name: "NSR - Nushares",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.nushares;
                setHdCoin(11);
            },
        },
        {
            name: "NYC - Newyorkc",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.newyorkc;
                setHdCoin(179);
            },
        },
        {
            name: "NVC - Novacoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.novacoin;
                setHdCoin(50);
            },
        },
        {
            name: "OK - Okcash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.okcash;
                setHdCoin(69);
            },
        },
        {
            name: "OMNI - Omnicore",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.omnicore;
                setHdCoin(200);
            },
        },
        {
            name: "ONX - Onixcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.onixcoin;
                setHdCoin(174);
            },
        },
        {
            name: "PINK - Pinkcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.pinkcoin;
                setHdCoin(117);
            },
        },
        {
            name: "PIRL - Pirl",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(164);
            },
        },
        {
            name: "PIVX - PIVX",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.pivx;
                setHdCoin(119);
            },
        },
        {
            name: "PIVX - PIVX Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.pivxtestnet;
                setHdCoin(1);
            },
        },
        {
            name: "POA - Poa",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(178);
            },
        },
        {
            name: "POSW - POSWcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.poswcoin;
                setHdCoin(47);
            },
        },
        {
            name: "POT - Potcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.potcoin;
                setHdCoin(81);
            },
        },
        {
            name: "PPC - Peercoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.peercoin;
                setHdCoin(6);
            },
        },
        {
            name: "PSB - Pesobit",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.pesobit;
                setHdCoin(62);
            },
        },
        {
            name: "PUT - Putincoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.putincoin;
                setHdCoin(122);
            },
        },
        {
            name: "RBY - Rubycoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.rubycoin;
                setHdCoin(16);
            },
        },
        {
            name: "RDD - Reddcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.reddcoin;
                setHdCoin(4);
            },
        },
        {
            name: "RVR - RevolutionVR",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.revolutionvr;
                setHdCoin(129);
            },
        },
        {
          name: "SLS - Salus",
          onSelect: function() {
              network = bitcoinjs.bitcoin.networks.salus;
              setHdCoin(63);
            },
        },
        {
            name: "SDC - ShadowCash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.shadow;
                setHdCoin(35);
            },
        },
        {
            name: "SDC - ShadowCash Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.shadowtn;
                setHdCoin(1);
            },
        },
        {
            name: "SLM - Slimcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.slimcoin;
                setHdCoin(63);
            },
        },
        {
            name: "SLM - Slimcoin Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.slimcointn;
                setHdCoin(111);
            },
        },
        {
            name: "SLR - Solarcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.solarcoin;
                setHdCoin(58);
            },
        },
        {
            name: "SMLY - Smileycoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.smileycoin;
                setHdCoin(59);
            },
        },
        {
            name: "STASH - Stash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.stash;
                setHdCoin(0xC0C0);
            },
        },
        {
            name: "STASH - Stash Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.stashtn;
                setHdCoin(0xCAFE);
            },
        },
        {
            name: "STRAT - Stratis",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.stratis;
                setHdCoin(105);
            },
        },
        {
            name: "TSTRAT - Stratis Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.stratistest;
                setHdCoin(105);
            },
        },
        {
            name: "SYS - Syscoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.syscoin;
                setHdCoin(57);
            },
        },
        {
            name: "THC - Hempcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.hempcoin;
                setHdCoin(113);
            },
        },
        {
            name: "TOA - Toa",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.toa;
                setHdCoin(159);
            },
        },
        {
            name: "USC - Ultimatesecurecash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.ultimatesecurecash;
                setHdCoin(112);
            },
        },
        {
            name: "USNBT - NuBits",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.nubits;
                setHdCoin(12);
            },
        },
        {
            name: "UNO - Unobtanium",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.unobtanium;
                setHdCoin(92);
            },
        },
        {
            name: "VASH - Vpncoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.vpncoin;
                setHdCoin(33);
            },
        },
        {
            name: "VIA - Viacoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.viacoin;
                setHdCoin(14);
            },
        },
        {
            name: "VIA - Viacoin Testnet",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.viacointestnet;
                setHdCoin(1);
            },
        },
        {
            name: "VIVO - Vivo",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.vivo;
                setHdCoin(166);
            },
        },
        {
            name: "VTC - Vertcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.vertcoin;
                setHdCoin(28);
            },
        },
        {
            name: "WC - Wincoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.wincoin;
                setHdCoin(181);
            },
        },
		{
            name: "XAX - Artax",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.artax;
                setHdCoin(219);
            },
        },
        {
            name: "XBC - Bitcoinplus",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoinplus;
                setHdCoin(65);
            },
        },
        {
            name: "XMY - Myriadcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.myriadcoin;
                setHdCoin(90);
            },
        },
        {
            name: "XRP - Ripple",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.bitcoin;
                setHdCoin(144);
            },
        },
        {
            name: "XVC - Vcash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.vcash;
                setHdCoin(127);
            },
        },
        {
            name: "XVG - Verge",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.verge;
                setHdCoin(77);
            },
        },
        {
            name: "XUEZ - Xuez",
            segwitAvailable: false,
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.xuez;
                setHdCoin(225);
            },
        },
        {
            name: "XWC - Whitecoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.whitecoin;
                setHdCoin(155);
            },
        },
        {
            name: "XZC - Zcoin",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.zcoin;
                setHdCoin(136);
            },
        },
        {
            name: "ZCL - Zclassic",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.zclassic;
                setHdCoin(147);
            },
        },
        {
            name: "ZEC - Zcash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.zcash;
                setHdCoin(133);
            },
        },
        {
            name: "ZEN - Zencash",
            onSelect: function() {
                network = bitcoinjs.bitcoin.networks.zencash;
                setHdCoin(121);
            },
        },
    ]

    var clients = [
        {
            name: "Bitcoin Core",
            onSelect: function() {
                DOM.bip32path.val("m/0'/0'");
                DOM.hardenedAddresses.prop('checked', true);
            },
        },
        {
            name: "blockchain.info",
            onSelect: function() {
                DOM.bip32path.val("m/44'/0'/0'");
                DOM.hardenedAddresses.prop('checked', false);
            },
        },
        {
            name: "MultiBit HD",
            onSelect: function() {
                DOM.bip32path.val("m/0'/0");
                DOM.hardenedAddresses.prop('checked', false);
            },
        },
        {
            name: "Coinomi, Ledger",
            onSelect: function() {
                DOM.bip32path.val("m/44'/"+DOM.bip44coin.val()+"'/0'");
                DOM.hardenedAddresses.prop('checked', false);
            },
        }
    ]

    init();

})();
