// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests.js
//
// Dependencies:
// nodejs
// selenium
// jasmine
// see https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Headless_mode#Automated_testing_with_headless_mode

// USER SPECIFIED OPTIONS
var browser = process.env.BROWSER; //"firefox"; // or "chrome"
if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/tests.js");
    console.log("Options for BROWSER are firefox chrome");
    console.log("Using default browser: chrome");
    browser = "chrome";
}
else {
    console.log("Using browser: " + browser);
}

// Globals

var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
var newDriver = null;
var driver = null;
// Delays in ms
var generateDelay = 1500;
var feedbackDelay = 500;
var entropyFeedbackDelay = 500;
var bip38delay = 15000;

// url uses file:// scheme
var path = require('path')
var parentDir = path.resolve(process.cwd(), '..', 'src', 'index.html');
var url = "file://" + parentDir;
if (browser == "firefox") {
    // TODO loading local html in firefox is broken
    console.log("Loading local html in firefox is broken, see https://stackoverflow.com/q/46367054");
    console.log("You must run a server in this case, ie do this:");
    console.log("$ cd /path/to/bip39/src");
    console.log("$ python -m http.server");
    url = "http://localhost:8000";
}

// Variables dependent on specific browser selection

if (browser == "firefox") {
    var firefox = require('selenium-webdriver/firefox');
    var binary = new firefox.Binary(firefox.Channel.NIGHTLY);
    binary.addArguments("-headless");
    newDriver = function() {
        return new webdriver.Builder()
              .forBrowser('firefox')
              .setFirefoxOptions(new firefox.Options().setBinary(binary))
              .build();
    }
}
else if (browser == "chrome") {
    var chrome = require('selenium-webdriver/chrome');
    newDriver = function() {
        return new webdriver.Builder()
          .forBrowser('chrome')
          .setChromeOptions(new chrome.Options().addArguments("headless"))
          .build();
    }
}

// Helper functions

function testNetwork(done, params) {
    var phrase = params.phrase || 'abandon abandon ability';
    driver.findElement(By.css('.phrase'))
        .sendKeys(phrase);
    selectNetwork(params.selectText);
    driver.sleep(generateDelay).then(function() {
            getFirstAddress(function(address) {
                getFirstPublicKey(function(pubkey) {
                    getFirstPrivateKey(function(privkey) {
                        if ("firstAddress" in params) {
                            expect(address).toBe(params.firstAddress);
                        }
                        if ("firstPubKey" in params) {
                            expect(pubkey).toBe(params.firstPubKey);
                        }
                        if ("firstPrivKey" in params) {
                            expect(privkey).toBe(params.firstPrivKey);
                        }
                        done();
                    });
                });
            });
    });
}

function getFirstRowValue(handler, selector) {
    driver.findElements(By.css(selector))
        .then(function(els) {
            els[0].getText()
                .then(handler);
        })
}

function getFirstAddress(handler) {
    getFirstRowValue(handler, ".address");
}

function getFirstPublicKey(handler) {
    getFirstRowValue(handler, ".pubkey");
}

function getFirstPrivateKey(handler) {
    getFirstRowValue(handler, ".privkey");
}

function getFirstPath(handler) {
    getFirstRowValue(handler, ".index");
}

function testColumnValuesAreInvisible(done, columnClassName) {
    var selector = "." + columnClassName + " span";
    driver.findElements(By.css(selector))
        .then(function(els) {
            els[0].getAttribute("class")
                .then(function(classes) {
                    expect(classes).toContain("invisible");
                    done();
                });
        })
}

function testRowsAreInCorrectOrder(done) {
    driver.findElements(By.css('.index'))
        .then(function(els) {
            var testRowAtIndex = function(i) {
                if (i >= els.length) {
                    done();
                }
                else {
                    els[i].getText()
                        .then(function(actualPath) {
                            var noHardened = actualPath.replace(/'/g, "");
                            var pathBits = noHardened.split("/")
                            var lastBit = pathBits[pathBits.length-1];
                            var actualIndex = parseInt(lastBit);
                            expect(actualIndex).toBe(i);
                            testRowAtIndex(i+1);
                        });
                }
            }
            testRowAtIndex(0);
        });
}

function selectNetwork(name) {
    driver.executeScript(function() {
        var selectText = arguments[0];
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function(i,e) {
            return $(e).html() == selectText;
        }).prop("selected", true);
        $(".network").trigger("change");
    }, name);
}

function selectBip85Language(language) {
    driver.executeScript(function() {
        var selectText = arguments[0];
        $(".bip85-mnemonic-language option[selected]").removeAttr("selected");
        $(".bip85-mnemonic-language option").filter(function(i,e) {
            return $(e).html() == selectText;
        }).prop("selected", true);
        $(".bip85-mnemonic-language").trigger("change");
    }, language);
}

function testEntropyType(done, entropyText, entropyTypeUnsafe) {
    // entropy type is compiled into regexp so needs escaping
    // see https://stackoverflow.com/a/2593661
    var entropyType = (entropyTypeUnsafe+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Entropy Type\\s+" + entropyType);
                expect(text).toMatch(re);
                done();
            });
    });
}

function testEntropyBits(done, entropyText, entropyBits) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Total Bits\\s+" + entropyBits);
                expect(text).toMatch(re);
                done();
            });
    });
}

function testEntropyFeedback(done, entropyDetail) {
    // entropy type is compiled into regexp so needs escaping
    // see https://stackoverflow.com/a/2593661
    if ("type" in entropyDetail) {
        entropyDetail.type = (entropyDetail.type+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    }
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyDetail.entropy);
    driver.sleep(entropyFeedbackDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                driver.findElement(By.css('.phrase'))
                    .getAttribute("value")
                    .then(function(phrase) {
                        if ("filtered" in entropyDetail) {
                            var key = "Filtered Entropy";
                            var value = entropyDetail.filtered;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("type" in entropyDetail) {
                            var key = "Entropy Type";
                            var value = entropyDetail.type;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("events" in entropyDetail) {
                            var key = "Event Count";
                            var value = entropyDetail.events;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("bits" in entropyDetail) {
                            var key = "Total Bits";
                            var value = entropyDetail.bits;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("bitsPerEvent" in entropyDetail) {
                            var key = "Bits Per Event";
                            var value = entropyDetail.bitsPerEvent;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("words" in entropyDetail) {
                            var actualWords = phrase.split(/\s+/)
                                .filter(function(w) { return w.length > 0 })
                                .length;
                            expect(actualWords).toBe(entropyDetail.words);
                        }
                        if ("strength" in entropyDetail) {
                            var key = "Time To Crack";
                            var value = entropyDetail.strength;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        done();
                    });
            });
    });
}

function testClientSelect(done, params) {
    // set mnemonic and select bip32 tab
    driver.findElement(By.css('#bip32-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // BITCOIN CORE
        // set bip32 client to bitcoin core
        driver.executeScript(function() {
            $("#bip32-client").val(arguments[0]).trigger("change");
        }, params.selectValue);
        driver.sleep(generateDelay).then(function() {
            // check the derivation path is correct
            driver.findElement(By.css("#bip32-path"))
                .getAttribute("value")
                .then(function(path) {
                expect(path).toBe(params.bip32path);
                // check hardened addresses is selected
                driver.findElement(By.css(".hardened-addresses"))
                    .getAttribute("checked")
                    .then(function(isChecked) {
                        expect(isChecked).toBe(params.useHardenedAddresses);
                        // check input is readonly
                        driver.findElement(By.css("#bip32-path"))
                            .getAttribute("readonly")
                            .then(function(isReadonly) {
                                expect(isReadonly).toBe("true");
                                done();
                            });
                    });
            });
        });
    });
}

// Tests

describe('BIP39 Tool Tests', function() {

    beforeEach(function(done) {
        driver = newDriver();
        driver.get(url).then(done);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(function(done) {
        driver.quit().then(done);
    });

// BEGIN TESTS

// Page initially loads with blank phrase
it('Should load the page', function(done) {
    driver.findElement(By.css('.phrase'))
        .getAttribute('value').then(function(value) {
            expect(value).toBe('');
            done();
        });
});

// Page has text
it('Should have text on the page', function(done) {
    driver.findElement(By.css('body'))
        .getText()
        .then(function(text) {
            var textToFind = "You can enter an existing BIP39 mnemonic";
            expect(text).toContain(textToFind);
            done();
        });
});

// Entering mnemonic generates addresses
it('Should have a list of addresses', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('.address'))
            .then(function(els) {
                expect(els.length).toBe(20);
                done();
            })
    });
});

// Generate button generates random mnemonic
it('Should be able to generate a random mnemonic', function(done) {
    // initial phrase is blank
    driver.findElement(By.css('.phrase'))
        .getAttribute("value")
        .then(function(phrase) {
            expect(phrase.length).toBe(0);
            // press generate
            driver.findElement(By.css('.generate')).click();
            driver.sleep(generateDelay).then(function() {
                // new phrase is not blank
                driver.findElement(By.css('.phrase'))
                    .getAttribute("value")
                    .then(function(phrase) {
                        expect(phrase.length).toBeGreaterThan(0);
                        done();
                    });
            });
        });
});

// Mnemonic length can be customized
it('Should allow custom length mnemonics', function(done) {
    // set strength to 6
    driver.executeScript(function() {
        $(".strength option[selected]").removeAttr("selected");
        $(".strength option[value=6]").prop("selected", true);
    });
    driver.findElement(By.css('.generate')).click();
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.phrase'))
            .getAttribute("value")
            .then(function(phrase) {
                var words = phrase.split(" ");
                expect(words.length).toBe(6);
                done();
            });
    });
});

// Passphrase can be set
it('Allows a passphrase to be set', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.findElement(By.css('.passphrase'))
        .sendKeys('secure_passphrase');
    driver.sleep(generateDelay).then(function() {
      getFirstAddress(function(address) {
          expect(address).toBe("15pJzUWPGzR7avffV9nY5by4PSgSKG9rba");
          done();
      })
  });
});

// Network can be set to networks other than bitcoin
it('Allows selection of bitcoin testnet', function(done) {
    var params = {
        selectText: "BTC - Bitcoin Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "mucaU5iiDaJDb69BHLeDv8JFfGiyg2nJKi",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cV3coiYD2NhHKfhC6Gb8DzpvPzcGYYExYxuNxpUtKq3VUJrkFLZx",
    };
    testNetwork(done, params);
});
it('Allows selection of bitcoin regtest', function(done) {
    var params = {
        selectText: "BTC - Bitcoin RegTest",
        phrase: "abandon abandon ability",
        firstAddress: "mucaU5iiDaJDb69BHLeDv8JFfGiyg2nJKi",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cV3coiYD2NhHKfhC6Gb8DzpvPzcGYYExYxuNxpUtKq3VUJrkFLZx",
    };
    testNetwork(done, params);
});
it('Allows selection of litecoin', function(done) {
    var params = {
        selectText: "LTC - Litecoin",
        phrase: "abandon abandon ability",
        firstAddress: "LQ4XU8RX2ULPmPq9FcUHdVmPVchP9nwXdn",
        firstPubKey: "028e27f074a8f4b85c07f944330bd59ec1b2dd7f88bb28182720cab6d2a5a5ff30",
        firstPrivKey: "T9ShR6Z2vyEMHVgpeoif857LdMUZDKvzux3QMvD4EjpPYUV5TuEx",
    };
    testNetwork(done, params);
});
it('Allows selection of litecoin testnet', function(done) {
    var params = {
        selectText: "LTCt - Litecoin Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "mucaU5iiDaJDb69BHLeDv8JFfGiyg2nJKi",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cV3coiYD2NhHKfhC6Gb8DzpvPzcGYYExYxuNxpUtKq3VUJrkFLZx",
    };
    testNetwork(done, params);
});
it('Allows selection of ripple', function(done) {
    var params = {
        selectText: "XRP - Ripple",
        phrase: "ill clump only blind unit burden thing track silver cloth review awake useful craft whale all satisfy else trophy sunset walk vanish hope valve",
        firstAddress: "rLTFnqbmCVPGx6VfaygdtuKWJgcN4v1zRS",
        firstPubKey: "0393ebfc2f75dd5757456a7ff7b907571693c9e3807ea386be68688b9c5fac072e",
        firstPrivKey: "a869f16215c3cd7b6c5f448344bc8688cba70b734bbe189b2c48098a2c15dd53",
    };
    testNetwork(done, params);
});
it('Allows selection of jingtum', function(done) {
    var params = {
        selectText: "SWTC - Jingtum",
        phrase: "ill clump only blind unit burden thing track silver cloth review awake useful craft whale all satisfy else trophy sunset walk vanish hope valve",
        firstAddress: "jffSYWyxcr9t6DHHdAj2yUXrCsioU66xjm",
        firstPubKey: "029dfcb278148874dd7e7109001593d7f410909e7bbcbcc3cc19ecb476c8bf8d84",
        firstPrivKey: "02bdfe14bdd75514e714db7b8cbbae87b2ab8d7a050c3e441d687b7c4ef17d1f",
    };
    testNetwork(done, params);
});
it('Allows selection of casinocoin', function(done) {
    var params = {
        selectText: "CSC - CasinoCoin",
        phrase: "ill clump only blind unit burden thing track silver cloth review awake useful craft whale all satisfy else trophy sunset walk vanish hope valve",
        firstAddress: "c3P5EUb27Pzk9dcGt4s7zQDQj4sC6Y81mT",
        firstPubKey: "038ca5b4ff9d58059423b5a03deb2a9b755a311e97dc36ae8ab3d4ed93c808daf7",
        firstPrivKey: "127fa93d8e4f434ce76faebc961df7ec081a68de19e96f36d38766e468b35920",
    };
    testNetwork(done, params);
});
it('Allows selection of dogecoin', function(done) {
    var params = {
        selectText: "DOGE - Dogecoin",
        phrase: "abandon abandon ability",
        firstAddress: "DPQH2AtuzkVSG6ovjKk4jbUmZ6iXLpgbJA",
        firstPubKey: "02d3d540cc62d5102887d26f2b129947f2bd2306dd9b76242c61ca65e5ca408899",
        firstPrivKey: "QNv5TAoR6EodkN86FXaLDosy4Rau4sJ46JxE9NtUYtmKPLTuRmpc",
    };
    testNetwork(done, params);
});
it('Allows selection of dogecoin testnet', function(done) {
    var params = {
        selectText: "DOGEt - Dogecoin Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "niHnSJKHdwDyDxRMLBJrtNqpvHEsAFWe6B",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cnCsx3G1NgXZGhijCRNupM1tts1aDNnQsr9e5jB5JnYv2yEDTwT5",
    };
    testNetwork(done, params);
});
it('Allows selection of denarius', function(done) {
    var params = {
        selectText: "DNR - Denarius",
        phrase: "abandon abandon ability",
        firstAddress: "DFdFMVUMzU9xX88EywXvAGwjiwpxyh9vKb",
        firstPubKey: "0285cda45afbf0b8897a5cedf97cbb1e2b63b0ac28cd1e919ea60fb748bc61e8d5",
        firstPrivKey: "QX3Dy3b7C3vNWYDBPk8Hewp3ii2NukAopsHFCCsLZ6Ss77vzdoMj",
    };
    testNetwork(done, params);
});
it('Allows selection of shadowcash', function(done) {
    var params = {
        selectText: "SDC - ShadowCash",
        phrase: "abandon abandon ability",
        firstAddress: "SiSZtfYAXEFvMm3XM8hmtkGDyViRwErtCG",
        firstPubKey: "024d48659b83ff20fc250e7f111742e652aa71b73f3ff8d41b5f3ea99cb8ef9e3c",
        firstPrivKey: "VJzJ98j5pdjzpY9DVRvU2RiRcvQ4t2oYYd9w9WUdiUJjvPs9X83v",
    };
    testNetwork(done, params);
});
it('Allows selection of shadowcash testnet', function(done) {
    var params = {
        selectText: "SDC - ShadowCash Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "tM2EDpVKaTiEg2NZg3yKg8eqjLr55BErHe",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "erKhxJJbpqMUuwuUwUuQxnLiNwphuEabA2sTv62QBV6syc1coTeS",
    };
    testNetwork(done, params);
});
it('Allows selection of viacoin', function(done) {
    var params = {
        selectText: "VIA - Viacoin",
        phrase: "abandon abandon ability",
        firstAddress: "Vq9Eq4N5SQnjqZvxtxzo7hZPW5XnyJsmXT",
        firstPubKey: "0223abcae630e23afd7ce0dc399906ca00f984b3be475fbf3f3995e708b0b75392",
        firstPrivKey: "WX5sbp26uyFDa4Bt5DgPqvQuRjrwc95DYzG7ZHXsdtooFAUhd3xV",
    };
    testNetwork(done, params);
});
it('Allows selection of viacoin testnet', function(done) {
    var params = {
        selectText: "VIA - Viacoin Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "tM2EDpVKaTiEg2NZg3yKg8eqjLr55BErHe",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "erKhxJJbpqMUuwuUwUuQxnLiNwphuEabA2sTv62QBV6syc1coTeS",
    };
    testNetwork(done, params);
});
it('Allows selection of jumbucks', function(done) {
    var params = {
        selectText: "JBS - Jumbucks",
        phrase: "abandon abandon ability",
        firstAddress: "JLEXccwDXADK4RxBPkRez7mqsHVoJBEUew",
        firstPubKey: "02e9e84c68e2247d87c863f5697676af9c0f2dacc3fe774a24188f37311b679059",
        firstPrivKey: "SPcmbuyWp5ukQLbnDyaVr8WuPfmLUEVZN9e2r7X96i31twrn8BBQ",
    };
    testNetwork(done, params);
});
it('Allows selection of clam', function(done) {
    var params = {
        selectText: "CLAM - Clams",
        phrase: "abandon abandon ability",
        firstAddress: "xCp4sakjVx4pUAZ6cBCtuin8Ddb6U1sk9y",
        firstPubKey: "03f6189ef4ae7f15ead1a579201c63845cf3efc4745d6abf58aa5584163b2dd070",
        firstPrivKey: "LoqdpeyYzFoGqQag6Ya4BkMT9KQJK1ygQFbKj3x2meaWe6Xzen15",
    };
    testNetwork(done, params);
});
it('Allows selection of crown', function(done) {
    var params = {
        selectText: "CRW - Crown (Legacy)",
        phrase: "abandon abandon ability",
        firstAddress: "18pWSwSUAQdiwMHUfFZB1fM2xue9X1FqE5",
        firstPubKey: "034246d561c53eb1a2afbd9df6403d6fd8a70b36016e0307eae28095a465eaa602",
        firstPrivKey: "L2oSEFimb9QJB38eGD1xL8zKZAa1cTYGFGXMi4yJBqKmYvpjcuJs",
    };
    testNetwork(done, params);
});
it('Allows selection of crown', function(done) {
    var params = {
        selectText: "CRW - Crown",
        phrase: "abandon abandon ability",
        firstAddress: "CRWKnVmVhvH1KWTYe6sq8xV4dFGcFpBEEkPQ",
        firstPubKey: "034246d561c53eb1a2afbd9df6403d6fd8a70b36016e0307eae28095a465eaa602",
        firstPrivKey: "L2oSEFimb9QJB38eGD1xL8zKZAa1cTYGFGXMi4yJBqKmYvpjcuJs",
    };
    testNetwork(done, params);
});
it('Allows selection of dash', function(done) {
    var params = {
        selectText: "DASH - Dash",
        phrase: "abandon abandon ability",
        firstAddress: "XdbhtMuGsPSkE6bPdNTHoFSszQKmK4S5LT",
        firstPubKey: "0270009f37337f15603103ce90111f32f44ddd87525017a93ec6170abb784be2ff",
        firstPrivKey: "XGqEiiVo1w6Us3YN8KRthyLxdnBH1W6JpLkcxoX2w2zQMYFDKSua",
    };
    testNetwork(done, params);
});
it('Allows selection of dash testnet', function(done) {
    var params = {
        selectText: "DASH - Dash Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "yaR52EN4oojdJfBgzWJTymC4uuCLPT29Gw",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cV3coiYD2NhHKfhC6Gb8DzpvPzcGYYExYxuNxpUtKq3VUJrkFLZx",
    };
    testNetwork(done, params);
});
it('Allows selection of game', function(done) {
    var params = {
        selectText: "GAME - GameCredits",
        phrase: "abandon abandon ability",
        firstAddress: "GSMY9bAp36cMR4zyT4uGVS7GFjpdXbao5Q",
        firstPubKey: "03d173ea00b6688f7d7c2afdcbc720b227aa8b9b87e5f7145139acaa9f0a0dc447",
        firstPrivKey: "Raixm9wAKFjw9rnPKcXkymQ5iEdMZBRdrvjm8zLpqacS7LUeXBwZ",
    };
    testNetwork(done, params);
});
it('Allows selection of komodo', function(done) {
    var params = {
        selectText: "KMD - Komodo",
        phrase: "abandon abandon ability",
        firstAddress: "RMPPzJwAjPVZZAwJvXivHJGGjdCx6WBD2t",
        firstPubKey: "03bd652582a446ce9a697e74da9429eabe6e70bbe3d300b9ef227df7430e83b6fc",
        firstPrivKey: "UxHzU8KCfSDrQgreujv1vGrqpbvx5jrjSz7bNWjWoT7D3V4uWo4i",
    };
    testNetwork(done, params);
});
it('Allows selection of namecoin', function(done) {
    var params = {
        selectText: "NMC - Namecoin",
        phrase: "abandon abandon ability",
        firstAddress: "Mw2vK2Bvex1yYtYF6sfbEg2YGoUc98YUD2",
        firstPubKey: "0398066486fe87cbcb9da8e29d180b44937b6c43ad1ec4d3bddd77b7905765937e",
        firstPrivKey: "TkJvbqVdNnGsCtFaV2nE8x3qqhYnYriRkGAB4747cEDRg9VUKKiz",
    };
    testNetwork(done, params);
});
it('Allows selection of onixcoin', function(done) {
    var params = {
        selectText: "ONX - Onixcoin",
        phrase: "abandon abandon ability",
        firstAddress: "XGwMqddeKjT3ddgX73QokjVbCL3aK6Yxfk",
        firstPubKey: "035349f2912e3290898d6e00807704254f256127e59a2930367c403b3b9ae5afbd",
        firstPrivKey: "X8hzuyWvi2F6UQQ5MNiQo2taYwKwZvJRurTBV6smahx2ikLksLPm",
    };
    testNetwork(done, params);
});
it('Allows selection of lkrcoin', function(done) {
    var params = {
        selectText: "LKR - Lkrcoin",
        phrase: "abandon abandon ability",
        firstAddress: "LfbT296e7AEEnn4bYDbL535Nd8P9g98CdJ",
        firstPubKey: "03328d3800456372224ec54b033ace88bfd4c19a684204147404063839a02ab7e8",
        firstPrivKey: "TANp1xRA3qCdRfZc8THM8HMKZivevNz8BEXmA8YxemqXj1YzHmDS",
    };
    testNetwork(done, params);
});
it('Allows selection of bolivarcoin', function(done) {
    var params = {
        selectText: "BOLI - Bolivarcoin",
        phrase: "abandon abandon ability",
        firstAddress: "bbKzCAUR7hZ3nqfffy7VgrSz8LmAP3S5mK",
        firstPubKey: "0328a72574c709cc183ffccb8f17c0383caf937ce67e7c3411cdf8ca2e5fc2bf8f",
        firstPrivKey: "YYwA99QgwZu9zNJBxYbG43GzeE8kEREb7S1dpnFcBJG1W5sR1W9T",
    };
    testNetwork(done, params);
});
it('Allows selection of peercoin', function(done) {
    var params = {
        selectText: "PPC - Peercoin",
        phrase: "abandon abandon ability",
        firstAddress: "PVAiioTaK2eDHSEo3tppT9AVdBYqxRTBAm",
        firstPubKey: "02035b1d7f7683a03be1a6009c4572b24a3ba114afb8caff278881af77c4cba362",
        firstPrivKey: "UCcQgeBjh7GpqukSRcXrx54Q41BJYkWY6PSdm6CtCUFYD5bS9qZS",
    };
    testNetwork(done, params);
});
it('Allows selection of ethereum', function(done) {
    var params = {
        selectText: "ETH - Ethereum",
        phrase: "abandon abandon ability",
        firstAddress: "0xe5815d5902Ad612d49283DEdEc02100Bd44C2772",
        firstPubKey: "0x03e723e5b3aa7d72213f01139aa4783e1b34f74e1a04534e3fd8e29bfe2768af8a",
        firstPrivKey: "0x8f253078b73d7498302bb78c171b23ce7a8fb511987d2b2702b731638a4a15e7",
    };
    testNetwork(done, params);
});
it('Allows selection of slimcoin', function(done) {
    var params = {
        selectText: "SLM - Slimcoin",
        phrase: "abandon abandon ability",
        firstAddress: "SNzPi1CafHFm3WWjRo43aMgiaEEj3ogjww",
        firstPubKey: "020c3ab49a6de010d23ddf14dec67666d7ad46dafbae9841db7723bbb0044067cc",
        firstPrivKey: "BTPTMvgoTgsAxpoQE4VCJAq5TYMnLbX5mDodFSaF7ceq6suK13pk",
    };
    testNetwork(done, params);
});
it('Allows selection of slimcoin testnet', function(done) {
    var params = {
        selectText: "SLM - Slimcoin Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "n3nMgWufTek5QQAr6uwMhg5xbzj8xqc4Dq",
        firstPubKey: "024557a9693da0354c5f77e57a0b2aac9c20b15cc322bec85faa2ec45438415c90",
        firstPrivKey: "DvJeEkHzJzysYFtUdgETgWHprG63ATFWRtG2R9xfBJ6bZ2fHcJSU",
    };
    testNetwork(done, params);
});
it('Allows selection of bitcoin cash', function(done) {
    var params = {
        selectText: "BCH - Bitcoin Cash",
        phrase: "abandon abandon ability",
        firstAddress: "bitcoincash:qzlquk7w4hkudxypl4fgv8x279r754dkvur7jpcsps",
        firstPubKey: "02b1cbe8aba996d77d4c33fa2e3bf1f6ae80576aa587aa74d87092b1dbdf2aa067",
        firstPrivKey: "KxbCheZjSzF48zyka4QK1ToSYmz3REZiePU6FPc99qqFs8WuHyVY",
    };
    testNetwork(done, params);
});

