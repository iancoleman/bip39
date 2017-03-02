// Usage:
// $ phantomjs tests.js


var page = require('webpage').create();
var url = 'src/index.html';
var testMaxTime = 20000;

page.viewportSize = {
    width: 1024,
    height: 720
};

page.onResourceError = function(e) {
    console.log("Error loading " + e.url);
    phantom.exit();
}

function fail() {
    console.log("Failed");
    phantom.exit();
}

function waitForGenerate(fn, maxTime) {
    if (!maxTime) {
        maxTime = testMaxTime;
    }
    var start = new Date().getTime();
    var prevAddressCount = -1;
    var wait = function keepWaiting() {
        var now = new Date().getTime();
        var hasTimedOut = now - start > maxTime;
        var addressCount = page.evaluate(function() {
            return $(".address").length;
        });
        var hasFinished = addressCount > 0 && addressCount == prevAddressCount;
        prevAddressCount = addressCount;
        if (hasFinished) {
            fn();
        }
        else if (hasTimedOut) {
            console.log("Test timed out");
            fn();
        }
        else {
            setTimeout(keepWaiting, 100);
        }
    }
    wait();
}

function waitForFeedback(fn, maxTime) {
    if (!maxTime) {
        maxTime = testMaxTime;
    }
    var start = new Date().getTime();
    var wait = function keepWaiting() {
        var now = new Date().getTime();
        var hasTimedOut = now - start > maxTime;
        if (hasTimedOut) {
            console.log("Test timed out");
            fn();
            return;
        }
        var feedback = page.evaluate(function() {
            var feedback = $(".feedback");
            if (feedback.css("display") == "none") {
                return "";
            }
            return feedback.text();
        });
        var hasFinished = feedback.length > 0 && feedback != "Calculating...";
        if (hasFinished) {
            fn();
        }
        else {
            setTimeout(keepWaiting, 100);
        }
    }
    wait();
}

function waitForEntropyFeedback(fn, maxTime) {
    if (!maxTime) {
        maxTime = testMaxTime;
    }
    var origFeedback = page.evaluate(function() {
        return $(".entropy-container").text();
    });
    var start = new Date().getTime();
    var wait = function keepWaiting() {
        var now = new Date().getTime();
        var hasTimedOut = now - start > maxTime;
        if (hasTimedOut) {
            console.log("Test timed out");
            fn();
            return;
        }
        var feedback = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        var hasFinished = feedback != origFeedback;
        if (hasFinished) {
            fn();
        }
        else {
            setTimeout(keepWaiting, 100);
        }
    }
    wait();
}

function next() {
    if (tests.length > 0) {
        var testsStr = tests.length == 1 ? "test" : "tests";
        console.log(tests.length + " " + testsStr + " remaining");
        tests.shift()();
    }
    else {
        console.log("Finished with 0 failures");
        phantom.exit();
    }
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * See http://stackoverflow.com/a/12646864
 */
function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

tests = [

// Page loads with status of 'success'
function() {
page.open(url, function(status) {
    if (status != "success") {
        console.log("Page did not load with status 'success'");
        fail();
    }
    next();
});
},

// Page has text
function() {
page.open(url, function(status) {
    var content = page.evaluate(function() {
        return document.body.textContent.trim();
    });
    if (!content) {
        console.log("Page does not have text");
        fail();
    }
    next();
});
},

// Entering mnemonic generates addresses
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    // get the address
    waitForGenerate(function() {
        var addressCount = page.evaluate(function() {
            return $(".address").length;
        });
        if (addressCount != 20) {
            console.log("Mnemonic did not generate addresses");
            console.log("Expected: " + expected);
            console.log("Got: " + actual);
            fail();
        }
        next();
    });
});
},

// Random button generates random mnemonic
function() {
page.open(url, function(status) {
    // check initial phrase is empty
    var phrase = page.evaluate(function() {
        return $(".phrase").text();
    });
    if (phrase != "") {
        console.log("Initial phrase is not blank");
        fail();
    }
    // press the 'generate' button
    page.evaluate(function() {
        $(".generate").click();
    });
    // get the new phrase
    waitForGenerate(function() {
        var phrase = page.evaluate(function() {
            return $(".phrase").val();
        });
        if (phrase.length <= 0) {
            console.log("Phrase not generated by pressing button");
            fail();
        }
        next();
    });
});
},

// Mnemonic length can be customized
function() {
page.open(url, function(status) {
    // set the length to 6
    var expectedLength = "6";
    page.evaluate(function() {
        $(".strength option[selected]").removeAttr("selected");
        $(".strength option[value=6]").prop("selected", true);
    });
    // press the 'generate' button
    page.evaluate(function() {
        $(".generate").click();
    });
    // check the new phrase is six words long
    waitForGenerate(function() {
        var actualLength = page.evaluate(function() {
            var words = $(".phrase").val().split(" ");
            return words.length;
        });
        if (actualLength != expectedLength) {
            console.log("Phrase not generated with correct length");
            console.log("Expected: " + expectedLength);
            console.log("Actual: " + actualLength);
            fail();
        }
        next();
    });
});
},

