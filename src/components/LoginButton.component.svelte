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
            userData.set(false);
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