'use strict'

const request = require('request-promise')

module.exports = (() => {
  const config = {}
  config.TKK = ''
  config.now = 0

  const wr = a => {
      return () => a
  }
  const xr = function(a, b) {
      for (var c = 0; c < b.length - 2; c += 3) {
          var d = b.charAt(c + 2)
              , d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d)
              , d = "+" == b.charAt(c + 1) ? a >>> d : a << d;
          a = "+" == b.charAt(c) ? a + d & 4294967295 : a ^ d
      }
      return a
  };

  const sM = (a, yr) => {
      var b;
      if (null !== yr) {
          b = yr;
      } else {
          b = wr(String.fromCharCode(84));
          var c = wr(String.fromCharCode(75));
          b = [b(), b()];
          b[1] = c();
          b = (yr = config[b.join(c())] || "") || ""
      }
      var d = wr(String.fromCharCode(116))
          , c = wr(String.fromCharCode(107))
          , d = [d(), d()];
      d[1] = c();
      c = "&" + d.join("") + "=";
      d = b.split(".");
      b = Number(d[0]) || 0;
      for (var e = [], f = 0, g = 0; g < a.length; g++) {
          var l = a.charCodeAt(g);
          128 > l ? e[f++] = l : (2048 > l ? e[f++] = l >> 6 | 192 : (55296 == (l & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (l = 65536 + ((l & 1023) << 10) + (a.charCodeAt(++g) & 1023),
              e[f++] = l >> 18 | 240,
              e[f++] = l >> 12 & 63 | 128) : e[f++] = l >> 12 | 224,
              e[f++] = l >> 6 & 63 | 128),
              e[f++] = l & 63 | 128)
      }
      a = b;
      for (f = 0; f < e.length; f++)
          a += e[f],
              a = xr(a, "+-a^+6");
      a = xr(a, "+-3^+b+-f");
      a ^= Number(d[1]) || 0;
      0 > a && (a = (a & 2147483647) + 2147483648);
      a %= 1E6;
      return c + (a.toString() + "." + (a ^ b))
  }

  return async function(text) {
    const now = Math.floor(Date.now() / 3600000)
    
    if (config.now !== now) {
      const res = await request('https://translate.google.cn')

      const code = res.toString().match(/TKK=.*?var a\\x3d(\d*);var b\\x3d(-?\d*);return (\d*)\+.*?'\);/i)

      if (code) {
          config.TKK  = `${code[3]}.${+code[1] + +code[2]}`
          config.now  = +code[3]
      }
    }

    return sM(text, config.TKK).replace('&tk=', '')
  }
})()