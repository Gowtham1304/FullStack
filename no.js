var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/registration", function (req, res){
    res.sendFile(__dirname + "/public/" + "registration.html");
});

var admin = require("firebase-admin");
var serviceAccount = require("./key.json");

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

app.post("/reg", async function (req, res){
    const { username, email, password } = req.body;

    
    const emailExists = await checkEmailExists(email);

    if (emailExists) {
        res.send("Email already exists");
    } else {
        
        const hashedPassword = await bcrypt.hash(password, 10);

        db.collection('address').add({
           FullName: username,
           Email: email,
           Password: hashedPassword
        })
        .then(()=>{
            res.redirect("/login.html");
        });
    }
});


async function checkEmailExists(email) {
    const querySnapshot = await db.collection('address')
        .where("Email", "==", email)
        .get();
    return !querySnapshot.empty;
}

app.get("/login", function (req, res){
    res.sendFile(__dirname + "/public/" + "login.html");
});

app.post("/signin", function (req, res){
    const { email, password } = req.body;

    db.collection('address')
    .where("Email", "==", email)
    .get()
    .then(async (querySnapshot) => {
        if(querySnapshot.empty){
            res.send("User not found");
        }
        else{
            const user = querySnapshot.docs[0].data();
            const hashedPassword = user.Password;

            
            const passwordMatch = await bcrypt.compare(password, hashedPassword);

            if (passwordMatch) {
                res.redirect("/web.html");
            } else {
                res.send("Incorrect email or password");
            }
        }
    });
});

app.listen(3000, function () {  
    console.log('Example app listening on port 3000!');
});