// Passphrase can be set
function() {
page.open(url, function(status) {
    // set the phrase and passphrase
    var expected = "15pJzUWPGzR7avffV9nY5by4PSgSKG9rba";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".passphrase").val("secure_passphrase").trigger("input");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Passphrase results in wrong address");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to bitcoin testnet
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "mucaU5iiDaJDb69BHLeDv8JFfGiyg2nJKi";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Bitcoin Testnet";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Bitcoin testnet address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to litecoin
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "LQ4XU8RX2ULPmPq9FcUHdVmPVchP9nwXdn";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Litecoin";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Litecoin address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to dogecoin
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "DPQH2AtuzkVSG6ovjKk4jbUmZ6iXLpgbJA";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Dogecoin";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Dogecoin address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to shadowcash
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "SiSZtfYAXEFvMm3XM8hmtkGDyViRwErtCG";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "ShadowCash";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Shadowcash address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to shadowcash testnet
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "tM2EDpVKaTiEg2NZg3yKg8eqjLr55BErHe";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "ShadowCash Testnet";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Shadowcash testnet address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to viacoin
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "Vq9Eq4N5SQnjqZvxtxzo7hZPW5XnyJsmXT";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Viacoin";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Viacoin address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to viacoin testnet
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "tM2EDpVKaTiEg2NZg3yKg8eqjLr55BErHe";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Viacoin Testnet";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Viacoin testnet address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to jumbucks
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "JLEXccwDXADK4RxBPkRez7mqsHVoJBEUew";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Jumbucks";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Jumbucks address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to clam
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "xCp4sakjVx4pUAZ6cBCtuin8Ddb6U1sk9y";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "CLAM";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("CLAM address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to dash
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "XdbhtMuGsPSkE6bPdNTHoFSszQKmK4S5LT";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "DASH";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("DASH address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to namecoin
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "Mw2vK2Bvex1yYtYF6sfbEg2YGoUc98YUD2";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Namecoin";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Namecoin address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to peercoin
function() {
page.open(url, function(status) {
    // set the phrase and coin
    var expected = "PVAiioTaK2eDHSEo3tppT9AVdBYqxRTBAm";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Peercoin";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Peercoin address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Network can be set to ethereum
function() {

page.open(url, function(status) {

    // set the phrase and coin
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function() {
            return $(this).html() == "Ethereum";
        }).prop("selected", true);
        $(".network").trigger("change");
    });
    waitForGenerate(function() {
        // check the address is generated correctly
        // this value comes from
        // https://www.myetherwallet.com/#view-wallet-info
        // Unusual capitalization is due to checksum
        var expected = "0xe5815d5902Ad612d49283DEdEc02100Bd44C2772";
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Ethereum address is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        // check the private key is correct
        // this private key can be imported into
        // https://www.myetherwallet.com/#view-wallet-info
        // and it should correlate to the address above
        var expected = "8f253078b73d7498302bb78c171b23ce7a8fb511987d2b2702b731638a4a15e7";
        var actual = page.evaluate(function() {
            return $(".privkey:first").text();
        });
        if (actual != expected) {
            console.log("Ethereum privkey is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        // check the public key is correct
        // TODO
        // don't have any third-party source to generate the expected value
        //var expected = "?";
        //var actual = page.evaluate(function() {
        //    return $(".pubkey:first").text();
        //});
        //if (actual != expected) {
        //    console.log("Ethereum privkey is incorrect");
        //    console.log("Expected: " + expected);
        //    console.log("Actual: " + actual);
        //    fail();
        //}
        next();
    });
});
},

// BIP39 seed is set from phrase
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "20da140d3dd1df8713cefcc4d54ce0e445b4151027a1ab567b832f6da5fcc5afc1c3a3f199ab78b8e0ab4652efd7f414ac2c9a3b81bceb879a70f377aa0a58f3";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".seed").val();
        });
        if (actual != expected) {
            console.log("BIP39 seed is incorrectly generated from mnemonic");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// BIP32 root key is set from phrase
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".root-key").val();
        });
        if (actual != expected) {
            console.log("Root key is incorrectly generated from mnemonic");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Tabs show correct addresses when changed
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "17uQ7s2izWPwBmEVFikTmZUjbBKWYdJchz";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // change tabs
    waitForGenerate(function() {
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        // check the address is generated correctly
        waitForGenerate(function() {
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("Clicking tab generates incorrect address");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// BIP44 derivation path is shown
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "m/44'/0'/0'/0";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check the derivation path of the first address
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $("#bip44 .path").val();
        });
        if (actual != expected) {
            console.log("BIP44 derivation path is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// BIP44 extended private key is shown
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xprvA2DxxvPZcyRvYgZMGS53nadR32mVDeCyqQYyFhrCVbJNjPoxMeVf7QT5g7mQASbTf9Kp4cryvcXnu2qurjWKcrdsr91jXymdCDNxKgLFKJG";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check the BIP44 extended private key
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".extended-priv-key").val();
        });
        if (actual != expected) {
            console.log("BIP44 extended private key is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// BIP44 extended public key is shown
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xpub6FDKNRvTTLzDmAdpNTc49ia9b4byd6vqCdUa46Fp3vqMcC96uBoufCmZXQLiN5AK3iSCJMhf9gT2sxkpyaPepRuA7W3MujV5tGmF5VfbueM";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check the BIP44 extended public key
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".extended-pub-key").val();
        });
        if (actual != expected) {
            console.log("BIP44 extended public key is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// BIP44 purpose field changes address list
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "1JbDzRJ2cDT8aat2xwKd6Pb2zzavow5MhF";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // change the bip44 purpose field to 45
        page.evaluate(function() {
            $("#bip44 .purpose").val("45");
            $("#bip44 .purpose").trigger("input");
        });
        waitForGenerate(function() {
            // check the address for the new derivation path
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("BIP44 purpose field generates incorrect address");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// BIP44 coin field changes address list
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "1F6dB2djQYrxoyfZZmfr6D5voH8GkJTghk";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // change the bip44 purpose field to 45
        page.evaluate(function() {
            $("#bip44 .coin").val("1");
            $("#bip44 .coin").trigger("input");
        });
        waitForGenerate(function() {
            // check the address for the new derivation path
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("BIP44 coin field generates incorrect address");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// BIP44 account field changes address list
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "1Nq2Wmu726XHCuGhctEtGmhxo3wzk5wZ1H";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // change the bip44 purpose field to 45
        page.evaluate(function() {
            $("#bip44 .account").val("1");
            $("#bip44 .account").trigger("input");
        });
        waitForGenerate(function() {
            // check the address for the new derivation path
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("BIP44 account field generates incorrect address");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// BIP44 change field changes address list
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "1KAGfWgqfVbSSXY56fNQ7YnhyKuoskHtYo";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // change the bip44 purpose field to 45
        page.evaluate(function() {
            $("#bip44 .change").val("1");
            $("#bip44 .change").trigger("input");
        });
        waitForGenerate(function() {
            // check the address for the new derivation path
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("BIP44 change field generates incorrect address");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// BIP32 derivation path can be set
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "16pYQQdLD1hH4hwTGLXBaZ9Teboi1AGL8L";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // change tabs
    waitForGenerate(function() {
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        // set the derivation path to m/1
        waitForGenerate(function() {
            page.evaluate(function() {
                $("#bip32 .path").val("m/1");
                $("#bip32 .path").trigger("input");
            });
            // check the address is generated correctly
            waitForGenerate(function() {
                var actual = page.evaluate(function() {
                    return $(".address:first").text();
                });
                if (actual != expected) {
                    console.log("Custom BIP32 path generates incorrect address");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                next();
            });
        });
    });
});
},

// BIP32 can use hardened derivation paths
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "14aXZeprXAE3UUKQc4ihvwBvww2LuEoHo4";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // change tabs
    waitForGenerate(function() {
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        // set the derivation path to m/0'
        waitForGenerate(function() {
            page.evaluate(function() {
                $("#bip32 .path").val("m/0'");
                $("#bip32 .path").trigger("input");
            });
            // check the address is generated correctly
            waitForGenerate(function() {
                var actual = page.evaluate(function() {
                    return $(".address:first").text();
                });
                if (actual != expected) {
                    console.log("Hardened BIP32 path generates incorrect address");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                next();
            });
        });
    });
});
},

// BIP32 extended private key is shown
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xprv9va99uTVE5aLiutUVLTyfxfe8v8aaXjSQ1XxZbK6SezYVuikA9MnjQVTA8rQHpNA5LKvyQBpLiHbBQiiccKiBDs7eRmBogsvq3THFeLHYbe";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // change tabs
    waitForGenerate(function() {
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        // check the extended private key is generated correctly
        waitForGenerate(function() {
            var actual = page.evaluate(function() {
                return $(".extended-priv-key").val();
            });
            if (actual != expected) {
                console.log("BIP32 extended private key is incorrect");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// BIP32 extended public key is shown
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xpub69ZVZQzP4T8dwPxwbMzz36cNgwy4yzTHmETZMyihzzXXNi3thgg3HCow1RtY252wdw5rS8369xKnraN5Q93y3FkFfJp2XEHWUrkyXsjS93P";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // change tabs
    waitForGenerate(function() {
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        // check the extended public key is generated correctly
        waitForGenerate(function() {
            var actual = page.evaluate(function() {
                return $(".extended-pub-key").val();
            });
            if (actual != expected) {
                console.log("BIP32 extended public key is incorrect");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// Derivation path is shown in table
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "m/44'/0'/0'/0/0";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check for derivation path in table
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".index:first").text();
        });
        if (actual != expected) {
            console.log("Derivation path shown incorrectly in table");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Derivation path for address can be hardened
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "18exLzUv7kfpiXRzmCjFDoC9qwNLFyvwyd";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // change tabs
    waitForGenerate(function() {
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        waitForGenerate(function() {
            // select the hardened addresses option
            page.evaluate(function() {
                $(".hardened-addresses").prop("checked", true);
                $(".hardened-addresses").trigger("change");
            });
            waitForGenerate(function() {
                // check the generated address is hardened
                var actual = page.evaluate(function() {
                    return $(".address:first").text();
                });
                if (actual != expected) {
                    console.log("Hardened address is incorrect");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                next();
            });
        });
    });
});
},

// Derivation path visibility can be toggled
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // toggle path visibility
        page.evaluate(function() {
            $(".index-toggle").click();
        });
        // check the path is not visible
        var isInvisible = page.evaluate(function() {
            return $(".index:first span").hasClass("invisible");
        });
        if (!isInvisible) {
            console.log("Toggled derivation path is visible");
            fail();
        }
        next();
    });
});
},

// Address is shown
function() {
page.open(url, function(status) {
    var expected = "1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug";
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    // get the address
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Address is not shown");
            console.log("Expected: " + expected);
            console.log("Got: " + actual);
            fail();
        }
        next();
    });
});
},

// Addresses are shown in order of derivation path
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    // get the derivation paths
    waitForGenerate(function() {
        var paths = page.evaluate(function() {
            return $(".index").map(function(i, e) {
                return $(e).text();
            });
        });
        if (paths.length != 20) {
            console.log("Total paths is less than expected: " + paths.length);
            fail();
        }
        for (var i=0; i<paths.length; i++) {
            var expected = "m/44'/0'/0'/0/" + i;
            var actual = paths[i];
            if (actual != expected) {
                console.log("Path " + i + " is incorrect");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
        }
        next();
    });
});
},

// Address visibility can be toggled
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // toggle address visibility
        page.evaluate(function() {
            $(".address-toggle").click();
        });
        // check the address is not visible
        var isInvisible = page.evaluate(function() {
            return $(".address:first span").hasClass("invisible");
        });
        if (!isInvisible) {
            console.log("Toggled address is visible");
            fail();
        }
        next();
    });
});
},

// Public key is shown
function() {
page.open(url, function(status) {
    var expected = "033f5aed5f6cfbafaf223188095b5980814897295f723815fea5d3f4b648d0d0b3";
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    // get the address
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".pubkey:first").text();
        });
        if (actual != expected) {
            console.log("Public key is not shown");
            console.log("Expected: " + expected);
            console.log("Got: " + actual);
            fail();
        }
        next();
    });
});
},

// Public key visibility can be toggled
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // toggle public key visibility
        page.evaluate(function() {
            $(".public-key-toggle").click();
        });
        // check the public key is not visible
        var isInvisible = page.evaluate(function() {
            return $(".pubkey:first span").hasClass("invisible");
        });
        if (!isInvisible) {
            console.log("Toggled public key is visible");
            fail();
        }
        next();
    });
});
},

