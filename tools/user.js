var usersInSingingPart = {
    s1: "#Hazel Hon, #Winifred Lee, #Ivy Wong,  T.Y. Chen, Pauli Lai,  Catherine Li, Winnie Lai, Candy Chik, Zoe Tang,  Elaine Chan, Rebecca Siu, Winnie Yau, Eden Yiu, Maria Li, Kimmy Kam, Tracy Yeung, Stella Lam, Kim Wong, Rebecca Ho, Sandra Tam",
    s2: "#Mary Chu,  Ophelia Chan, Karen Tang, Alice Yeung, Stela Ngo, Mimi Ho, KK Leung, Alison Tsang, Monita Chow, Cecilia Chan, Jane Lai, Lynn Zhang, Eileen Tang",
    a: "#Shelley Deng,  #Anita Chau, Anita Kwan, Angela Chan, Lily Yeung, Sarah Chan, Ophelia Ng, Fonia Chan",
    a: "#Yabe Makiko, Gladys Lau, Sue Fung, Joyce Chu, Melody Zhang, Anna Shih, May Chan, Vicki Yu, Ada Wong, Choi-ling Cheung, Ella Chan",
    t: "#Joe Cheng, #Man-kin Hong, Yiu-chung Wong, Colman Shuen, John Lam, Terry Ching, Jack Kung, Chi-fai Shek, Larry Ho",
    t: "Patrick Lo, Jack Leung, Charn-wing Ng, Tony Kwong, Akira Cheung, Vinson Ho, Sam Szeto, Jerry So",
    b: "Mark Li,  Ivan Chan, Willaim Hui, Wally Ho, Cedric Lam,  Brian Yau, Wai-hong Fong, Angus Lee",
    b: "#Lawrence Lau, Samuel Lui, Sam Lo, Alan Chan, Gary Wong, Jian Sun"
}
users = []
const bcrypt = require("bcrypt");
Object.keys(usersInSingingPart).forEach(singingPart => {
    let userFUllNames = usersInSingingPart[singingPart].replaceAll("#", "").trim().split(",")
    singingPart = singingPart.toUpperCase()
    let saltedpassword = bcrypt.hashSync(`${singingPart}jerry123`, 10)
    users = [...users, ...userFUllNames.map(fullname => {
        return {
            username: fullname.replaceAll(" ", ''),
            saltedpassword: saltedpassword,
            fullname: fullname,
            email: `hkccticketing.${singingPart}@gmail.com`,
            singingPart: singingPart,
            verified: false
        }
    })]
})

const {
    readdir,
    writeFile
} = require('fs').promises;
writeFile('users.json',
    JSON.stringify(users), 'utf8', () => {});