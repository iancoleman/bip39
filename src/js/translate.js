// An extremely basic translation library
//
// Example usage:
//
// Set some html to be translated. Do this using the 'data-translate' attribute:
//
//   <div data-translate>Test</div>
//   <div data-translate-html><em>keep em tag</em></div>
//   <input data-translate-placeholder placeholder="Example placeholder">
//   <span data-translate-title title="Example title"></span>
//
// Obtain all the phrases to be translated via js debug console:
//
//   Translate.phrasesAsJson();
//
// Use that template to translate the phrases into another language.
// Leave the key the same. Change the value to the new language.
//
// Create a js file to load the new phrases. In this example for Spanish,
// es.js will contain the following code:
//
//   Translate.loadForeignPhrases("es", {
//       "Test": "Test in Spanish",
//       "<em>keep em tag</em>": "<em>keep em tag in Spanish</em>",
//       "Example placeholder": "Example placeholder in Spanish"
//       "Example title": "Example title in Spanish"
//   });
//
// In your UI put a listener for clicking on the Spanish button:
//
//   mySpanishButton.addEventListener("click", function() {
//       Translate.setLanguage("es");
//   });
//   myEnglishButton.addEventListener("click", function() {
//       Translate.setLanguage("en");
//   });

Translate = new (function() {

    var defaultLanguage = "en";

    var allPhrases = {};
    allPhrases[defaultLanguage] = {};

    // Node types

    var text = {
        selector: "[data-translate]",
        getKey: function() {
            return this.textContent.trim().replace(/\s+/g, " ");
        },
        setPhrase: function(p) {
            this.textContent = p;
        },
    }

    var html = {
        selector: "[data-translate-html]",
        getKey: function() {
            return this.innerHTML.trim().replace(/\s+/g, " ");
        },
        setPhrase: function(p) {
            this.innerHTML = p;
        },
    }

    var placeholder = {
        selector: "[data-translate-placeholder]",
        getKey: function() {
            return this.getAttribute("placeholder").trim().replace(/\s+/g, " ");
        },
        setPhrase: function(p) {
            this.setAttribute("placeholder", p);
        },
    }

    var title = {
        selector: "[data-translate-title]",
        getKey: function() {
            return this.getAttribute("title").trim().replace(/\s+/g, " ");
        },
        setPhrase: function(p) {
            this.setAttribute("title", p);
        },
    }

    // Get elements to be translated
    var allEls = getEls(text)
        .concat(getEls(html))
        .concat(getEls(placeholder))
        .concat(getEls(title));

    // Provides access to phrases from a non-default language.
    // See phrases_en.js for example usage.
    this.loadForeignPhrases = function(language, phrases) {
        allPhrases[language] =  phrases;
    }

    // Displays a different language, eg "en" or "fr"
    this.setLanguage = function(language) {
        for (var i=0; i<allEls.length; i++) {
            var el = allEls[i];
            var key = el.key;
            if (!(language in allPhrases)) {
                console.log(language + " not in allPhrases");
                return;
            }
            if (!(key in allPhrases[language])) {
                console.log(language + " does not contain phrase: " + key);
                return;
            }
            var phrase = allPhrases[language][key];
            el.setPhrase(phrase);
        }
    }

    // Converts the phrases to a key-pair json file.
    // This is a good way to export phrases for use in translation tools.
    this.phrasesAsJson = function(language) {
        var keys = [];
        for (var i=0; i<allEls.length; i++) {
            var el = allEls[i];
            var key = el.key;
            keys.push(key);
        }
        keys.sort();
        var output = {};
        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            var translated = "";
            if (language in allPhrases && key in allPhrases[language]) {
                translated = allPhrases[language][key];
            }
            output[key] = translated;
        }
        return JSON.stringify(output, null, 2);
    }

    function getEls(nodeType) {
        var nodes = document.querySelectorAll(nodeType.selector);
        var els = [];
        for (var i=0; i<nodes.length; i++) {
            var node = nodes[i];
            node.getKey = nodeType.getKey;
            node.setPhrase = nodeType.setPhrase;
            node.key = node.getKey();
            allPhrases[defaultLanguage][node.key] = node.key;
            els.push(node);
        }
        return els;
    }

})();