// Private key is shown
function() {
page.open(url, function(status) {
    var expected = "L26cVSpWFkJ6aQkPkKmTzLqTdLJ923e6CzrVh9cmx21QHsoUmrEE";
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    // get the address
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".privkey:first").text();
        });
        if (actual != expected) {
            console.log("Private key is not shown");
            console.log("Expected: " + expected);
            console.log("Got: " + actual);
            fail();
        }
        next();
    });
});
},

// Private key visibility can be toggled
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // toggle private key visibility
        page.evaluate(function() {
            $(".private-key-toggle").click();
        });
        // check the private key is not visible
        var isInvisible = page.evaluate(function() {
            return $(".privkey:first span").hasClass("invisible");
        });
        if (!isInvisible) {
            console.log("Toggled private key is visible");
            fail();
        }
        next();
    });
});
},

// More addresses can be generated
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // generate more addresses
        page.evaluate(function() {
            $(".more").click();
        });
        waitForGenerate(function() {
            // check there are more addresses
            var addressCount = page.evaluate(function() {
                return $(".address").length;
            });
            if (addressCount != 40) {
                console.log("More addresses cannot be generated");
                fail();
            }
            next();
        });
    });
});
},

// A custom number of additional addresses can be generated
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // get the current number of addresses
        var oldAddressCount = page.evaluate(function() {
            return $(".address").length;
        });
        // set a custom number of additional addresses
        page.evaluate(function() {
            $(".rows-to-add").val(1);
        });
        // generate more addresses
        page.evaluate(function() {
            $(".more").click();
        });
        waitForGenerate(function() {
            // check there are the correct number of addresses
            var newAddressCount = page.evaluate(function() {
                return $(".address").length;
            });
            if (newAddressCount - oldAddressCount != 1) {
                console.log("Number of additional addresses cannot be customized");
                console.log(newAddressCount)
                console.log(oldAddressCount)
                fail();
            }
            next();
        });
    });
});
},

// Additional addresses are shown in order of derivation path
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // generate more addresses
        page.evaluate(function() {
            $(".more").click();
        });
        // get the derivation paths
        waitForGenerate(function() {
            var paths = page.evaluate(function() {
                return $(".index").map(function(i, e) {
                    return $(e).text();
                });
            });
            if (paths.length != 40) {
                console.log("Total additional paths is less than expected: " + paths.length);
                fail();
            }
            for (var i=0; i<paths.length; i++) {
                var expected = "m/44'/0'/0'/0/" + i;
                var actual = paths[i];
                if (actual != expected) {
                    console.log("Path " + i + " is not in correct order");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
            }
            next();
        });
    });
});
},

// BIP32 root key can be set by the user
function() {
page.open(url, function(status) {
    var expected = "1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug";
    // set the root key
    page.evaluate(function() {
        $(".root-key").val("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi").trigger("input");
    });
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("Setting BIP32 root key results in wrong address");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Setting BIP32 root key clears the existing phrase, passphrase and seed
function() {
page.open(url, function(status) {
    var expected = "";
    // set a mnemonic
    page.evaluate(function() {
        $(".phrase").val("A non-blank but invalid value");
    });
    // Accept any confirm dialogs
    page.onConfirm = function() {
        return true;
    };
    // set the root key
    page.evaluate(function() {
        $(".root-key").val("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi").trigger("input");
    });
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".phrase").val();
        });
        if (actual != expected) {
            console.log("Phrase not cleared when setting BIP32 root key");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Clearing of phrase, passphrase and seed can be cancelled by user
function() {
page.open(url, function(status) {
    var expected = "abandon abandon ability";
    // set a mnemonic
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
    });
    // Cancel any confirm dialogs
    page.onConfirm = function() {
        return false;
    };
    // set the root key
    page.evaluate(function() {
        $(".root-key").val("xprv9s21ZrQH143K3d3vzEDD3KpSKmxsZ3y7CqhAL1tinwtP6wqK4TKEKjpBuo6P2hUhB6ZENo7TTSRytiP857hBZVpBdk8PooFuRspE1eywwNZ").trigger("input");
    });
    var actual = page.evaluate(function() {
        return $(".phrase").val();
    });
    if (actual != expected) {
        console.log("Phrase not retained when cancelling changes to BIP32 root key");
        console.log("Expected: " + expected);
        console.log("Actual: " + actual);
        fail();
    }
    next();
});
},

// Custom BIP32 root key is used when changing the derivation path
function() {
page.open(url, function(status) {
    var expected = "1Nq2Wmu726XHCuGhctEtGmhxo3wzk5wZ1H";
    // set the root key
    page.evaluate(function() {
        $(".root-key").val("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi").trigger("input");
    });
    waitForGenerate(function() {
        // change the derivation path
        page.evaluate(function() {
            $("#account").val("1").trigger("input");
        });
        // check the bip32 root key is used for derivation, not the blank phrase
        waitForGenerate(function() {
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("Changing the derivation path does not use BIP32 root key");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// Incorrect mnemonic shows error
function() {
page.open(url, function(status) {
    // set the root key
    page.evaluate(function() {
        $(".phrase").val("abandon abandon abandon").trigger("input");
    });
    waitForFeedback(function() {
        // check there is an error shown
        var feedback = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (feedback.length <= 0) {
            console.log("Invalid mnemonic does not show error");
            fail();
        }
        next();
    });
});
},

// Incorrect word shows suggested replacement
function() {
page.open(url, function(status) {
    // set the root key
    page.evaluate(function() {
        $(".phrase").val("abandon abandon abiliti").trigger("input");
    });
    // check there is a suggestion shown
    waitForFeedback(function() {
        var feedback = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (feedback.indexOf("did you mean ability?") < 0) {
            console.log("Incorrect word does not show suggested replacement");
            console.log("Error: " + error);
            fail();
        }
        next();
    });
});
},

// Github pull request 48
// First four letters of word shows that word, not closest
// since first four letters gives unique word in BIP39 wordlist
// eg ille should show illegal, not idle
function() {
page.open(url, function(status) {
    // set the incomplete word
    page.evaluate(function() {
        $(".phrase").val("ille").trigger("input");
    });
    // check there is a suggestion shown
    waitForFeedback(function() {
        var feedback = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (feedback.indexOf("did you mean illegal?") < 0) {
            console.log("Start of word does not show correct suggestion");
            console.log("Error: " + error);
            fail();
        }
        next();
    });
});
},

// Incorrect BIP32 root key shows error
function() {
page.open(url, function(status) {
    // set the root key
    page.evaluate(function() {
        $(".root-key").val("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpj").trigger("input");
    });
    // check there is an error shown
    waitForFeedback(function() {
        var feedback = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (feedback != "Invalid root key") {
            console.log("Invalid root key does not show error");
            console.log("Error: " + error);
            fail();
        }
        next();
    });
});
},

// Derivation path not starting with m shows error
function() {
page.open(url, function(status) {
    // set the mnemonic phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // select the bip32 tab so custom derivation path can be set
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        waitForGenerate(function() {
            // set the incorrect derivation path
            page.evaluate(function() {
                $("#bip32 .path").val("n/0").trigger("input");
            });
            waitForFeedback(function() {
                var feedback = page.evaluate(function() {
                    return $(".feedback").text();
                });
                if (feedback != "First character must be 'm'") {
                    console.log("Derivation path not starting with m should show error");
                    console.log("Error: " + error);
                    fail();
                }
                next();
            });
        });
    });
});
},

// Derivation path containing invalid characters shows useful error
function() {
page.open(url, function(status) {
    // set the mnemonic phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // select the bip32 tab so custom derivation path can be set
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        waitForGenerate(function() {
            // set the incorrect derivation path
            page.evaluate(function() {
                $("#bip32 .path").val("m/1/0wrong1/1").trigger("input");
            });
            waitForFeedback(function() {
                var feedback = page.evaluate(function() {
                    return $(".feedback").text();
                });
                if (feedback != "Invalid characters 0wrong1 found at depth 2") {
                    console.log("Derivation path with invalid characters should show error");
                    console.log("Error: " + error);
                    fail();
                }
                next();
            });
        });
    });
});
},

// Github Issue 11: Default word length is 15
// https://github.com/iancoleman/bip39/issues/11
function() {
page.open(url, function(status) {
    // get the word length
    var defaultLength = page.evaluate(function() {
        return $(".strength").val();
    });
    if (defaultLength != 15) {
        console.log("Default word length is not 15");
        fail();
    }
    next();
});
},


// Github Issue 12: Generate more rows with private keys hidden
// https://github.com/iancoleman/bip39/issues/12
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // toggle private keys hidden, then generate more addresses
        page.evaluate(function() {
            $(".private-key-toggle").click();
            $(".more").click();
        });
        waitForGenerate(function() {
            // check more have been generated
            var expected = 40;
            var numPrivKeys = page.evaluate(function() {
                return $(".privkey").length;
            });
            if (numPrivKeys != expected) {
                console.log("Wrong number of addresses when clicking 'more' with hidden privkeys");
                console.log("Expected: " + expected);
                console.log("Actual: " + numPrivKeys);
                fail();
            }
            // check no private keys are shown
            var numHiddenPrivKeys = page.evaluate(function() {
                return $(".privkey span[class=invisible]").length;
            });
            if (numHiddenPrivKeys != expected) {
                console.log("Generating more does not retain hidden state of privkeys");
                console.log("Expected: " + expected);
                console.log("Actual: " + numHiddenPrivKeys);
                fail();
            }
            next();
        });
    });
});
},

