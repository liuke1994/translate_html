const translate = require('./index.js')


const str1 = '123'
const str2 = '你好'
const str3 = '我'
const str4 = '变'
const str5 = '你'

// token(str2).then(async (tokenStr) => {

//   let url = 'https://translate.google.cn/translate_a/single';
//   const params = {
//     client: 't',
//     sl: 'auto',
//     tl: 'en',
//     hl: 'en',
//     dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
//     ie: 'UTF-8',
//     oe: 'UTF-8',
//     otf: 1,
//     ssel: 0,
//     tsel: 0,
//     kc: 7,
//     tk: tokenStr
//   }
  

//   const body = {
//     q: str2
//   }
//   url += '?' + querystring.stringify(params)

//   let result = await request({
//     method: 'POST',
//     uri: url,
//     form: body,
//     encoding: 'UTF-8'
//   })

//   let resultObj = JSON.parse(result)

//   let data = {
//     text: '',
//     language: ''
//   }

//   data.language = resultObj[8][0][0]
//   resultObj = resultObj[0]

//   for (let i = 0;i < resultObj.length;i++){
//       if (resultObj[i][0] !== null) {
//         data.text += resultObj[i][0]
//       }
//   }

//   console.log(typeof(data), '=======', data)
// })

translate(str2, 'en').then((data) => {
  console.log(data)
})
// token(str3).then((err, data) => {
//   console.log(err, data)
// })
// token(str4).then((err, data) => {
//   console.log(err, data)
// })
// token(str5).then((err, data) => {
//   console.log(err, data)
// })