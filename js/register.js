const form=document.getElementById("registerForm");
form.addEventListener("submit",async(e)=>{
e.preventDefault();

try{
const res=await fetch(`${API_URL}/auth/register`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
name:name.value,
email:email.value,
password:password.value
})
});

const data=await res.json();

if(!res.ok){
alert(data.message || "Registration failed");
return;
}

localStorage.setItem("token",data.token);
localStorage.setItem("user",JSON.stringify(data.user));
localStorage.setItem("loggedIn","true");

alert("Registration Successful!");
window.location="index.html";

}catch(err){
alert("Could not reach the server. Is the backend running?");
console.error(err);
}
});