// Github Issue 19: Mnemonic is not sensitive to whitespace
// https://github.com/iancoleman/bip39/issues/19
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xprv9s21ZrQH143K3isaZsWbKVoTtbvd34Y1ZGRugGdMeBGbM3AgBVzTH159mj1cbbtYSJtQr65w6L5xy5L9SFC7c9VJZWHxgAzpj4mun5LhrbC";
    page.evaluate(function() {
        var doubleSpace = "  ";
        $(".phrase").val("urge cat" + doubleSpace + "bid");
        $(".phrase").trigger("input");
    });
    waitForGenerate(function() {
        // Check the bip32 root key is correct
        var actual = page.evaluate(function() {
            return $(".root-key").val();
        });
        if (actual != expected) {
            console.log("Mnemonic is sensitive to whitespace");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Github Issue 23: Part 1: Use correct derivation path when changing tabs
// https://github.com/iancoleman/bip39/issues/23
function() {
page.open(url, function(status) {
    // 1) and 2) set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // 3) select bip32 tab
        page.evaluate(function() {
            $("#bip32-tab a").click();
        });
        waitForGenerate(function() {
            // 4) switch from bitcoin to litecoin
            page.evaluate(function() {
                $(".network option").filter(function() {
                    return $(this).html() == "Litecoin";
                }).prop("selected", true);
                $(".network").trigger("change");
            });
            waitForGenerate(function() {
                // 5) Check derivation path is displayed correctly
                var expected = "m/0/0";
                var actual = page.evaluate(function() {
                    return $(".index:first").text();
                });
                if (actual != expected) {
                    console.log("Github Issue 23 Part 1: derivation path display error");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                // 5) Check address is displayed correctly
                var expected = "LS8MP5LZ5AdzSZveRrjm3aYVoPgnfFh5T5";
                var actual = page.evaluate(function() {
                    return $(".address:first").text();
                });
                if (actual != expected) {
                    console.log("Github Issue 23 Part 1: address display error");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                next();
            });
        });
    });
});
},

// Github Issue 23 Part 2: Coin selection in derivation path
// https://github.com/iancoleman/bip39/issues/23#issuecomment-238011920
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // switch from bitcoin to clam
        page.evaluate(function() {
            $(".network option").filter(function() {
                return $(this).html() == "CLAM";
            }).prop("selected", true);
            $(".network").trigger("change");
        });
        waitForGenerate(function() {
            // check derivation path is displayed correctly
            var expected = "m/44'/23'/0'/0/0";
            var actual = page.evaluate(function() {
                return $(".index:first").text();
            });
            if (actual != expected) {
                console.log("Github Issue 23 Part 2: Coin in BIP44 derivation path is incorrect");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// Github Issue 26: When using a Root key derrived altcoins are incorrect
// https://github.com/iancoleman/bip39/issues/26
function() {
page.open(url, function(status) {
    // 1) 2) and 3) set the root key
    page.evaluate(function() {
        $(".root-key").val("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi").trigger("input");
    });
    waitForGenerate(function() {
        // 4) switch from bitcoin to viacoin
        page.evaluate(function() {
            $(".network option").filter(function() {
                return $(this).html() == "Viacoin";
            }).prop("selected", true);
            $(".network").trigger("change");
        });
        waitForGenerate(function() {
            // 5) ensure the derived address is correct
            var expected = "Vq9Eq4N5SQnjqZvxtxzo7hZPW5XnyJsmXT";
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("Github Issue 26: address is incorrect when changing networks and using root-key to derive");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// Selecting a language with no existing phrase should generate a phrase in
// that language.
function() {
page.open(url, function(status) {
    // Select a language
    // Need to manually simulate hash being set due to quirk between
    // 'click' event triggered by javascript vs triggered by mouse.
    // Perhaps look into page.sendEvent
    // http://phantomjs.org/api/webpage/method/send-event.html
    page.evaluate(function() {
        window.location.hash = "#japanese";
        $("a[href='#japanese']").trigger("click");
    });
    waitForGenerate(function() {
        // Check the mnemonic is in Japanese
        var phrase = page.evaluate(function() {
            return $(".phrase").val();
        });
        if (phrase.length <= 0) {
            console.log("No Japanese phrase generated");
            fail();
        }
        if (phrase.charCodeAt(0) < 128) {
            console.log("First character of Japanese phrase is ascii");
            console.log("Phrase: " + phrase);
            fail();
        }
        next();
    });
});
},

// Selecting a language with existing phrase should update the phrase to use
// that language.
function() {
page.open(url, function(status) {
    // Set the phrase to an English phrase.
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // Change to Italian
        // Need to manually simulate hash being set due to quirk between
        // 'click' event triggered by javascript vs triggered by mouse.
        // Perhaps look into page.sendEvent
        // http://phantomjs.org/api/webpage/method/send-event.html
        page.evaluate(function() {
            window.location.hash = "#italian";
            $("a[href='#italian']").trigger("click");
        });
        waitForGenerate(function() {
            // Check only the language changes, not the phrase
            var expected = "abaco abaco abbaglio";
            var actual = page.evaluate(function() {
                return $(".phrase").val();
            });
            if (actual != expected) {
                console.log("Changing language with existing phrase");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            // Check the address is correct
            var expected = "1Dz5TgDhdki9spa6xbPFbBqv5sjMrx3xgV";
            var actual = page.evaluate(function() {
                return $(".address:first").text();
            });
            if (actual != expected) {
                console.log("Changing language generates incorrect address");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            next();
        });
    });
});
},

// Suggested replacement for erroneous word in non-English language
function() {
page.open(url, function(status) {
    // Set an incorrect phrase in Italian
    page.evaluate(function() {
        $(".phrase").val("abaco abaco zbbaglio").trigger("input");
    });
    waitForFeedback(function() {
        // Check the suggestion is correct
        var feedback = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (feedback.indexOf("did you mean abbaglio?") < 0) {
            console.log("Incorrect Italian word does not show suggested replacement");
            console.log("Error: " + error);
            fail();
        }
        next();
    });
});
},


// Japanese word does not break across lines.
// Point 2 from
// https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md#japanese
function() {
page.open(url, function(status) {
    hasWordBreakCss = page.content.indexOf("word-break: keep-all;") > -1;
    if (!hasWordBreakCss) {
        console.log("Japanese words can break across lines mid-word");
        console.log("Check CSS for '.phrase { word-break: keep-all; }'");
        fail();
    }
    // Run the next test
    next();
});
},

// Language can be specified at page load using hash value in url
function() {
page.open(url, function(status) {
    // Set the page hash as if it were on a fresh page load
    page.evaluate(function() {
        window.location.hash = "#japanese";
    });
    // Generate a random phrase
    page.evaluate(function() {
        $(".generate").trigger("click");
    });
    waitForGenerate(function() {
        // Check the phrase is in Japanese
        var phrase = page.evaluate(function() {
            return $(".phrase").val();
        });
        if (phrase.length <= 0) {
            console.log("No phrase generated using url hash");
            fail();
        }
        if (phrase.charCodeAt(0) < 128) {
            console.log("Language not detected from url hash on page load.");
            console.log("Phrase: " + phrase);
            fail();
        }
        next();
    });
});
},

// Entropy unit tests
function() {
page.open(url, function(status) {
    var response = page.evaluate(function() {
        var e;
        // binary entropy is detected
        try {
            e = Entropy.fromString("01010101");
            if (e.base.str != "binary") {
                return "Binary entropy not detected correctly";
            }
        }
        catch (e) {
            return e.message;
        }
        // base6 entropy is detected
        try {
            e = Entropy.fromString("012345012345");
            if (e.base.str != "base 6") {
                return "base6 entropy not detected correctly";
            }
        }
        catch (e) {
            return e.message;
        }
        // dice entropy is detected
        try {
            e = Entropy.fromString("123456123456");
            if (e.base.str != "base 6 (dice)") {
                return "dice entropy not detected correctly";
            }
        }
        catch (e) {
            return e.message;
        }
        // base10 entropy is detected
        try {
            e = Entropy.fromString("0123456789");
            if (e.base.str != "base 10") {
                return "base10 entropy not detected correctly";
            }
        }
        catch (e) {
            return e.message;
        }
        // hex entropy is detected
        try {
            e = Entropy.fromString("0123456789ABCDEF");
            if (e.base.str != "hexadecimal") {
                return "hexadecimal entropy not detected correctly";
            }
        }
        catch (e) {
            return e.message;
        }
        // card entropy is detected
        try {
            e = Entropy.fromString("AC4DTHKS");
            if (e.base.str != "card") {
                return "card entropy not detected correctly";
            }
        }
        catch (e) {
            return e.message;
        }
        // entropy is case insensitive
        try {
            e = Entropy.fromString("aBcDeF");
            if (e.cleanStr != "aBcDeF") {
                return "Entropy should not be case sensitive";
            }
        }
        catch (e) {
            return e.message;
        }
        // dice entropy is converted to base6
        try {
            e = Entropy.fromString("123456");
            if (e.cleanStr != "123450") {
                return "Dice entropy is not automatically converted to base6";
            }
        }
        catch (e) {
            return e.message;
        }
        // dice entropy is preferred to base6 if ambiguous
        try {
            e = Entropy.fromString("12345");
            if (e.base.str != "base 6 (dice)") {
                return "dice not used as default over base 6";
            }
        }
        catch (e) {
            return e.message;
        }
        // unused characters are ignored
        try {
            e = Entropy.fromString("fghijkl");
            if (e.cleanStr != "f") {
                return "additional characters are not ignored";
            }
        }
        catch (e) {
            return e.message;
        }
        // the lowest base is used by default
        // 7 could be decimal or hexadecimal, but should be detected as decimal
        try {
            e = Entropy.fromString("7");
            if (e.base.str != "base 10") {
                return "lowest base is not used";
            }
        }
        catch (e) {
            return e.message;
        }
        // Leading zeros are retained
        try {
            e = Entropy.fromString("000A");
            if (e.cleanStr != "000A") {
                return "Leading zeros are not retained";
            }
        }
        catch (e) {
            return e.message;
        }
        // Leading zeros are correctly preserved for hex in binary string
        try {
            e = Entropy.fromString("2A");
            if (e.binaryStr != "00101010") {
                return "Hex leading zeros are not correct in binary";
            }
        }
        catch (e) {
            return e.message;
        }
        // Leading zeros for base 6 as binary string
        // 20 = 2 events at 2.58 bits per event = 5 bits
        // 20 in base 6 = 12 in base 10 = 1100 in base 2
        // so it needs 1 bit of padding to be the right bit length
        try {
            e = Entropy.fromString("20");
            if (e.binaryStr != "01100") {
                return "Base 6 as binary has leading zeros";
            }
        }
        catch (e) {
            return e.message;
        }
        // Leading zeros for base 10 as binary string
        try {
            e = Entropy.fromString("17");
            if (e.binaryStr != "010001") {
                return "Base 10 as binary has leading zeros";
            }
        }
        catch (e) {
            return e.message;
        }
        // Leading zeros for card entropy as binary string.
        // Card entropy is hashed so 2c does not necessarily produce leading zeros.
        try {
            e = Entropy.fromString("2c");
            if (e.binaryStr != "0010") {
                return "Card entropy as binary has leading zeros";
            }
        }
        catch (e) {
            return e.message;
        }
        // Keyboard mashing results in weak entropy
        // Despite being a long string, it's less than 30 bits of entropy
        try {
            e = Entropy.fromString("aj;se ifj; ask,dfv js;ifj");
            if (e.binaryStr.length >= 30) {
                return "Keyboard mashing should produce weak entropy";
            }
        }
        catch (e) {
            return e.message;
        }
        // Card entropy is used if every pair could be a card
        try {
            e = Entropy.fromString("4c3c2c");
            if (e.base.str != "card") {
                return "Card entropy not used if all pairs are cards";
            }
        }
        catch (e) {
            return e.message;
        }
        // Card entropy uses base 52
        // [ cards, binary ]
        try {
            var cards = [
                [ "ac", "0101" ],
                [ "acqs", "11011100" ],
                [ "acks", "01011100" ],
                [ "2cac", "11111000" ],
                [ "2c", "0010" ],
                [ "3d", "0001" ],
                [ "4h", "1001" ],
                [ "5s", "1001" ],
                [ "6c", "0000" ],
                [ "7d", "0001" ],
                [ "8h", "1011" ],
                [ "9s", "0010" ],
                [ "tc", "1001" ],
                [ "jd", "1111" ],
                [ "qh", "0010" ],
                [ "ks", "0101" ],
                [ "ks2c", "01010100" ],
                [ "KS2C", "01010100" ],
            ];
            for (var i=0; i<cards.length; i++) {
                var card = cards[i][0];
                var result = cards[i][1];
                e = Entropy.fromString(card);
                console.log(e.binary + " " + result);
                if (e.binaryStr !== result) {
                    return "card entropy " + card + " not parsed correctly: " + result + " != " + e.binaryStr;
                }
            }
        }
        catch (e) {
            return e.message;
        }
        return "PASS";
    });
    if (response != "PASS") {
        console.log("Entropy unit tests");
        console.log(response);
        fail();
    };
    next();
});
},

// Entropy can be entered by the user
function() {
page.open(url, function(status) {
    expected = {
        mnemonic: "abandon abandon ability",
        address: "1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug",
    }
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("00000000 00000000 00000000 00000000").trigger("input");
    });
    // check the mnemonic is set and address is correct
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return {
                address: $(".address:first").text(),
                mnemonic: $(".phrase").val(),
            }
        });
        if (actual.mnemonic != expected.mnemonic) {
            console.log("Entropy does not generate correct mnemonic");
            console.log("Expected: " + expected.mnemonic);
            console.log("Got: " + actual.mnemonic);
            fail();
        }
        if (actual.address != expected.address) {
            console.log("Entropy does not generate correct address");
            console.log("Expected: " + expected.address);
            console.log("Got: " + actual.address);
            fail();
        }
        next();
    });
});
},

// A warning about entropy is shown to the user, with additional information
function() {
page.open(url, function(status) {
    // get text content from entropy sections of page
    var hasWarning = page.evaluate(function() {
        var entropyText = $(".entropy-container").text();
        var warning = "mnemonic may be insecure";
        if (entropyText.indexOf(warning) == -1) {
            return false;
        }
        var readMoreText = $("#entropy-notes").parent().text();
        var goodSources = "flipping a fair coin, rolling a fair dice, noise measurements etc";
        if (readMoreText.indexOf(goodSources) == -1) {
            return false;
        }
        return true;
    });
    // check the warnings and information are shown
    if (!hasWarning) {
        console.log("Page does not contain warning about using own entropy");
        fail();
    }
    next();
});
},

// The types of entropy available are described to the user
function() {
page.open(url, function(status) {
    // get placeholder text for entropy field
    var placeholder = page.evaluate(function() {
        return $(".entropy").attr("placeholder");
    });
    var options = [
        "binary",
        "base 6",
        "dice",
        "base 10",
        "hexadecimal",
        "cards",
    ];
    for (var i=0; i<options.length; i++) {
        var option = options[i];
        if (placeholder.indexOf(option) == -1) {
            console.log("Available entropy type is not shown to user: " + option);
            fail();
        }
    }
    next();
});
},

// The actual entropy used is shown to the user
function() {
page.open(url, function(status) {
    // use entropy
    var badEntropySource = page.evaluate(function() {
        var entropy = "Not A Very Good Entropy Source At All";
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val(entropy).trigger("input");
    });
    // check the actual entropy being used is shown
    waitForEntropyFeedback(function() {
        var expectedText = "AedEceAA";
        var entropyText = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        if (entropyText.indexOf(expectedText) == -1) {
            console.log("Actual entropy used is not shown");
            fail();
        }
        next();
    });
});
},

// Binary entropy can be entered
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("01").trigger("input");
    });
    // check the entropy is shown to be the correct type
    waitForEntropyFeedback(function() {
        var entropyText = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        if (entropyText.indexOf("binary") == -1) {
            console.log("Binary entropy is not detected and presented to user");
            fail();
        }
        next();
    });
});
},

// Base 6 entropy can be entered
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("012345").trigger("input");
    });
    // check the entropy is shown to be the correct type
    waitForEntropyFeedback(function() {
        var entropyText = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        if (entropyText.indexOf("base 6") == -1) {
            console.log("Base 6 entropy is not detected and presented to user");
            fail();
        }
        next();
    });
});
},

