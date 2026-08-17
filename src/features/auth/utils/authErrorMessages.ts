export const getAuthErrorMessage = (error) => {
    const code = error?.code || ""

    switch (code) {
        case "auth/invalid-email":
            return "Invalid email address."

        case "auth/missing-email":
            return "Please enter your email address."

        case "auth/missing-password":
            return "Please enter your password."

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Wrong email or password."
        
        case "auth/user-disabled":
            return "Your account is disabled. Contact support."
        
        case "auth/too-many-requests":
            return "Too many tries. Please try again later."

        case "auth/network-request-failed":
            return "Connection problems. Check the internet."

        // Google popup
        case "auth/popup-closed-by-user":
            return "Your login has been canceled."

        case "auth/cancelled-popup-request":
            return "There is already an open authentication window."

        case "auth/popup-blocked":
            return "The browser has blocked the login window."

        case "auth/account-exists-with-different-credential":
            return "There is already an account with this email, but with a different authentication method."

        default:
            return "Authentication failed. Try again."
    }
}