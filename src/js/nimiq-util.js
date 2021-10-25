/**
 * Converts a Nimiq address from HEX to user-friendly (IBAN) representation
 * @param {string} address
 * @returns {string}
 */
function convertNimiqAddr(address) {
    const BASE32_NIMIQ = '0123456789ABCDEFGHJKLMNPQRSTUVXY';
    const CCODE = 'NQ';

    const base32 = libs.basex(BASE32_NIMIQ).encode(libs.basex('0123456789abcdef').decode(address));
    const checksum = ('00' + (98 - nimiqIbanChecksum(base32 + CCODE + '00'))).slice(-2);
    return CCODE + checksum + base32;
}

/**
 * Calculate an IBAN checksum
 * @param {string} str
 * @returns {number}
 */
function nimiqIbanChecksum(str) {
    const num = str.split('').map((c) => {
        const code = c.toUpperCase().charCodeAt(0);
        return code >= 48 && code <= 57 ? c : (code - 55).toString();
    }).join('');

    let tmp = '';
    for (let i = 0; i < Math.ceil(num.length / 6); i++) {
        tmp = (parseInt(tmp + num.substr(i * 6, 6)) % 97).toString();
    }

    return parseInt(tmp);
}
