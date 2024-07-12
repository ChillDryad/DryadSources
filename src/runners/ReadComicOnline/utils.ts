import type { ChapterPage } from "@suwatte/daisuke"

const trimIndent = (str: string): string => {
  const lines = str.split("\n")
  const minIndent = lines
    .filter((line) => line.trim().length > 0)
    .reduce(
      (min, line) => Math.min(min, line.match(/^\s*/)![0].length),
      Infinity,
    )

  const trimmedLines = lines.map((line) =>
    minIndent < Infinity ? line.slice(minIndent) : line,
  )
  return trimmedLines.join("\n").trim()
}

const DISABLE_JS_SCRIPT = trimIndent(`
    const handler = {
        get: function(target, _) {
            return function() {
                return target;
            };
        },
        apply: function(_, __, ___) {
            return new Proxy({}, handler);
        }
    };
    
    globalThis.window = new Proxy({}, handler);
    globalThis.document = new Proxy({}, handler);
    globalThis.$ = new Proxy(function() {}, handler);
`)

const ATOB_SCRIPT = trimIndent(`
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        b64re = /^(?:[A-Za-z\\d+\\/]{4})*?(?:[A-Za-z\\d+\\/]{2}(?:==)?|[A-Za-z\\d+\\/]{3}=?)?$/;

    const atob = function(string) {
        // atob can work with strings with whitespaces, even inside the encoded part,
        // but only \\t, \\n, \\f, \\r and ' ', which can be stripped.
        string = String(string).replace(/[\\t\\n\\f\\r ]+/g, "");
        if (!b64re.test(string))
            throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");

        // Adding the padding if missing, for simplicity
        string += "==".slice(2 - (string.length & 3));
        var bitmap, result = "", r1, r2, i = 0;
        for (; i < string.length;) {
            bitmap = b64.indexOf(string.charAt(i++)) << 18 | b64.indexOf(string.charAt(i++)) << 12
                    | (r1 = b64.indexOf(string.charAt(i++))) << 6 | (r2 = b64.indexOf(string.charAt(i++)));

            result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255)
                    : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255)
                    : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
        }
        return result;
    };
`)

export const urlDecode = (
  urls: string[],
  rguardScript: string,
): ChapterPage[] => {
  const script = eval(
    DISABLE_JS_SCRIPT +
      ATOB_SCRIPT +
      rguardScript +
      `
        var images = ${JSON.stringify(urls)};
        beau(images);
        images;
    `,
  )

  return script.map((item: string) => ({ url: item }))
}