it('Allows selection of simpleledger(SLP)', function(done) {
    var params = {
        selectText: "SLP - Simple Ledger Protocol",
        phrase: "abandon abandon ability",
        firstAddress: "simpleledger:qrtffz6ajfsn74gpur7y3epjquz42pvww5acewqmre",
        firstPubKey: "03c8310ef78a379ce91ed3d7998e1f356dbcb089869f9c9d8f8571b0d8414acbdc",
        firstPrivKey: "L2q3Bvqe6kBRSqUaJpew7pLacnWjsJdUk7hwV1bTdDu665gXHDj6",
    };
    testNetwork(done, params);
});

it('Allows selection of myriadcoin', function(done) {
    var params = {
        selectText: "XMY - Myriadcoin",
        phrase: "abandon abandon ability",
        firstAddress: "MJEswvRR46wh9BoiVj9DzKYMBkCramhoBV",
        firstPubKey: "037ad798b3173b0af46acddd1501ed53ce654840f29e4710c3081134b1193f811b",
        firstPrivKey: "TMMUiQ3yqes7wjWvCro1Ghbu7eFXm8wQgX89v4Wgxm5qFZJAVEVD",
    };
    testNetwork(done, params);
});
it('Allows selection of pivx', function(done) {
    var params = {
        selectText: "PIVX - PIVX",
        phrase: "abandon abandon ability",
        firstAddress: "DBxgT7faCuno7jmtKuu6KWCiwqsVPqh1tS",
        firstPubKey: "022583478df6a5ac35380e7cdcd9f7ab0d43f5eb82452d4aa1f74f04c810fcde8c",
        firstPrivKey: "YVdYDdkuTbra4EVRLWoBUCCm9WMLuXZy3ZpK6iDBCi13ttreZ4cD",
    };
    testNetwork(done, params);
});
it('Allows selection of pivx testnet', function(done) {
    var params = {
        selectText: "PIVX - PIVX Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "yB5U384n6dGkVE3by5y9VdvHHPwPg68fQj",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cV3coiYD2NhHKfhC6Gb8DzpvPzcGYYExYxuNxpUtKq3VUJrkFLZx",
    };
    testNetwork(done, params);
});
it('Allows selection of maza', function(done) {
    var params = {
        selectText: "MAZA - Maza",
        phrase: "abandon abandon ability",
        firstAddress: "MGW4Bmi2NEm4PxSjgeFwhP9vg18JHoRnfw",
        firstPubKey: "022b9d4376588a736d43301a659ef288302472aeff6344f5d8a5bfe376733e0da8",
        firstPrivKey: "aH9R7KaHm6D3p44zDM2Vf6vY9x7bHVdaZGkBb2rHeXAZzEKnQ66G",
    };
    testNetwork(done, params);
});
it('Allows selection of FIX', function(done) {
    var params = {
        selectText: "FIX - FIX",
        phrase: "abandon abandon ability",
        firstAddress: "FS5MEU8fs5dUvsaSCSusV8RQtC8j2h3JEh",
        firstPubKey: "026003e9a2bc6b9bd18bd7f8826cebbfd4d0554995141920eda2cb723ae53337ee",
        firstPrivKey: "9uFsoZFuCUCMRF93aNKsLvYTX8jwYoKPbgENtdYURH1GCJvDNkps",
    };
    testNetwork(done, params);
});
it('Allows selection of FIX testnet', function(done) {
    var params = {
        selectText: "FIX - FIX Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "XpnU1HHdNG5YxvG9Rez4wjmidchxqnZaNa",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cBtMfPpQg4s1Ndfez7oLdedwu8CxshhWE5f7qunhLsY4ueNvKKyM",
    };
    testNetwork(done, params);
});
it('Allows selection of fujicoin', function(done) {
    var params = {
        selectText: "FJC - Fujicoin",
        phrase: "abandon abandon ability",
        firstAddress: "FgiaLpG7C99DyR4WnPxXedRVHXSfKzUDhF",
        firstPubKey: "022b41c7ecbae94c0c926dda9304ccf6e6b22f6f6879e2fc52823b154d118a290e",
        firstPrivKey: "RMFbyVXUF5Ndji4H75jXrnXi9KH6QFKgA6zDfuisa57BrHCN8MSG",
    };
    testNetwork(done, params);
});
it('Allows selection of nubits', function(done) {
    var params = {
        selectText: "USNBT - NuBits",
        phrase: "abandon abandon ability",
        firstAddress: "BLxkabXuZSJSdesLD7KxZdqovd4YwyBTU6",
        firstPubKey: "03a37da71e839af0e3fc7cef0f3a82fbff64e372eb7fd067dc452d13b7b269e858",
        firstPrivKey: "PJ9vZVjQWXNQDbfZbmFiDTcUGpJHiWc923LcX7oKSYHuLRvWhdJ3",
    };
    testNetwork(done, params);
});
it('Allows selection of bitcoin gold', function(done) {
    var params = {
        selectText: "BTG - Bitcoin Gold",
        phrase: "abandon abandon ability",
        firstAddress: "GdDqug4WUsn5syNbSTHatNn4XnuwZtzedx",
        firstPubKey: "02e48e4053db573bb74fb67a47c91443ec7c0ed5f3f25aa8a408bad798f0230086",
        firstPrivKey: "KwxCxhXq72JzuDNEj2VzzjKr1XU4tvpuksdEKBhngFuSEK8XWCBa",
    };
    testNetwork(done, params);
});
it('Allows selection of monacoin', function(done) {
    var params = {
        selectText: "MONA - Monacoin",
        phrase: "abandon abandon ability",
        firstAddress: "MKMiMr7MyjDKjJbCBzgF6u4ByqTS4NkRB1",
        firstPubKey: "020b104320aaeb1ec921874e96cafd5add3c0de8d785cd01dc93e5f2b31fa352f4",
        firstPrivKey: "T45jYrkbSutUvNF1cytpmbvyLR7qWWEXg5r7udj4mqrauzEsxHAG",
    };
    testNetwork(done, params);
});
it('Allows selection of AXE', function(done) {
    var params = {
        selectText: "AXE - Axe",
        phrase: "abandon abandon ability",
        firstAddress: "PScwtLUyPiGrqtKXrHF37DGETLXLZdw4up",
        firstPubKey: "0288ea360af543ff72c79560f9f0ed8ed5386681fc3cc5edc84921c1118d989bce",
        firstPrivKey: "XJKs1GN3sABamT6daKdRSjBgE2XPrnwBurWyBSVJht6zv5kS2dZd",
    };
    testNetwork(done, params);
});
it('Allows selection of BlackCoin', function(done) {
    var params = {
        selectText: "BLK - BlackCoin",
        phrase: "abandon abandon ability",
        firstAddress: "B5MznAKwj7uQ42vDz3w4onhBXPcqhTwJ9z",
        firstPubKey: "03f500b73bad9955fbe26a27bbeefa4ec00119532449eeccfb1f021cafa638d046",
        firstPrivKey: "Piyy1AGXZ9wRJdiUMPm97WAmN1DHvSxtjCpkYrtX2qyvc4huUxe9",
    };
    testNetwork(done, params);
});
it('Allows selection of Neblio', function(done) {
    var params = {
        selectText: "NEBL - Neblio",
        phrase: "abandon abandon ability",
        firstAddress: "NefkeEEvhusbHMmTRrxx7H9wFnUXd8qQsE",
        firstPubKey: "0274d827c4aef5b009e0c5ddd3c852a9a0bd91cb37cfb72a5f07d570e4ce7e1569",
        firstPrivKey: "TpEwnrinfiH7AMDJLvFzNoW1duU2rg7hox6tgF4wMmcnQSmNmQZM",
    };
    testNetwork(done, params);
});
it('Allows selection of Beetlecoin', function(done) {
    var params = {
        selectText: "BEET - Beetlecoin",
        phrase: "abandon abandon ability",
        firstAddress: "BVmtbEsGrjpknprmpHFq26z4kYHJUFHE71",
        firstPubKey: "03e8e78daa2d96e390b55426d6b4cad887bdc028a394847308ad4910d00875b04c",
        firstPrivKey: "Pkb5yU9mK1CzSQuYKm6CYmaJxDEiycipm426F3EhYtHPJdBJxViG",
    };
    testNetwork(done, params);
});
it('Allows selection of Adcoin', function(done) {
    var params = {
        selectText: "ACC - Adcoin",
        phrase: "abandon abandon ability",
        firstAddress: "AcEDM6V5sF4kFHC76MJjjfProtS5Sw2qcd",
        firstPubKey: "026625ec7d1b747bd361a57c593fd8384fcdc65696aed5b72f64e73dbf2b24e854",
        firstPrivKey: "T4B9YVUonpM7tQQEkqv4QjMxWJqxyqcJt78H7XqsRXRvuvd2XGog",
    };
    testNetwork(done, params);
});
it('Allows selection of Asiacoin', function(done) {
    var params = {
        selectText: "AC - Asiacoin",
        phrase: "abandon abandon ability",
        firstAddress: "ALupuEEz7kJjQTAvmtcBMBVuEjPa7GqZzE",
        firstPubKey: "0338b40a58e69c087f5092223555c1ce48988e5b2b6bb15f42d881109aa1499d39",
        firstPrivKey: "PNRyYtznRQBbD3GNCt86uHdWEHyeFr7ZszqckXCt7ZXEcRF29Z4X",
    };
    testNetwork(done, params);
});
it('Allows selection of Aryacoin', function(done) {
    var params = {
        selectText: "ARYA - Aryacoin",
        phrase: "abandon abandon ability",
        firstAddress: "Abr6gX25KaU9BpwD34UfsL3A4n89NvYYSf",
        firstPubKey: "03973c0669f332a69e8f0661ffddc7fd86dd7fdb768a40608fcbf0efceebf900e0",
        firstPrivKey: "PNukdY6bBGJhFDnJGeRFrJ5ptj3WD1xZHbPv8ubjMknFz2L6sZFi",
    };
    testNetwork(done, params);
});
it('Allows selection of Cosmos Hub', function(done) {
    var params = {
        selectText: "ATOM - Cosmos Hub",
        phrase: "abandon abandon ability",
        firstAddress: "cosmos17mkch9syem8gtf6wh7p38thdgav6dwezpkylny",
        firstPubKey: "cosmospub1addwnpepq0sgn66ty4suk5vx3hsmxxqd5z3amegqwlu59funrzyz5u8r9758qhl84ys",
        firstPrivKey: "zUnETPxmE2vkHzLHTAlO9wg8PL/GEEBc1I4yVwvSV8M=",
    };
    testNetwork(done, params);
});
it('Allows selection of Terra', function(done) {
    var params = {
        selectText: "LUNA - Terra",
        phrase: "abandon abandon ability",
        firstAddress: "terra1txr4jwel3vjl64vrc08pljnjryqkhtffmyp265",
        firstPubKey: "028e7658e3debb2d9d458919bfba0e85b0220e845f7552176f30a52acd0f809d71",
        firstPrivKey: "d611b211e370aa1edd9743acd6ce537d16fade85d7ae7e88b32f3a0483f52535",
    };
    testNetwork(done, params);
});
it('Allows selection of Auroracoin', function(done) {
    var params = {
        selectText: "AUR - Auroracoin",
        phrase: "abandon abandon ability",
        firstAddress: "ANuraS6F4Jpi413FEnavjYkKYJJRHkgYCm",
        firstPubKey: "03f843b9258aa001f24ebe3a77b6746a20ffda9f60934da8ed44f83d081977fe4b",
        firstPrivKey: "PQyDA9ewjeMNvNy6ZaUEWVwTNHFPp2J3F131msPx4XFNgMuKMaXF",
    };
    testNetwork(done, params);
});
it('Allows selection of Bata', function(done) {
    var params = {
        selectText: "BTA - Bata",
        phrase: "abandon abandon ability",
        firstAddress: "BGxBdNeYPtF3GCuTtZBPQdFxCkdBYSF3fj",
        firstPubKey: "033f35cba191c80f5246113ef33cd8a1e2449d304ad25afbd25e86aff333f07472",
        firstPrivKey: "RKbjo1gnyFsuEimVGGybBfbvcp6fCCY35D9SY38xLAwrSrQ3B5v9",
    };
    testNetwork(done, params);
});
it('Allows selection of Belacoin', function(done) {
    var params = {
        selectText: "BELA - Belacoin",
        phrase: "abandon abandon ability",
        firstAddress: "BEeetqpNffdzeknSpNmQp5KAFh2KK1Qx7S",
        firstPubKey: "039d895165f9c8218c12499820b783d920b632b49b0ca70b9352171b2f4273bf0b",
        firstPrivKey: "PeicG333UdMZ1t5PoHCt2Yepc7X15wHPawvsusWWspKCw99Dfqmx",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitcoin Atom', function(done) {
    var params = {
        selectText: "BCA - Bitcoin Atom",
        phrase: "abandon abandon ability",
        firstAddress: "AMy6qMbJeC4zsGRL6iWszmeCdQH65fgfih",
        firstPubKey: "02efe1e4f85342c8c57c4d6e6f48758f7be4e059d61586f769e33dd5bf0aa78a04",
        firstPrivKey: "Ky4hiMBLXZEj3TFknsuvceh16ttBfw9U7ReMgGWBtoYg1LPuxxUq",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitcoinplus', function(done) {
    var params = {
        selectText: "XBC - Bitcoinplus",
        phrase: "abandon abandon ability",
        firstAddress: "B7FSynZoDbEwTCSgsXq9nJ5ue8owYLVL8r",
        firstPubKey: "03ca81fbc766f6a38c7d122facd68c87ceeb57a0ee7d58927132a77704dfe88f92",
        firstPrivKey: "Pjjssfh7oJnFZfcxxooUvUqqxtb35oiurrDm3rEHCGpyCW1tPEG2",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitcoin Private', function(done) {
    var params = {
        selectText: "BTCP - Bitcoin Private",
        phrase: "abandon abandon ability",
        firstAddress: "b1M3PbiXXyN6Hdivdw5rJv5VKpLjPzhm4jM",
        firstPubKey: "03b4dae910c8563ae77e4c665022f8afbf8bcc659ce3bc790a74956e5ebba932af",
        firstPrivKey: "L5U3Rfy7otN5JQP9iveYkT1pB9va71uebx7VE8reBbiAofKCiCxk",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitcoin Private testnet', function(done) {
    var params = {
        selectText: "BTCPt - Bitcoin Private Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "n1UcUUSDfDppfzh7XLJNHmZkLdbTQg3VAZL",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cV3coiYD2NhHKfhC6Gb8DzpvPzcGYYExYxuNxpUtKq3VUJrkFLZx",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitcoin SV', function(done) {
    var params = {
        selectText: "BSV - BitcoinSV",
        phrase: "abandon abandon ability",
        firstAddress: "1N4mgtE5yxifch9jWs7Sds6oVqxdy2t576",
        firstPubKey: "0280bbf3fd6f1c7ab4b04cca0ab6e23487fafa9c5edea3d1882d8e967111ee8b38",
        firstPrivKey: "L3oBCYKNpT6uc5qeYGN9NFNyvQsTUGBV7v2cqeB76GfWzuGJDYeY",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitcoinz', function(done) {
    var params = {
        selectText: "BTCZ - Bitcoinz",
        phrase: "abandon abandon ability",
        firstAddress: "t1X2YQoxs8cYRo2oaBYgVEwW5QNjCC59NYc",
        firstPubKey: "033eb18e80984fa3fbaeee1096977d6b169399123641dc97ceba00910c8ad211d4",
        firstPrivKey: "L1qcDeAXPxMSgnXvquJo5Dd4myFxxxrWNgi99Ns26GPNyRW7eVuZ",
    };
    testNetwork(done, params);
});
it('Allows selection of BitCloud', function(done) {
    var params = {
        selectText: "BTDX - BitCloud",
        phrase: "abandon abandon ability",
        firstAddress: "BHbWitXCNgTf1BhsRDNMP186EeibuzmrBi",
        firstPubKey: "032ca47d6a35bd01ba3832791bcb0ee5676b1a63a491b42c39a4b214d78bf64fd3",
        firstPrivKey: "PgTZBt9exdzZSWfhdwXKVmz5WBFjAJFjNLa9552FCx1X6mnztNSL",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitcore', function(done) {
    var params = {
        selectText: "BTX - Bitcore",
        phrase: "abandon abandon ability",
        firstAddress: "2Rgp5Znhpy34TK4QmPkfCiYs9r4KovfTH9",
        firstPubKey: "02caa73ee839b074c8d353f6869222bafd8ce5ad3bcb1c0bd404d108390b2a6438",
        firstPrivKey: "L4286qDXUJfVq4ebbHHUVDoFpEudJj81FUWkjwNeQ132gFCDGUBj",
    };
    testNetwork(done, params);
});
it('Allows selection of Bitsend', function(done) {
    var params = {
        selectText: "BSD - Bitsend",
        phrase: "abandon abandon ability",
        firstAddress: "iBPk7LYjDun3EPk7CRR8UUmnPoceVc1bp2",
        firstPubKey: "03e6b12ed885225302fc126980e42abfee1c3350b77b61b01abcf200b5e9a9fee5",
        firstPrivKey: "XCTxjfV68KfXKySGJyZTYvYMBDFKSPJu41W3SN1bRpJch5R498mC",
    };
    testNetwork(done, params);
});
it('Allows selection of Britcoin', function(done) {
    var params = {
        selectText: "BRIT - Britcoin",
        phrase: "abandon abandon ability",
        firstAddress: "B6Aue4J2XLs1f1dtD4H1SHYFfh4XrmEbrw",
        firstPubKey: "035dee3aad6f635aeffe61a28e82a58271b984d20cc3766f63d9acb29ecee91d3f",
        firstPrivKey: "PdyPdAngoD42Pe5qCd2en6nS1j4rqVyH6cFGkCDEu2nEMt8DHsoz",
    };
    testNetwork(done, params);
});
it('Allows selection of Canadaecoin', function(done) {
    var params = {
        selectText: "CDN - Canadaecoin",
        phrase: "abandon abandon ability",
        firstAddress: "CanAyCfd5Rj2CQVfaoAmvDUZunPM5W1AEQ",
        firstPubKey: "03124e22733a75beba1e4f2635d08e034772bf6cbe8102404226a9402e135ff7f6",
        firstPrivKey: "QCEMYNRcKqGgYXhxDNZfrF9m8sqd28NujXpjDNuN7r525rrXPnLm",
    };
    testNetwork(done, params);
});
it('Allows selection of Cannacoin', function(done) {
    var params = {
        selectText: "CCN - Cannacoin",
        phrase: "abandon abandon ability",
        firstAddress: "CYjW8xWB43g6krLJTmmrPk1PonoQX7h9Qd",
        firstPubKey: "03bd05a584f418aa8d65a05c7bcc301eb552f67aa380f15e4b29c0b8eec698b443",
        firstPrivKey: "QAM1aUWMGEDdcDsgaPQKXcMe8Z3vEfDaPSds3wTFz8USQ3yht7Kk",
    };
    testNetwork(done, params);
});
it('Allows selection of Clubcoin', function(done) {
    var params = {
        selectText: "CLUB - Clubcoin",
        phrase: "abandon abandon ability",
        firstAddress: "CHMDEXN4sihpSVX4GyAa2hZ62shnby7uyN",
        firstPubKey: "0356187f1336ac2e340145478f02024ce1c318e3648cbba38262afbde7f2dc0055",
        firstPrivKey: "PeJx6v8h1N6GvTj7VkK7vWqjdWJb4QXzfrDgJjFao8bkpRrDiymm",
    };
    testNetwork(done, params);
});
it('Allows selection of Compcoin', function(done) {
    var params = {
        selectText: "CMP - Compcoin",
        phrase: "abandon abandon ability",
        firstAddress: "CLshtw3zhxkseBJS46UF12v3AFy9Dx7JVv",
        firstPubKey: "027d1b4f1798882b8978eb3ab0e8b503aa1fb4cf058e0086cf25326fb6a8751aae",
        firstPrivKey: "QDq6KKEdmrzHbZHmgzsGcweUFwYA7mVvvfeAKsPSxfxHNv73ETr7",
    };
    testNetwork(done, params);
});
it('Allows selection of CPUchain', function(done) {
    var params = {
        selectText: "CPU - CPUchain",
        phrase: "abandon abandon ability",
        firstAddress: "CWSpLpW7jS4mBHJnkz3mmL5s3yQMg93zK8",
        firstPubKey: "0390845eef5c5993069211f94d9f3990c27c380700bb92ae629d2a5afae1c08806",
        firstPrivKey: "L378gxzvUEX9JUFnfXBik2H4gV7XM4dzXWKM9rvR8UZr2rBphL1t",
    };
    testNetwork(done, params);
});
it('Allows selection of Crave', function(done) {
    var params = {
        selectText: "CRAVE - Crave",
        phrase: "abandon abandon ability",
        firstAddress: "VCYJeti6uKMNBFKCL7eP96UwuFWYHM7c85",
        firstPubKey: "02c8938f30cc46013706586753d6dca3e4ac6b7d6924dfc35d444c3605f35da4c7",
        firstPrivKey: "PjRdEuhRZ6rufXAdU6amoaPDRZamWmxN46qbmSPyqUKsJzChCjZT",
    };
    testNetwork(done, params);
});
it('Allows selection of Defcoin', function(done) {
    var params = {
        selectText: "DFC - Defcoin",
        phrase: "abandon abandon ability",
        firstAddress: "D8swcgyaaFUrXZU3ATwbgy16buCpWqbG1M",
        firstPubKey: "02d02cc83ddfaa5aed4fb9b611b504cccbfa8397485411f16816fc28dccb51e609",
        firstPrivKey: "QSRhMr1B4tt7DEcgxji6NrEfS51wQ6GypfMkqgNDHuWVKo2RzTac",
    };
    testNetwork(done, params);
});
it('Allows selection of Diamond', function(done) {
    var params = {
        selectText: "DMD - Diamond",
        phrase: "abandon abandon ability",
        firstAddress: "dJnrVbLL9UPjdaVRz2C8VpqHZknqAqjLek",
        firstPubKey: "03750645ffc120a0ffda07f01b0cc0d321bccf02eaedc98907672d78f2b2ef20d6",
        firstPrivKey: "ZKnjDNkhgCwRs8KV5Mf33k1USiiiP8AuXKM2xR4zhd3PAhtVmkEg",
    };
    testNetwork(done, params);
});
it('Allows selection of Digibyte', function(done) {
    var params = {
        selectText: "DGB - Digibyte",
        phrase: "abandon abandon ability",
        firstAddress: "D85Rp9jwLtMdmP6wGjTiqHBdVQLST3YCEq",
        firstPubKey: "02f86cc0afd113956e995fb9cbe33b68e59e9175c0c89419efc4031f2e3c128288",
        firstPrivKey: "L1w9pD4XodykLEJxiK1R9SVELpftD9x1QtGjHEb1nWviAvYVZbwv",
    };
    testNetwork(done, params);
});
it('Allows selection of Digitalcoin', function(done) {
    var params = {
        selectText: "DGC - Digitalcoin",
        phrase: "abandon abandon ability",
        firstAddress: "DKw4UGKEAZWweDNEbBFNQx4EM8x1mpUdia",
        firstPubKey: "02148710e3f09fa9e108bd90a3d53e0eeea9b6ee929c4668a7d64732e3fc839ff7",
        firstPrivKey: "QVBstKEkSbT4M9aDbBTkqJkpLCaGjL5zYSiiufHwMxGCn2dunbYL",
    };
    testNetwork(done, params);
});
it('Allows selection of Ecoin', function(done) {
    var params = {
        selectText: "ECN - Ecoin",
        phrase: "abandon abandon ability",
        firstAddress: "e6WFPLG5gcXyF7cESFteH1hE2XSmowW5yB",
        firstPubKey: "03a74536710cba6aa02b543f1ac4a76d241b47a96e38cfd002eb975cdef4b9ec19",
        firstPrivKey: "ZZPUTdAqpJ3s6S6xe2RpZD3jyEqwGk5MRkJHSpar1rESp4BFEqLV",
    };
    testNetwork(done, params);
});
it('Allows selection of Edrcoin', function(done) {
    var params = {
        selectText: "EDRC - Edrcoin",
        phrase: "abandon abandon ability",
        firstAddress: "eh1nUJsvgKPFv6ebMBfcwJ299GMCpjeZUG",
        firstPubKey: "02b541bdd9ff6ffc03ec4749dbe1a8a4ac8b02dc528758acac43eb1f38b5f48f27",
        firstPrivKey: "ZjZir6LUrg6A8WqcCeCeM249TGCxJcgGkEL6VefJJV1mGsGb7MEb",
    };
    testNetwork(done, params);
});
it('Allows selection of Egulden', function(done) {
    var params = {
        selectText: "EFL - Egulden",
        phrase: "abandon abandon ability",
        firstAddress: "Lg66yt55R7edRM58cDhKzXik2kFme3viX7",
        firstPubKey: "02d8d54be535836e70b9feed7a2502c026d714894342746f15d21c6bc80e1f97e4",
        firstPrivKey: "T7NPtpaVXs7SBfsCzp3ooadkctNqcZW6HpNHeT3U8EAXc6NtDJ4c",
    };
    testNetwork(done, params);
});
it('Allows selection of Einsteinium', function(done) {
    var params = {
        selectText: "EMC2 - Einsteinium",
        phrase: "abandon abandon ability",
        firstAddress: "EVAABm9hXKHk2MpVMbwNakRubFnNha5m8m",
        firstPubKey: "02826e69c802fbf71ca8e7daf9fdac2e371b86847b5397422997785cefb973269b",
        firstPrivKey: "QwySA5DiFKbvMcm7H3xXfsDUdq1Q5RPYjBAcLjZKkESxmJMXBvL2",
    };
    testNetwork(done, params);
});
it('Allows selection of EOSIO', function(done) {
    var params = {
        selectText: "EOS - EOSIO",
        phrase: "abandon abandon ability",
        firstPubKey: "EOS692VJTBK3Rmw93onNnpnZ8ZtmE9PdxjDStArvbyzoe11QUTNoy",
        firstPrivKey: "5Jef4qXr3nF8cjudHNQBaComNB653dnQX4pWec32xXRVThBLiCM",
    };
    testNetwork(done, params);
});
it('Allows selection of Europecoin', function(done) {
    var params = {
        selectText: "ERC - Europecoin",
        phrase: "abandon abandon ability",
        firstAddress: "ESA2YwPYntAoaPrE8Fm5qkKRtkcwLcwD6R",
        firstPubKey: "038f16d567cdefac2813b64d465f5cd8d6d59df9dfe4d16302a19b5e0b7179d685",
        firstPrivKey: "RzXndDAzJ4Wft6HXkpopV7vRnRBeVw2o6dKp44FYQgriYWngseBu",
    };
    testNetwork(done, params);
});
it('Allows selection of Exclusivecoin', function(done) {
    var params = {
        selectText: "EXCL - Exclusivecoin",
        phrase: "abandon abandon ability",
        firstAddress: "EbUa6m8UZW6nTxsYZD2FsDjkadKbp5M6JT",
        firstPubKey: "0291a6b82197e13aa2fd65bd1f2a6e905a9a2baaa36dfb5da10690022f7f9e998d",
        firstPrivKey: "Qu6pr1srXmEFzWSa4Ry1sjV6qDj4TEf4q2CxHBSRByiSBLsm967z",
    };
    testNetwork(done, params);
});
it('Allows selection of Feathercoin', function(done) {
    var params = {
        selectText: "FTC - Feathercoin",
        phrase: "abandon abandon ability",
        firstAddress: "6gDdjAMoSgQaW8UhqK3oboHs6ftGAroKkM",
        firstPubKey: "02e9f5c37fba2b6457f3c59de5bf5be2efe524751a682a47765825cb9d82d339f3",
        firstPrivKey: "N5487NUGCd1JnWzZzhjX1uu6SNGnpQKjeWuK6Y1NzNHjGaLysCdi",
    };
    testNetwork(done, params);
});
it('Allows selection of FIO', function(done) {
    var params = {
        selectText: "FIO - Foundation for Interwallet Operability",
        phrase: "valley alien library bread worry brother bundle hammer loyal barely dune brave",
        firstPubKey: "FIO5kJKNHwctcfUM5XZyiWSqSTM5HTzznJP9F3ZdbhaQAHEVq575o",
        firstPrivKey: "5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu",
    };
    testNetwork(done, params);
});
it('Allows selection of Firo', function(done) {
    var params = {
        selectText: "FIRO - Firo (Zcoin rebrand)",
        phrase: "abandon abandon ability",
        firstAddress: "a6VcMdP4XgAA9Tr7xNszmPG5FZpfRf17Cq",
        firstPubKey: "0236f2348c32dc62d69488b01988ed1154df261723ec60461cb6e62189984c62db",
        firstPrivKey: "Y8k3XQRQrJoABEao4Sw45s744g6xth7yviNqFcN7zqPqKUJrrKTQ",
    };
    testNetwork(done, params);
});
it('Allows selection of Zcoin', function(done) {
    var params = {
        selectText: "XZC - Zcoin (rebranded to Firo)",
        phrase: "abandon abandon ability",
        firstAddress: "a6VcMdP4XgAA9Tr7xNszmPG5FZpfRf17Cq",
        firstPubKey: "0236f2348c32dc62d69488b01988ed1154df261723ec60461cb6e62189984c62db",
        firstPrivKey: "Y8k3XQRQrJoABEao4Sw45s744g6xth7yviNqFcN7zqPqKUJrrKTQ",
    };
    testNetwork(done, params);
});
it('Allows selection of Firstcoin', function(done) {
    var params = {
        selectText: "FRST - Firstcoin",
        phrase: "abandon abandon ability",
        firstAddress: "FJN9GzfMm7Q8R4DJwK1H9F6A1GTghvFiMJ",
        firstPubKey: "029300108c006d1dc75847fece915138747b7bc17b515eae7458da98d2f14d7178",
        firstPrivKey: "RDxAN3n3k2dEZ4Ln3bbozzZ3Jgg7CQdgzYDCURmPghKQdzctX7ck",
    };
    testNetwork(done, params);
});
it('Allows selection of Flashcoin', function(done) {
    var params = {
        selectText: "FLASH - Flashcoin",
        phrase: "abandon abandon ability",
        firstAddress: "UWfpf5LfMmLxZYooEb2EyvWhZ8NG7EZDRt",
        firstPubKey: "032d55eae8073e75f02e9674b0ac3f69190ad359ad37ee4c4c11d12bcfee13d439",
        firstPrivKey: "W6pedhBW35Twq8ZmgTQi7sHx6wczQanSk2FUpcFWtgEW29jowsvi",
    };
    testNetwork(done, params);
});
it('Allows selection of GCRCoin', function(done) {
    var params = {
        selectText: "GCR - GCRCoin",
        phrase: "abandon abandon ability",
        firstAddress: "GJjF5cLwyXLacpuvXAVksxGxKvHDjx58d6",
        firstPubKey: "0356187f1336ac2e340145478f02024ce1c318e3648cbba38262afbde7f2dc0055",
        firstPrivKey: "Pntag5VbBX1Qtyjt3pi1igwDswWEtpoiqHqosBbgHcMU6m2e7t9J",
    };
    testNetwork(done, params);
});
it('Allows selection of Gobyte', function(done) {
    var params = {
        selectText: "GBX - Gobyte",
        phrase: "abandon abandon ability",
        firstAddress: "GS813Ys2brkmvSUw1rUqGPm2HqQVDHJRyA",
        firstPubKey: "036f84f44e4c8bffe039c2d9da087b006ebbfcdcf24b32a6434b2fad708ef00ae0",
        firstPrivKey: "WLiSrhfqRwgNmw7rhGHFoXLEuNGXxQYuKb9PK84AZmTfiHN9dz22",
    };
    testNetwork(done, params);
});
it('Allows selection of Gridcoin', function(done) {
    var params = {
        selectText: "GRC - Gridcoin",
        phrase: "abandon abandon ability",
        firstAddress: "SGrWbBPvobgqKRF8td1Kdc9vbRY7MJ78Y9",
        firstPubKey: "0377436f8c4c4d96d5ddfe6875abeb589deec595331b9a915b7e8d81a4134926ce",
        firstPrivKey: "V7h5EhRuWGM8uqAouxHr9uNt8ZLCQ7kmpA27tvKDbUE3zBarH81n",
    };
    testNetwork(done, params);
});
it('Allows selection of Gulden', function(done) {
    var params = {
        selectText: "NLG - Gulden",
        phrase: "abandon abandon ability",
        firstAddress: "GcDP7cNEc33MPPdTFNJ8pZc6VMZJ2CbKxY",
        firstPubKey: "03ff51002146450eb68f294dbe34f3e208f8694b51079f81e3f7dbd403cc10df41",
        firstPrivKey: "Fc6gU4tscBk3pybMWU1ajS1tLvNerXC24hQJ1F944QqdgSSrr3XW",
    };
    testNetwork(done, params);
});
it('Allows selection of Helleniccoin', function(done) {
    var params = {
        selectText: "HNC - Helleniccoin",
        phrase: "abandon abandon ability",
        firstAddress: "LbHEKe5H72zp9G1fuWNiiNePTUfJb88915",
        firstPubKey: "02e602000d65b969ac27172297ee907684bfc606f457ef0bad62c229edb17d5cb2",
        firstPrivKey: "T6JEq9jKLvztjhg4tJMezy1L4NjnMfLDZJe1egVzPBU3Q5XPBFrz",
    };
    testNetwork(done, params);
});
it('Allows selection of Hempcoin', function(done) {
    var params = {
        selectText: "THC - Hempcoin",
        phrase: "abandon abandon ability",
        firstAddress: "H8sdWbZyJV4gyXyHtLXDaNnAuUDhK5mfTV",
        firstPubKey: "02e40aaa6bf20e32d9f5976f57e9bf7a8f75db36b96a9033c20b681c9d9454b617",
        firstPrivKey: "Ry5Dg2yR32uhbrPLdNmsK1TRbZ1bHLvFp7kcPgeMzVPN6ycu9Jj5",
    };
    testNetwork(done, params);
});
it('Allows selection of Insane', function(done) {
    var params = {
        selectText: "INSN - Insane",
        phrase: "abandon abandon ability",
        firstAddress: "iMPqEJMiXWuxC9U2NVinCCMr4t72h58EWx",
        firstPubKey: "036ec4cf4b92300f12ff824b1eca775b27b1a728f6b57c6354ce791fd8ea0f3497",
        firstPrivKey: "9HA4X5kXWKxLjybjko8Z5wDo19UUJKroRrZ1BuKCtsfcfNB48K61",
    };
    testNetwork(done, params);
});
it('Allows selection of Iop', function(done) {
    var params = {
        selectText: "IOP - Iop",
        phrase: "abandon abandon ability",
        firstAddress: "pGKQmcaPf95Ur5o6oHK4qdiZ52p1yaTvq1",
        firstPubKey: "02bbaa07f154d04b04dec0978a1655952e1a09a3c0e7798085902273965d93c2f6",
        firstPrivKey: "8MDnKDhVSp84AqzYN5g18MhMvHk3UMYnP51EVjidSas1pT62Sdpc",
    };
    testNetwork(done, params);
});
it('Allows selection of Starname', function(done) {
    var params = {
        selectText: "IOV - Starname",
        phrase: "abandon abandon ability",
        firstAddress: "star1xgfvgq40r7ff8ylw9l95dw56xnr0pvtjnlp7h4",
        firstPubKey: "starpub1addwnpepqg9x5cft48hcgx25vyzeyygntl7pt763datr6v50hrecafyane54xlqdxkd",
        firstPrivKey: "bGI4BNRvMYT1lbCOoH000HvNFPkyXms9n3Xp1X/7E80=",
    };
    testNetwork(done, params);
});
it('Allows selection of Ixcoin', function(done) {
    var params = {
        selectText: "IXC - Ixcoin",
        phrase: "abandon abandon ability",
        firstAddress: "xgE9bTZ6YypT3E6ByzkTt31Hq68E9BqywH",
        firstPubKey: "0257766cea209cf52ba08776b6dfa263a4759e1e148f25d0cab3a91a60b6a52062",
        firstPrivKey: "KxdDep6zGCWoRt6arat5DVR5s6a8vmZtuekwHafEwRc7VGxfeD4Y",
    };
    testNetwork(done, params);
});
it('Allows selection of Kobocoin', function(done) {
    var params = {
        selectText: "KOBO - Kobocoin",
        phrase: "abandon abandon ability",
        firstAddress: "FTVoNJETXDAM8x7MnmdE8RwWndSr9PQWhy",
        firstPubKey: "0225753a5e232b384dce73b58d25fb90172faaf4c83a8850189abd8cae86495601",
        firstPrivKey: "R7u1uvHmVGkGqjURaNoppFjPNBzPYt37QwttrJc6F2K1WRm1zKoQ",
    };
    testNetwork(done, params);
});
it('Allows selection of Landcoin', function(done) {
    var params = {
        selectText: "LDCN - Landcoin",
        phrase: "abandon abandon ability",
        firstAddress: "LLvLwNjG1aJcn1RS4W4GJUbv8fNaRATG7c",
        firstPubKey: "020c3ab49a6de010d23ddf14dec67666d7ad46dafbae9841db7723bbb0044067cc",
        firstPrivKey: "T8rHy2tA1yykFgCpr6KrgcrhqbevpxG923qSZbJHALYGwy3M3qAw",
    };
    testNetwork(done, params);
});
it('Allows selection of Library Credits', function(done) {
    var params = {
        selectText: "LBC - Library Credits",
        phrase: "abandon abandon ability",
        firstAddress: "bQJEQrHDJyHdqycB32uysh1SWn8Ln8LMdg",
        firstPubKey: "02abd5018c033f59f49f28ee76d93c41323890928e25c171ccc7c61ed753cde8ad",
        firstPrivKey: "5CWjkFs7be8vPa3CZEodPDsMDSbvyT9gAC1n1w83znRz4poNK5nZ",
    };
    testNetwork(done, params);
});
it('Allows selection of Linx', function(done) {
    var params = {
        selectText: "LINX - Linx",
        phrase: "abandon abandon ability",
        firstAddress: "XGWQ3cb3LGUB3VnHmj6xYSMgnokNbf6dyk",
        firstPubKey: "0232edeec8e3e021b53982a01943dea4398e9cc4b177c5483cf0e7774be41ea094",
        firstPrivKey: "X8YJFxPPmwyCBQ7Rp5bqn3V8U9rsaba5Tftsh3j8qZX9hjTTURgL",
    };
    testNetwork(done, params);
});
it('Allows selection of Litecoincash', function(done) {
    var params = {
        selectText: "LCC - Litecoincash",
        phrase: "abandon abandon ability",
        firstAddress: "Ce5n7fjUuQPLutJ4W5nCCfQLKdKLE1mv9A",
        firstPubKey: "033af2daadddcc976ea61023783b350f9b1ac45a056dba2d3b8c6ceec9d5817a8d",
        firstPrivKey: "T6qztYVwa6onx5HjCB3XZcCtegpUjVKtocRCQ8daWj2b8tbrDZqp",
    };
    testNetwork(done, params);
});
it('Allows selection of Lynx', function(done) {
    var params = {
        selectText: "LYNX - Lynx",
        phrase: "abandon abandon ability",
        firstAddress: "KUeY3ZdZkg96p4W98pj1JjygCFU1XqWdw3",
        firstPubKey: "0340435307cc0831d85adb70ceb518297cdebee8f25574d8eca0ff94e35fa759da",
        firstPrivKey: "SdwVFsLjH2wbWziEZTLPQ2iCBrt9vXHWr7X333RbFZG7hZg88u5V",
    };
    testNetwork(done, params);
});
it('Allows selection of Megacoin', function(done) {
    var params = {
        selectText: "MEC - Megacoin",
        phrase: "abandon abandon ability",
        firstAddress: "MDfAj9CzkC1HpcUiVGnHp8yKTa7WXgu8AY",
        firstPubKey: "02e560b00165c939ba08f5096201794a32e6de66216cdc5763472abf09a5e62380",
        firstPrivKey: "TSw7if5qV6HzW2hKhPjVvQBVUXt5aD17mM34PkueLrHQiXwMwcp4",
    };
    testNetwork(done, params);
});
it('Allows selection of Minexcoin', function(done) {
    var params = {
        selectText: "MNX - Minexcoin",
        phrase: "abandon abandon ability",
        firstAddress: "XC1VnyJVfiMDwWgFtAHDp41cgY3AHk3dJT",
        firstPubKey: "0232a31bee17b806941c419cea385d427f0d6c6fbd564fb2f366faa008aa15822c",
        firstPrivKey: "KzouDFGCydewfP2pGdGv62vwP7KBtaaSgBW28B94YuksV5y8jGyE",
    };
    testNetwork(done, params);
});
it('Allows selection of Navcoin', function(done) {
    var params = {
        selectText: "NAV - Navcoin",
        phrase: "abandon abandon ability",
        firstAddress: "NTQVTPK3NWSQLKoffkiQw99T8PifkF1Y2U",
        firstPubKey: "0345105cc449c627cfee118bcd7804465669e6b32e751a61e39737f5693f56d5f4",
        firstPrivKey: "PKXWZeQCqutM4vawyuNAHuAAkfEuWLVhwtszCRuWTecyJ92EMEE2",
    };
    testNetwork(done, params);
});
it('Allows selection of Nebulas', function(done) {
    var params = {
        selectText: "NAS - Nebulas",
        phrase: "abandon abandon ability",
        firstAddress: "n1PbK61DGBfDoDusLw621G6sVSMfLLHdfnm",
        firstPubKey: "3a3ffb88114f54ed7525c987a3124dc5eefc221806bc049e1e08371cca5fbebea38c2ce791ee32912c1f7799fad99db91f6a3724def5e715b4ff64bc06fe4537",
        firstPrivKey: "78d2df373c54efe1bfda371ee7532892ea8ec046f45e5c7e2dfa8371ad190f8b",
    };
    testNetwork(done, params);
});
it('Allows selection of Neoscoin', function(done) {
    var params = {
        selectText: "NEOS - Neoscoin",
        phrase: "abandon abandon ability",
        firstAddress: "NgATz6QbQNXvayHQ4CpZayugb9HeaPDdby",
        firstPubKey: "021bf6bd94ac773ed78b6e682bf6509a08944b67925a3ea9ec94f500479f637f63",
        firstPrivKey: "TBebkUs87R1WLhMPHMzCYF2FmiHzuVcCrhgf2rRwsSpi35SGZPMc",
    };
    testNetwork(done, params);
});
it('Allows selection of Nix', function(done) {
    var params = {
        selectText: "NIX - NIX Platform",
        phrase: "abandon abandon ability",
        firstAddress: "GgcNW2SQQXB4LWHRQTHKkQF3GzXNSLqS8u",
        firstPubKey: "02438f5277bc74be69e99eee406cda968705a8ab26b9aecfaa1bbc9d3700fa2eae",
        firstPrivKey: "L44wVS6tPZhVGfnJhXTfEyBZwLggW61GKKRVDaEKSaWAt2HkALyT",
    };
    testNetwork(done, params);
});
it('Allows selection of Neurocoin', function(done) {
    var params = {
        selectText: "NRO - Neurocoin",
        phrase: "abandon abandon ability",
        firstAddress: "NVdYErQ3mFpDuF5DquW9WMiT7sLc8ufFTn",
        firstPubKey: "03a3690f587d97dee95393d6dfe9daa81d60354657f84a75fb6733335a1c0588db",
        firstPrivKey: "Tn3LK6WyQRczahRsf3cZCpS12VxvbdhM6zSARDvGxhNoxCCN7oKv",
    };
    testNetwork(done, params);
});
it('Allows selection of Newyorkc', function(done) {
    var params = {
        selectText: "NYC - Newyorkc",
        phrase: "abandon abandon ability",
        firstAddress: "RSVMfyH1fKfy3puADJEhut2vfkRyon6imm",
        firstPubKey: "02c1f71b4e74098cf6dc66c5c0e386c695002093e986698e53f50162493b2deec8",
        firstPrivKey: "UqWMjJsXSsC4X7vgCTxLwxV21yA8vDosyGW2rBTYnn7MfFUbKZFy",
    };
    testNetwork(done, params);
});
it('Allows selection of Novacoin', function(done) {
    var params = {
        selectText: "NVC - Novacoin",
        phrase: "abandon abandon ability",
        firstAddress: "4JRvUmxcKCJmaMXZyvRoSS1cmG2XvnZfHN",
        firstPubKey: "0252531247a5e26a866909467ce552a3433b00f86319446aa3584723ad637be28a",
        firstPrivKey: "MD2NsZQtBdXGvox6VzpZfnhHyDJ2NHzzdSE6jUeUjQuaBRQ3LXUg",
    };
    testNetwork(done, params);
});
it('Allows selection of Nushares', function(done) {
    var params = {
        selectText: "NSR - Nushares",
        phrase: "abandon abandon ability",
        firstAddress: "SecjXzU3c7EecdT7EbC4vvmbdtBBokWh6J",
        firstPubKey: "02e0e94d07415703fd89b8a72f22fc28e7b916c0649bea2c53e6600377a4d125b5",
        firstPrivKey: "P5SXdUhciyemKJojb5tBFPKjVyX4Ymf1wdKDPmYHRigxPAnDNudM",
    };
    testNetwork(done, params);
});
it('Allows selection of Okcash', function(done) {
    var params = {
        selectText: "OK - Okcash",
        phrase: "abandon abandon ability",
        firstAddress: "PV4Qp1TUYuGv4TqVtLZtqvrsWWRycfx1Yi",
        firstPubKey: "02ab6d1d1b2c6f19f9c13cf0cd48e352e04245026d25de014cde0493c773f27789",
        firstPrivKey: "WuuneUUV8naqRRs1mSAdSVfZ9g6VXLWRV7NVEYdugts8vT2iNXR",
    };
    testNetwork(done, params);
});
it('Allows selection of Omnicore', function(done) {
    var params = {
        selectText: "OMNI - Omnicore",
        phrase: "abandon abandon ability",
        firstAddress: "1Q1t3gonjCT3rW38TsTsCvgSc3hh7zBGbi",
        firstPubKey: "02a8cadac7ee1d034f968c1441481fc2c941c8f529a17b6810e917f9ccc893fa3a",
        firstPrivKey: "KyvFh1tWTBsLWxJTVjpTpfjJ7eha81iks7NiD6FvrC23o24oAhcs",
    };
    testNetwork(done, params);
});
it('Allows selection of DeepOnion', function(done) {
    var params = {
        selectText: "ONION - DeepOnion",
        phrase: "abandon abandon ability",
        firstAddress: "DYREY7XCFXVqJ3x5UuN43k2JwD2s1kif48",
        firstPubKey: "030ed256ea98edd15006a57fd4d3c60b2b811ecd74107c3fa1ac36558107c139b3",
        firstPrivKey: "QZZHsJF9C9okF5JV2qx4H1NgCCQqeio6k8cryKyrpU3TPnDhSzwV",
    };
    testNetwork(done, params);
});
it('Allows selection of Pesobit', function(done) {
    var params = {
        selectText: "PSB - Pesobit",
        phrase: "abandon abandon ability",
        firstAddress: "PDePsF7ALyXP7JaywokdYiRTDtKa14MAr1",
        firstPubKey: "023dd8af1b0196275ee2fb450279656ab16f86221d47f62094c78088200d67e90f",
        firstPrivKey: "U9eg6xGhoA9H4aHmQtXPP1uR3dR3EjbdmTr3ejVK5jdhWFoJotSj",
    };
    testNetwork(done, params);
});
it('Allows selection of Pinkcoin', function(done) {
    var params = {
        selectText: "PINK - Pinkcoin",
        phrase: "abandon abandon ability",
        firstAddress: "2TgjYQffjbzUHJghNaVbdsjHbRwruC3yzC",
        firstPubKey: "02fcc7a9d26b78c1ef3149dc3fcb9fbd68293fe5627a9099a01e5acf5f848d029d",
        firstPrivKey: "LX84Cjro1aRwwqTDu2jqNTPvproSm7VJCyMFLCeEKa4LTFGzXgks",
    };
    testNetwork(done, params);
});
it('Allows selection of POSWcoin', function(done) {
    var params = {
        selectText: "POSW - POSWcoin",
        phrase: "abandon abandon ability",
        firstAddress: "PNxewmZoPnGBvoEbH6hgQZCK1igDiBCdgC",
        firstPubKey: "0358e511140f2f2bc96debf22639b36cc9b12addc386ac7a1de7dca05896ec0162",
        firstPrivKey: "UCs7SQEhD8r3GwXL99M8sBuxcqB9uke6kRSh7qQfbH9VdS6g919B",
    };
    testNetwork(done, params);
});
it('Allows selection of Potcoin', function(done) {
    var params = {
        selectText: "POT - Potcoin",
        phrase: "abandon abandon ability",
        firstAddress: "PEo7Vg2ctXgpP4vuLPeY9aGJtZotyrmiHc",
        firstPubKey: "02b86d3f153eac657f140a8ce9ae530504eea3c9894e594b9c9ddf0cfe393dc8ab",
        firstPrivKey: "U89dfzjfUtTSEKaRzr3FPw7ark3bjZAzTVw5kedjBcFj1UAdBcdE",
    };
    testNetwork(done, params);
});
it('Allows selection of Putincoin', function(done) {
    var params = {
        selectText: "PUT - Putincoin",
        phrase: "abandon abandon ability",
        firstAddress: "PViWnfr2uFtovd6e7joM49C94CsGSnqJis",
        firstPubKey: "0387bbd868cb20682619733e63205c66d460014714db26593d55c916c34f7e7970",
        firstPrivKey: "UBB9nGXWEMjhmvWqta83YkSYLLc1vjkqsnP289jbwMPG72LpAiUg",
    };
    testNetwork(done, params);
});
it('Allows selection of Rapids', function(done) {
    var params = {
        selectText: "RPD - Rapids",
        phrase: "abandon abandon ability",
        firstAddress: "Ri8XxUdZaXS5LqxmFJcFEjFinkaMbmhSUp",
        firstPubKey: "03cf69b270c1d03bbedb39f21d70a0a2aa0192b7dfb26bff4bf9a4ed8315d90f4e",
        firstPrivKey: "7sgLTht7XHwAkEgEpm7FJE6Tkv7GqCXxSSKPsr4hWYDNePUhBx6t",
    };
    testNetwork(done, params);
});
it('Allows selection of Ravencoin', function(done) {
    var params = {
        selectText: "RVN - Ravencoin",
        phrase: "abandon abandon ability",
        firstAddress: "RBuDoVNnzvFsEcX8XKPm8ic4mgiCzjUCNk",
        firstPubKey: "02135446ddfa13617ada02187702b51c3ae17a671773aa7ab7100a3cb89b7c9eb1",
        firstPrivKey: "KwRpyD9EmoyjQQRKtFVYL1WkS9Ywue8zSpebRPtXViiGR8kWUEJV",
    };
    testNetwork(done, params);
});
it('Allows selection of Reddcoin', function(done) {
    var params = {
        selectText: "RDD - Reddcoin",
        phrase: "abandon abandon ability",
        firstAddress: "RtgRvXMBng1y51ftteveFqwNfyRG18HpxQ",
        firstPubKey: "026565dd8a2e6f75e6391fbe16e6fb7dfab8b9cba85ea56b63f015d98c13d8f46d",
        firstPrivKey: "V1cNKW3ZYbRXosccyG9d3t4g7nGCBGyQJi7zLe6WZ3tExXMUqqK1",
    };
    testNetwork(done, params);
});
it('Allows selection of RevolutionVR', function(done) {
    var params = {
        selectText: "RVR - RevolutionVR",
        phrase: "abandon abandon ability",
        firstAddress: "VXeeoP2jkzZnMFxtc66ZBZK1NHN5QJnnjL",
        firstPubKey: "03c107f37ffb305d70a690ecd89254a67099d8855a4162762c62e3ad72e78c50e4",
        firstPrivKey: "WQdDNS6ZPZcFfBn7AwFMu1GHkm5jScBwpVDqNjmC16PEU7yG97vP",
    };
    testNetwork(done, params);
});
it('Allows selection of Ritocoin', function(done) {
    var params = {
        selectText: "RITO - Ritocoin",
        phrase: "abandon abandon ability",
        firstAddress: "BMbHdwDiuaZh4ATp8Xapf4srv3swzAGgkf",
        firstPubKey: "036f5f55dc37fa97294a2a5ae4d92735d4392d4405cbbebebf2d70d5d6781be622",
        firstPrivKey: "Mdaumz3494kxCeiEBame4ZBzjtTQ5mYzD8notv2EBW8FcNy3PiYd",
    };
    testNetwork(done, params);
});
it('Allows selection of Rubycoin', function(done) {
    var params = {
        selectText: "RBY - Rubycoin",
        phrase: "abandon abandon ability",
        firstAddress: "RV76JDtjTs11JdMDRToYn6CHecMRPLnKS6",
        firstPubKey: "037828022748cf1f2107e9d99f7a19b8b44ebb24b332c51c0ca1cecec301cf1797",
        firstPrivKey: "UwQPqs31g9AKQzLjHNqgXN66tout2i6F7VSiCsSsR3LVHq7aToVL",
    };
    testNetwork(done, params);
});
it('Allows selection of THORChain', function(done) {
    var params = {
        selectText: "RUNE - THORChain",
        phrase: "flip vicious divorce angle toward say derive blue refuse load word creek once expire bounce",
        firstAddress: "thor1zp3yx758t64vqvu8776vnwd0udrs2vwuxhc4ep",
        firstPubKey: "02fa85b75ef37fe3a4f4a6d62352aa7de070d2b39af9c55be26f079d01f406851d",
        firstPrivKey: "6020c0d5a9a8689c491c6a8f36beb70bf459e129e1428fed64aaf594beee54a6",
    };
    testNetwork(done, params);
});
it('Allows selection of Salus', function(done) {
    var params = {
        selectText: "SLS - Salus",
        phrase: "abandon abandon ability",
        firstAddress: "SNzPi1CafHFm3WWjRo43aMgiaEEj3ogjww",
        firstPubKey: "020c3ab49a6de010d23ddf14dec67666d7ad46dafbae9841db7723bbb0044067cc",
        firstPrivKey: "VMYkYTHeeHiosSQM9EFFdEH1a7fiMEL3TgBPxQVhXWqxAvyQ3uJL",
    };
    testNetwork(done, params);
});
it('Allows selection of Smileycoin', function(done) {
    var params = {
        selectText: "SMLY - Smileycoin",
        phrase: "abandon abandon ability",
        firstAddress: "BEZVnEBCAyFByrgKpwAgYgtvP4rKAd9Sj2",
        firstPubKey: "02145f25ab87def3ce6decffc6bf740037dc467a32ff8e62f147c70f5092074f2b",
        firstPrivKey: "pC32pZDfv3L3vegrv8gptiyc3SkJEZ6BigioGjLmD3wFw2h1qcz",
    };
    testNetwork(done, params);
});
it('Allows selection of Solarcoin', function(done) {
    var params = {
        selectText: "SLR - Solarcoin",
        phrase: "abandon abandon ability",
        firstAddress: "8LZ13HbnjtaMJWSvvVFNTLf71zFfDrhwLu",
        firstPubKey: "0305dbadd4fd239ecfca9239c9405e3b12178d46bdaf7520d511339a05367a3c88",
        firstPrivKey: "NeNfMe2zy5R6eUVJ3pZ4hs17s4xtm7xHjLJoe1hgCwVoYsfHx5Jy",
    };
    testNetwork(done, params);
});
it('Allows selection of stash', function(done) {
    var params = {
        selectText: "STASH - Stash",
        phrase: "abandon abandon ability",
        firstAddress: "XxwAsWB7REDKmAvHA85SbEZQQtpxeUDxS3",
        firstPubKey: "030caa120ce0fbd2c2d08a24c15086bafcf55d3862f423b0e55fd376474a0e7160",
        firstPrivKey: "XF3r4xQozRKvRUNgQG1bx8MGCuSLzV82XrNfB52Utpaixm8tWmWz",
    };
    testNetwork(done, params);
});
it('Allows selection of stash testnet', function(done) {
    var params = {
        selectText: "STASH - Stash Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "yWQCTSkUst7ddYuebKsqa1kSoXEjpCkGKR",
        firstPubKey: "02a709b853a4ac1739c036c3d2bcf03b3e8c54b64927c57a07ac05c8e903545dd0",
        firstPrivKey: "cNrt5ghh7pPGQZVZkL5FJFNsWQQTKQPtLJz2JT7KnsfpzeAPYSp3",
    };
    testNetwork(done, params);
});
it('Allows selection of Stratis', function(done) {
    var params = {
        selectText: "STRAT - Stratis",
        phrase: "abandon abandon ability",
        firstAddress: "ScfJnq3QDhKgDMEds6sqUE1ot6ShfhmXXq",
        firstPubKey: "0269cea528e4ed01b44729287c831fe1889b196fee6202956a7e5c9486c3bc5c00",
        firstPrivKey: "VLx3VXEsVzWVeZjHvrgCJ8N1H7JCEWTSHiEGsYUEZCedHR6yBqDU",
    };
    testNetwork(done, params);
});
it('Allows selection of Stratis Test', function(done) {
    var params = {
        selectText: "TSTRAT - Stratis Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "TRLWm3dye4FRrDWouwYUSUZP96xb76mBE3",
        firstPubKey: "0269cea528e4ed01b44729287c831fe1889b196fee6202956a7e5c9486c3bc5c00",
        firstPrivKey: "VLx3VXEsVzWVeZjHvrgCJ8N1H7JCEWTSHiEGsYUEZCedHR6yBqDU",
    };
    testNetwork(done, params);
});
it('Allows selection of Sugarchain', function(done) {
    var params = {
        selectText: "SUGAR - Sugarchain",
        phrase: "abandon abandon ability",
        firstAddress: "SYnd31fYr39VgKju87Vz1sYBmEeHg5cudk",
        firstPubKey: "035bc9fa22eff2246ec07bb09c9e32f5f9fee517b4f49a8f117508f8fb41905b25",
        firstPrivKey: "L2G3axGdZv5EV8osAsBPMese74i4dTHaGvxDh7DsRF5Ky6hKkPDY",
    };
    testNetwork(done, params);
});
it('Allows selection of Sugarchain Testnet', function(done) {
    var params = {
        selectText: "TUGAR - Sugarchain Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "TkoRzLZQyaY88dAACNVwUFMYekR7pv6CbY",
        firstPubKey: "035bc9fa22eff2246ec07bb09c9e32f5f9fee517b4f49a8f117508f8fb41905b25",
        firstPrivKey: "cSd33sGUzymVeaH8ZGzWiyNhjJ1UHuPGLy6goXgNvMjLDqioARWW",
    };
    testNetwork(done, params);
});
it('Allows selection of Syscoin', function(done) {
    var params = {
        selectText: "SYS - Syscoin",
        phrase: "abandon abandon ability",
        firstAddress: "SZwJi42Pst3VAMomyK5DG4157WM5ofRmSj",
        firstPubKey: "02219514722373a337c6425ca5ccc423e160f0abf66b57a71fba4db7aca6957f6a",
        firstPrivKey: "L36rm7aHFTz571YY87nA3ZLace8NcqPYZsyuyREuT4wXFtTBqLrc",
    };
    testNetwork(done, params);
});
it('Allows selection of Toa', function(done) {
    var params = {
        selectText: "TOA - Toa",
        phrase: "abandon abandon ability",
        firstAddress: "TSe1QAnUwQzUfbBusDzRJ9URttrRGKoNKF",
        firstPubKey: "0332facd2ea64c2f1e6152961340b7e51ca77f1bffa0f950442b4ef5021f7ee86c",
        firstPrivKey: "VdSdDaM1Kjw1SzzW7KCzFEFi7Zf5egUHVofSiLkrSh7K6bbYZhnb",
    };
    testNetwork(done, params);
});
it('Allows selection of TWINS', function(done) {
    var params = {
        selectText: "TWINS - TWINS",
        phrase: "abandon abandon ability",
        firstAddress: "WPpJnfLLubNmF7HLNxg8d8zH5haxn4wri8",
        firstPubKey: "02a4b9bda2a7a2e4540d54c4afb3a3007f6f22f8cd2df67d5c69388fd8ddc16a07",
        firstPrivKey: "Au5fg7nYMXHmNT9BSfQVNxaUduP9cgJASeNDMrP9qfoWi2ZTmR48",
    };
    testNetwork(done, params);
});
it('Allows selection of TWINS testnet', function(done) {
    var params = {
        selectText: "TWINS - TWINS Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "XpnU1HHdNG5YxvG9Rez4wjmidchxqnZaNa",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cBtMfPpQg4s1Ndfez7oLdedwu8CxshhWE5f7qunhLsY4ueNvKKyM",
    };
    testNetwork(done, params);
});
it('Allows selection of Ultimatesecurecash', function(done) {
    var params = {
        selectText: "USC - Ultimatesecurecash",
        phrase: "abandon abandon ability",
        firstAddress: "UPyLAZU2Che5fiy7Ed8xVJFmXAUhitA4ug",
        firstPubKey: "03a529111ee6d54965962b289f7537db1edb57863e2e10dd96939f8d3501ecebd4",
        firstPrivKey: "VG1ZbBExPyeeT72EL1jQU8SvXkpK6heTept76wLiGCuMgRHqrz9L",
    };
    testNetwork(done, params);
});
it('Allows selection of Unobtanium', function(done) {
    var params = {
        selectText: "UNO - Unobtanium",
        phrase: "abandon abandon ability",
        firstAddress: "uUBMPVMXrR6qhqornJqKTWgr8L69vihSL9",
        firstPubKey: "026dd108ff43d425ad923f2107f5fc166cbb90dd0bd04b157c1ebdc9c04a423e0f",
        firstPrivKey: "aAf6LmMJpWQMZbHVSHtkKDCNViknGD4TQ3y1rwvJe2L55dwpbqBV",
    };
    testNetwork(done, params);
});
it('Allows selection of Vcash', function(done) {
    var params = {
        selectText: "XVC - Vcash",
        phrase: "abandon abandon ability",
        firstAddress: "VuL53MSY6KjvAjKSeRkh3NDnKykacDVeps",
        firstPubKey: "03ab245795cf39c4084684d039a01c387472c3626d93d24289d229c27ce9eeeace",
        firstPrivKey: "WVC2yAf2rFHzjbKKJeZWNFjMqQ9ATRg3xdtG2FfVDQATpNj5fHy9",
    };
    testNetwork(done, params);
});
it('Allows selection of Verge', function(done) {
    var params = {
        selectText: "XVG - Verge",
        phrase: "abandon abandon ability",
        firstAddress: "DCrVuGkMjLJpTGgwAgv9AcMdeb1nkWbjZA",
        firstPubKey: "03cd21de72f291cd5a3632a23a710616416743f60b4667a0f8d3fc03c7fd6e0c77",
        firstPrivKey: "QRpRGbTRC7P12PyhiFqyZpVwK5XCGe5Lmr9hbV7ujcjg9cjUGqF7",
    };
    testNetwork(done, params);
});
it('Allows selection of Vertcoin', function(done) {
    var params = {
        selectText: "VTC - Vertcoin",
        phrase: "abandon abandon ability",
        firstAddress: "Vf6koGuiWdXQfx8tNqxoNeEDxh4xh5cxsG",
        firstPubKey: "02f15155bc5445fc764db199da5e7ac92112ab9f2a5e408904f145ea29d169010a",
        firstPrivKey: "Kxu4LwEJZooaVWGT9ZLzJBuaUFr1hLjuottjT7eTNNWJKk7Hur1u",
    };
    testNetwork(done, params);
});
it('Allows selection of Vivo', function(done) {
    var params = {
        selectText: "VIVO - Vivo",
        phrase: "abandon abandon ability",
        firstAddress: "VFmBwuXXGhJe7MarQG2GfzHMFebRHgfSpB",
        firstPubKey: "02d24546a74522e0dc8bbfde66e65201ae81b0f6e2b60239c8baf09c1a53b73f8c",
        firstPrivKey: "WLSLMqZjuwzibyhPfaYvxG4z1tRnmVX4yYFtbQmHhU4eKt12Nuqq",
    };
    testNetwork(done, params);
});
it('Allows selection of Vpncoin', function(done) {
    var params = {
        selectText: "VASH - Vpncoin",
        phrase: "abandon abandon ability",
        firstAddress: "VoEmH1qXC4TsSgBAStR21QYetwnFqbqCx9",
        firstPubKey: "039e579dd18157ef1dff74d46f0bdb95f729d3985f0d4f9167fed4095b1aba846c",
        firstPrivKey: "WTbS2wjqeTzs8nk1E1N8RxpPUow8wNkgCjfDCuvDLRHaWFuNhxMz",
    };
    testNetwork(done, params);
});
it('Allows selection of VeChain', function(done) {
    var params = {
        selectText: "VET - VeChain",
        phrase: "abandon abandon ability",
        firstAddress: "0xdba55B1B6070f3a733D5eDFf35F0da4A00E455F2",
        firstPubKey: "0x0386911777255ed1d57906dcc85ca7fd4ba9eb4c8160ced97817933919d1ffe7ad",
        firstPrivKey: "0x3ec2b392952fe8a82a319c8ca9a4bb9c1db7beb09c64799da7693615ba1a787e",
    };
    testNetwork(done, params);
});
it('Allows selection of Whitecoin Classic', function(done) {
    var params = {
        selectText: "XWCC - Whitecoin Classic",
        phrase: "abandon abandon ability",
        firstAddress: "WcSwCAUqrSgeSYbsaS3SSWWhsx8KRYTFDR",
        firstPubKey: "03d3f4fa758f6260bfb39664d248a32258b53a90a71224db056ee79abaa3e9f208",
        firstPrivKey: "WrGUVSubUyDx5wzjfwi3EhhUwf5anHFW7Dv9kAaTu39CtDDBJWM9",
    };
    testNetwork(done, params);
});
it('Allows selection of Whitecoin', function(done) {
    var params = {
        selectText: "XWC - Whitecoin",
        phrase: "abandon abandon ability",
        firstAddress: "XWCNY5EQsC55ifxRVEbP7H28yc3TMXC2pqsb5",
        firstPubKey: "XWC68fEy4cCc8G1UWyeMPnQ5NjEhMUFSvu1oz4gLKxvj3dPvh7v18",
        firstPrivKey: "5K8toD6TYy5DMHkxjpywXNLj4M6CjZAT5h12uhRuVuBBRtci8Zw",
    };
    testNetwork(done, params);
});
it('Allows selection of Wincoin', function(done) {
    var params = {
        selectText: "WC - Wincoin",
        phrase: "abandon abandon ability",
        firstAddress: "WaDVCESMGgyKgNESdn3u43NnwmGSkZED3Z",
        firstPubKey: "02d10b29f6d88dd86f733b2140ba2207a9dfb5d014bb287541c66a41e467e231a7",
        firstPrivKey: "WmLWUvbz8UF1s7PrHyeQBMLbt4LpmQrwbzatvusvx6SRoNASbWtW",
    };
    testNetwork(done, params);
});
it('Allows selection of Zcash', function(done) {
    var params = {
        selectText: "ZEC - Zcash",
        phrase: "abandon abandon ability",
        firstAddress: "t1Sz8AneMcVuzUg3tPJ8et5AS5LFJ7K2EF9",
        firstPubKey: "035864cede8db462f7ccfda96bd7358156e198a894032cfc87505d82abb6d48b48",
        firstPrivKey: "L1eU2kCeBQBZTQKKt7uYu4pb6Z1ZMy1Km1VMznUvGyH64GTxMqfL",
    };
    testNetwork(done, params);
});
it('Allows selection of Zclassic', function(done) {
    var params = {
        selectText: "ZCL - Zclassic",
        phrase: "abandon abandon ability",
        firstAddress: "t1TBMxTvVJRybUbMLGWq8H4A8F4VUL7czEc",
        firstPubKey: "02fbdf32c4d9e692d4a94aa09f830a2a3b7b73f5c4f313b8234fc39a8b151c9ab7",
        firstPrivKey: "L5N7BBrrAweLcbAQGVDLZAaX9DnfAiD2VCZBBU1U3HBftFsRfHm7",
    };
    testNetwork(done, params);
});
it('Allows selection of Horizen', function(done) {
    var params = {
        selectText: "ZEN - Horizen",
        phrase: "abandon abandon ability",
        firstAddress: "znWh9XASyW2dZq5tck84wFjiwuqVysi7q3p",
        firstPubKey: "0326a78c08ef8a2b6c0d0d3959ffeddaad64fc921b0e714baeafff4785db31ff7a",
        firstPrivKey: "L25L6Ctvb4fr6fTaVVECE2CVoeGuttfUJqk1HQxfuejgb5QZHu8y",
    };
    testNetwork(done, params);
});
it('Allows selection of Energi', function(done) {
    var params = {
        selectText: "NRG - Energi",
        phrase: "abandon abandon ability",
        firstAddress: "EejRy4t4nidzhGGzkJUgFP3z4HYBjhTsRt",
        firstPubKey: "03a4aa1d4d5bdce7c18df69b123ef292e7e9b6069948b14bf3ee089188076e7c80",
        firstPrivKey: "GkMWjZtHh9RXFeNL2m5GKPp3wdNmiaSqqUWVLunR766TjbigK4FC",
    };
    testNetwork(done, params);
});
it('Allows selection of Ethereum Classic', function(done) {
    var params = {
        selectText: "ETC - Ethereum Classic",
        phrase: "abandon abandon ability",
        firstAddress: "0x3c05e5556693808367afB62eF3b63e35d6eD249A",
        firstPubKey: "0x02afa443029a20b62fe90c3eaa772d440d8e2ddc1ad247c3473b3ff34dc0583f3f",
        firstPrivKey: "0x5253e43358ddb97c8c710a2f51fcbdf7c07aad193ddd29c8b57dbab50d6141f2",
    };
    testNetwork(done, params);
});
it('Allows selection of Pirl', function(done) {
    var params = {
        selectText: "PIRL - Pirl",
        phrase: "abandon abandon ability",
        firstAddress: "0xe77FC0723dA122B5025CA79193c28563eB47e776",
        firstPubKey: "0x039b4d13ecf9ef299546ba0d486969e0b659baa0cb71278501a46dce4381f612de",
        firstPrivKey: "0xe76ed1cffd0572b31be2ada6848d46e267b8b2242b30f1a92142f64ee4772460",
    };
    testNetwork(done, params);
});
it('Allows selection of MIX', function(done) {
    var params = {
        selectText: "MIX - MIX",
        phrase: "abandon abandon ability",
        firstAddress: "0x98BC5e63aeb6A4e82d72850d20710F07E29A29F1",
        firstPubKey: "0x02686ad3d73950627c46b73cd0c0d3b17e0bdcb89c094ce68b2f4219c09016c547",
        firstPrivKey: "0x70deca38fff7d8a2490491deb1bb7fbc979d6a0b97000b9f1eddefdd214eb7da",
    };
    testNetwork(done, params);
});
it('Allows selection of Monkey Project', function(done) {
    var params = {
        selectText: "MONK - Monkey Project",
        phrase: "abandon abandon ability",
        firstAddress: "MnLrcnnUzKnf7TzufjRe5DLZqQJz18oYyu",
        firstPubKey: "03a3f72bd9023fa12b22e5255d74e80420a968b577efbc52cea283da0f6690d4fc",
        firstPrivKey: "9B4CknHTfmvPS3oEG6AjJUMz1SZtJKN6rmEoaFoZNCJd1EU1xVdS",
    };
    testNetwork(done, params);
});

it('Allows selection of MOAC', function(done) {
    var params = {
        selectText: "MOAC - MOAC",
        phrase: "ill clump only blind unit burden thing track silver cloth review awake useful craft whale all satisfy else trophy sunset walk vanish hope valve",
        firstAddress: "0xa1350EA5707247e0092Ab780A0CDbeA9c8C7Acb5",
        firstPubKey: "0x0376b024c6068c9fda7e91779e115dcd3a70584fd6984e6dd25da144c46ca259c6",
        firstPrivKey: "0x2515f9db03c1e56de393648eabf35d288f730aadce5d30865c52e72b28e303c9",
    };
    testNetwork(done, params);
});
it('Allows selection of Musicoin', function(done) {
    var params = {
        selectText: "MUSIC - Musicoin",
        phrase: "abandon abandon ability",
        firstAddress: "0xDc060e4A0b0313ea83Cf6B3A39B9db2D29004897",
        firstPubKey: "0x02a17278d54548e7cf0c1e6120646174f42e380ae5a0080f1a0d09f118305d6f9f",
        firstPrivKey: "0xaea8683b8bfd56b6fc68c19b88eee4ccd2f00430bc466741d0297aa65c7b56a5",
    };
    testNetwork(done, params);
});
it('Allows selection of Poa', function(done) {
    var params = {
        selectText: "POA - Poa",
        phrase: "abandon abandon ability",
        firstAddress: "0x53aF28d754e106210C3d0467Dd581eaf7e3C5e60",
        firstPubKey: "0x02cda40cf7f21f370afe0206cbf219f963369d7c7229dc7ba64137358489d96567",
        firstPrivKey: "0xed0a44cff8e44fa978f339af3308ee439c30f4170671ad0e1ccd7e4bfff70ed9",
    };
    testNetwork(done, params);
});
it('Allows selection of Expanse', function(done) {
    var params = {
        selectText: "EXP - Expanse",
        phrase: "abandon abandon ability",
        firstAddress: "0xf57FeAbf26582b6E3E666559d3B1Cc6fB2b2c5F6",
        firstPubKey: "0x0232fa15f0971f93c182afea54cb28a3180f5a4c31759235ca6ceca47a5a777335",
        firstPrivKey: "0x9f96418f9ec3672b52c2a6421272650b2d5992d524a48905a4ff0ed9ce347c9b",
    };
    testNetwork(done, params);
});
it('Allows selection of Callisto', function(done) {
    var params = {
        selectText: "CLO - Callisto",
        phrase: "abandon abandon ability",
        firstAddress: "0x4f9364F7420B317266C51Dc8eB979717D4dE3f4E",
        firstPubKey: "0x0313d9db8d77249c768630a5a8315e08e3a3284d7e18774476d15e073931ddc15e",
        firstPrivKey: "0x02bbf00719f3730baf989f7392b8d55548dd349abd744c68242c69bd016ce28d",
    };
    testNetwork(done, params);
});
it('Allows selection of HUSH', function(done) {
    var params = {
        selectText: "HUSH - Hush (Legacy)",
        phrase: "abandon abandon ability",
        firstAddress: "t1g6rLXUnJaiJuu4q4zmJjoa9Gk4fwKpiuA",
        firstPubKey: "038702683b2d7bbb5c35e18e01cd18483cda8485fb919f34c0186ae31a05007755",
        firstPrivKey: "Kx99fhLCDHPsBsZAJDH7v8vgGDch4rNr9VjhAUMfVevJWnoGr8WD",
    };
    testNetwork(done, params);
});
it('Allows selection of HUSH3', function(done) {
    var params = {
        selectText: "HUSH - Hush3",
        phrase: "abandon abandon ability",
        firstAddress: "RXWSQhwvw5jHPGP8bjwJhWoRnMLBnuPDKD",
        firstPubKey: "038702683b2d7bbb5c35e18e01cd18483cda8485fb919f34c0186ae31a05007755",
        firstPrivKey: "UpvyyNxAiWN7evMFUkxhgabuCHfq9xeTv17Wjj9LxN91QegKs6RR",
    };
    testNetwork(done, params);
});
it('Allows selection of ExchangeCoin', function(done) {
    var params = {
        selectText: "EXCC - ExchangeCoin",
        phrase: "abandon abandon ability",
        firstAddress: "22txYKpFN5fwGwdSs2UBf7ywewbLM92YqK7E",
        firstPubKey: "033f5aed5f6cfbafaf223188095b5980814897295f723815fea5d3f4b648d0d0b3",
        firstPrivKey: "L26cVSpWFkJ6aQkPkKmTzLqTdLJ923e6CzrVh9cmx21QHsoUmrEE",
    };
    testNetwork(done, params);
});
it('Allows selection of Artax', function(done) {
    var params = {
        selectText: "XAX - Artax",
        phrase: "abandon abandon ability",
        firstAddress: "AYxaQPY7XLidG31V7F3yNzwxPYpYzRqG4q",
        firstPubKey: "02edef928ec3951112452119f9a63d9479741ea0fc497682bd13064cfc5d1cc4e3",
        firstPrivKey: "PMcqFx52ipYy9gZynEi5LYVD3XUC8YbQr2Neg6e3LFnh4yTBQ9yJ",
    };
    testNetwork(done, params);
});
it('Allows selection of BitcoinGreen', function(done) {
    var params = {
        selectText: "BITG - Bitcoin Green",
        phrase: "abandon abandon ability",
        firstAddress: "GeNGm9SkEfwbsws3UrrUSE2sJeyWYjzraY",
        firstPubKey: "02a8e34c2599a14ca861285b734750432a7ce10caf7f1ff5a366a94264c636a12b",
        firstPrivKey: "7uf6WeVgBqKR1WyUcaz1TLSKabyov9SfQDghyvfaCy6VZPwLNeku",
    };
    testNetwork(done, params);
});
it('Allows selection of ANON', function(done) {
    var params = {
        selectText: "ANON - ANON",
        phrase: "abandon abandon ability",
        firstAddress: "AnU6pijpEeUZFWSTyM2qTqZQn996Zq1Xard",
        firstPubKey: "032742ff4eaf9188d84d38dfb4a2fdbb541bfd3ca9ee533a7d1092940a1ea60bb4",
        firstPrivKey: "L2w3aoZExc9eHh1KMnDzrzaSVmfgQMvBxxFbtcegKNvrHVa4r81m",
    };
    testNetwork(done, params);
});
it('Allows selection of ProjectCoin', function(done) {
    var params = {
        selectText: "PRJ - ProjectCoin",
        phrase: "abandon abandon ability",
        firstAddress: "PXZG97saRseSCftfe1mcFmfAA7pf6qBbaz",
        firstPubKey: "025f84297a93a33bccb735c931140ddb4279fe9d55a571ee7731259e3e19d0c7fe",
        firstPrivKey: "JRR5uB6daEtSCLNnv7hKSgZ5KmFdHMUcpTzJGtEAi9sWSiQd4hVQ",
    };
    testNetwork(done, params);
});
it('Allows selection of Phore', function(done) {
    var params = {
        selectText: "PHR - Phore",
        phrase: "abandon abandon ability",
        firstAddress: "PJThxpoXAG6hqrmdeQQbVDX4TJtFTMMymC",
        firstPubKey: "022ef3c4cbc0481fd925ecac51f09f2976ea024b0863b543b1b481181e1ef34265",
        firstPrivKey: "YPzQxHMA2Pm5S2p8Xwhmhm2PnH6ooYHrWNXiAKCCA2CjMtHyNzuh",
    };
    testNetwork(done, params);
});
it('Allows selection of Safecoin', function(done) {
     var params = {
         selectText: "SAFE - Safecoin",
        phrase: "abandon abandon ability",
         firstAddress: "RtxHpnhJz6RY8k9owP3ua5QWraunmewB1G",
        firstPubKey: "0383956cd23c1124324c92ac69f4bcf71ad973892a83aceb4085041afb082f6db9",
        firstPrivKey: "Uznk2AHWqpSGRw8dmG3t3Q3rJJwyn3TcjzWh9EgDCQ9jU34DWF6m",
     };
     testNetwork(done, params);
 });
it('Allows selection of Blocknode', function(done) {
    var params = {
        selectText: "BND - Blocknode",
        phrase: "abandon abandon ability",
        firstAddress: "BG8xZSAur2jYLG9VXt8dYfkKxxeR7w9bSe",
        firstPubKey: "03e91c00dcfca87c80f57691e34e0e4c55a18eb79048dbdd5f6d9c83daefea6459",
        firstPrivKey: "C6gySxND85cLnLgsjTfUxXmMzh8JrSR24vpQnUHqVMqGYy36k4ho",
    };
    testNetwork(done, params);
});
it('Allows selection of Blocknode Testnet', function(done) {
    var params = {
        selectText: "tBND - Blocknode Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "bSptsFyDktFSKpWveRywJsDoJA2TC6qfHv",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "MPuJVFnTAhFFvtLqgYL32FBF1g7jPraowuN5tV9EF2AtkYXCfkE3",
    };
    testNetwork(done, params);
});
it('Allows selection of LitecoinZ', function(done) {
    var params = {
        selectText: "LTZ - LitecoinZ",
        phrase: "abandon abandon ability",
        firstAddress: "L1VTXju7hLgKV4T7fGXS9sKsnm2gmtRCmyw",
        firstPubKey: "03ea84a1cc8b43ea8330bc2f363e706a9ff2d48858185c42c296d06ddcb94bc827",
        firstPrivKey: "L1PktmLfTgVRQZsqs2ZoFBBqnVXi5hVAimJt8tmfT2ye95WH9zEd",
    };
    testNetwork(done, params);
});
it('Allows selection of BlockStamp', function(done) {
    var params = {
        selectText: "BST - BlockStamp",
        phrase: "abandon abandon ability",
        firstAddress: "15gypKtim4cVTj137ApfryG17RkvSbPazZ",
        firstPubKey: "0277bc537f8354004f8a77e07fb78b38f291df7bc07819c2d7eab049b8d10b3f7f",
        firstPrivKey: "L1NmycTQz17fXBMzK25aBTnN7v5U6rz3AURjL72xyKg21zmAmgt7",
    };
    testNetwork(done, params);
});
it('Allows selection of DEXON', function(done) {
    var params = {
        selectText: "DXN - DEXON",
        phrase: "abandon abandon ability",
        firstAddress: "0x136a58788033E028CCd740FbDec6734358DB56Ec",
        firstPubKey: "0x028d7fa8c3417904cec37946db8d12bba51d85dde25156651f216260e0ff641cf4",
        firstPrivKey: "0x8d7d8479dac38e786d4e493159dd655e116871d17ed803af6bb70207c60298ff",
    };
    testNetwork(done, params);
});
it('Allows selection of Ellaism', function(done) {
    var params = {
        selectText: "ELLA - Ellaism",
        phrase: "abandon abandon ability",
        firstAddress: "0xa8B0BeA09eeBc41062308546a01d6E544277e2Ca",
        firstPubKey: "0x03698fee21c52ad4b4772df3da92ddf0278da529da231c2ebfb167c9e3cc88f29f",
        firstPrivKey: "0xe10bc99fcea6f5bca20c1b6e5386a18991b8d16d658b36881b7aca792e06bac2",
    };
    testNetwork(done, params);
});
it('Allows selection of Ethersocial Network', function(done) {
    var params = {
        selectText: "ESN - Ethersocial Network",
        phrase: "abandon abandon ability",
        firstAddress: "0x6EE99Be2A0C7F887a71e21C8608ACF0aa0D2b767",
        firstPubKey: "0x028df59c64daa4f1036fe0dc832c4e36d9df0692a7ed9a062d48a4662a01d2c7b3",
        firstPrivKey: "0x44e0316578fd8168022039d5dfd5838e70826686a4b05dec9c88100c30049fce",
    };
    testNetwork(done, params);
});
it('Allows selection of Stellar', function(done) {
    var params = {
        selectText: "XLM - Stellar",
        phrase: "abandon abandon ability",
        firstAddress: "GCUK3NYYUXA2QGN6KU5RR36WAKN3Y5EANZV65XNAWN4XM4CHQ3G4DMO2",
        firstPubKey: "GCUK3NYYUXA2QGN6KU5RR36WAKN3Y5EANZV65XNAWN4XM4CHQ3G4DMO2",
        firstPrivKey: "SA35HYGAHWYYLCW2P5EDHGWAYQW2C5F25KH4KFWEXLG5I4CPKPZTLRM5",
    };
    testNetwork(done, params);
});
it('Allows selection of Nano', function(done) {
    var params = {
        selectText: "NANO - Nano",
        phrase: "deal wedding panda forum property artist whip total word student sea middle",
        firstAddress: "nano_15fum9n68681dz73qyu37fuc9tro84gqm86eptdqpm9jutkfnt34agkoqpw5",
        firstPubKey: "0dbb99e84310c05fca1bfb612b76a3eb15309d79988cb6977b4cf1dea4da6822",
        firstPrivKey: "30633c8497cc47e0aefd52c7971ffd45e6c5d166274c7978feca3482a859c0af",
    };
    testNetwork(done, params);
});
it('Allows selection of Wagerr', function(done) {
    var params = {
        selectText: "WGR - Wagerr",
        phrase: "abandon abandon ability",
        firstAddress: "WYiVgQU39VcQxcnacoCiaZHZZLjDCJoS95",
        firstPubKey: "0343cfa1ed85e02fdc782c3c8b0b5febe7653c30a0c4319bef2e7d462e67245e46",
        firstPrivKey: "WagfoYsRKgtBwBMgwYWuboY2DpGjJBpFcneqzSegZg4ppvYLWcry",
    };
    testNetwork(done, params);
});
it('Allows selection of Groestlcoin', function(done) {
    var params = {
        selectText: "GRS - Groestlcoin",
        phrase: "abandon abandon ability",
        firstAddress: "FZycsFvZ1eH1hbtyjBpAgJSukVw1bN6PBN",
        firstPubKey: "03c1d0c7b272a762b4b697bdb1b3b36e26add3215e69f7251db16c5a51c84b7b4c",
        firstPrivKey: "KzQVqEsQrKjb4K6bViRqqQJc9nXrvEAxDy2AiPf6tfEkRW7rgNfg",
    };
    testNetwork(done, params);
});
it('Allows selection of Groestlcoin Testnet', function(done) {
    var params = {
        selectText: "GRS - Groestlcoin Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "mucaU5iiDaJDb69BHLeDv8JFfGiygRPne9",
        firstPubKey: "0382a5450765e2025bdb5f7d109c9254a11ef97a566228bf171d80ecb348763bb0",
        firstPrivKey: "cV3coiYD2NhHKfhC6Gb8DzpvPzcGYYExYxuNxpUtKq3VUJpRHpNq",
    };
    testNetwork(done, params);
});
it('Allows selection of Elastos', function(done) {
    var params = {
        selectText: "ELA - Elastos",
        phrase: "abandon abandon ability",
        firstAddress: "EMccDcsn3SwPDcfeQMf3w7utqi8ioWYtkg",
        firstPubKey: "02c936d5025b06acc283bf9562700279fd1ea3ce7ee204afca0c07be77bc3b4822",
        firstPrivKey: "608f7e64b46a1df51ba6b5b38b0599196afd1f36572b1ec696d7aae65d05045d",
    };
    testNetwork(done, params);
});
it('Allows selection of Energyweb', function(done) {
    var params = {
        selectText: "EWT - EnergyWeb",
        phrase: "abandon abandon ability",
        firstAddress: "0x22171474844Fc7E8E99A3A69CCf1eDb5574FdD4c",
        firstPubKey: "0x03eee63d4d201168802b43f392e61f148a478935055cd990549452c741f4c34b84",
        firstPrivKey: "0x325aa9e82d03b3773859d84bece81a598df8478d361cfbc59efc27385e0e3611",
    };
    testNetwork(done, params);
});
it('Allows selection of Thought', function(done) {
    var params = {
        selectText: "THT - Thought",
        phrase: "abandon abandon ability",
        firstAddress: "4B1Bh9GibDarFQrhtYU8krpc7WSjgGfYvo",
        firstPubKey: "0390e4598e7924f3b0369020394b133545db6bd37fa3aa4648aafbce46330c28cc",
        firstPrivKey: "KCwL3y6VVrgzJFqtCkh2RV9M1zruX9NymKsWheb7by1dWLd2QkFx",
    };
    testNetwork(done, params);
});
it('Allows selection of EtherCore', function(done) {
    var params = {
        selectText: "ERE - EtherCore",
        phrase: "abandon abandon ability",
        firstAddress: "0x119e6EAC3Ce1b473D62d9fD847fb0ea222eF1D9e",
        firstPubKey: "0x02cfeb9a4d8003b5c919c1eb67c91e06b3c08e602a336f74017fc7c756a2550ca9",
        firstPrivKey: "0x6bb6e036aaf39326d3c74345ec34ef0c73b1608acb409306c9ba73d22de6abf0",
    };
    testNetwork(done, params);
});
it('Allows selection of RBTC - RSK', function(done) {
    var params = {
        selectText: "R-BTC - RSK",
        phrase: "abandon abandon ability",
        firstAddress: "0x37CA764c4b2fe819108448b80d2F35921b035931",
        firstPubKey: "0x0219d9b5087ab68edc8a714969d8cb70e7159417b47a05932b227e6f417c7962b9",
        firstPrivKey: "0x6e6f48cc422825f7fd68f2200d3dde757849f15342f252eeb0bc4ebc46089fe1",
    };
    testNetwork(done, params);
});
it('Allows selection of tRBTC - RSK Testnet', function(done) {
    var params = {
        selectText: "tR-BTC - RSK Testnet",
        phrase: "abandon abandon ability",
        firstAddress: "0x176484B5a155Fe802aCB26055eb1c193D5A576d5",
        firstPubKey: "0x03f77eb7bd83e92ef47be1abddae7f71fb0bc8a7a1ee4b193662a86ed2705ffc5b",
        firstPrivKey: "0x18c2400d2f818d28b80d0e31235873bfeef644fc45fd702f54ae0d422cff6ab3",
    };
    testNetwork(done, params);
});
it('Allows selection of Argoneum', function(done) {
    var params = {
        selectText: "AGM - Argoneum",
        phrase: "abandon abandon ability",
        firstAddress: "MWgLPvJkaJwH6hrXFs1MimAC4FwC1kYRhe",
        firstPubKey: "0348e5252045fee1d3b1e5bce25dbc16284d5b6c3bfff9c305d4ffa6078c16f3f8",
        firstPrivKey: "VJXpuMEFnK8USLyo5tgF7M4cBXU44U8MUor1KRTQ6t9DVno9AAgg",
    };
    testNetwork(done, params);
});
it('Allows selection of CranePay', function(done) {
    var params = {
        selectText: "CRP - CranePay",
        phrase: "abandon abandon ability",
        firstAddress: "CcUHPqgmef1BmgWFa9g3YNc8scgVXVh8ip",
        firstPubKey: "0392af9ea9dc78170c6f68c50bac926f960e50769295f539ac6382a3af2b928740",
        firstPrivKey: "KHTCAvKHKg1WdLoDSg3VjjyZK5Wk1ihzJENpp2YMb1RmAxrCZrXX",
    };
    testNetwork(done, params);
});
it('Allows selection of Scribe', function(done) {
    var params = {
        selectText: "SCRIBE - Scribe",
        phrase: "abandon abandon ability",
        firstAddress: "RYAnPeBLD8veZ9Tw8xugeTC2f9PeZonLHM",
        firstPubKey: "02c912bc4759c8a209475502fb5352ff5be8a8f13eb72f1732ee25125cd53edc1e",
        firstPrivKey: "HLZWvNCEUv4ghygjH9A2EYCa9HNRcxe5CS42kzUTmoxJYp3z96QE",
    };
    testNetwork(done, params);
});
it('Allows selection of Binance Smart Chain', function(done) {
    var params = {
        selectText: "BSC - Binance Smart Chain",
        phrase: "abandon abandon ability",
        firstAddress: "0xe5815d5902Ad612d49283DEdEc02100Bd44C2772",
        firstPubKey: "0x03e723e5b3aa7d72213f01139aa4783e1b34f74e1a04534e3fd8e29bfe2768af8a",
        firstPrivKey: "0x8f253078b73d7498302bb78c171b23ce7a8fb511987d2b2702b731638a4a15e7",
    };
    testNetwork(done, params);
});

it('Allows selection of TRX on Tron', function(done) {
    var params = {
        selectText: "TRX - Tron",
        phrase: "abandon abandon ability",
        firstAddress: "TA891Fu7vVz595BGQpNX2MCzr7yBcxuoC7",
        firstPubKey: "0337bbb060e6166066f7f9e59e52f67bc23a6c9d0cbc815b82b6d89112444842e7",
        firstPrivKey: "3a8fbd0379a815764979de86a3fcda759cb62d49e784e7b2a9a03206c90cfae2",
    };
    testNetwork(done, params);
});

it('Allows selection of ZooBlockchain', function(done) {
    var params = {
        selectText: "ZBC - ZooBlockchain",
        phrase: "shy invest oxygen real lunar moral merge corn program air affair amazing dove imitate combine solve library fresh case alcohol pole question act thing",
        firstAddress: "ZBC_MGEZVH3U_SXPCBHTU_KSWDPQ4X_K6MSI3VR_CQAYMTLC_RXUMM3DJ_LFABCAXA",
        firstPubKey: "61899a9f7495de209e7454ac37c3975799246eb11401864d628de8c66c695940",
        firstPrivKey: "adb11e79068fa7366ec4f5963ad57115d666b1ad2b369b92d962563adf7dd48b",
    };
    testNetwork(done, params);
});

// BIP39 seed is set from phrase
it('Sets the bip39 seed from the prhase', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.seed'))
            .getAttribute("value")
            .then(function(seed) {
                expect(seed).toBe("20da140d3dd1df8713cefcc4d54ce0e445b4151027a1ab567b832f6da5fcc5afc1c3a3f199ab78b8e0ab4652efd7f414ac2c9a3b81bceb879a70f377aa0a58f3");
                done();
            })
    });
});

// BIP32 root key is set from phrase
it('Sets the bip39 root key from the prhase', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.root-key'))
            .getAttribute("value")
            .then(function(seed) {
                expect(seed).toBe("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi");
                done();
            })
    });
});

// Tabs show correct addresses when changed
it('Shows the correct address when tab is changed', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip32-tab a'))
            .click();
        driver.sleep(generateDelay).then(function() {
            getFirstAddress(function(address) {
                expect(address).toBe("17uQ7s2izWPwBmEVFikTmZUjbBKWYdJchz");
                done();
            });
        });
    });
});

