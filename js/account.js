const token = localStorage.getItem("token");

if(!token){
    alert("Please log in to view your account.");
    window.location.href = "login.html";
}

function logout(){
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

function toast(message){
    const toast=document.createElement("div");
    toast.className="toast";
    toast.innerHTML=message;
    document.body.appendChild(toast);
    setTimeout(()=>{ toast.classList.add("show"); },100);
    setTimeout(()=>{
        toast.classList.remove("show");
        setTimeout(()=>{ toast.remove(); },400);
    },2500);
}

async function loadProfile(){
    try{
        const res = await fetch(`${API_URL}/users/me`,{
            headers:{ "Authorization":"Bearer "+token }
        });
        const user = await res.json();

        if(!res.ok){
            toast(user.message || "Could not load profile");
            return;
        }

        document.getElementById("accountName").value = user.name || "";
        document.getElementById("accountEmail").value = user.email || "";
        document.getElementById("accountPhone").value = user.phone || "";
        document.getElementById("accountAddress").value = user.address || "";

    }catch(err){
        toast("Could not reach the server.");
        console.error(err);
    }
}

document.getElementById("accountForm").addEventListener("submit", async (e)=>{
    e.preventDefault();

    try{
        const res = await fetch(`${API_URL}/users/me`,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+token
            },
            body: JSON.stringify({
                name: document.getElementById("accountName").value,
                phone: document.getElementById("accountPhone").value,
                address: document.getElementById("accountAddress").value
            })
        });

        const data = await res.json();

        if(!res.ok){
            toast(data.message || "Could not save changes");
            return;
        }

        // Keep localStorage's cached user name in sync (used elsewhere for display)
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};
        storedUser.name = data.name;
        localStorage.setItem("user", JSON.stringify(storedUser));

        toast("✅ Profile updated");

    }catch(err){
        toast("Could not reach the server.");
        console.error(err);
    }
});

loadProfile();