// Base 6 dice entropy can be entered
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("123456").trigger("input");
    });
    // check the entropy is shown to be the correct type
    waitForEntropyFeedback(function() {
        var entropyText = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        if (entropyText.indexOf("dice") == -1) {
            console.log("Dice entropy is not detected and presented to user");
            fail();
        }
        next();
    });
});
},

// Base 10 entropy can be entered
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("789").trigger("input");
    });
    // check the entropy is shown to be the correct type
    waitForEntropyFeedback(function() {
        var entropyText = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        if (entropyText.indexOf("base 10") == -1) {
            console.log("Base 10 entropy is not detected and presented to user");
            fail();
        }
        next();
    });
});
},

// Hexadecimal entropy can be entered
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("abcdef").trigger("input");
    });
    // check the entropy is shown to be the correct type
    waitForEntropyFeedback(function() {
        var entropyText = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        if (entropyText.indexOf("hexadecimal") == -1) {
            console.log("Hexadecimal entropy is not detected and presented to user");
            fail();
        }
        next();
    });
});
},

// Dice entropy value is shown as the converted base 6 value
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("123456").trigger("input");
    });
    // check the entropy is shown as base 6, not as the original dice value
    waitForEntropyFeedback(function() {
        var entropyText = page.evaluate(function() {
            return $(".entropy-container").text();
        });
        if (entropyText.indexOf("123450") == -1) {
            console.log("Dice entropy is not shown to user as base 6 value");
            fail();
        }
        if (entropyText.indexOf("123456") > -1) {
            console.log("Dice entropy value is shown instead of true base 6 value");
            fail();
        }
        next();
    });
});
},

