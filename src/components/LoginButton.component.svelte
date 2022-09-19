<script>
    import { app } from '../firebase.js';
    import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
    import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore/lite';
    import { userData, userIsAdmin } from '../stores.js';

    let auth = getAuth(app);
    let db = getFirestore(app);
    let provider = new GoogleAuthProvider();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            userData.set(user);
            // check firestore if data exists for user
            userDbEntry($userData.uid, $userData.email);

        } else {
            userData.set('');
        }

        userIsAdmin.set(false);
    })

    function signin() {
        signInWithPopup(auth, provider);
    }

    function signout() {
        signOut(auth);
    }

    async function userDbEntry(uid, email) {
        let docRef = doc(db, 'users', uid);
        let docSnap = await getDoc(docRef);

        // create new entry in db with permission level on first login
        if (docSnap.exists()) {
            userIsAdmin.set(docSnap.data().isAdmin);
        } else {
            let userRef = collection(db, 'users');

            await setDoc(doc(userRef, uid), 
                {
                    email: email,
                    // new users are not admins
                    isAdmin: false,
                },    
            );
        }
    }

</script>

{#if $userData}
    <button class=login-btn on:click|preventDefault={ signout }>Sign Out</button>
{:else}               
    <button class=login-btn on:click|preventDefault={ signin }>Sign In</button>
{/if}

<style>
    /* apply the same style to the other nav bar buttons */
    button {
        background: none;
        color: #fff;
        border-style: none;
        z-index: 100%;
        width: 100%;
        height: 100%;
        text-decoration: none;
        font-weight: lighter;
        transition: color 0.05s ease-in;
    }

    button:hover {
        color: #00acac;
    }
</style>