const jwt = require("jsonwebtoken");
function createToken(user){
    return jwt.sign(
        {
            id:user._id,
            role:user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"30d"
        }
    );
}
module.exports = createToken;