// The number of bits of entropy accumulated is shown
function() {
page.open(url, function(status) {
    //[ entropy, bits ]
    var tests = [
        [ "0000 0000 0000 0000 0000", "20" ],
        [ "0", "1" ],
        [ "0000", "4" ],
        [ "6", "2" ], // 6 in card is 0 in base 6, 0 in base 6 is 2.6 bits (rounded down to 2 bits)
        [ "7", "3" ], // 7 in base 10 is 111 in base 2, no leading zeros
        [ "8", "4" ],
        [ "F", "4" ],
        [ "29", "6" ],
        [ "0A", "8" ],
        [ "1A", "8" ], // hex is always multiple of 4 bits of entropy
        [ "2A", "8" ],
        [ "4A", "8" ],
        [ "8A", "8" ],
        [ "FA", "8" ],
        [ "000A", "16" ],
        [ "5555", "11" ],
        [ "6666", "10" ], // uses dice, so entropy is actually 0000 in base 6, which is 4 lots of 2.58 bits, which is 10.32 bits (rounded down to 10 bits)
        [ "2227", "13" ], // Uses base 10, which is 4 lots of 3.32 bits, which is 13.3 bits (rounded down to 13)
        [ "222F", "16" ],
        [ "FFFF", "16" ],
        [ "0000101017", "33" ], // 10 events at 3.32 bits per event
        [ "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks", "225" ], // cards are not replaced, so a full deck is not 52^52 entropy which is 296 bits, it's 52!, which is 225 bits
    ]
    // use entropy
    page.evaluate(function(e) {
        $(".use-entropy").prop("checked", true).trigger("change");
    });
    // Run each test
    var nextTest = function runNextTest(i) {
        var entropy = tests[i][0];
        var expected = tests[i][1];
        // set entropy
        page.evaluate(function(e) {
            $(".entropy").val(e).trigger("input");
        }, entropy);
        // check the number of bits of entropy is shown
        waitForEntropyFeedback(function() {
            var entropyText = page.evaluate(function() {
                return $(".entropy-container").text();
            });
            if (entropyText.replace(/\s/g,"").indexOf("Bits" + expected) == -1) {
                console.log("Accumulated entropy is not shown correctly for " + entropy);
                fail();
            }
            var isLastTest = i == tests.length - 1;
            if (isLastTest) {
                next();
            }
            else {
                runNextTest(i+1);
            }
        });
    }
    nextTest(0);
});
},

// There is feedback provided about the supplied entropy
function() {
page.open(url, function(status) {
    var tests = [
        {
            entropy: "A",
            filtered: "A",
            type: "hexadecimal",
            events: 1,
            bits: 4,
            words: 0,
            strength: "extremely weak",
        },
        {
            entropy: "AAAAAAAA",
            filtered: "AAAAAAAA",
            type: "hexadecimal",
            events: 8,
            bits: 32,
            words: 3,
            strength: "extremely weak",
        },
        {
            entropy: "AAAAAAAA B",
            filtered: "AAAAAAAAB",
            type: "hexadecimal",
            events: 9,
            bits: 36,
            words: 3,
            strength: "extremely weak",
        },
        {
            entropy: "AAAAAAAA BBBBBBBB",
            filtered: "AAAAAAAABBBBBBBB",
            type: "hexadecimal",
            events: 16,
            bits: 64,
            words: 6,
            strength: "very weak",
        },
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCC",
            type: "hexadecimal",
            events: 24,
            bits: 96,
            words: 9,
            strength: "weak",
        },
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD",
            type: "hexadecimal",
            events: 32,
            bits: 128,
            words: 12,
            strength: "easily cracked",
        },
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDA",
            type: "hexadecimal",
            events: 32,
            bits: 128,
            words: 12,
            strength: "strong",
        },
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA EEEEEEEE",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDAEEEEEEEE",
            type: "hexadecimal",
            events: 40,
            bits: 160,
            words: 15,
            strength: "very strong",
        },
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA EEEEEEEE FFFFFFFF",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDAEEEEEEEEFFFFFFFF",
            type: "hexadecimal",
            events: 48,
            bits: 192,
            words: 18,
            strength: "extremely strong",
        },
        {
            entropy: "7d",
            type: "card",
            events: 1,
            bits: 5,
            words: 0,
            strength: "extremely weak",
        },
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (full deck)",
            events: 52,
            bits: 225,
            words: 21,
            strength: "extremely strong",
        },
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks3d",
            type: "card (full deck, 1 duplicate: 3d)",
            events: 53,
            bits: 254,
            words: 21,
            strength: "extremely strong",
        },
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqs3d4d",
            type: "card (2 duplicates: 3d 4d, 1 missing: KS)",
            events: 53,
            bits: 254,
            words: 21,
            strength: "extremely strong",
        },
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqs3d4d5d6d",
            type: "card (4 duplicates: 3d 4d 5d..., 1 missing: KS)",
            events: 53,
            bits: 264,
            words: 24,
            strength: "extremely strong",
        },
        // Next test was throwing uncaught error in zxcvbn
        // Also tests 451 bits, ie Math.log2(52!)*2 = 225.58 * 2
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsksac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (full deck, 52 duplicates: ac 2c 3c...)",
            events: 104,
            bits: 499,
            words: 45,
            strength: "extremely strong",
        },
        // Case insensitivity to duplicate cards
        {
            entropy: "asAS",
            type: "card (1 duplicate: AS)",
            events: 2,
            bits: 9,
            words: 0,
            strength: "extremely weak",
        },
        {
            entropy: "ASas",
            type: "card (1 duplicate: as)",
            events: 2,
            bits: 9,
            words: 0,
            strength: "extremely weak",
        },
        // Missing cards are detected
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (1 missing: 9C)",
            events: 51,
            bits: 221,
            words: 18,
            strength: "extremely strong",
        },
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (2 missing: 9C 5D)",
            events: 50,
            bits: 216,
            words: 18,
            strength: "extremely strong",
        },
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d7d8d9dtdjd  kdah2h3h  5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (4 missing: 9C 5D QD...)",
            events: 48,
            bits: 208,
            words: 18,
            strength: "extremely strong",
        },
        // More than six missing cards does not show message
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d  8d9d  jd  kdah2h3h  5h6h7h8h9hthjhqhkh  2s3s4s5s6s7s8s9stsjsqsks",
            type: "card",
            events: 45,
            bits: 195,
            words: 18,
            strength: "extremely strong",
        },
        // Multiple decks of cards increases bits per event
        {
            entropy: "3d",
            events: 1,
            bits: 4,
            bitsPerEvent: 4.34,
        },
        {
            entropy: "3d3d",
            events: 2,
            bits: 9,
            bitsPerEvent: 4.80,
        },
        {
            entropy: "3d3d3d",
            events: 3,
            bits: 15,
            bitsPerEvent: 5.01,
        },
        {
            entropy: "3d3d3d3d",
            events: 4,
            bits: 20,
            bitsPerEvent: 5.14,
        },
        {
            entropy: "3d3d3d3d3d",
            events: 5,
            bits: 26,
            bitsPerEvent: 5.22,
        },
        {
            entropy: "3d3d3d3d3d3d",
            events: 6,
            bits: 31,
            bitsPerEvent: 5.28,
        },
        {
            entropy: "3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d",
            events: 33,
            bits: 184,
            bitsPerEvent: 5.59,
            strength: 'easily cracked - Repeats like "abcabcabc" are only slightly harder to guess than "abc"',
        },
    ];
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
    });
    var nextTest = function runNextTest(i) {
        function getFeedbackError(expected, actual) {
            if ("filtered" in expected && actual.indexOf(expected.filtered) == -1) {
                return "Filtered value not in feedback";
            }
            if ("type" in expected && actual.indexOf(expected.type) == -1) {
                return "Entropy type not in feedback";
            }
            if ("events" in expected && actual.indexOf(expected.events) == -1) {
                return "Event count not in feedback";
            }
            if ("bits" in expected && actual.indexOf(expected.bits) == -1) {
                return "Bit count not in feedback";
            }
            if ("strength" in expected && actual.indexOf(expected.strength) == -1) {
                return "Strength not in feedback";
            }
            if ("bitsPerEvent" in expected && actual.indexOf(expected.bitsPerEvent) == -1) {
                return "bitsPerEvent not in feedback";
            }
            return false;
        }
        test = tests[i];
        page.evaluate(function(e) {
            $(".addresses").empty();
            $(".phrase").val("");
            $(".entropy").val(e).trigger("input");
        }, test.entropy);
        waitForEntropyFeedback(function() {
            var mnemonic = page.evaluate(function() {
                return $(".phrase").val();
            });
            // Check mnemonic length
            if ("words" in test && test.words == 0) {
                if (mnemonic.length > 0) {
                    console.log("Mnemonic length for " + test.strength + " strength is not " + test.words);
                    console.log("Entropy: " + test.entropy);
                    console.log("Mnemonic: " + mnemonic);
                    fail();
                }
            }
            else if ("words" in test) {
                if (mnemonic.split(" ").length != test.words) {
                    console.log("Mnemonic length for " + test.strength + " strength is not " + test.words);
                    console.log("Entropy: " + test.entropy);
                    console.log("Mnemonic: " + mnemonic);
                    fail();
                }
            }
            // check feedback
            var feedback = page.evaluate(function() {
                return $(".entropy-container").text();
            });
            var feedbackError = getFeedbackError(test, feedback);
            if (feedbackError) {
                console.log("Entropy feedback for " + test.entropy + " returned error");
                console.log(feedbackError);
                fail();
            }
            // Run next test
            var isLastTest = i == tests.length - 1;
            if (isLastTest) {
                next();
            }
            else {
                runNextTest(i+1);
            }
        });
    }
    nextTest(0);
});
},

