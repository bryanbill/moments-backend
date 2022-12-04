import mongoose from "mongoose";

export const DBconnection = async () => {
    await mongoose
        .connect(process.env.MONGO_URI ?? "mongodb://localhost:27017/moments", {

        })
        .then(() => console.log("DB connected".cyan.underline))
        .catch(err => {
            console.log(`For some reasons we couldn't connect to the DB`.red, err)
        })

}