// BIP44 derivation path is shown
it('Shows the derivation path for bip44 tab', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip44 .path'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("m/44'/0'/0'/0");
                done();
            })
    });
});

// BIP44 extended private key is shown
it('Shows the extended private key for bip44 tab', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-priv-key'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("xprvA2DxxvPZcyRvYgZMGS53nadR32mVDeCyqQYyFhrCVbJNjPoxMeVf7QT5g7mQASbTf9Kp4cryvcXnu2qurjWKcrdsr91jXymdCDNxKgLFKJG");
                done();
            })
    });
});

// BIP44 extended public key is shown
it('Shows the extended public key for bip44 tab', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-pub-key'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("xpub6FDKNRvTTLzDmAdpNTc49ia9b4byd6vqCdUa46Fp3vqMcC96uBoufCmZXQLiN5AK3iSCJMhf9gT2sxkpyaPepRuA7W3MujV5tGmF5VfbueM");
                done();
            })
    });
});

// BIP44 account field changes address list
it('Changes the address list if bip44 account is changed', function(done) {
    driver.findElement(By.css('#bip44 .account'))
        .sendKeys('1');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("1Nq2Wmu726XHCuGhctEtGmhxo3wzk5wZ1H");
            done();
        });
    });
});

// BIP44 change field changes address list
it('Changes the address list if bip44 change is changed', function(done) {
    driver.findElement(By.css('#bip44 .change'))
        .sendKeys('1');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("1KAGfWgqfVbSSXY56fNQ7YnhyKuoskHtYo");
            done();
        });
    });
});

