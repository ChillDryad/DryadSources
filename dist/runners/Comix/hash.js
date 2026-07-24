"use strict";
// TypeScript port of ComixHash.kt
// Generates authentication tokens for chapter list requests.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHash = void 0;
const KEYS = [
    "13YDu67uDgFczo3DnuTIURqas4lfMEPADY6Jaeqky+w=",
    "yEy7wBfBc+gsYPiQL/4Dfd0pIBZFzMwrtlRQGwMXy3Q=",
    "yrP+EVA1Dw==",
    "vZ23RT7pbSlxwiygkHd1dhToIku8SNHPC6V36L4cnwM=",
    "QX0sLahOByWLcWGnv6l98vQudWqdRI3DOXBdit9bxCE=",
    "WJwgqCmf",
    "BkWI8feqSlDZKMq6awfzWlUypl88nz65KVRmpH0RWIc=",
    "v7EIpiQQjd2BGuJzMbBA0qPWDSS+wTJRQ7uGzZ6rJKs=",
    "1SUReYlCRA==",
    "RougjiFHkSKs20DZ6BWXiWwQUGZXtseZIyQWKz5eG34=",
    "LL97cwoDoG5cw8QmhI+KSWzfW+8VehIh+inTxnVJ2ps=",
    "52iDqjzlqe8=",
    "U9LRYFL2zXU4TtALIYDj+lCATRk/EJtH7/y7qYYNlh8=",
    "e/GtffFDTvnw7LBRixAD+iGixjqTq9kIZ1m0Hj+s6fY=",
    "xb2XwHNB", // 14 prefKey  round 5
];
const B64_STD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function b64decode(s) {
    const lookup = {};
    for (let i = 0; i < B64_STD.length; i++)
        lookup[B64_STD[i]] = i;
    const out = [];
    let buf = 0;
    let bits = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === "=")
            break;
        const val = lookup[c];
        if (val === undefined)
            continue;
        buf = (buf << 6) | val;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out.push((buf >> bits) & 0xff);
        }
    }
    return out;
}
function b64urlEncode(bytes) {
    let result = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i];
        const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
        result += B64_URL[(b0 >> 2) & 0x3f];
        result += B64_URL[((b0 << 4) | (b1 >> 4)) & 0x3f];
        result += B64_URL[((b1 << 2) | (b2 >> 6)) & 0x3f];
        result += B64_URL[b2 & 0x3f];
    }
    const rem = bytes.length % 3;
    if (rem === 1)
        return result.slice(0, -2);
    if (rem === 2)
        return result.slice(0, -1);
    return result;
}
function getKeyBytes(index) {
    const k = KEYS[index];
    if (!k)
        return [];
    try {
        return b64decode(k);
    }
    catch {
        return [];
    }
}
function rc4(key, data) {
    if (key.length === 0)
        return data;
    const s = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;
    for (let i = 0; i < 256; i++) {
        j = (j + s[i] + key[i % key.length]) % 256;
        [s[i], s[j]] = [s[j], s[i]];
    }
    let i = 0;
    j = 0;
    return data.map((b) => {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        [s[i], s[j]] = [s[j], s[i]];
        return b ^ s[(s[i] + s[j]) % 256];
    });
}
const mutS = (e) => (e + 143) % 256;
const mutL = (e) => ((e >>> 1) | (e << 7)) & 255;
const mutC = (e) => (e + 115) % 256;
const mutM = (e) => e ^ 177;
const mutF = (e) => (e - 188 + 256) % 256;
const mutG = (e) => ((e << 2) | (e >>> 6)) & 255;
const mutH = (e) => (e - 42 + 256) % 256;
const mutDollar = (e) => ((e << 4) | (e >>> 4)) & 255;
const mutB = (e) => (e - 12 + 256) % 256;
const mutUnderscore = (e) => (e - 20 + 256) % 256;
const mutY = (e) => ((e >>> 1) | (e << 7)) & 255;
const mutK = (e) => (e - 241 + 256) % 256;
function getMutKey(mk, idx) {
    return mk.length > 0 && idx % 32 < mk.length ? mk[idx % 32] : 0;
}
function round1(data) {
    const enc = rc4(getKeyBytes(0), data);
    const mutKey = getKeyBytes(1);
    const prefKey = getKeyBytes(2);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
        if (i < 7 && i < prefKey.length)
            out.push(prefKey[i]);
        let v = enc[i] ^ getMutKey(mutKey, i);
        switch (i % 10) {
            case 0:
            case 9:
                v = mutC(v);
                break;
            case 1:
                v = mutB(v);
                break;
            case 2:
                v = mutY(v);
                break;
            case 3:
                v = mutDollar(v);
                break;
            case 4:
            case 6:
                v = mutH(v);
                break;
            case 5:
                v = mutS(v);
                break;
            case 7:
                v = mutK(v);
                break;
            case 8:
                v = mutL(v);
                break;
        }
        out.push(v & 255);
    }
    return out;
}
function round2(data) {
    const enc = rc4(getKeyBytes(3), data);
    const mutKey = getKeyBytes(4);
    const prefKey = getKeyBytes(5);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
        if (i < 6 && i < prefKey.length)
            out.push(prefKey[i]);
        let v = enc[i] ^ getMutKey(mutKey, i);
        switch (i % 10) {
            case 0:
            case 8:
                v = mutC(v);
                break;
            case 1:
                v = mutB(v);
                break;
            case 2:
            case 6:
                v = mutDollar(v);
                break;
            case 3:
                v = mutH(v);
                break;
            case 4:
            case 9:
                v = mutS(v);
                break;
            case 5:
                v = mutK(v);
                break;
            case 7:
                v = mutUnderscore(v);
                break;
        }
        out.push(v & 255);
    }
    return out;
}
function round3(data) {
    const enc = rc4(getKeyBytes(6), data);
    const mutKey = getKeyBytes(7);
    const prefKey = getKeyBytes(8);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
        if (i < 7 && i < prefKey.length)
            out.push(prefKey[i]);
        let v = enc[i] ^ getMutKey(mutKey, i);
        switch (i % 10) {
            case 0:
                v = mutC(v);
                break;
            case 1:
                v = mutF(v);
                break;
            case 2:
            case 8:
                v = mutS(v);
                break;
            case 3:
                v = mutG(v);
                break;
            case 4:
                v = mutY(v);
                break;
            case 5:
                v = mutM(v);
                break;
            case 6:
                v = mutDollar(v);
                break;
            case 7:
                v = mutK(v);
                break;
            case 9:
                v = mutB(v);
                break;
        }
        out.push(v & 255);
    }
    return out;
}
function round4(data) {
    const enc = rc4(getKeyBytes(9), data);
    const mutKey = getKeyBytes(10);
    const prefKey = getKeyBytes(11);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
        if (i < 8 && i < prefKey.length)
            out.push(prefKey[i]);
        let v = enc[i] ^ getMutKey(mutKey, i);
        switch (i % 10) {
            case 0:
                v = mutB(v);
                break;
            case 1:
            case 9:
                v = mutM(v);
                break;
            case 2:
            case 7:
                v = mutL(v);
                break;
            case 3:
            case 5:
                v = mutS(v);
                break;
            case 4:
            case 6:
                v = mutUnderscore(v);
                break;
            case 8:
                v = mutY(v);
                break;
        }
        out.push(v & 255);
    }
    return out;
}
function round5(data) {
    const enc = rc4(getKeyBytes(12), data);
    const mutKey = getKeyBytes(13);
    const prefKey = getKeyBytes(14);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
        if (i < 6 && i < prefKey.length)
            out.push(prefKey[i]);
        let v = enc[i] ^ getMutKey(mutKey, i);
        switch (i % 10) {
            case 0:
                v = mutUnderscore(v);
                break;
            case 1:
            case 7:
                v = mutS(v);
                break;
            case 2:
                v = mutC(v);
                break;
            case 3:
            case 5:
                v = mutM(v);
                break;
            case 4:
                v = mutB(v);
                break;
            case 6:
                v = mutF(v);
                break;
            case 8:
                v = mutDollar(v);
                break;
            case 9:
                v = mutG(v);
                break;
        }
        out.push(v & 255);
    }
    return out;
}
function generateHash(path) {
    const encoded = encodeURIComponent(path)
        .replace(/\+/g, "%20")
        .replace(/\*/g, "%2A")
        .replace(/%7E/g, "~");
    const initialBytes = Array.from(encoded, (c) => c.charCodeAt(0));
    const r5 = round5(round4(round3(round2(round1(initialBytes)))));
    return b64urlEncode(r5);
}
exports.generateHash = generateHash;
