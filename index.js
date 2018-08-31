const fs = require('fs')
const request = require('request')

'use strict'

const crypto = require('crypto')
const querystring = require('querystring')
const Controller = require('egg').Controller

let config = {
  TKK: '0'
}

var yr = null;
var wr = function(a) {
    return function() {
        return a
    }
}
    , xr = function(a, b) {
    for (var c = 0; c < b.length - 2; c += 3) {
        var d = b.charAt(c + 2)
            , d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d)
            , d = "+" == b.charAt(c + 1) ? a >>> d : a << d;
        a = "+" == b.charAt(c) ? a + d & 4294967295 : a ^ d
    }
    return a
};

const sM = (a) => {
    var b;
    if (null !== yr)
        b = yr;
    else {
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

const translateFunc =async (text, options, ctx) => {

  // 如果内容只有标签 无需翻译 直接返回
  if (text.replace(/<.*?>/g, '').trim() === '') {
    return text
  }

  options.from = options.from || 'auto'
  options.to = options.to || 'en'


  if (config.TKK === '0') {
    const res = await ctx.curl('https://translate.google.cn')

    //console.log('==========res==============', res.data.toString())

    const code = res.data.toString().match(/TKK=.*?var a\\x3d(\d*);var b\\x3d(-?\d*);return (\d*)\+.*?'\);/i)

    if (code) {
        config.TKK  = code[3] + '.' + (Number(code[1]) + Number(code[2]))
    }
  }

  const token = sM(text).replace('&tk=', '')

  //console.log(config, '======token=======', token)

  let url = 'https://translate.google.cn/translate_a/single';
  const params = {
    client: 't',
    sl: options.from,
    tl: options.to,
    hl: options.to,
    dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
    ie: 'UTF-8',
    oe: 'UTF-8',
    otf: 1,
    ssel: 0,
    tsel: 0,
    kc: 7,
    tk: token
  }
  
  const fromData = {
    q: text
  }
  url += '?' + querystring.stringify(params)

  //console.log('=====fromData==========', fromData)

  let result = await ctx.curl(url, {
    method: 'POST',
    data: fromData,
    dataType: 'json',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    },
    timeout: 60 * 1000
  })

  let data = {
    text: '',
    language: ''
  }

  data.language = result.data[8][0][0]
  result = result.data[0]

  for (let i = 0;i < result.length;i++){
			if (result[i][0] !== null) {
				data.text += result[i][0]
			}
  }
//console.log('=======data======', data)
/*   let translations = await rp.post(url, {
			form: fromData,
			encoding: 'UTF-8'
		})

  console.log('=======123======', translations.toString()) */

  return data
}


let count = 1;
let replaceMap = {}
const replaceKeyStart = '%'
const replaceKeyEnd = 'd '
let translateSourceTextArr = []

let translateSourceText = sourceText.replace(/\t|\r|\n/g, '')
  .replace(/<script.*?>(?:\s|\r|\n|.)*?<\/script>/ig, '').replace(/\s+/g, ' ')
  .replace(/<style.*?>(?:\s|\r|\n|.)*?<\/style>/ig, (rs) => {
    count += 3
    replaceMap[replaceKeyStart + count + replaceKeyEnd] = rs
    return replaceKeyStart + count + replaceKeyEnd
  }).replace(/<!--\[if.*?-->/ig, (rs) => {
    count += 3
    replaceMap[replaceKeyStart + count + replaceKeyEnd] = rs
    return replaceKeyStart + count + replaceKeyEnd
  }).replace(/<!--.*?-->/ig,'')

translateSourceText = translateSourceText.replace(/<.*?>/g, (rs) => {
  count += 3
  replaceMap[replaceKeyStart + count + replaceKeyEnd] = rs
  return replaceKeyStart + count + replaceKeyEnd
}) 
// console.log('=========replaceMap========', replaceMap)

const detectText = translateSourceText.replace(/<.*?>/g, '').substr(0,3500)

const detectResult = await translateFunc(detectText, {from: 'auto'}, this.ctx)

source = detectResult.language || source

let start = 0
let nextIndex = 3000

while(start < translateSourceText.length){
  const end = translateSourceText.indexOf(replaceKeyStart, nextIndex) !== -1 ? translateSourceText.indexOf(replaceKeyStart, nextIndex) : translateSourceText.length + 1
  translateSourceTextArr.push(translateSourceText.substring(start, end))
  start = end
  nextIndex = start + 3000
}
// console.log('=========translateSourceText========', translateSourceText)
const result = await Promise.all(translateSourceTextArr.map(translateSourceText => translateFunc(translateSourceText, {from: source ,to: target}, this.ctx)))

data = ''

for (let i = 0; i < result.length; i++) {
  data += result[i].text
}

// console.log('=========data========', data)

data = data.replace(/(?:％|%)?\s?(\d{1}\s?\d?\s?\d?\s?\d?\s?\d?\s?\d?\s?\d?\s?)(?:d|e)e?\s?/ig, (rs, index) => {
  //console.log('============', rs)
  index = index.replace(/\s/g, '').toLowerCase()
  return replaceMap[`%${index}d `] || ''
})

data = data.replace(/\"/g, '"').replace(/＆/g, '&').replace(/&\s?n\s?b\s?s\s?p\s?;/ig, '&nbsp;')
        .replace(/<</g, '《').replace(/>>/g, '》')