// BIP32 derivation path can be set
it('Can use a custom bip32 derivation path', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.findElement(By.css('#bip32 .path'))
        .clear();
    driver.findElement(By.css('#bip32 .path'))
        .sendKeys('m/1');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("16pYQQdLD1hH4hwTGLXBaZ9Teboi1AGL8L");
            done();
        });
    });
});

// BIP32 can use hardened derivation paths
it('Can use a hardened derivation paths', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.findElement(By.css('#bip32 .path'))
        .clear();
    driver.findElement(By.css('#bip32 .path'))
        .sendKeys("m/0'");
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("14aXZeprXAE3UUKQc4ihvwBvww2LuEoHo4");
            done();
        });
    });
});

// BIP32 extended private key is shown
it('Shows the BIP32 extended private key', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-priv-key'))
            .getAttribute("value")
            .then(function(privKey) {
                expect(privKey).toBe("xprv9va99uTVE5aLiutUVLTyfxfe8v8aaXjSQ1XxZbK6SezYVuikA9MnjQVTA8rQHpNA5LKvyQBpLiHbBQiiccKiBDs7eRmBogsvq3THFeLHYbe");
                done();
            });
    });
});

// BIP32 extended public key is shown
it('Shows the BIP32 extended public key', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-pub-key'))
            .getAttribute("value")
            .then(function(pubKey) {
                expect(pubKey).toBe("xpub69ZVZQzP4T8dwPxwbMzz36cNgwy4yzTHmETZMyihzzXXNi3thgg3HCow1RtY252wdw5rS8369xKnraN5Q93y3FkFfJp2XEHWUrkyXsjS93P");
                done();
            });
    });
});

