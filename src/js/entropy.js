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

    let eventBits = {

    "binary": {
        "0": "0",
        "1": "1",
    },

    // log2(6) = 2.58496 bits per roll, with bias
    // 4 rolls give 2 bits each
    // 2 rolls give 1 bit each
    // Average (4*2 + 2*1) / 6 = 1.66 bits per roll without bias
    "base 6": {
        "0": "00",
        "1": "01",
        "2": "10",
        "3": "11",
        "4": "0",
        "5": "1",
    },

    // log2(6) = 2.58496 bits per roll, with bias
    // 4 rolls give 2 bits each
    // 2 rolls give 1 bit each
    // Average (4*2 + 2*1) / 6 = 1.66 bits per roll without bias
    "base 6 (dice)": {
        "0": "00", // equivalent to 0 in base 6
        "1": "01",
        "2": "10",
        "3": "11",
        "4": "0",
        "5": "1",
    },

    // log2(10) = 3.321928 bits per digit, with bias
    // 8 digits give 3 bits each
    // 2 digits give 1 bit each
    // Average (8*3 + 2*1) / 10 = 2.6 bits per digit without bias
    "base 10": {
        "0": "000",
        "1": "001",
        "2": "010",
        "3": "011",
        "4": "100",
        "5": "101",
        "6": "110",
        "7": "111",
        "8": "0",
        "9": "1",
    },

    "hexadecimal": {
        "0": "0000",
        "1": "0001",
        "2": "0010",
        "3": "0011",
        "4": "0100",
        "5": "0101",
        "6": "0110",
        "7": "0111",
        "8": "1000",
        "9": "1001",
        "a": "1010",
        "b": "1011",
        "c": "1100",
        "d": "1101",
        "e": "1110",
        "f": "1111",
    },

    // log2(52) = 5.7004 bits per card, with bias
    // 32 cards give 5 bits each
    // 16 cards give 4 bits each
    // 4 cards give 2 bits each
    // Average (32*5 + 16*4 + 4*2) / 52 = 4.46 bits per card without bias
    "card": {
        "ac": "00000",
        "2c": "00001",
        "3c": "00010",
        "4c": "00011",
        "5c": "00100",
        "6c": "00101",
        "7c": "00110",
        "8c": "00111",
        "9c": "01000",
        "tc": "01001",
        "jc": "01010",
        "qc": "01011",
        "kc": "01100",
        "ad": "01101",
        "2d": "01110",
        "3d": "01111",
        "4d": "10000",
        "5d": "10001",
        "6d": "10010",
        "7d": "10011",
        "8d": "10100",
        "9d": "10101",
        "td": "10110",
        "jd": "10111",
        "qd": "11000",
        "kd": "11001",
        "ah": "11010",
        "2h": "11011",
        "3h": "11100",
        "4h": "11101",
        "5h": "11110",
        "6h": "11111",
        "7h": "0000",
        "8h": "0001",
        "9h": "0010",
        "th": "0011",
        "jh": "0100",
        "qh": "0101",
        "kh": "0110",
        "as": "0111",
        "2s": "1000",
        "3s": "1001",
        "4s": "1010",
        "5s": "1011",
        "6s": "1100",
        "7s": "1101",
        "8s": "1110",
        "9s": "1111",
        "ts": "00",
        "js": "01",
        "qs": "10",
        "ks": "11",
    },

    }

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

    this.fromString = function(rawEntropyStr, baseStr) {
        // Find type of entropy being used (binary, hex, dice etc)
        var base = getBase(rawEntropyStr, baseStr);
        // Convert dice to base6 entropy (ie 1-6 to 0-5)
        // This is done by changing all 6s to 0s
        if (base.str == "dice") {
            var newEvents = [];
            for (var i=0; i<base.events.length; i++) {
                var c = base.events[i];
                if ("12345".indexOf(c) > -1) {
                    newEvents[i] = base.events[i];
                }
                else {
                    newEvents[i] = "0";
                }
            }
            base.str = "base 6 (dice)";
            base.events = newEvents;
            base.matcher = matchers.base6;
        }
        // Detect empty entropy
        if (base.events.length == 0) {
            return {
                binaryStr: "",
                cleanStr: "",
                cleanHtml: "",
                base: base,
            };
        }
        // Convert entropy events to binary
        var entropyBin = base.events.map(function(e) {
            return eventBits[base.str][e.toLowerCase()];
        }).join("");
        // Get average bits per event
        // which may be adjusted for bias if log2(base) is fractional
        var bitsPerEvent = base.bitsPerEvent;
        // Supply a 'filtered' entropy string for display purposes
        var entropyClean = base.events.join("");
        var entropyHtml = base.events.join("");
        if (base.asInt == 52) {
            entropyClean = base.events.join(" ").toUpperCase();
            entropyClean = entropyClean.replace(/C/g, "\u2663");
            entropyClean = entropyClean.replace(/D/g, "\u2666");
            entropyClean = entropyClean.replace(/H/g, "\u2665");
            entropyClean = entropyClean.replace(/S/g, "\u2660");
            entropyHtml = base.events.join(" ").toUpperCase();
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

    function getBase(str, baseStr) {
        // Need to get the lowest base for the supplied entropy.
        // This prevents interpreting, say, dice rolls as hexadecimal.
        var binaryMatches = matchers.binary(str);
        var hexMatches = matchers.hex(str);
        var autodetect = baseStr === undefined;
        // Find the lowest base that can be used, whilst ignoring any irrelevant chars
        if ((binaryMatches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "binary") {
            var ints = binaryMatches.map(function(i) { return parseInt(i, 2) });
            return {
                ints: ints,
                events: binaryMatches,
                matcher: matchers.binary,
                asInt: 2,
                bitsPerEvent: 1,
                str: "binary",
            }
        }
        var cardMatches = matchers.card(str);
        if ((cardMatches.length >= hexMatches.length / 2 && autodetect) || baseStr === "card") {
            return {
                ints: ints,
                events: cardMatches,
                matcher: matchers.card,
                asInt: 52,
                bitsPerEvent: (32*5 + 16*4 + 4*2) / 52, // see cardBits
                str: "card",
            }
        }
        var diceMatches = matchers.dice(str);
        if ((diceMatches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "dice") {
            var ints = diceMatches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: diceMatches,
                matcher: matchers.dice,
                asInt: 6,
                bitsPerEvent: (4*2 + 2*1) / 6, // see diceBits
                str: "dice",
            }
        }
        var base6Matches = matchers.base6(str);
        if ((base6Matches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "base 6") {
            var ints = base6Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base6Matches,
                matcher: matchers.base6,
                asInt: 6,
                bitsPerEvent: (4*2 + 2*1) / 6, // see diceBits
                str: "base 6",
            }
        }
        var base10Matches = matchers.base10(str);
        if ((base10Matches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "base 10") {
            var ints = base10Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base10Matches,
                matcher: matchers.base10,
                asInt: 10,
                bitsPerEvent: (8*3 + 2*1) / 10, // see b10Bits
                str: "base 10",
            }
        }
        var ints = hexMatches.map(function(i) { return parseInt(i, 16) });
        return {
            ints: ints,
            events: hexMatches,
            matcher: matchers.hex,
            asInt: 16,
            bitsPerEvent: 4,
            str: "hexadecimal",
        }
    }

})();
