/*
 * Detects entropy from a string.
 *
 * Formats include:
 * binary [0-1]
 * base 6 [0-5]
 * dice 6 [1-6]
 * decimal [0-9]
 * hexadecimal [0-9A-F]
 * card [A2-9TJQK][CDHS]
 *
 * Automatically uses lowest entropy to avoid issues such as interpretting 0101
 * as hexadecimal which would be 16 bits when really it's only 4 bits of binary
 * entropy.
 */

window.Entropy = new (function() {

    var TWO = new BigInteger(2);

    // matchers returns an array of the matched events for each type of entropy.
    // eg
    // matchers.binary("010") returns ["0", "1", "0"]
    // matchers.binary("a10") returns ["1", "0"]
    // matchers.hex("a10") returns ["a", "1", "0"]
    var matchers = {
        binary: function(str) {
            return str.match(/[0-1]/gi) || [];
        },
        base6: function(str) {
            return str.match(/[0-5]/gi) || [];
        },
        dice: function(str) {
            return str.match(/[1-6]/gi) || []; // ie dice numbers
        },
        base10: function(str) {
            return str.match(/[0-9]/gi) || [];
        },
        hex: function(str) {
            return str.match(/[0-9A-F]/gi) || [];
        },
        card: function(str) {
            // Format is NumberSuit, eg
            // AH ace of hearts
            // 8C eight of clubs
            // TD ten of diamonds
            // JS jack of spades
            // QH queen of hearts
            // KC king of clubs
            return str.match(/([A2-9TJQK][CDHS])/gi) || [];
        }
    }

    // Convert array of cards from ["ac", "4d", "ks"]
    // to numbers between 0 and 51 [0, 16, 51]
    function convertCardsToInts(cards) {
        var ints = [];
        var values = "a23456789tjqk";
        var suits = "cdhs";
        for (var i=0; i<cards.length; i++) {
            var card = cards[i].toLowerCase();
            var value = card[0];
            var suit = card[1];
            var asInt = 13 * suits.indexOf(suit) + values.indexOf(value);
            ints.push(asInt);
        }
        return ints;
    }

    this.fromString = function(rawEntropyStr) {
        // Find type of entropy being used (binary, hex, dice etc)
        var base = getBase(rawEntropyStr);
        // Convert dice to base6 entropy (ie 1-6 to 0-5)
        // This is done by changing all 6s to 0s
        if (base.str == "dice") {
            var newParts = [];
            var newInts = [];
            for (var i=0; i<base.parts.length; i++) {
                var c = base.parts[i];
                if ("12345".indexOf(c) > -1) {
                    newParts[i] = base.parts[i];
                    newInts[i] = base.ints[i];
                }
                else {
                    newParts[i] = "0";
                    newInts[i] = 0;
                }
            }
            base.str = "base 6 (dice)";
            base.ints = newInts;
            base.parts = newParts;
            base.matcher = matchers.base6;
        }
        // Detect empty entropy
        if (base.parts.length == 0) {
            return {
                binaryStr: "",
                cleanStr: "",
                cleanHtml: "",
                base: base,
            };
        }
        // Convert base.ints to BigInteger.
        // Due to using unusual bases, eg cards of base52, this is not as simple as
        // using BigInteger.parse()
        var entropyInt = BigInteger.ZERO;
        for (var i=base.ints.length-1; i>=0; i--) {
            var thisInt = BigInteger.parse(base.ints[i]);
            var power = (base.ints.length - 1) - i;
            var additionalEntropy = BigInteger.parse(base.asInt).pow(power).multiply(thisInt);
            entropyInt = entropyInt.add(additionalEntropy);
        }
        // Convert entropy to binary
        var entropyBin = entropyInt.toString(2);
        // If the first integer is small, it must be padded with zeros.
        // Otherwise the chance of the first bit being 1 is 100%, which is
        // obviously incorrect.
        // This is not perfect for non-2^n bases.
        var expectedBits = Math.floor(base.parts.length * Math.log2(base.asInt));
        while (entropyBin.length < expectedBits) {
            entropyBin = "0" + entropyBin;
        }
        // Calculate the number of bits per event
        var bitsPerEvent = Math.log2(base.asInt);
        // Cards binary must be handled differently, since they're not replaced
        if (base.asInt == 52) {
            var cardEntropy = processCardEntropy(base.parts);
            entropyBin = cardEntropy.binaryStr;
            bitsPerEvent = cardEntropy.bitsPerEvent;
        }
        // Supply a 'filtered' entropy string for display purposes
        var entropyClean = base.parts.join("");
        var entropyHtml = base.parts.join("");
        if (base.asInt == 52) {
            entropyClean = base.parts.join(" ").toUpperCase();
            entropyClean = entropyClean.replace(/C/g, "\u2663");
            entropyClean = entropyClean.replace(/D/g, "\u2666");
            entropyClean = entropyClean.replace(/H/g, "\u2665");
            entropyClean = entropyClean.replace(/S/g, "\u2660");
            entropyHtml = base.parts.join(" ").toUpperCase();
            entropyHtml = entropyHtml.replace(/C/g, "<span class='card-suit club'>\u2663</span>");
            entropyHtml = entropyHtml.replace(/D/g, "<span class='card-suit diamond'>\u2666</span>");
            entropyHtml = entropyHtml.replace(/H/g, "<span class='card-suit heart'>\u2665</span>");
            entropyHtml = entropyHtml.replace(/S/g, "<span class='card-suit spade'>\u2660</span>");
        }
        // Return the result
        var e = {
            binaryStr: entropyBin,
            cleanStr: entropyClean,
            cleanHtml: entropyHtml,
            bitsPerEvent: bitsPerEvent,
            base: base,
        }
        return e;
    }

    function getSortedDeck() {
        var s = [];
        var suits = "CDHS";
        var values = "A23456789TJQK";
        for (var i=0; i<suits.length; i++) {
            for (var j=0; j<values.length; j++) {
                s.push(values[j]+suits[i]);
            }
        }
        return s;
    }

    function getBase(str) {
        // Need to get the lowest base for the supplied entropy.
        // This prevents interpreting, say, dice rolls as hexadecimal.
        var binaryMatches = matchers.binary(str);
        var hexMatches = matchers.hex(str);
        // Find the lowest base that can be used, whilst ignoring any irrelevant chars
        if (binaryMatches.length == hexMatches.length && hexMatches.length > 0) {
            var ints = binaryMatches.map(function(i) { return parseInt(i, 2) });
            return {
                ints: ints,
                parts: binaryMatches,
                matcher: matchers.binary,
                asInt: 2,
                str: "binary",
            }
        }
        var cardMatches = matchers.card(str);
        if (cardMatches.length >= hexMatches.length / 2) {
            var ints = convertCardsToInts(cardMatches);
            return {
                ints: ints,
                parts: cardMatches,
                matcher: matchers.card,
                asInt: 52,
                str: "card",
            }
        }
        var diceMatches = matchers.dice(str);
        if (diceMatches.length == hexMatches.length && hexMatches.length > 0) {
            var ints = diceMatches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                parts: diceMatches,
                matcher: matchers.dice,
                asInt: 6,
                str: "dice",
            }
        }
        var base6Matches = matchers.base6(str);
        if (base6Matches.length == hexMatches.length && hexMatches.length > 0) {
            var ints = base6Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                parts: base6Matches,
                matcher: matchers.base6,
                asInt: 6,
                str: "base 6",
            }
        }
        var base10Matches = matchers.base10(str);
        if (base10Matches.length == hexMatches.length && hexMatches.length > 0) {
            var ints = base10Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                parts: base10Matches,
                matcher: matchers.base10,
                asInt: 10,
                str: "base 10",
            }
        }
        var ints = hexMatches.map(function(i) { return parseInt(i, 16) });
        return {
            ints: ints,
            parts: hexMatches,
            matcher: matchers.hex,
            asInt: 16,
            str: "hexadecimal",
        }
    }

    // Assume cards are NOT replaced.
    // Additional entropy decreases as more cards are used. This means
    // total possible entropy is measured using n!, not base^n.
    // eg the second last card can be only one of two, not one of fifty two
    // so the added entropy for that card is only one bit at most
    function processCardEntropy(cards) {
        // Track how many instances of each card have been used, and thus
        // how many decks are in use.
        var cardCounts = {};
        var numberOfDecks = 0;
        // Work out number of decks by max(duplicates)
        for (var i=0; i<cards.length; i++) {
            // Get the card that was drawn
            var cardLower = cards[i];
            var card = cardLower.toUpperCase();
            // Initialize the count for this card if needed
            if (!(card in cardCounts)) {
                cardCounts[card] = 0;
            }
            cardCounts[card] += 1;
            // See if this is max(duplicates)
            if (cardCounts[card] > numberOfDecks) {
                numberOfDecks = cardCounts[card];
            }
        }
        // Work out the total number of bits for this many decks
        // See http://crypto.stackexchange.com/q/41886
        var gainedBits = 0;
        // Equivalent of Math.log2(factorial(52*numberOfDecks))
        // which becomes infinity for numberOfDecks > 4
        for (var i=1; i<=52*numberOfDecks; i++) {
            gainedBits = gainedBits + Math.log2(i);
        }
        var lostBits = 52 * Math.log2(factorial(numberOfDecks));
        var maxBits = gainedBits - lostBits;
        // Convert the drawn cards to a binary representation.
        // The exact technique for doing this is unclear.
        // See
        // http://crypto.stackexchange.com/a/41896
        // "I even doubt that this is well defined (only the average entropy
        // is, I believe)."
        // See
        // https://github.com/iancoleman/bip39/issues/33#issuecomment-263021856
        // "The binary representation can be the first log(permutations,2) bits
        // of the sha-2 hash of the normalized deck string."
        //
        // In this specific implementation, the first N bits of the hash of the
        // normalized cards string is being used. Uppercase, no spaces; eg
        // sha256("AH8DQSTC2H")
        var totalCards = numberOfDecks * 52;
        var percentUsed = cards.length / totalCards;
        // Calculate the average number of bits of entropy for the number of
        // cards drawn.
        var numberOfBits = Math.floor(maxBits * percentUsed);
        // Create a normalized string of the selected cards
        var normalizedCards = cards.join("").toUpperCase();
        // Convert to binary using the SHA256 hash of the normalized cards.
        // If the number of bits is more than 256, multiple hashes
        // are used until the required number of bits is reached.
        var entropyBin = "";
        var iterations = 0;
        while (entropyBin.length < numberOfBits) {
            var hashedCards = sjcl.hash.sha256.hash(normalizedCards + ":" + iterations);
            var hashHex = sjcl.codec.hex.fromBits(hashedCards);
            for (var i=0; i<hashHex.length; i++) {
                var decimal = parseInt(hashHex[i], 16);
                var binary = decimal.toString(2);
                while (binary.length < 4) {
                    binary = "0" + binary;
                }
                entropyBin = entropyBin + binary;
            }
            iterations = iterations + 1;
        }
        // Truncate to the appropriate number of bits.
        entropyBin = entropyBin.substring(0, numberOfBits);
        // Get the number of bits per event
        bitsPerEvent = maxBits / totalCards;
        return {
            binaryStr: entropyBin,
            bitsPerEvent: bitsPerEvent,
        }
    }

    // Polyfill for Math.log2
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2#Polyfill
    Math.log2 = Math.log2 || function(x) {
        // The polyfill isn't good enough because of the poor accuracy of
        // Math.LOG2E
        // log2(8) gave 2.9999999999999996 which when floored causes issues.
        // So instead use the BigInteger library to get it right.
        return BigInteger.log(x) / BigInteger.log(2);
    };

    // Depends on BigInteger
    function factorial(n) {
        if (n == 0) {
            return 1;
        }
        f = BigInteger.ONE;
        for (var i=1; i<=n; i++) {
            f = f.multiply(new BigInteger(i));
        }
        return f;
    }

})();