// Derivation path is shown in table
it('Shows the derivation path in the table', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstPath(function(path) {
            expect(path).toBe("m/44'/0'/0'/0/0");
            done();
        });
    });
});

// Derivation path for address can be hardened
it('Can derive hardened addresses', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.executeScript(function() {
        $(".hardened-addresses").prop("checked", true);
    });
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("18exLzUv7kfpiXRzmCjFDoC9qwNLFyvwyd");
            done();
        });
    });
});

// Derivation path visibility can be toggled
it('Can toggle visibility of the derivation path column', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.index-toggle'))
            .click();
        testColumnValuesAreInvisible(done, "index");
    });
});

// Address is shown
it('Shows the address in the table', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug");
            done();
        });
    });
});

// Addresses are shown in order of derivation path
it('Shows the address in order of derivation path', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        testRowsAreInCorrectOrder(done);
    });
});

// Address visibility can be toggled
it('Can toggle visibility of the address column', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.address-toggle'))
            .click();
        testColumnValuesAreInvisible(done, "address");
    });
});

// Public key is shown in table
it('Shows the public key in the table', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('.pubkey'))
            .then(function(els) {
                els[0].getText()
                    .then(function(pubkey) {
                        expect(pubkey).toBe("033f5aed5f6cfbafaf223188095b5980814897295f723815fea5d3f4b648d0d0b3");
                        done();
                    });
            });
    });
});