// Entropy is truncated from the left
function() {
page.open(url, function(status) {
    var expected = "avocado zoo zone";
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        var entropy  = "00000000 00000000 00000000 00000000";
            entropy += "11111111 11111111 11111111 1111"; // Missing last byte
        $(".entropy").val(entropy).trigger("input");
    });
    // check the entropy is truncated from the right
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".phrase").val();
        });
        if (actual != expected) {
            console.log("Entropy is not truncated from the right");
            console.log("Expected: " + expected);
            console.log("Got: " + actual);
            fail();
        }
        next();
    });
});
},

// Very large entropy results in very long mnemonics
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        var entropy  = "";
        // Generate a very long entropy string
        for (var i=0; i<33; i++) {
            entropy += "AAAAAAAA"; // 3 words * 33 iterations = 99 words
        }
        $(".entropy").val(entropy).trigger("input");
    });
    // check the mnemonic is very long
    waitForGenerate(function() {
        var wordCount = page.evaluate(function() {
            return $(".phrase").val().split(" ").length;
        });
        if (wordCount != 99) {
            console.log("Large entropy does not generate long mnemonic");
            console.log("Expected 99 words, got " + wordCount);
            fail();
        }
        next();
    });
});
},

// Is compatible with bip32jp entropy
// https://bip32jp.github.io/english/index.html
// NOTES:
// Is incompatible with:
//     base 20
function() {
page.open(url, function(status) {
    var expected = "train then jungle barely whip fiber purpose puppy eagle cloud clump hospital robot brave balcony utility detect estate old green desk skill multiply virus";
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        var entropy  = "543210543210543210543210543210543210543210543210543210543210543210543210543210543210543210543210543";
        $(".entropy").val(entropy).trigger("input");
    });
    // check the mnemonic matches the expected value from bip32jp
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".phrase").val();
        });
        if (actual != expected) {
            console.log("Mnemonic does not match bip32jp for base 6 entropy");
            console.log("Expected: " + expected);
            console.log("Got: " + actual);
            fail();
        }
        next();
    });
});
},

// Blank entropy does not generate mnemonic or addresses
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("").trigger("input");
    });
    waitForFeedback(function() {
        // check there is no mnemonic
        var phrase = page.evaluate(function() {
            return $(".phrase").val();
        });
        if (phrase != "") {
            console.log("Blank entropy does not result in blank mnemonic");
            console.log("Got: " + phrase);
            fail();
        }
        // check there are no addresses displayed
        var addresses = page.evaluate(function() {
            return $(".address").length;
        });
        if (addresses != 0) {
            console.log("Blank entropy does not result in zero addresses");
            fail();
        }
        // Check the feedback says 'blank entropy'
        var feedback = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (feedback != "Blank entropy") {
            console.log("Blank entropy does not show feedback message");
            fail();
        }
        next();
    });
});
},

// Mnemonic length can be selected even for weak entropy
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("012345");
        $(".mnemonic-length").val("18").trigger("change");
    });
    // check the mnemonic is the correct length
    waitForGenerate(function() {
        var phrase = page.evaluate(function() {
            return $(".phrase").val();
        });
        var numberOfWords = phrase.split(/\s/g).length;
        if (numberOfWords != 18) {
            console.log("Weak entropy cannot be overridden to give 18 word mnemonic");
            console.log(phrase);
            fail();
        }
        next();
    });
});
},

// Github issue 33
// https://github.com/iancoleman/bip39/issues/33
// Final cards should contribute entropy
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".entropy").val("7S 9H 9S QH 8C KS AS 7D 7C QD 4S 4D TC 2D 5S JS 3D 8S 8H 4C 3C AC 3S QC 9C JC 7H AD TD JD 6D KH 5C QS 2S 6S 6H JH KD 9D-6C TS TH 4H KC 5H 2H AH 2C 8D 3H 5D").trigger("input");
    });
    // get the mnemonic
    waitForGenerate(function() {
        var originalPhrase = page.evaluate(function() {
            return $(".phrase").val();
        });
        // Set the last 12 cards to be AS
        page.evaluate(function() {
            $(".addresses").empty();
            $(".entropy").val("7S 9H 9S QH 8C KS AS 7D 7C QD 4S 4D TC 2D 5S JS 3D 8S 8H 4C 3C AC 3S QC 9C JC 7H AD TD JD 6D KH 5C QS 2S 6S 6H JH KD 9D-AS AS AS AS AS AS AS AS AS AS AS AS").trigger("input");
        });
        // get the new mnemonic
        waitForGenerate(function() {
            var newPhrase = page.evaluate(function() {
                return $(".phrase").val();
            });
            // check the phrase has changed
            if (newPhrase == originalPhrase) {
                console.log("Changing last 12 cards does not change mnemonic");
                console.log("Original:");
                console.log(originalPhrase);
                console.log("New:");
                console.log(newPhrase);
                fail();
            }
            next();
        });
    });
});
},

// Github issue 35
// https://github.com/iancoleman/bip39/issues/35
// QR Code support
function() {
page.open(url, function(status) {
    // use entropy
    page.evaluate(function() {
        $(".generate").click();
    });
    waitForGenerate(function() {
        var p = page.evaluate(function() {
            // get position of mnemonic element
            return $(".phrase").offset();
        });
        p.top = Math.ceil(p.top);
        p.left = Math.ceil(p.left);
        // check the qr code shows
        page.sendEvent("mousemove", p.left+4, p.top+4);
        var qrShowing = page.evaluate(function() {
            return $(".qr-container").find("canvas").length > 0;
        });
        if (!qrShowing) {
            console.log("QR Code does not show");
            fail();
        }
        // check the qr code hides
        page.sendEvent("mousemove", p.left-4, p.top-4);
        var qrHidden = page.evaluate(function() {
            return $(".qr-container").find("canvas").length == 0;
        });
        if (!qrHidden) {
            console.log("QR Code does not hide");
            fail();
        }
        next();
    });
});
},

// BIP44 account extendend private key is shown
// github issue 37 - compatibility with electrum
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xprv9yzrnt4zWVJUr1k2VxSPy9ettKz5PpeDMgaVG7UKedhqnw1tDkxP2UyYNhuNSumk2sLE5ctwKZs9vwjsq3e1vo9egCK6CzP87H2cVYXpfwQ";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check the BIP44 account extended private key
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".account-xprv").val();
        });
        if (actual != expected) {
            console.log("BIP44 account extended private key is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// BIP44 account extendend public key is shown
// github issue 37 - compatibility with electrum
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf";
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability");
        $(".phrase").trigger("input");
    });
    // check the BIP44 account extended public key
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".account-xpub").val();
        });
        if (actual != expected) {
            console.log("BIP44 account extended public key is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// github issue 40
// BIP32 root key can be set as an xpub
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        // set xpub for account 0 of bip44 for 'abandon abandon ability'
        var bip44AccountXpub = "xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf";
        $("#root-key").val(bip44AccountXpub);
        $("#root-key").trigger("input");
    });
    waitForFeedback(function() {
        page.evaluate(function() {
            // Use bip32 tab
            $("#bip32-tab a").click();
        });
        waitForGenerate(function() {
            page.evaluate(function() {
                // derive external addresses for this xpub
                var firstAccountDerivationPath = "m/0";
                $("#bip32-path").val(firstAccountDerivationPath);
                $("#bip32-path").trigger("input");
            });
            waitForGenerate(function() {
                // check the addresses are generated
                var expected = "1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug";
                var actual = page.evaluate(function() {
                    return $(".address:first").text();
                });
                if (actual != expected) {
                    console.log("xpub key does not generate addresses in table");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                // check the xprv key is not set
                var expected = "NA";
                var actual = page.evaluate(function() {
                    return $(".extended-priv-key").val();
                });
                if (actual != expected) {
                    console.log("xpub key as root shows derived bip32 xprv key");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                // check the private key is not set
                var expected = "NA";
                var actual = page.evaluate(function() {
                    return $(".privkey:first").text();
                });
                if (actual != expected) {
                    console.log("xpub key generates private key in addresses table");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                next();
            });
        });
    });
});
},

