const form=document.getElementById("loginForm");
form.addEventListener("submit",async(e)=>{
e.preventDefault();

try{
const res=await fetch(`${API_URL}/auth/login`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
email:loginEmail.value,
password:loginPassword.value
})
});

const data=await res.json();

if(!res.ok){
alert(data.message || "Wrong Email or Password");
return;
}

localStorage.setItem("token",data.token);
localStorage.setItem("user",JSON.stringify(data.user));
localStorage.setItem("loggedIn","true");

alert("Welcome "+data.user.name);
window.location="index.html";

}catch(err){
alert("Could not reach the server. Is the backend running?");
console.error(err);
}
});