// Public key visibility can be toggled
it('Can toggle visibility of the public key column', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.public-key-toggle'))
            .click();
        testColumnValuesAreInvisible(done, "pubkey");
    });
});

// Private key is shown in table
it('Shows the private key in the table', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('.privkey'))
            .then(function(els) {
                els[0].getText()
                    .then(function(pubkey) {
                        expect(pubkey).toBe("L26cVSpWFkJ6aQkPkKmTzLqTdLJ923e6CzrVh9cmx21QHsoUmrEE");
                        done();
                    });
            });
    });
});

// Private key visibility can be toggled
it('Can toggle visibility of the private key column', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.private-key-toggle'))
            .click();
        testColumnValuesAreInvisible(done, "privkey");
    });
});

// More addresses can be generated
it('Can generate more rows in the table', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.more'))
            .click();
        driver.sleep(generateDelay).then(function() {
            driver.findElements(By.css('.address'))
                .then(function(els) {
                    expect(els.length).toBe(40);
                    done();
                });
        });
    });
});

// A custom number of additional addresses can be generated
it('Can generate more rows in the table', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.rows-to-add'))
            .clear();
        driver.findElement(By.css('.rows-to-add'))
            .sendKeys('1');
        driver.findElement(By.css('.more'))
            .click();
        driver.sleep(generateDelay).then(function() {
            driver.findElements(By.css('.address'))
                .then(function(els) {
                    expect(els.length).toBe(21);
                    done();
                });
        });
    });
});

// Additional addresses are shown in order of derivation path
it('Shows additional addresses in order of derivation path', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.more'))
            .click();
        driver.sleep(generateDelay).then(function() {
            testRowsAreInCorrectOrder(done);
        });
    });
});

// BIP32 root key can be set by the user
it('Allows the user to set the BIP32 root key', function(done) {
    driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug");
            done();
        });
    });
});

// Setting BIP32 root key clears the existing phrase, passphrase and seed
it('Confirms the existing phrase should be cleared', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('A non-blank but invalid value');
    driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi');
    driver.switchTo().alert().accept();
    driver.findElement(By.css('.phrase'))
    .getAttribute("value").then(function(value) {
        expect(value).toBe("");
        done();
    });
});

// Clearing of phrase, passphrase and seed can be cancelled by user
it('Allows the clearing of the phrase to be cancelled', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.root-key'))
            .clear();
        driver.findElement(By.css('.root-key'))
            .sendKeys('x');
        driver.switchTo().alert().dismiss();
        driver.findElement(By.css('.phrase'))
        .getAttribute("value").then(function(value) {
            expect(value).toBe("abandon abandon ability");
            done();
        });
    });
});

// Custom BIP32 root key is used when changing the derivation path
it('Can set derivation path for root key instead of phrase', function(done) {
    driver.findElement(By.css('#bip44 .account'))
        .sendKeys('1');
    driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("1Nq2Wmu726XHCuGhctEtGmhxo3wzk5wZ1H");
            done();
        });
    });
});

// Incorrect mnemonic shows error
it('Shows an error for incorrect mnemonic', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon');
    driver.sleep(feedbackDelay).then(function() {
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                expect(feedback).toBe("Invalid mnemonic");
                done();
            });
    });
});

// Incorrect word shows suggested replacement
it('Shows word suggestion for incorrect word', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abiliti');
    driver.sleep(feedbackDelay).then(function() {
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "abiliti not in wordlist, did you mean ability?";
                expect(feedback).toBe(msg);
                done();
            });
    });
});

// Github pull request 48
// First four letters of word shows that word, not closest
// since first four letters gives unique word in BIP39 wordlist
// eg ille should show illegal, not idle
it('Shows word suggestion based on first four chars', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('ille');
    driver.sleep(feedbackDelay).then(function() {
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "ille not in wordlist, did you mean illegal?";
                expect(feedback).toBe(msg);
                done();
            });
    });
});

// Incorrect BIP32 root key shows error
it('Shows error for incorrect root key', function(done) {
    driver.findElement(By.css('.root-key'))
        .sendKeys('xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpj');
    driver.sleep(feedbackDelay).then(function() {
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "Invalid root key";
                expect(feedback).toBe(msg);
                done();
            });
    });
});

// Derivation path not starting with m shows error
it('Shows error for derivation path not starting with m', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.findElement(By.css('#bip32 .path'))
        .clear();
    driver.findElement(By.css('#bip32 .path'))
        .sendKeys('n/0');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(feedbackDelay).then(function() {
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "First character must be 'm'";
                expect(feedback).toBe(msg);
                done();
            });
    });
});

// Derivation path containing invalid characters shows useful error
it('Shows error for derivation path not starting with m', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.findElement(By.css('#bip32 .path'))
        .clear();
    driver.findElement(By.css('#bip32 .path'))
        .sendKeys('m/1/0wrong1/1');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(feedbackDelay).then(function() {
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "Invalid characters 0wrong1 found at depth 2";
                expect(feedback).toBe(msg);
                done();
            });
    });
});

// Github Issue 11: Default word length is 15
// https://github.com/iancoleman/bip39/issues/11
it('Sets the default word length to 15', function(done) {
    driver.findElement(By.css('.strength'))
        .getAttribute("value")
        .then(function(strength) {
            expect(strength).toBe("15");
            done();
        });
});

// Github Issue 12: Generate more rows with private keys hidden
// https://github.com/iancoleman/bip39/issues/12
it('Sets the correct hidden column state on new rows', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.private-key-toggle'))
            .click();
        driver.findElement(By.css('.more'))
            .click();
        driver.sleep(generateDelay).then(function() {
            driver.findElements(By.css('.privkey'))
                .then(function(els) {
                    expect(els.length).toBe(40);
                });
            testColumnValuesAreInvisible(done, "privkey");
        });
    });
});

// Github Issue 19: Mnemonic is not sensitive to whitespace
// https://github.com/iancoleman/bip39/issues/19
it('Ignores excess whitespace in the mnemonic', function(done) {
    var doublespace = "  ";
    var mnemonic = "urge cat" + doublespace + "bid";
    driver.findElement(By.css('.phrase'))
        .sendKeys(mnemonic);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.root-key'))
            .getAttribute("value")
            .then(function(seed) {
                expect(seed).toBe("xprv9s21ZrQH143K3isaZsWbKVoTtbvd34Y1ZGRugGdMeBGbM3AgBVzTH159mj1cbbtYSJtQr65w6L5xy5L9SFC7c9VJZWHxgAzpj4mun5LhrbC");
                done();
            });
    });
});

// Github Issue 23: Part 1: Use correct derivation path when changing tabs
// https://github.com/iancoleman/bip39/issues/23
// This test was failing for default timeout of 5000ms so changed it to +10s
it('Uses the correct derivation path when changing tabs', function(done) {
    // 1) and 2) set the phrase
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // 3) select bip32 tab
        driver.findElement(By.css('#bip32-tab a'))
            .click();
        driver.sleep(generateDelay).then(function() {
            // 4) switch from bitcoin to litecoin
            selectNetwork("LTC - Litecoin");
            driver.sleep(generateDelay).then(function() {
                // 5) Check address is displayed correctly
                getFirstAddress(function(address) {
                    expect(address).toBe("LS8MP5LZ5AdzSZveRrjm3aYVoPgnfFh5T5");
                    // 5) Check derivation path is displayed correctly
                    getFirstPath(function(path) {
                        expect(path).toBe("m/0/0");
                        done();
                    });
                });
            });
        });
    });
}, generateDelay + 10000);

// Github Issue 23 Part 2: Coin selection in derivation path
// https://github.com/iancoleman/bip39/issues/23#issuecomment-238011920
it('Uses the correct derivation path when changing coins', function(done) {
    // set the phrase
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // switch from bitcoin to clam
        selectNetwork("CLAM - Clams");
        driver.sleep(generateDelay).then(function() {
            // check derivation path is displayed correctly
            getFirstPath(function(path) {
                expect(path).toBe("m/44'/23'/0'/0/0");
                done();
            });
        });
    });
});

// Github Issue 26: When using a Root key derrived altcoins are incorrect
// https://github.com/iancoleman/bip39/issues/26
it('Uses the correct derivation for altcoins with root keys', function(done) {
    // 1) 2) and 3) set the root key
    driver.findElement(By.css('.root-key'))
        .sendKeys("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi");
    driver.sleep(generateDelay).then(function() {
        // 4) switch from bitcoin to viacoin
        selectNetwork("VIA - Viacoin");
        driver.sleep(generateDelay).then(function() {
            // 5) ensure the derived address is correct
            getFirstAddress(function(address) {
                expect(address).toBe("Vq9Eq4N5SQnjqZvxtxzo7hZPW5XnyJsmXT");
                done();
            });
        });
    });
});

// Selecting a language with no existing phrase should generate a phrase in
// that language.
it('Generate a random phrase when language is selected and no current phrase', function(done) {
    driver.findElement(By.css("a[href='#japanese']"))
        .click();
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(phrase) {
                expect(phrase.search(/[a-z]/)).toBe(-1);
                expect(phrase.length).toBeGreaterThan(0);
                done();
            });
    });
});

// Selecting a language with existing phrase should update the phrase to use
// that language.
it('Updates existing phrases when the language is changed', function(done) {
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css("a[href='#italian']"))
            .click();
        driver.sleep(generateDelay).then(function() {
            driver.findElement(By.css(".phrase"))
                .getAttribute("value").then(function(phrase) {
                    // Check only the language changes, not the phrase
                    expect(phrase).toBe("abaco abaco abbaglio");
                    getFirstAddress(function(address) {
                        // Check the address is correct
                        expect(address).toBe("1Dz5TgDhdki9spa6xbPFbBqv5sjMrx3xgV");
                        done();
                    });
                });
        });
    });
});

// Suggested replacement for erroneous word in non-English language
it('Shows word suggestion for incorrect word in non-English language', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abaco abaco zbbaglio');
    driver.sleep(feedbackDelay).then(function() {
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "zbbaglio not in wordlist, did you mean abbaglio?";
                expect(feedback).toBe(msg);
                done();
            });
    });
});

// Japanese word does not break across lines.
// Point 2 from
// https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md#japanese
it('Does not break Japanese words across lines', function(done) {
    driver.findElement(By.css('.phrase'))
        .getCssValue("word-break")
        .then(function(value) {
            expect(value).toBe("keep-all");
            done();
        });
});

// Language can be specified at page load using hash value in url
it('Can set the language from the url hash', function(done) {
    driver.get(url + "#japanese").then(function() {
        driver.findElement(By.css('.generate')).click();
        driver.sleep(generateDelay).then(function() {
            driver.findElement(By.css(".phrase"))
                .getAttribute("value").then(function(phrase) {
                    expect(phrase.search(/[a-z]/)).toBe(-1);
                    expect(phrase.length).toBeGreaterThan(0);
                    done();
                });
        });
    });
});

// Entropy can be entered by the user
it('Allows entropy to be entered', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys('00000000 00000000 00000000 00000000');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(phrase) {
                expect(phrase).toBe("abandon abandon ability");
                getFirstAddress(function(address) {
                    expect(address).toBe("1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug");
                    done();
                })
            });
    });
});

// A warning about entropy is shown to the user, with additional information
it('Shows a warning about using entropy', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy-container'))
        .getText()
        .then(function(containerText) {
            var warning = "mnemonic may be insecure";
            expect(containerText).toContain(warning);
            driver.findElement(By.css('#entropy-notes'))
                .findElement(By.xpath("parent::*"))
                .getText()
                .then(function(notesText) {
                    var detail = "flipping a fair coin, rolling a fair dice, noise measurements etc";
                    expect(notesText).toContain(detail);
                    done();
                });
        });
});

// The types of entropy available are described to the user
it('Shows the types of entropy available', function(done) {
    driver.findElement(By.css('.entropy'))
        .getAttribute("placeholder")
        .then(function(placeholderText) {
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
                expect(placeholderText).toContain(option);
            }
            done();
        });
});

// The actual entropy used is shown to the user
it('Shows the actual entropy used', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys('Not A Very Good Entropy Source At All');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                expect(text).toMatch(/Filtered Entropy\s+AedEceAA/);
                done();
            });
    });
});

// Binary entropy can be entered
it('Allows binary entropy to be entered', function(done) {
    testEntropyType(done, "01", "binary");
});

// Base 6 entropy can be entered
it('Allows base 6 entropy to be entered', function(done) {
    testEntropyType(done, "012345", "base 6");
});

// Base 6 dice entropy can be entered
it('Allows base 6 dice entropy to be entered', function(done) {
    testEntropyType(done, "123456", "base 6 (dice)");
});

// Base 10 entropy can be entered
it('Allows base 10 entropy to be entered', function(done) {
    testEntropyType(done, "789", "base 10");
});

// Hexadecimal entropy can be entered
it('Allows hexadecimal entropy to be entered', function(done) {
    testEntropyType(done, "abcdef", "hexadecimal");
});

// Dice entropy value is shown as the converted base 6 value
// ie 123456 is converted to 123450
it('Shows dice entropy as base 6', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys("123456");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                expect(text).toMatch(/Filtered Entropy\s+123450/);
                done();
            });
    });
});

// The number of bits of entropy accumulated is shown
it("Shows the number of bits of entropy for 20 bits of binary", function(done) {
    testEntropyBits(done, "0000 0000 0000 0000 0000", "20");
});
it("Shows the number of bits of entropy for 1 bit of binary", function(done) {
    testEntropyBits(done, "0", "1");
});
it("Shows the number of bits of entropy for 4 bits of binary", function(done) {
    testEntropyBits(done, "0000", "4");
});
it("Shows the number of bits of entropy for 1 character of base 6 (dice)", function(done) {
    // 6 in card is 0 in base 6, 0 is mapped to 00 by entropy.js
    testEntropyBits(done, "6", "2");
});
it("Shows the number of bits of entropy for 1 character of base 10 with 3 bits", function(done) {
    // 7 in base 10 is 111 in base 2, no leading zeros
    testEntropyBits(done, "7", "3");
});
it("Shows the number of bits of entropy for 1 character of base 10 with 4 bis", function(done) {
    // 8 in base 10 is mapped to 0 by entropy.js
    testEntropyBits(done, "8", "1");
});
it("Shows the number of bits of entropy for 1 character of hex", function(done) {
    testEntropyBits(done, "F", "4");
});
it("Shows the number of bits of entropy for 2 characters of base 10", function(done) {
    // 2 as base 10 is binary 010, 9 is mapped to binary 1 by entropy.js
    testEntropyBits(done, "29", "4");
});
it("Shows the number of bits of entropy for 2 characters of hex", function(done) {
    testEntropyBits(done, "0A", "8");
});
it("Shows the number of bits of entropy for 2 characters of hex with 3 leading zeros", function(done) {
    // hex is always multiple of 4 bits of entropy
    testEntropyBits(done, "1A", "8");
});
it("Shows the number of bits of entropy for 2 characters of hex with 2 leading zeros", function(done) {
    testEntropyBits(done, "2A", "8");
});
it("Shows the number of bits of entropy for 2 characters of hex with 1 leading zero", function(done) {
    testEntropyBits(done, "4A", "8");
});
it("Shows the number of bits of entropy for 2 characters of hex with no leading zeros", function(done) {
    testEntropyBits(done, "8A", "8");
});
it("Shows the number of bits of entropy for 2 characters of hex starting with F", function(done) {
    testEntropyBits(done, "FA", "8");
});
it("Shows the number of bits of entropy for 4 characters of hex with leading zeros", function(done) {
    testEntropyBits(done, "000A", "16");
});
it("Shows the number of bits of entropy for 4 characters of base 6", function(done) {
    // 5 in base 6 is mapped to binary 1
    testEntropyBits(done, "5555", "4");
});
it("Shows the number of bits of entropy for 4 characters of base 6 dice", function(done) {
    // uses dice, so entropy is actually 0000 in base 6, which is 4 lots of
    // binary 00
    testEntropyBits(done, "6666", "8");
});
it("Shows the number of bits of entropy for 4 charactes of base 10", function(done) {
    // 2 in base 10 is binary 010 and 7 is binary 111 so is 4 events of 3 bits
    testEntropyBits(done, "2227", "12");
});
it("Shows the number of bits of entropy for 4 characters of hex with 2 leading zeros", function(done) {
    testEntropyBits(done, "222F", "16");
});
it("Shows the number of bits of entropy for 4 characters of hex starting with F", function(done) {
    testEntropyBits(done, "FFFF", "16");
});
it("Shows the number of bits of entropy for 10 characters of base 10", function(done) {
    // 10 events with 3 bits for each event
    testEntropyBits(done, "0000101017", "30");
});
it("Shows the number of bits of entropy for 10 characters of base 10 account for bias", function(done) {
    // 9 events with 3 bits per event and 1 event with 1 bit per event
    testEntropyBits(done, "0000101018", "28");
});
it("Shows the number of bits of entropy for a full deck of cards", function(done) {
    // removing bias is 32*5 + 16*4 + 4*2
    testEntropyBits(done, "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks", "232");
});