// github issue 40
// xpub for bip32 root key will not work with hardened derivation paths
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        // set xpub for account 0 of bip44 for 'abandon abandon ability'
        var bip44AccountXpub = "xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf";
        $("#root-key").val(bip44AccountXpub);
        $("#root-key").trigger("input");
    });
    waitForFeedback(function() {
        // Check feedback is correct
        var expected = "Hardened derivation path is invalid with xpub key";
        var actual = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (actual != expected) {
            console.log("xpub key with hardened derivation path does not show feedback");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        // Check no addresses are shown
        var expected = 0;
        var actual = page.evaluate(function() {
            return $(".addresses tr").length;
        });
        if (actual != expected) {
            console.log("addresses still show after setting xpub key with hardened derivation path");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// github issue 39
// no root key shows feedback
function() {
page.open(url, function(status) {
    // click the bip32 tab on fresh page
    page.evaluate(function() {
        $("#bip32-tab a").click();
    });
    waitForFeedback(function() {
        // Check feedback is correct
        var expected = "No root key";
        var actual = page.evaluate(function() {
            return $(".feedback").text();
        });
        if (actual != expected) {
            console.log("Blank root key not detected");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Github issue 44
// display error switching tabs while addresses are generating
function() {
page.open(url, function(status) {
    // set the phrase
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // set to generate 500 more addresses
        // generate more addresses
        // change tabs which should cancel the previous generating
        page.evaluate(function() {
            $(".rows-to-add").val("100");
            $(".more").click();
            $("#bip32-tab a").click();
        });
        // check the derivation paths are in order and of the right quantity
        waitForGenerate(function() {
            var paths = page.evaluate(function() {
                return $(".index").map(function(i, e) {
                    return $(e).text();
                });
            });
            for (var i=0; i<paths.length; i++) {
                var expected = "m/0/" + i;
                var actual = paths[i];
                if (actual != expected) {
                    console.log("Path " + i + " is not in correct order");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
            }
            if (paths.length != 20) {
                console.log("Generation was not cancelled by new action");
                fail();
            }
            next();
        });
    });
});
},

// Github issue 49
// padding for binary should give length with multiple of 256
// hashed entropy 1111 is length 252, so requires 4 leading zeros
// prior to issue 49 it would only generate 2 leading zeros, ie missing 2
function() {
page.open(url, function(status) {
    expected = "avocado valid quantum cross link predict excuse edit street able flame large galaxy ginger nuclear"
    // use entropy
    page.evaluate(function() {
        $(".use-entropy").prop("checked", true).trigger("change");
        $(".mnemonic-length").val("15");
        $(".entropy").val("1111").trigger("input");
    });
    waitForGenerate(function() {
        // get the mnemonic
        var actual = page.evaluate(function() {
            return $(".phrase").val();
        });
        // check the mnemonic is correct
        if (actual != expected) {
            console.log("Left padding error for entropy");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// Github pull request 55
// https://github.com/iancoleman/bip39/pull/55
// Client select
function() {
page.open(url, function(status) {
    // set mnemonic and select bip32 tab
    page.evaluate(function() {
        $("#bip32-tab a").click();
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // BITCOIN CORE
        // set bip32 client to bitcoin core
        page.evaluate(function() {
            var bitcoinCoreIndex = "0";
            $("#bip32-client").val(bitcoinCoreIndex).trigger("change");
        });
        waitForGenerate(function() {
            // get the derivation path
            var actual = page.evaluate(function() {
                return $("#bip32-path").val();
            });
            // check the derivation path is correct
            expected = "m/0'/0'"
            if (actual != expected) {
                console.log("Selecting Bitcoin Core client does not set correct derivation path");
                console.log("Expected: " + expected);
                console.log("Actual: " + actual);
                fail();
            }
            // get hardened addresses
            var usesHardenedAddresses = page.evaluate(function() {
                return $(".hardened-addresses").prop("checked");
            });
            // check hardened addresses is selected
            if(!usesHardenedAddresses) {
                console.log("Selecting Bitcoin Core client does not use hardened addresses");
                fail();
            }
            // check input is readonly
            var pathIsReadonly = page.evaluate(function() {
                return $("#bip32-path").prop("readonly");
            });
            if (!pathIsReadonly) {
                console.log("Selecting Bitcoin Core client does not set derivation path to readonly");
                fail();
            }
            // MULTIBIT
            // set bip32 client to multibit
            page.evaluate(function() {
                var multibitIndex = "2";
                $("#bip32-client").val(multibitIndex).trigger("change");
            });
            waitForGenerate(function() {
                // get the derivation path
                var actual = page.evaluate(function() {
                    return $("#bip32-path").val();
                });
                // check the derivation path is correct
                expected = "m/0'/0"
                if (actual != expected) {
                    console.log("Selecting Multibit client does not set correct derivation path");
                    console.log("Expected: " + expected);
                    console.log("Actual: " + actual);
                    fail();
                }
                // get hardened addresses
                var usesHardenedAddresses = page.evaluate(function() {
                    return $(".hardened-addresses").prop("checked");
                });
                // check hardened addresses is selected
                if(usesHardenedAddresses) {
                    console.log("Selecting Multibit client does not uncheck hardened addresses");
                    fail();
                }
                // CUSTOM DERIVATION PATH
                // check input is not readonly
                page.evaluate(function() {
                    $("#bip32-client").val("custom").trigger("change");
                });
                // do not wait for generate, since there is no change to the
                // derivation path there is no new generation performed
                var pathIsReadonly = page.evaluate(function() {
                    return $("#bip32-path").prop("readonly");
                });
                if (pathIsReadonly) {
                    console.log("Selecting Custom Derivation Path does not allow derivation path input");
                    fail();
                }
                next();
            });
        });
    });
});
},

// github issue 58
// https://github.com/iancoleman/bip39/issues/58
// bip32 derivation is correct, does not drop leading zeros
// see also
// https://medium.com/@alexberegszaszi/why-do-my-bip32-wallets-disagree-6f3254cc5846
function() {
page.open(url, function(status) {
    // set the phrase and passphrase
    var expected = "17rxURoF96VhmkcEGCj5LNQkmN9HVhWb7F";
    // Note that bitcore generates an incorrect address
    // 13EuKhffWkBE2KUwcbkbELZb1MpzbimJ3Y
    // see the medium.com link above for more details
    page.evaluate(function() {
        $(".phrase").val("fruit wave dwarf banana earth journey tattoo true farm silk olive fence");
        $(".passphrase").val("banana").trigger("input");
    });
    // check the address is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("BIP32 derivation is incorrect");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},


// github issue 60
// Japanese mnemonics generate incorrect bip32 seed
// BIP39 seed is set from phrase
function() {
page.open(url, function(status) {
    // set the phrase
    var expected = "a262d6fb6122ecf45be09c50492b31f92e9beb7d9a845987a02cefda57a15f9c467a17872029a9e92299b5cbdf306e3a0ee620245cbd508959b6cb7ca637bd55";
    page.evaluate(function() {
        $(".phrase").val("あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あおぞら");
        $("#passphrase").val("メートルガバヴァぱばぐゞちぢ十人十色");
        $("#passphrase").trigger("input");
    });
    // check the seed is generated correctly
    waitForGenerate(function() {
        var actual = page.evaluate(function() {
            return $(".seed").val();
        });
        if (actual != expected) {
            console.log("BIP39 seed is incorrectly generated from Japanese mnemonic");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        next();
    });
});
},

// If you wish to add more tests, do so here...

// Here is a blank test template
/*

function() {
page.open(url, function(status) {
    // Do something on the page
    page.evaluate(function() {
        $(".phrase").val("abandon abandon ability").trigger("input");
    });
    waitForGenerate(function() {
        // Check the result of doing the thing
        var expected = "1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug";
        var actual = page.evaluate(function() {
            return $(".address:first").text();
        });
        if (actual != expected) {
            console.log("A specific message about what failed");
            console.log("Expected: " + expected);
            console.log("Actual: " + actual);
            fail();
        }
        // Run the next test
        next();
    });
});
},

*/

];

console.log("Running tests...");
tests = shuffle(tests);
next();
