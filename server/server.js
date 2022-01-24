const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

const users=[
{
    id:"1",
    username : "john",
    password : "john111",
    isAdmin : true
},
{
    id:"2",
    username : "jane",
    password : "jane111",
    isAdmin : false
}
]

let refreshTokens = [];

const generalAccessToken = (user)=>{
return jwt.sign({id: user.id, isAdmin : user.isAdmin}, "AccessScretKEY", {expiresIn : "10s"})
}

const generalRefreshToken = (user)=>{
    return jwt.sign({id: user.id, isAdmin : user.isAdmin}, "RefreshScretKEY")
}

app.post("/api/login", (req,res)=>{
    const {username, password} = req.body;
    const user = users.find((u)=>{
       return u.username===username && u.password === password;
    })
    if(user){
        const accessKey = generalAccessToken(user);
        const refreshKey = generalRefreshToken(user);
        refreshTokens.push(refreshKey);
        res.json({
            username : user.username,
            isAdmin : user.isAdmin,
            accessToken : accessKey,
            refreshToken : refreshKey
        })
    }else{
        res.status(400).json("아이디나 비번이 달라요!")
    }
})

app.post("/api/refresh", (req,res)=>{
    const refreshToekn = req.body.refreshToken;
    if(!refreshToekn) return res.status(401).json("인증이 안됐어요!");
    if(!refreshTokens.includes(refreshToekn)) return res.status(403).json("토큰이 유효하지 않아요!");
    jwt.verify(refreshToekn, "RefreshScretKEY", (err,user)=>{
        if(err){
            return res.status(401).json("토큰 유효하지 않아요!")
        }
        refreshTokens = refreshTokens.filter((token)=>token!==refreshToekn);
        const newAccessToken = generalAccessToken(user);
        const newRefreshToken = generalRefreshToken(user);
        refreshTokens.push(newRefreshToken);
        res.status(200).json( {accessToken : newAccessToken, refreshToken : newRefreshToken})
    })
})

const verify = (req,res,next)=>{
    const authHeader = req.headers.auth;
    if(authHeader){
        const token = authHeader.split(" ")[1];
        jwt.verify(token, "AccessScretKEY", (err,user)=>{
            if(err){
               return res.status(401).json("토큰 유효하지 않아요!");
            }
            req.user = user;
            next();
        })
    }else{
        res.status(401).json("인증되지 않았습니다!")
    }
}

app.delete("/api/user/:id", verify, (req,res)=>{
if(req.params.id === req.user.id || req.user.isAdmin){
    res.status(200).json("삭제완료!")
}
else{
    res.status(403).json("삭제 불가합니다.")
}
})

app.post("/api/loggout", (req,res)=>{
const refreshToken = req.body.token;
            refreshTokens = refreshTokens.filter((token)=>{refreshToken!==token})
            res.status(200).json("로그아웃 완료!")
})


app.listen(4000, ()=>{
    console.log("server connect")
})