it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "A",
            filtered: "A",
            type: "hexadecimal",
            events: "1",
            bits: "4",
            words: 0,
            strength: "less than a second",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA",
            filtered: "AAAAAAAA",
            type: "hexadecimal",
            events: "8",
            bits: "32",
            words: 3,
            strength: "less than a second - Repeats like \"aaa\" are easy to guess",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA B",
            filtered: "AAAAAAAAB",
            type: "hexadecimal",
            events: "9",
            bits: "36",
            words: 3,
            strength: "less than a second - Repeats like \"aaa\" are easy to guess",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA BBBBBBBB",
            filtered: "AAAAAAAABBBBBBBB",
            type: "hexadecimal",
            events: "16",
            bits: "64",
            words: 6,
            strength: "less than a second - Repeats like \"aaa\" are easy to guess",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCC",
            type: "hexadecimal",
            events: "24",
            bits: "96",
            words: 9,
            strength: "less than a second",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD",
            type: "hexadecimal",
            events: "32",
            bits: "128",
            words: 12,
            strength: "2 minutes",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDA",
            type: "hexadecimal",
            events: "32",
            bits: "128",
            words: 12,
            strength: "2 days",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA EEEEEEEE",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDAEEEEEEEE",
            type: "hexadecimal",
            events: "40",
            bits: "160",
            words: 15,
            strength: "3 years",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDA EEEEEEEE FFFFFFFF",
            filtered: "AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDAEEEEEEEEFFFFFFFF",
            type: "hexadecimal",
            events: "48",
            bits: "192",
            words: 18,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "7d",
            type: "card",
            events: "1",
            bits: "5",
            words: 0,
            strength: "less than a second",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (full deck)",
            events: "52",
            bits: "232",
            words: 21,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks3d",
            type: "card (full deck, 1 duplicate: 3d)",
            events: "53",
            bits: "237",
            words: 21,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqs3d4d",
            type: "card (2 duplicates: 3d 4d, 1 missing: KS)",
            events: "53",
            bits: "240",
            words: 21,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqs3d4d5d6d",
            type: "card (4 duplicates: 3d 4d 5d..., 1 missing: KS)",
            events: "55",
            bits: "250",
            words: 21,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        // Next test was throwing uncaught error in zxcvbn
        {
            entropy: "ac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsksac2c3c4c5c6c7c8c9ctcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (full deck, 52 duplicates: ac 2c 3c...)",
            events: "104",
            bits: "464",
            words: 42,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        // Case insensitivity to duplicate cards
        {
            entropy: "asAS",
            type: "card (1 duplicate: AS)",
            events: "2",
            bits: "8",
            words: 0,
            strength: "less than a second",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "ASas",
            type: "card (1 duplicate: as)",
            events: "2",
            bits: "8",
            words: 0,
            strength: "less than a second",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        // Missing cards are detected
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d5d6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (1 missing: 9C)",
            events: "51",
            bits: "227",
            words: 21,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d7d8d9dtdjdqdkdah2h3h4h5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (2 missing: 9C 5D)",
            events: "50",
            bits: "222",
            words: 18,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d7d8d9dtdjd  kdah2h3h  5h6h7h8h9hthjhqhkhas2s3s4s5s6s7s8s9stsjsqsks",
            type: "card (4 missing: 9C 5D QD...)",
            events: "48",
            bits: "212",
            words: 18,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        // More than six missing cards does not show message
        {
            entropy: "ac2c3c4c5c6c7c8c  tcjcqckcad2d3d4d  6d  8d9d  jd  kdah2h3h  5h6h7h8h9hthjhqhkh  2s3s4s5s6s7s8s9stsjsqsks",
            type: "card",
            events: "45",
            bits: "198",
            words: 18,
            strength: "centuries",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    // multiple decks does not affect the bits per event
    // since the bits are hardcoded in entropy.js
    testEntropyFeedback(done,
        {
            entropy: "3d",
            events: "1",
            bits: "5",
            bitsPerEvent: "4.46",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "3d3d",
            events: "2",
            bits: "10",
            bitsPerEvent: "4.46",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "3d3d3d",
            events: "3",
            bits: "15",
            bitsPerEvent: "4.46",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "3d3d3d3d",
            events: "4",
            bits: "20",
            bitsPerEvent: "4.46",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "3d3d3d3d3d",
            events: "5",
            bits: "25",
            bitsPerEvent: "4.46",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "3d3d3d3d3d3d",
            events: "6",
            bits: "30",
            bitsPerEvent: "4.46",
        }
    );
});
it("Shows details about the entered entropy", function(done) {
    testEntropyFeedback(done,
        {
            entropy: "3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d",
            events: "33",
            bits: "165",
            bitsPerEvent: "4.46",
            strength: 'less than a second - Repeats like "abcabcabc" are only slightly harder to guess than "abc"',
        }
    );
});

// Entropy is truncated from the left
it('Truncates entropy from the left', function(done) {
    // Truncate from left means 0000 is removed from the start
    // which gives mnemonic 'avocado zoo zone'
    // not 1111 removed from the end
    // which gives the mnemonic 'abstract zoo zoo'
    var entropy  = "00000000 00000000 00000000 00000000";
        entropy += "11111111 11111111 11111111 1111"; // Missing last byte
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropy);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(phrase) {
                expect(phrase).toBe("avocado zoo zone");
                done();
            });
    });
});

// Very large entropy results in very long mnemonics
it('Converts very long entropy to very long mnemonics', function(done) {
    var entropy  = "";
    for (var i=0; i<33; i++) {
        entropy += "AAAAAAAA"; // 3 words * 33 iterations = 99 words
    }
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropy);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(phrase) {
                var wordCount = phrase.split(/\s+/g).length;
                expect(wordCount).toBe(99);
                done();
            });
    });
});

// Is compatible with bip32jp entropy
// https://bip32jp.github.io/english/index.html
// NOTES:
// Is incompatible with:
//     base 6
//     base 20
it('Is compatible with bip32jp.github.io', function(done) {
    var entropy  = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    var expectedPhrase = "primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary foster";
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropy);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(phrase) {
                expect(phrase).toBe(expectedPhrase);
                done();
            });
    });
});

// Blank entropy does not generate mnemonic or addresses
it('Does not generate mnemonic for blank entropy', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .clear();
    // check there is no mnemonic
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(phrase) {
                expect(phrase).toBe("");
                // check there is no mnemonic
                driver.findElements(By.css(".address"))
                    .then(function(addresses) {
                        expect(addresses.length).toBe(0);
                        // Check the feedback says 'blank entropy'
                        driver.findElement(By.css(".feedback"))
                            .getText()
                            .then(function(feedbackText) {
                                expect(feedbackText).toBe("Blank entropy");
                                done();
                            });
                    })
            });
    });
});

// Mnemonic length can be selected even for weak entropy
it('Allows selection of mnemonic length even for weak entropy', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.executeScript(function() {
        $(".mnemonic-length").val("18").trigger("change");
    });
    driver.findElement(By.css('.entropy'))
        .sendKeys("012345");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(phrase) {
                var wordCount = phrase.split(/\s+/g).length;
                expect(wordCount).toBe(18);
                done();
            });
    });
});

// Github issue 33
// https://github.com/iancoleman/bip39/issues/33
// Final cards should contribute entropy
it('Uses as much entropy as possible for the mnemonic', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys("7S 9H 9S QH 8C KS AS 7D 7C QD 4S 4D TC 2D 5S JS 3D 8S 8H 4C 3C AC 3S QC 9C JC 7H AD TD JD 6D KH 5C QS 2S 6S 6H JH KD 9D-6C TS TH 4H KC 5H 2H AH 2C 8D 3H 5D");
    driver.sleep(generateDelay).then(function() {
        // Get mnemonic
        driver.findElement(By.css(".phrase"))
            .getAttribute("value").then(function(originalPhrase) {
                // Set the last 12 cards to be AS
                driver.findElement(By.css('.entropy'))
                    .clear();
                driver.findElement(By.css('.entropy'))
                    .sendKeys("7S 9H 9S QH 8C KS AS 7D 7C QD 4S 4D TC 2D 5S JS 3D 8S 8H 4C 3C AC 3S QC 9C JC 7H AD TD JD 6D KH 5C QS 2S 6S 6H JH KD 9D-AS AS AS AS AS AS AS AS AS AS AS AS");
                driver.sleep(generateDelay).then(function() {
                    // Get new mnemonic
                    driver.findElement(By.css(".phrase"))
                        .getAttribute("value").then(function(newPhrase) {
                            expect(originalPhrase).not.toEqual(newPhrase);
                            done();
                        });
                });
            });
    });
});

// Github issue 35
// https://github.com/iancoleman/bip39/issues/35
// QR Code support
// TODO this doesn't work in selenium with firefox
// see https://stackoverflow.com/q/40360223
it('Shows a qr code on hover for the phrase', function(done) {
    if (browser == "firefox") {
        pending("Selenium + Firefox bug for mouseMove, see https://stackoverflow.com/q/40360223");
    }
    // generate a random mnemonic
    var generateEl = driver.findElement(By.css('.generate'));
    generateEl.click();
    // toggle qr to show (hidden by default)
    var phraseEl = driver.findElement(By.css(".phrase"));
    phraseEl.click();
    var rootKeyEl = driver.findElement(By.css(".root-key"));
    driver.sleep(generateDelay).then(function() {
        // hover over the root key
        driver.actions().mouseMove(rootKeyEl).perform().then(function() {
            // check the qr code shows
            driver.executeScript(function() {
                return $(".qr-container").find("canvas").length > 0;
            })
            .then(function(qrShowing) {
                expect(qrShowing).toBe(true);
                // hover away from the phrase
                driver.actions().mouseMove(generateEl).perform().then(function() {;
                    // check the qr code hides
                    driver.executeScript(function() {
                        return $(".qr-container").find("canvas").length == 0;
                    })
                    .then(function(qrHidden) {
                        expect(qrHidden).toBe(true);
                        done();
                    });
                });
            });
        });
    });
});

// BIP44 account extendend private key is shown
// github issue 37 - compatibility with electrum
it('Shows the bip44 account extended private key', function(done) {
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css("#bip44 .account-xprv"))
            .getAttribute("value")
            .then(function(xprv) {
                expect(xprv).toBe("xprv9yzrnt4zWVJUr1k2VxSPy9ettKz5PpeDMgaVG7UKedhqnw1tDkxP2UyYNhuNSumk2sLE5ctwKZs9vwjsq3e1vo9egCK6CzP87H2cVYXpfwQ");
                done();
        });
    });
});

// BIP44 account extendend public key is shown
// github issue 37 - compatibility with electrum
it('Shows the bip44 account extended public key', function(done) {
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css("#bip44 .account-xpub"))
            .getAttribute("value")
            .then(function(xprv) {
                expect(xprv).toBe("xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf");
                done();
        });
    });
});

// github issue 40
// BIP32 root key can be set as an xpub
it('Generates addresses from xpub as bip32 root key', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    driver.findElement(By.css("#root-key"))
        .sendKeys("xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf");
    driver.sleep(generateDelay).then(function() {
        // check the addresses are generated
        getFirstAddress(function(address) {
            expect(address).toBe("1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug");
            // check the xprv key is not set
            driver.findElement(By.css(".extended-priv-key"))
                .getAttribute("value")
                .then(function(xprv) {
                    expect(xprv).toBe("NA");
                    // check the private key is not set
                    driver.findElements(By.css(".privkey"))
                        .then(function(els) {
                            els[0]
                                .getText()
                                .then(function(privkey) {
                                    expect(xprv).toBe("NA");
                                    done();
                                });
                        });
                });
        });
    });
});

// github issue 40
// xpub for bip32 root key will not work with hardened derivation paths
it('Shows error for hardened derivation paths with xpub root key', function(done) {
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    driver.findElement(By.css("#root-key"))
        .sendKeys("xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf");
    driver.sleep(feedbackDelay).then(function() {
        // Check feedback is correct
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "Hardened derivation path is invalid with xpub key";
                expect(feedback).toBe(msg);
                // Check no addresses are shown
                driver.findElements(By.css('.addresses tr'))
                    .then(function(rows) {
                        expect(rows.length).toBe(0);
                        done();
                    });
            });
    });
});

// github issue 39
// no root key shows feedback
it('Shows feedback for no root key', function(done) {
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    driver.findElement(By.css('#bip32-tab a'))
        .click();
    driver.sleep(feedbackDelay).then(function() {
        // Check feedback is correct
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                expect(feedback).toBe("Invalid root key");
                done();
            });
    });
});

// Github issue 44
// display error switching tabs while addresses are generating
it('Can change details while old addresses are still being generated', function(done) {
    // Set to generate 199 more addresses.
    // This will take a long time allowing a new set of addresses to be
    // generated midway through this lot.
    // The newly generated addresses should not include any from the old set.
    // Any more than 199 will show an alert which needs to be accepted.
    driver.findElement(By.css('.rows-to-add'))
        .clear();
    driver.findElement(By.css('.rows-to-add'))
        .sendKeys('199');
    // set the prhase
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // change tabs which should cancel the previous generating
        driver.findElement(By.css('.rows-to-add'))
            .clear();
        driver.findElement(By.css('.rows-to-add'))
            .sendKeys('20');
        driver.findElement(By.css('#bip32-tab a'))
            .click()
        driver.sleep(generateDelay).then(function() {
            driver.findElements(By.css('.index'))
                .then(function(els) {
                    // check the derivation paths have the right quantity
                    expect(els.length).toBe(20);
                    // check the derivation paths are in order
                    testRowsAreInCorrectOrder(done);
                });
        });
    });
}, generateDelay + 10000);

// Github issue 49
// padding for binary should give length with multiple of 256
// hashed entropy 1111 is length 252, so requires 4 leading zeros
// prior to issue 49 it would only generate 2 leading zeros, ie missing 2
it('Pads hashed entropy with leading zeros', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.executeScript(function() {
        $(".mnemonic-length").val("15").trigger("change");
    });
    driver.findElement(By.css('.entropy'))
        .sendKeys("1111");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.phrase'))
            .getAttribute("value")
            .then(function(phrase) {
                expect(phrase).toBe("avocado valid quantum cross link predict excuse edit street able flame large galaxy ginger nuclear");
                done();
            });
    });
});

// Github pull request 55
// https://github.com/iancoleman/bip39/pull/55
// Client select
it('Can set the derivation path on bip32 tab for bitcoincore', function(done) {
    testClientSelect(done, {
        selectValue: "0",
        bip32path: "m/0'/0'",
        useHardenedAddresses: "true",
    });
});
it('Can set the derivation path on bip32 tab for multibit', function(done) {
    testClientSelect(done, {
        selectValue: "2",
        bip32path: "m/0'/0",
        useHardenedAddresses: null,
    });
});
it('Can set the derivation path on bip32 tab for coinomi/ledger', function(done) {
    testClientSelect(done, {
        selectValue: "3",
        bip32path: "m/44'/0'/0'",
        useHardenedAddresses: null,
    });
});

// github issue 58
// https://github.com/iancoleman/bip39/issues/58
// bip32 derivation is correct, does not drop leading zeros
// see also
// https://medium.com/@alexberegszaszi/why-do-my-bip32-wallets-disagree-6f3254cc5846
it('Retains leading zeros for bip32 derivation', function(done) {
    driver.findElement(By.css(".phrase"))
        .sendKeys("fruit wave dwarf banana earth journey tattoo true farm silk olive fence");
    driver.findElement(By.css(".passphrase"))
        .sendKeys("banana");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            // Note that bitcore generates an incorrect address
            // 13EuKhffWkBE2KUwcbkbELZb1MpzbimJ3Y
            // see the medium.com link above for more details
            expect(address).toBe("17rxURoF96VhmkcEGCj5LNQkmN9HVhWb7F");
            done();
        });
    });
});

// github issue 60
// Japanese mnemonics generate incorrect bip32 seed
// BIP39 seed is set from phrase
it('Generates correct seed for Japanese mnemonics', function(done) {
    driver.findElement(By.css(".phrase"))
        .sendKeys("あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あおぞら");
    driver.findElement(By.css(".passphrase"))
        .sendKeys("メートルガバヴァぱばぐゞちぢ十人十色");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".seed"))
            .getAttribute("value")
            .then(function(seed) {
                expect(seed).toBe("a262d6fb6122ecf45be09c50492b31f92e9beb7d9a845987a02cefda57a15f9c467a17872029a9e92299b5cbdf306e3a0ee620245cbd508959b6cb7ca637bd55");
                done();
            });
    });
});

// BIP49 official test vectors
// https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki#test-vectors
it('Generates BIP49 addresses matching the official test vectors', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    selectNetwork("BTC - Bitcoin Testnet");
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("2Mww8dCYPUpKHofjgcXcBCEGmniw9CoaiD2");
            done();
        });
    });
});

// BIP49 derivation path is shown
it('Shows the bip49 derivation path', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip49 .path'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("m/49'/0'/0'/0");
                done();
            });
    });
});

// BIP49 extended private key is shown
it('Shows the bip49 extended private key', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-priv-key'))
            .getAttribute("value")
            .then(function(xprv) {
                expect(xprv).toBe("yprvALYB4DYRG6CzzVgzQZwwqjAA2wjBGC3iEd7KYYScpoDdmf75qMRWZWxoFcRXBJjgEXdFqJ9vDRGRLJQsrL22Su5jMbNFeM9vetaGVqy9Qy2");
                done();
            });
    });
});

// BIP49 extended public key is shown
it('Shows the bip49 extended public key', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-pub-key'))
            .getAttribute("value")
            .then(function(xprv) {
                expect(xprv).toBe("ypub6ZXXTj5K6TmJCymTWbUxCs6tayZffemZbr2vLvrEP8kceTSENtjm7KHH6thvAKxVar9fGe8rgsPEX369zURLZ68b4f7Vexz7RuXsjQ69YDt");
                done();
            });
    });
});

// BIP49 account field changes address list
it('Can set the bip49 account field', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css('#bip49 .account'))
        .clear();
    driver.findElement(By.css('#bip49 .account'))
        .sendKeys("1");
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("381wg1GGN4rP88rNC9v7QWsiww63yLVPsn");
            done();
        });
    });
});

// BIP49 change field changes address list
it('Can set the bip49 change field', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css('#bip49 .change'))
        .clear();
    driver.findElement(By.css('#bip49 .change'))
        .sendKeys("1");
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("3PEM7MiKed5konBoN66PQhK8r3hjGhy9dT");
            done();
        });
    });
});

// BIP49 account extendend private key is shown
it('Shows the bip49 account extended private key', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip49 .account-xprv'))
            .getAttribute("value")
            .then(function(xprv) {
                expect(xprv).toBe("yprvAHtB1M5Wp675aLzFy9TJYK2mSsLkg6mcBRh5DZTR7L4EnYSmYPaL63KFA4ycg1PngW5LfkmejxzosCs17TKZMpRFKc3z5SJar6QAKaFcaZL");
                done();
            });
    });
});

// BIP49 account extendend public key is shown
it('Shows the bip49 account extended public key', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip49 .account-xpub'))
            .getAttribute("value")
            .then(function(xprv) {
                expect(xprv).toBe("ypub6WsXQrcQeTfNnq4j5AzJuSyVzuBF5ZVTYecg1ws2ffbDfLmv5vtadqdj1NgR6C6gufMpMfJpHxvb6JEQKvETVNWCRanNedfJtnTchZiJtsL");
                done();
            });
    });
});

// Test selecting coin where bip49 is unavailable (eg CLAM)
it('Shows an error on bip49 tab for coins without bip49', function(done) {
    driver.findElement(By.css('#bip49-tab a'))
        .click();
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        selectNetwork("CLAM - Clams");
        // bip49 available is hidden
        driver.findElement(By.css('#bip49 .available'))
            .getAttribute("class")
            .then(function(classes) {
                expect(classes).toContain("hidden");
                // bip49 unavailable is shown
                driver.findElement(By.css('#bip49 .unavailable'))
                    .getAttribute("class")
                    .then(function(classes) {
                        expect(classes).not.toContain("hidden");
                        // check there are no addresses shown
                        driver.findElements(By.css('.addresses tr'))
                            .then(function(rows) {
                                expect(rows.length).toBe(0);
                                // check the derived private key is blank
                                driver.findElement(By.css('.extended-priv-key'))
                                    .getAttribute("value")
                                    .then(function(xprv) {
                                        expect(xprv).toBe('');
                                        // check the derived public key is blank
                                        driver.findElement(By.css('.extended-pub-key'))
                                            .getAttribute("value")
                                            .then(function(xpub) {
                                                expect(xpub).toBe('');
                                                done();
                                            });
                                    });
                            })
                    });
            });
    });
});

// github issue 43
// Cleared mnemonic and root key still allows addresses to be generated
// https://github.com/iancoleman/bip39/issues/43
it('Clears old root keys from memory when mnemonic is cleared', function(done) {
    // set the phrase
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // clear the mnemonic and root key
        // using selenium .clear() doesn't seem to trigger the 'input' event
        // so clear it using keys instead
        driver.findElement(By.css('.phrase'))
            .sendKeys(Key.CONTROL,"a");
        driver.findElement(By.css('.phrase'))
            .sendKeys(Key.DELETE);
        driver.findElement(By.css('.root-key'))
            .sendKeys(Key.CONTROL,"a");
        driver.findElement(By.css('.root-key'))
            .sendKeys(Key.DELETE);
        driver.sleep(generateDelay).then(function() {
            // try to generate more addresses
            driver.findElement(By.css('.more'))
                .click();
            driver.sleep(generateDelay).then(function() {
                driver.findElements(By.css(".addresses tr"))
                    .then(function(els) {
                        // check there are no addresses shown
                        expect(els.length).toBe(0);
                        done();
                    });
                });
            });
    });
});

// Github issue 95
// error trying to generate addresses from xpub with hardened derivation
it('Shows error for hardened addresses with xpub root key', function(done) {
    driver.findElement(By.css('#bip32-tab a'))
        .click()
    driver.executeScript(function() {
        $(".hardened-addresses").prop("checked", true);
    });
    // set xpub for account 0 of bip44 for 'abandon abandon ability'
    driver.findElement(By.css("#root-key"))
        .sendKeys("xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf");
    driver.sleep(feedbackDelay).then(function() {
        // Check feedback is correct
        driver.findElement(By.css('.feedback'))
            .getText()
            .then(function(feedback) {
                var msg = "Hardened derivation path is invalid with xpub key";
                expect(feedback).toBe(msg);
                done();
            });
    });
});

// Litecoin uses ltub by default, and can optionally be set to xprv
// github issue 96
// https://github.com/iancoleman/bip39/issues/96
// Issue with extended keys on Litecoin
it('Uses ltub by default for litecoin, but can be set to xprv', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    selectNetwork("LTC - Litecoin");
    driver.sleep(generateDelay).then(function() {
        // check the extended key is generated correctly
        driver.findElement(By.css('.root-key'))
            .getAttribute("value")
            .then(function(rootKey) {
                expect(rootKey).toBe("Ltpv71G8qDifUiNesiPqf6h5V6eQ8ic77oxQiYtawiACjBEx3sTXNR2HGDGnHETYxESjqkMLFBkKhWVq67ey1B2MKQXannUqNy1RZVHbmrEjnEU");
                // set litecoin to use ltub
                driver.executeScript(function() {
                    $(".litecoin-use-ltub").prop("checked", false);
                    $(".litecoin-use-ltub").trigger("change");
                });
                driver.sleep(generateDelay).then(function() {
                    driver.findElement(By.css('.root-key'))
                        .getAttribute("value")
                        .then(function(rootKey) {
                            expect(rootKey).toBe("xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi");
                            done();
                        });
                })
            });
    });
});

// github issue 99
// https://github.com/iancoleman/bip39/issues/99#issuecomment-327094159
// "warn me emphatically when they have detected invalid input" to the entropy field
// A warning is shown when entropy is filtered and discarded
it('Warns when entropy is filtered and discarded', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    // set entropy to have no filtered content
    driver.findElement(By.css('.entropy'))
        .sendKeys("00000000 00000000 00000000 00000000");
    driver.sleep(generateDelay).then(function() {
        // check the filter warning does not show
        driver.findElement(By.css('.entropy-container .filter-warning'))
            .getAttribute("class")
            .then(function(classes) {
                expect(classes).toContain("hidden");
                // set entropy to have some filtered content
                driver.findElement(By.css('.entropy'))
                    .sendKeys("10000000 zxcvbn 00000000 00000000 00000000");
                driver.sleep(entropyFeedbackDelay).then(function() {
                    // check the filter warning shows
                    driver.findElement(By.css('.entropy-container .filter-warning'))
                        .getAttribute("class")
                        .then(function(classes) {
                            expect(classes).not.toContain("hidden");
                            done();
                        });
                });
            });
    });
});

// Bitcoin Cash address can be set to use cashaddr format
it('Can use cashaddr format for bitcoin cash addresses', function(done) {
    driver.executeScript(function() {
        $(".use-bch-cashaddr-addresses").prop("checked", true);
    });
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    selectNetwork("BCH - Bitcoin Cash");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("bitcoincash:qzlquk7w4hkudxypl4fgv8x279r754dkvur7jpcsps");
            done();
        });
    });
});

