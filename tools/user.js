const { usersInSingingPart } = require('../credential/userList.js');
let users = []
let usersPassword = {}
const bcrypt = require("bcrypt");
const {
    argv
} = require('node:process');
const {
    writeFile
} = require('fs').promises;
const mixedGroup = {
    t1: 'T',
    b1: 'B',
    a1: 'A',
    t2: 'T',
    b2: 'B',
    a2: 'A'
}

function randomPassword(length) {
    return Math.floor(Math.random() * 9) + (length > 1 ? randomPassword(length - 1) : "")
}
console.log("generating password with length: " + argv[2])
var suffix = argv[3] ? argv[3] : ''
Object.keys(usersInSingingPart).forEach(singingPart => {
    let userFUllNames = usersInSingingPart[singingPart].replaceAll('#', '').trim().split(",")
    singingPart = Object.keys(mixedGroup).includes(singingPart) ? mixedGroup[singingPart] : singingPart
    singingPart = singingPart.toUpperCase()
    let emailHost = ['T', 'B', 'A'].includes(singingPart) ? "yahoo.com" : "gmail.com"
    users = [...users, ...userFUllNames.map(fullname => fullname.trim()).map(fullname => {
        let password = randomPassword(Number(argv[2]))
        let saltedpassword = bcrypt.hashSync(`${password}`, 10)
        usersPassword[fullname] = password
        return {
            username: fullname.replace(/[^a-z]/gi, '').toLowerCase() + suffix,
            saltedpassword: saltedpassword,
            fullname: fullname,
            email: `hkccticketing.${singingPart}@${emailHost}`,
            singingPart: singingPart,
            verified: false
        }
    })]
})

writeFile(`./credential/users${suffix}.json`,
    JSON.stringify(users), 'utf8', () => { });

writeFile(`./credential/password${suffix}.json`,
    JSON.stringify(usersPassword), 'utf8', () => { });