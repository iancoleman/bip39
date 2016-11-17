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
        // Assume cards are NOT replaced.
        // Additional entropy decreases as more cards are used. This means
        // total possible entropy is measured using n!, not base^n.
        // eg the second last card can be only one of two, not one of fifty two
        // so the added entropy for that card is only one bit at most
        if (base.asInt == 52) {
            // Get the maximum value WITHOUT replacement
            var totalDecks = Math.ceil(base.parts.length / 52);
            var totalCards = totalDecks * 52;
            var totalCombos = factorial(52).pow(totalDecks);
            var totalRemainingCards = totalCards - base.parts.length;
            var remainingDecks = Math.floor(totalRemainingCards / 52);
            var remainingCards = totalRemainingCards % 52;
            var remainingCombos = factorial(52).pow(remainingDecks).multiply(factorial(remainingCards));
            var currentCombos = totalCombos.divide(remainingCombos);
            var numberOfBits = Math.log2(currentCombos);
            var maxWithoutReplace = BigInteger.pow(2, numberOfBits);
            // aggresive flooring of numberOfBits by BigInteger.pow means a
            // more accurate result can be had for small numbers using the
            // built-in Math.pow function.
            if (numberOfBits < 32) {
                maxWithoutReplace = BigInteger(Math.round(Math.pow(2, numberOfBits)));
            }
            // Get the maximum value WITH replacement
            var maxWithReplace = BigInteger.pow(52, base.parts.length);
            // Calculate the new value by scaling the original value down
            var withoutReplace = entropyInt.multiply(maxWithoutReplace).divide(maxWithReplace);
            // Left pad with zeros based on number of bits
            var entropyBin = withoutReplace.toString(2);
            var numberOfBitsInt = Math.floor(numberOfBits);
            while (entropyBin.length < numberOfBitsInt) {
                entropyBin = "0" + entropyBin;
            }
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
            base: base,
        }
        return e;
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
