import { useState } from "react";
import "./app.css";
import axios from "axios";
import jwt_decode from 'jwt-decode';

function App(){

const [user, setUser] = useState(null);
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [success, setSuccess] = useState(false);
const [error, setError] = useState(false);


const refreshToken = async()=>{
try{
const res = await axios.post("/api/refresh", {refreshToken : user.refreshToken});
setUser({
  ...user,
  accessToken : res.data.accessToken,
  refreshToken : res.data.refreshToken
});
return res.data;
}catch(err){
  console.log(err);
}
}

const axiosJWT = axios.create();

axiosJWT.interceptors.request.use(
  async (config)=>{
    let currentDate = new Date();
    const decodeToken = jwt_decode(user.accessToken);
    if(decodeToken.exp*1000<currentDate.getTime()){
      const data = await refreshToken();
      config.headers["auth"] = "Bearer " + data.accessToken; 
    }
    return config;
  },(error)=>{
    return Promise.reject(error);
  }
)


const submit= async (e)=>{
  e.preventDefault();
  try{
const res = await axios.post("/api/login", {username, password});
setUser(res.data);
  }catch(err){
console.log(err);
  }
}

const deleteUser = async(id)=>{
  setSuccess(false);
  setError(false);
  try{
  await axiosJWT.delete("/api/user/" + id, {headers : {auth : "Bearer " + user.accessToken}});
setSuccess(true);
}catch(err){
  setError(true);
  console.log(err);
}

}

const loggout = async()=>{
  try{
await axios.post("/api/loggout", {token : user.refreshToken});
  }catch(err){
    console.log(err);
  }
}

  return(
    <div className="container">
{user?
<div className="login">
  <span>홈</span>
  <span>John</span>
  <button className="button" onClick={()=>deleteUser(1)}>John delete</button>
  <span>Jane</span>
  <button className="button" onClick={()=>deleteUser(2)}>Jane delete</button>
  <button className="loggoutbutton" onClick={()=>loggout()}>Loggout</button>
  {success&&<span className="success">삭제 성공!</span>}
  {error&&<span className="error">삭제 불가합니다.</span>}
</div>:
<div className="home">
  <form className="form" onSubmit={submit}>
  <span>로그인</span>
<input className="input" type="text" placeholder="id" onChange={(e)=>setUsername(e.target.value)} />
<input className="input" type="password" placeholder="password" onChange={(e)=>setPassword(e.target.value)} />
<button type="submit" className="submitbutton">Login</button>
  </form>
</div>
}
    </div>
  )
}

export default App;