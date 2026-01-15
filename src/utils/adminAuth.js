import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebase";

export const createSystemUser = async (username, password, role, additionalData = {}) => {
    // 1. Initialize a SECOND app instance. 
    // This prevents the main "auth" from switching to the new user.
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    const db = getFirestore(secondaryApp);

    const fakeEmail = `${username.toLowerCase().replace(/\s+/g, '')}@hospital.local`;

    try {
        // 2. Create user in Secondary Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, password);
        const user = userCredential.user;

        // 3. Create Firestore record (so roles work)
        await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: fakeEmail,
            role: role,
            createdAt: new Date(),
            isSystemUser: true,
            onShift: false, // Default to false for agents/supervisors
            isDisabled: false, // For enabling/disabling access
            ...additionalData // dni, fullName, phone, hospital, gate
        });

        // 4. Cleanup: Sign out the secondary auth so it doesn't linger (though it's isolated)
        await signOut(secondaryAuth);

        return { success: true };

    } catch (error) {
        console.error("Error creating system user:", error);
        return { success: false, error: error.message };
    }
};
