import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwt = jsonwebtoken;
const secretKey = process.env.JWT_SECRET;

const createSecretToken = (id) => {
    return jwt.sign({id}, secretKey, {
        expiresIn: "1d"
    })
}

export {createSecretToken};