// Bitcoin Cash address can be set to use bitpay format
it('Can use bitpay format for bitcoin cash addresses', function(done) {
    driver.executeScript(function() {
        $(".use-bch-bitpay-addresses").prop("checked", true);
    });
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    selectNetwork("BCH - Bitcoin Cash");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("CZnpA9HPmvhuhLLPWJP8rNDpLUYXy1LXFk");
            done();
        });
    });
});

// Bitcoin Cash address can be set to use legacy format
it('Can use legacy format for bitcoin cash addresses', function(done) {
    driver.executeScript(function() {
        $(".use-bch-legacy-addresses").prop("checked", true);
    });
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    selectNetwork("BCH - Bitcoin Cash");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("1JKvb6wKtsjNoCRxpZ4DGrbniML7z5U16A");
            done();
        });
    });
});

// End of tests ported from old suit, so no more comments above each test now

it('Can generate more addresses from a custom index', function(done) {
    var expectedIndexes = [
        0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,
        40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59
    ];
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // Set start of next lot of rows to be from index 40
        // which means indexes 20-39 will not be in the table.
        driver.findElement(By.css('.more-rows-start-index'))
            .sendKeys("40");
        driver.findElement(By.css('.more'))
            .click();
        driver.sleep(generateDelay).then(function() {
            // Check actual indexes in the table match the expected pattern
            driver.findElements(By.css(".index"))
                .then(function(els) {
                    expect(els.length).toBe(expectedIndexes.length);
                    var testRowAtIndex = function(i) {
                        if (i >= expectedIndexes.length) {
                            done();
                        }
                        else {
                            els[i].getText()
                                .then(function(actualPath) {
                                    var noHardened = actualPath.replace(/'/g, "");
                                    var pathBits = noHardened.split("/")
                                    var lastBit = pathBits[pathBits.length-1];
                                    var actualIndex = parseInt(lastBit);
                                    var expectedIndex = expectedIndexes[i];
                                    expect(actualIndex).toBe(expectedIndex);
                                    testRowAtIndex(i+1);
                                });
                        }
                    }
                    testRowAtIndex(0);
                });
        });
    });
});

it('Can generate BIP141 addresses with P2WPKH-in-P2SH semanitcs', function(done) {
    // Sourced from BIP49 official test specs
    driver.findElement(By.css('#bip141-tab a'))
        .click();
    driver.findElement(By.css('.bip141-path'))
        .clear();
    driver.findElement(By.css('.bip141-path'))
        .sendKeys("m/49'/1'/0'/0");
    selectNetwork("BTC - Bitcoin Testnet");
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("2Mww8dCYPUpKHofjgcXcBCEGmniw9CoaiD2");
            done();
        });
    });
});

it('Can generate BIP141 addresses with P2WSH semanitcs', function(done) {
    driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WSH
    driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css("#root-key"))
        .getAttribute("value")
        .then(function(rootKey) {
            expect(rootKey).toBe("ZprvAhadJRUYsNge9uHspaggavxU1BUQ8QwfT4Z9UGq5sKF2mSt1mVy8EckLAaoBdmLHyP5eYDJ3LxtmzMNnLg2MRFe7QN2ueF4NCH4s5PrCDR6");
            getFirstAddress(function(address) {
                expect(address).toBe("bc1q2qhee847pv438tgg8hc7mjy38n8dklleshettn344l0tgs0kj5hskz9p9r");
                done();
            });
        })
    });
});

it('Can generate BIP141 addresses with P2WSH-in-P2SH semanitcs', function(done) {
    driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WSH-in-P2SH
    driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH nested in P2SH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css("#root-key"))
        .getAttribute("value")
        .then(function(rootKey) {
            expect(rootKey).toBe("YprvANkMzkodih9AJc6kzDu4NqrxqDKxBnxAXx2vgswCVJs9iM4nWqoZcZ6C9NqbdrgNZjxqnjhUtJYE74mDcycLd1xWY2LV4LEsvZ1DgqxuAKe");
            getFirstAddress(function(address) {
                expect(address).toBe("343DLC4vGDyHBbBr9myL8zzZA1MdN9TM1G");
                done();
            });
        })
    });
});

it('Uses Vprv for bitcoin testnet p2wsh', function(done) {
    selectNetwork("BTC - Bitcoin Testnet");
    driver.findElement(By.css('#bip141-tab a'))
        .click()
    // Choose P2WSH
    driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.root-key'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("Vprv16YtLrHXxePM5ja5hXQbiJs5JKDAc4WcaXo5rZcrVMU6bMhUg1oY7fpPku3i819gvMcHvq1h8aELDsyfCEs19vj1Q3iDHRrESWyJConkoT1");
                done();
            })
    });
});

it('Uses Uprv for bitcoin testnet p2wsh-in-p2sh', function(done) {
    selectNetwork("BTC - Bitcoin Testnet");
    driver.findElement(By.css('#bip141-tab a'))
        .click()
    // Choose P2WSH-in-P2SH
    driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WSH nested in P2SH (1-of-1 multisig)";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.root-key'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("Uprv95RJn67y7xyEuRLHenkZYVUx9LkARJzAsVx3ZJMeyHMdVwosWD9K8JTe4Z1FeE4gwBVcnqKF3f82ZvJxkBxHS5E74fYnigxvqeke8ZV3Fp2");
                done();
            })
    });
});

it('Can generate BIP141 addresses with P2WPKH semanitcs', function(done) {
    // This result tested against bitcoinjs-lib test spec for segwit address
    // using the first private key of this mnemonic and default path m/0
    // https://github.com/bitcoinjs/bitcoinjs-lib/blob/9c8503cab0c6c30a95127042703bc18e8d28c76d/test/integration/addresses.js#L50
    // so whilst not directly comparable, substituting the private key produces
    // identical results between this tool and the bitcoinjs-lib test.
    // Private key generated is:
    // L3L8Nu9whawPBNLGtFqDhKut9DKKfG3CQoysupT7BimqVCZsLFNP
    driver.findElement(By.css('#bip141-tab a'))
        .click();
    // Choose P2WPKH
    driver.executeScript(function() {
        $(".bip141-semantics option[selected]").removeAttr("selected");
        $(".bip141-semantics option").filter(function(i,e) {
            return $(e).html() == "P2WPKH";
        }).prop("selected", true);
        $(".bip141-semantics").trigger("change");
    });
    driver.findElement(By.css(".phrase"))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("bc1qfwu6a5a3evygrk8zvdxxvz4547lmpyx5vsfxe9");
            done();
        });
    });
});

it('Shows the entropy used by the PRNG when clicking generate', function(done) {
    driver.findElement(By.css('.generate')).click();
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy'))
            .getAttribute("value")
            .then(function(entropy) {
                expect(entropy).not.toBe("");
                done();
            });
    });
});

it('Shows the index of each word in the mnemonic', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.use-entropy'))
            .click();
        driver.findElement(By.css('.word-indexes'))
            .getText()
            .then(function(indexes) {
                expect(indexes).toBe("0, 0, 1");
                done();
            });
    });
});

it('Shows the derivation path for bip84 tab', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip84 .path'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("m/84'/0'/0'/0");
                done();
            })
    });
});

it('Shows the extended private key for bip84 tab', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-priv-key'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("zprvAev3RKrZ3QVKiUFCfdeMRen1BPDJgdNt1XpxiDy8acSs4kkAGTCvq7HeRYRNNpo8EtEjCFQBWavJwtCUR29y4TUCH4X5RXMcyq48uN8y9BP");
                done();
            })
    });
});

it('Shows the extended public key for bip84 tab', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.extended-pub-key'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("zpub6suPpqPSsn3cvxKfmfBMnnijjR3o666jNkkZWcNk8wyqwZ5JozXBNuc8Gs7DB3uLwTDvGVTspVEAUQcEjKF3pZHgywVbubdTqbXTUg7usyx");
                done();
            })
    });
});

it('Changes the address list if bip84 account is changed', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('#bip84 .account'))
        .sendKeys('1');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("bc1qp7vv669t2fy965jdzvqwrraana89ctd5ewc662");
            done();
        });
    });
});

it('Changes the address list if bip84 change is changed', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('#bip84 .change'))
        .sendKeys('1');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("bc1qr39vj6rh06ff05m53uxq8uazehwhccswylhrs2");
            done();
        });
    });
});

it('Passes the official BIP84 test spec for rootpriv', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css(".root-key"))
        .getAttribute("value")
        .then(function(rootKey) {
            expect(rootKey).toBe("zprvAWgYBBk7JR8Gjrh4UJQ2uJdG1r3WNRRfURiABBE3RvMXYSrRJL62XuezvGdPvG6GFBZduosCc1YP5wixPox7zhZLfiUm8aunE96BBa4Kei5");
            done();
        })
    });
});

it('Passes the official BIP84 test spec for account 0 xprv', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css("#bip84 .account-xprv"))
        .getAttribute("value")
        .then(function(rootKey) {
            expect(rootKey).toBe("zprvAdG4iTXWBoARxkkzNpNh8r6Qag3irQB8PzEMkAFeTRXxHpbF9z4QgEvBRmfvqWvGp42t42nvgGpNgYSJA9iefm1yYNZKEm7z6qUWCroSQnE");
            done();
        })
    });
});

it('Passes the official BIP84 test spec for account 0 xpub', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css("#bip84 .account-xpub"))
        .getAttribute("value")
        .then(function(rootKey) {
            expect(rootKey).toBe("zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs");
            done();
        })
    });
});

it('Passes the official BIP84 test spec for account 0 first address', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu");
            done();
        });
    });
});

it('Passes the official BIP84 test spec for account 0 first change address', function(done) {
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.findElement(By.css('#bip84 .change'))
        .sendKeys('1');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el");
            done();
        });
    });
});

it('Can display the table as csv', function(done) {
    var headings = "path,address,public key,private key";
    var row1 = "m/44'/0'/0'/0/0,1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug,033f5aed5f6cfbafaf223188095b5980814897295f723815fea5d3f4b648d0d0b3,L26cVSpWFkJ6aQkPkKmTzLqTdLJ923e6CzrVh9cmx21QHsoUmrEE";
    var row20 = "m/44'/0'/0'/0/19,1KhBy28XLAciXnnRvm71PvQJaETyrxGV55,02b4b3e396434d8cdd20c03ac4aaa07387784d5d867b75987f516f5705ee68cb3a,L4GrDrjReMsCAu5DkLXn79jSb95qR7Zfx7eshybCQZ1qL32MXJab";
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.csv'))
            .getAttribute("value")
            .then(function(csv) {
                expect(csv).toContain(headings);
                expect(csv).toContain(row1);
                expect(csv).toContain(row20);
                done();
            });
    });
});

it('LeftPads ethereum keys that are less than 32 bytes', function(done) {
    // see https://github.com/iancoleman/bip39/issues/155
    selectNetwork("ETH - Ethereum");
    driver.findElement(By.css('#bip32-tab a'))
        .click()
    driver.findElement(By.css('#bip32-path'))
        .clear();
    driver.findElement(By.css('#bip32-path'))
        .sendKeys("m/44'/60'/0'");
    driver.findElement(By.css('.phrase'))
        .sendKeys('scout sort custom elite radar rare vivid thing trophy gesture cover snake change narrow kite list nation sustain buffalo erode open balance system young');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("0x8943E785B4a5714FC87a3aFAad1eB1FeB602B118");
            done();
        });
    });
});

it('Can encrypt private keys using BIP38', function(done) {
    // see https://github.com/iancoleman/bip39/issues/140
    driver.executeScript(function() {
        $(".use-bip38").prop("checked", true);
    });
    driver.findElement(By.css('.bip38-password'))
        .sendKeys('bip38password');
    driver.findElement(By.css('.rows-to-add'))
        .clear();
    driver.findElement(By.css('.rows-to-add'))
        .sendKeys('1');
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(bip38delay).then(function() {
        // address
        getFirstRowValue(function(address) {
            expect(address).toBe("1NCvSdumA3ngMM9c4aqU56AM6rqXddfuXB");
            // pubkey
            getFirstRowValue(function(pubkey) {
                expect(pubkey).toBe("043f5aed5f6cfbafaf223188095b5980814897295f723815fea5d3f4b648d0d0b3884a74447ea901729b1e73a999b7520e7cb55b4120e6432c64153ccab8a848e1");
                // privkey
                getFirstRowValue(function(privkey) {
                    expect(privkey).toBe("6PRNRiFnj1RoR3sXhymdCvoZCgnUHQpfupNdKkFbWJkwWQEKesWt1EDMDM");
                    done();
                }, ".privkey");
            }, ".pubkey");
        }, ".address");
    });
}, bip38delay + 5000);

it('Shows the checksum for the entropy', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys("00000000000000000000000000000000");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.checksum'))
            .getText()
            .then(function(text) {
                expect(text).toBe("1");
                done();
            });
    });
});

it('Shows the checksum for the entropy with the correct groupings', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    // create a checksum of 20 bits, which spans multiple words
    driver.findElement(By.css('.entropy'))
        .sendKeys("F000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.checksum'))
            .getText()
            .then(function(text) {
                // first group is 9 bits, second group is 11
                expect(text).toBe("011010111 01110000110");
                done();
            });
    });
});

it('Uses vprv for bitcoin testnet p2wpkh', function(done) {
    selectNetwork("BTC - Bitcoin Testnet");
    driver.findElement(By.css('#bip84-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.root-key'))
            .getAttribute("value")
            .then(function(path) {
                expect(path).toBe("vprv9DMUxX4ShgxML9N2YV5CvWEebWrM9aJ5ULpbRRyzyWu6vs4BzTvbfFFrH41N5hVi7MYSfiugd765L3JmAfDM5po36Y8ouCKRDeYQwByCmS7");
                done();
            })
    });
});

it('Shows a warning if generating weak mnemonics', function(done) {
    driver.executeScript(function() {
        $(".strength option[selected]").removeAttr("selected");
        $(".strength option[value=6]").prop("selected", true);
        $(".strength").trigger("change");
    });
    driver.findElement(By.css(".generate-container .warning"))
        .getAttribute("class")
        .then(function(classes) {
            expect(classes).not.toContain("hidden");
            done();
        });
});

it('Does not show a warning if generating strong mnemonics', function(done) {
    driver.executeScript(function() {
        $(".strength option[selected]").removeAttr("selected");
        $(".strength option[value=12]").prop("selected", true);
    });
    driver.findElement(By.css(".generate-container .warning"))
        .getAttribute("class")
        .then(function(classes) {
            expect(classes).toContain("hidden");
            done();
        });
});

it('Shows a warning if overriding weak entropy with longer mnemonics', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys("0123456789abcdef"); // 6 words
    driver.executeScript(function() {
        $(".mnemonic-length").val("12").trigger("change");
    });
    driver.findElement(By.css(".weak-entropy-override-warning"))
        .getAttribute("class")
        .then(function(classes) {
            expect(classes).not.toContain("hidden");
            done();
        });
});

it('Does not show a warning if entropy is stronger than mnemonic length', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys("0123456789abcdef0123456789abcdef0123456789abcdef"); // 18 words
    driver.executeScript(function() {
        $(".mnemonic-length").val("12").trigger("change");
    });
    driver.findElement(By.css(".weak-entropy-override-warning"))
        .getAttribute("class")
        .then(function(classes) {
            expect(classes).toContain("hidden");
            done();
        });
});

it('Shows litecoin BIP49 addresses', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    selectNetwork("LTC - Litecoin");
    driver.findElement(By.css('#bip49-tab a'))
        .click()
    // bip49 addresses are shown
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip49 .available'))
            .getAttribute("class")
            .then(function(classes) {
                expect(classes).not.toContain("hidden");
                // check first address
                getFirstAddress(function(address) {
                    expect(address).toBe("MFwLPhsXoBuSLL8cLmW9uK6tChkzduV8qN");
                    done();
                });
            });
    });
});

it('Shows Groestlcoin BIP49 addresses', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon ability');
    selectNetwork("GRS - Groestlcoin");
    driver.findElement(By.css('#bip49-tab a'))
        .click()
    // bip49 addresses are shown
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#bip49 .available'))
            .getAttribute("class")
            .then(function(classes) {
                expect(classes).not.toContain("hidden");
                // check first address
                getFirstAddress(function(address) {
                    expect(address).toBe("3HXSCZwCypLyixMsF4Z1sN49noJtrm8gnX");
                    done();
                });
            });
    });
});

it('Can use root keys to generate segwit table rows', function(done) {
    // segwit uses ypub / zpub instead of xpub but the root key should still
    // be valid regardless of the encoding used to import that key.
    // Maybe this breaks the reason for the different extended key prefixes, but
    // since the parsed root key is used behind the scenes anyhow this should be
    // allowed.
    driver.findElement(By.css('#root-key'))
        .sendKeys('xprv9s21ZrQH143K2jkGDCeTLgRewT9F2pH5JZs2zDmmjXes34geVnFiuNa8KTvY5WoYvdn4Ag6oYRoB6cXtc43NgJAEqDXf51xPm6fhiMCKwpi');
    driver.findElement(By.css('#bip49-tab a'))
        .click()
    // bip49 addresses are shown
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("3QG2Y9AA4xZ846gKHZqNf7mvVKbLqMKxr2");
            done();
        });
    });
});

// Pull Request 271
// Allow converting mnemonic back to raw entropy value
it('Converts mnemonics into raw entropy', function(done) {
    driver.findElement(By.css('.phrase'))
        .sendKeys('abandon abandon about');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.use-entropy'))
            .click();
        driver.findElement(By.css('.entropy'))
            .getAttribute("value")
            .then(function(entropy) {
                expect(entropy).toBe("00000001");
                driver.findElement(By.css('.phrase'))
                    .getAttribute("value")
                    .then(function(phrase) {
                        expect(phrase).toBe("abandon abandon about");
                        done();
                    });
            });
    });
});

// Pull Request 279
// Added Split Phrase Card Output
it('Shows split prase cards', function(done) {
    var originalPhrase = "ugly charge strong giant once anchor capable october thumb inject dwarf legal alley mixture shoot";
    var originalWords = originalPhrase.split(' ');
    driver.findElement(By.css('.phrase'))
        .sendKeys(originalPhrase);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.phraseSplit'))
            .getAttribute("value")
            .then(function(cardsStr) {
                var cards = cardsStr.split("\n");
                expect(cards.length).toBe(3);
                // test all 2-of-3 combos can be used to form full phrase
                var combos = [[0,1],[0,2],[1,2]];
                for (var i=0; i<combos.length; i++) {
                    var combo = combos[i];
                    var a = combo[0];
                    var b = combo[1];
                    var phrase = cards[a] + " " + cards[b];
                    // check all original words are present
                    for (var j=0; j<originalWords.length; j++) {
                        var originalWord = originalWords[j];
                        expect(phrase).toContain(originalWord);
                    }
                }
                done();
            });
    });
});

// Pull Request 454 https://github.com/iancoleman/bip39/pull/454
// Add BIP85 support
it('Show BIP85', function(done) {
  var originalPhrase = "install scatter logic circle pencil average fall shoe quantum disease suspect usage";
  driver.findElement(By.css('.phrase'))
      .sendKeys(originalPhrase);
  driver.sleep(generateDelay).then(function() {
    driver.findElement(By.css('.showBip85')).click();
    driver.findElement(By.css('.showBip85')).isSelected().then(function(isSelected) {
      expect(isSelected).toBe(true)
      driver.findElement(By.css('#bip85Field')).getAttribute("value").then(function(childMnemonic) {
        expect(childMnemonic).toBe('girl mad pet galaxy egg matter matrix prison refuse sense ordinary nose')
        done();
      })
    });
  });
});

it('Show BIP85 in non-English languages', function(done) {
  pending("BIP85 library update");
  var originalPhrase = "install scatter logic circle pencil average fall shoe quantum disease suspect usage";
  driver.findElement(By.css('.phrase'))
      .sendKeys(originalPhrase);
  driver.sleep(generateDelay).then(function() {
    driver.findElement(By.css('.showBip85')).click();
    selectBip85Language("3");
    driver.findElement(By.css('.showBip85')).isSelected().then(function(isSelected) {
      expect(isSelected).toBe(true)
      driver.findElement(By.css('#bip85Field')).getAttribute("value").then(function(childMnemonic) {
        expect(childMnemonic).not.toBe('girl mad pet galaxy egg matter matrix prison refuse sense ordinary nose')
        //expect(childMnemonic).toBe('Not sure yet, something Spanish')
        done();
      })
    });
  });
});

// It allows manually specifying the entropy type
it('Allows entropy type to be manually selected', function(done) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    // use decimal entropy
    driver.findElement(By.css('.entropy'))
        .sendKeys("91");
    // manually change to binary entropy
    driver.executeScript(function() {
        $(".entropy-container input[value='binary']").click();
    });
    driver.sleep(entropyFeedbackDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                // overide 91 to be just 1
                var key = "Filtered Entropy";
                var value = "1";
                var reText = key + "\\s+" + value;
                var re = new RegExp(reText);
                expect(text).toMatch(re);
                // overide automatic decimal to binary
                var key = "Entropy Type";
                var value = "binary";
                var reText = key + "\\s+" + value;
                var re = new RegExp(reText);
                expect(text).toMatch(re);
                // overide 2 events to 1
                var key = "Event Count";
                var value = 1;
                var reText = key + "\\s+" + value;
                var re = new RegExp(reText);
                expect(text).toMatch(re);
                // overide log2(10)*2 bits to 1 bit
                var key = "Total Bits";
                var value = 1;
                var reText = key + "\\s+" + value;
                var re = new RegExp(reText);
                expect(text).toMatch(re);
                done();
            });
    });
});

// https://github.com/iancoleman/bip39/issues/388
// Make field for bip39 seed editable
it('Generates addresses when seed is set', function(done) {
    driver.findElement(By.css('.seed'))
        .sendKeys("20da140d3dd1df8713cefcc4d54ce0e445b4151027a1ab567b832f6da5fcc5afc1c3a3f199ab78b8e0ab4652efd7f414ac2c9a3b81bceb879a70f377aa0a58f3");
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("1Di3Vp7tBWtyQaDABLAjfWtF6V7hYKJtug");
            done();
        });
    });
});

// https://github.com/iancoleman/bip39/issues/169
it('Generates ethereum addresses from a public key', function(done) {
    var pubkey = "xpub68UK3hrMEp2jLPxPASgXSiqiUsQsUWZHCeuu6NqcJLt259LMeWzwDyufXLN1QmjLeLRY5he4QfArDDLbsXiw3xN3kFcYtyDy74BY73RPhhW";
    driver.findElement(By.css('.root-key'))
      .sendKeys(pubkey);
    driver.findElement(By.css('#bip32-tab a'))
        .click()
    selectNetwork('ETH - Ethereum');
    driver.sleep(generateDelay).then(function() {
        getFirstAddress(function(address) {
            expect(address).toBe("0x1Bd54748903438C7E386b4a3fCbe16237A316a98");
            done();
        });
    });
});

// https://github.com/iancoleman/bip39/issues/469
it('Generates ethereum private keys with the correct padding', function(done) {
  var phrase = "flip vicious divorce angle toward say derive blue refuse load word creek once expire bounce";
  let withoutPadding = "0x53121fc5d193e623d2dbf43b2a96640bbed16bd530947fff8dda12f1aec828";
  let withPadding = "0x0053121fc5d193e623d2dbf43b2a96640bbed16bd530947fff8dda12f1aec828";
  let skIndex = 15;
  driver.findElement(By.css('.phrase'))
      .sendKeys(phrase);
    selectNetwork('ETH - Ethereum');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css(".privkey"))
            .then(function(els) {
                els[skIndex].getText()
                    .then(function(sk) {
                        expect(sk).toBe(withPadding);
                        expect(sk).not.toBe(withoutPadding);
                        done();
                    });
            })
    });
});

});
