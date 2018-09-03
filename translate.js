'use strict'

const crypto = require('crypto')
const querystring = require('querystring')
const request = require('request-promise')
const tokenFactory = require('./token.js')

const translateFunc =async (text, options, ctx) => {

  // 如果内容只有标签 无需翻译 直接返回
  if (text.replace(/<.*?>/g, '').trim() === '') {
    return text
  }

  options.from = options.from || 'auto'
  options.to = options.to || 'en'

  const token = await tokenFactory(text)

  // console.log('======token=======', token)

  let uri = 'https://translate.google.cn/translate_a/single';
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
  
  const form = {
    q: text
  }

  uri += '?' + querystring.stringify(params)

  const result = await request({
    method: 'POST',
    uri,
    form,
    encoding: 'UTF-8'
  })

  let resultObj = JSON.parse(result)

  let data = {
    text: '',
    language: ''
  }

  data.language = resultObj[8][0][0]
  resultObj = resultObj[0]

  for (let i = 0;i < resultObj.length;i++){
			if (resultObj[i][0] !== null) {
				data.text += resultObj[i][0]
			}
  }

  return data
}


const translate = async (sourceText, target, source) => {
    let data = ''
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
      index = index.replace(/\s/g, '').toLowerCase()//.replace(/^<span(\d{1,7})>$/, '<span $1>')
      return replaceMap[`%${index}d `] || ''
    })

    data = data.replace(/\"/g, '"').replace(/＆/g, '&').replace(/&\s?n\s?b\s?s\s?p\s?;/ig, '&nbsp;')
            .replace(/<</g, '《').replace(/>>/g, '》')

    return data
}

module.exports = translate
