import { currentUser } from "@clerk/nextjs/server"
import { db } from "./prisma";

export const checkUser = async () => {
    //grab the user
    const user = await currentUser();

    //if user not found
    if(!user){
        return null;
    }

    try {
        //user that logged in find it from the databse
        const loggedInUser = await db.user.findUnique({
            where: {
                clerkUserId: user.id,
            },
        });

        //if found return
        if(loggedInUser){
            return loggedInUser;
        }

        //else add the user to the database
        const name = `${user.firstName} ${user.lastName}`;
        const newUser = await db.user.create({
            data: {
                clerkUserId: user.id,
                name,
                imageUrl: user.imageUrl,
                email: user.emailAddresses[0].emailAddress,
            }
        });

        return newUser;

    } catch (error) {
        console.log(error.meesage);
    }
}