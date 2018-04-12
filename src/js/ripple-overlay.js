(function() {

$("html").append('<div style="position:fixed;width:100%;height:100%;top:0;left:0;right:0;bottom:0;z-index:10;background:#fff;"></div>');
$("html").css({"overflow": "hidden"});

//var api = new ripple.RippleAPI();
var api;

function connect(node) {
  display('Connecting to: ' + node);
  api = new ripple.RippleAPI({server: node});

  api.on('error', function(errorCode, errorMessage) {
    display(errorCode + ': ' + errorMessage);
  });
  api.on('connected', function() {
    display('Connected!');
  });
  api.on('disconnected', function(code) {
    display('Disconnected, code:', code);
  });
  return api.connect();
}

function log(str) {$('#console').append(JSON.stringify(str) + '<br>')}
function display(str) {$('#console').append(str + '<br>')}

function send(node, account, amount, currency, counterparty, recipient, tag, fees, publicKey, privateKey, message) {
  connect(node).then(function() {
    api.getAccountInfo(account).then(function(info) {
      var available = info.xrpBalance - 20 - (5 * info.ownerCount);
      available = Math.floor(available * 1000000) / 1000000;
      if (available < 0) available = 0;
      display("Your XRP balance: " + info.xrpBalance + "; You can spend: " + available + " XRP");
      tag = parseInt(tag);
      api.preparePayment(
          account,
          {
            source: {
              address: account,
              maxAmount: {
                value: amount,
                currency: currency,
                counterparty: counterparty
              }
            },
            destination: {
              address: recipient,
              amount: {
                value: amount,
                currency: currency,
                counterparty: counterparty
              },
              tag: tag
            },
            memos: [
              {
                type: 'message',
                format: 'plain/text',
                data: message
              }
            ]
          },
          {
            fee: fees
          }
        ).then(function(tx) {
        var signed = api.sign(tx.txJSON, {privateKey: privateKey, publicKey: publicKey});
        //log(signed);
        api.submit(
          signed.signedTransaction
        ).then(function(result) {
          display("Status: " + result.resultMessage);
          var link = "https://bithomp.com/explorer/" + signed.id;
          display("Check the transaction: <a href='" + link + "' target='_blank'>" + link + "</a>");
        }).catch(function (error) {console.log('submit: '); log(error)})
      }).catch(function (error) {console.log('preparePayment: '); log(error)})
    }).catch(function (error) {console.log('getAccountInfo: ');log(error)})
  }).catch(function (error) {console.log('connect: ');log(error)})
}

/* find sequence to sign tx offline
function sequence(node, account) {
  connect(node).then(function() {
    api.getAccountInfo(account).then(function(info) {
      console.log("sequence: " + info.sequence);
      return info.sequence;
    }).catch(function (error) {console.log('getAccountInfo: ');log(error)})
  }).catch(function (error) {console.log('connect: ');log(error)})
}
*/

function addTrustline(node, account, currency, counterparty, limit, fees, publicKey, privateKey) {
  connect(node).then(function() {
    api.getAccountInfo(account).then(function(info) {
      display("Your XRP balance: " + info.xrpBalance);
      api.prepareTrustline(
        account,
        {
          currency: currency,
          counterparty: counterparty,
          limit: limit,
          ripplingDisabled: true
        },
        {
          fee: fees
        }
      ).then(function(tx) {
        var signed = api.sign(tx.txJSON, {privateKey: privateKey, publicKey: publicKey});
        //log(signed);
        display("Transaction signed, submitting...");
        api.submit(
          signed.signedTransaction
        ).then(function(result) {
          display("Status: " + result.resultMessage);
          var link = "https://bithomp.com/explorer/" + signed.id;
          display("Check the transaction: <a href='" + link + "' target='_blank'>" + link + "</a>");
        }).catch(function (error) {console.log('submit: '); log(error)})
      }).catch(function (error) {console.log('prepareTrustline: '); log(error)})
    }).catch(function (error) {console.log('getAccountInfo: ');log(error)})
  }).catch(function (error) {console.log('connect: ');log(error)})
}

/* for offline functionality, need sequence
function addTrustline(node, account, sequence, currency, counterparty, limit, fees, publicKey, privateKey) {
  api.prepareTrustline(
    account,
    {
      currency: currency,
      counterparty: counterparty,
      limit: limit,
      ripplingDisabled: true
    },
    {
      fee: fees,
      sequence: sequence,
      maxLedgerVersion: null
    }
  ).then(function(tx) {
    var signed = api.sign(tx.txJSON, {privateKey: privateKey, publicKey: publicKey});
    log(signed);
    return signed;
  }).catch(function (error) {console.log('prepareTrustline: '); log(error)})
}
*/

function showStaff(type) {

  var limit = "10000000";
  if (type == 'deleteTrustline') {
    limit = "0";
    type = 'trustline';
  }

  $('#console').html('');

  if ($('#checkline').hasClass('hidden')) {
    $('.ripple').removeClass('hidden');
    if (type == 'payment')
      $('.ripple-tx').removeClass('hidden');
    return;
  }

  if (type == 'payment' && $('#paymentDetails').hasClass('hidden')) {
    $('.ripple-tx').removeClass('hidden');
    return;
  } else if (type == 'trustline' && !$('#paymentDetails').hasClass('hidden')) {
    $('.ripple-tx').addClass('hidden');
    return;
  }

  var address = $('.addresses.monospace tr td.address span').first().html();
  var privkey = $('.addresses.monospace tr td.privkey span').first().html();
  var pubkey = $('.addresses.monospace tr td.pubkey span').first().html();
  if (address && privkey && pubkey) {
    privkey = "00" + privkey.toUpperCase();
    pubkey = pubkey.toUpperCase();
    //var node = 'wss://s1.ripple.com';
    var node = $('#node').val();
    node = node.trim();
    var fees = $('#fees').val().trim();
    fees = fees.trim();
    var currency = $('#currency').val();
    currency = currency.trim().toUpperCase();
    var counterparty = $('#counterparty').val();
    counterparty = counterparty.trim();
    //var sequence = 4;
    if (!node || !fees)
      return alert('Server and Fee can not be empty');
    if (Number(fees) > 1)
      return alert('The fee is too high!');
    if (!currency || currency.lenght > 3)
      return alert('Incorrect currency: empty or wrong format');
    if (type && type == 'trustline' && !counterparty)
      return alert('Please fill in the counterparty.');
    if (type && type == 'payment' && currency != 'XRP' && !counterparty)
      return alert('Please fill in the counterparty.');
    var link = 'https://bithomp.com/explorer/' + address;
    display('Your ripple address: <a href="' + link + '" target="_blank">' + address + '</a>');
    if (type == 'trustline')
      addTrustline(node, address, currency, counterparty, limit, fees, pubkey, privkey);
    if (type == 'payment') {
      var amount = $('#amount').val();
      amount = amount.trim();
      if (!amount || amount < 0)
        return alert('Please fill in the amount you want to send!');
      var recipient = $('#recipient').val();
      recipient = recipient.trim();
      if (!recipient)
        return alert('Please fill in the recipient of your payment!');
      var tag = $('#tag').val();
      tag = tag.trim();
      var message = $('#message').val();
      message = message.trim();
      //add message
      send(node, address, amount, currency, counterparty, recipient, tag, fees, pubkey, privkey, message);
    }
  } else {
    alert('Please enter mnemonic first (ex: 24 recovery words)');
  }
}

//currency UpperCase 

$(document).ready(function() {
  $('#network-phrase').val(33);
  $('#coin').val(144);
  $('#phrase').css({"z-index":20,"position":"fixed","top":"100px","width":"800px","left":"50%","margin-left":"-400px"});
  $(".feedback-container").css({"z-index": 14});
  $("h1").text('Use mnemonic to make a ripple payment or to add a trustline').css({
    "z-index": 14,
    "position": "fixed",
    "font-size": "24px",
    "width": "800px",
    "margin-left": "-400px",
    "left": "50%",
  });
  $('#phrase').after('<span style="position:fixed;top:80px;z-index:20;width:800px;margin-left:-400px;left:50%;">Mnemonic (ex.: 24 recovery words):</span>');
  $('#phrase').after(
    '<div style="position:fixed;top:180px;z-index:20;width:800px;margin-left:-400px;left:50%;text-align:center;">' +
      '<table style="width: 100%; font-weight: bold;">' +
        '<tr class="ripple hidden">' +
          '<td>Server: </td><td><input id="node" value="wss://s1.ripple.com" class="form-control"/></td>' +
          '<td>Fee to pay (XRP): </td><td><input id="fees" value="0.000012" class="form-control" /></td>' +
        '</tr>' +

        '<tr class="ripple hidden" id="checkline"><td colspan="4"><hr></td></tr>' +

        '<tr class="ripple-tx hidden" id="paymentDetails">' +
          '<td>Recipient: </td><td><input id="recipient" placeholder="rBithomp4vj5E2kUebx7tVwipBueg55XxS" class="ripple-tx form-control" style="font-size: 12px;"/></td>' +
          '<td>Amount: </td><td><input id="amount" placeholder="0.00001" class="ripple-tx form-control"/></td>' +
        '</tr>' +

        '<tr class="ripple hidden">' +
          '<td>Currency: </td><td><input id="currency" placeholder="BTC" class="form-control"/></td>' +
          '<td>Counterparty: </td><td><input id="counterparty" placeholder="rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B" class="form-control" style="font-size: 12px;"/></td>' +
        '</tr>' +

        '<tr class="ripple-tx hidden">' +
          '<td>Tag (if requered): </td><td><input id="tag" placeholder="728754" class="ripple-tx form-control" /></td>' +
          '<td>Message (optional): </td><td><input id="message" placeholder="Payment for pizza" class="ripple-tx form-control" /></td>' +
        '</tr>' +

      '</table>' +
      '<br>' +
      '<input type="button" value="Make a payment" onclick="showStaff(\'payment\');" class="btn btn-default" style="margin: 0 50px 20px;"/>'+
      '<input type="button" value="Add a trustline" onclick="showStaff(\'trustline\');" class="btn btn-default" style="margin: 0 50px 20px;"/>'+
      '<input type="button" value="Delete a trustline" onclick="showStaff(\'deleteTrustline\');" class="btn btn-default" style="margin: 0 50px 20px;"/>'+

      '<div id="console" style="width:100%;margin-top: 20px;text-align:left;padding: 20px;"></div>' +
    '</div>' +
    '<div style="position: fixed; bottom:0; z-index: 14;">Ugly ripple plugin on top of <a href="https://github.com/iancoleman/bip39" target="_blank">https://github.com/iancoleman/bip39</a> using <a href="https://github.com/ripple/ripple-lib/" target="_blank">https://github.com/ripple/ripple-lib/</a></div>'
  );
});

})();