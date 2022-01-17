<script>
    import { app } from '../firebase.js';
    import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
    import { userData } from '../stores.js';

    let auth = getAuth(app);
    let provider = new GoogleAuthProvider();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            userData.set(user);
        } else {
            userData.set(null)
        }
    })

    function signin() {
        signInWithPopup(auth, provider);
    }

    function signout() {
        signOut(auth);
    }

</script>

{#if $userData}
    <button class=login-btn on:click|preventDefault={signout}>Sign Out</button>
{:else}               
    <button class=login-btn on:click|preventDefault={signin}>Sign In</button>
{/if}