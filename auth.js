/* ============ EdenRise Academy — Firebase auth + per-profile cloud sync ============
   Loads the Firebase modular SDK from the gstatic CDN (no build step). Handles
   Google + email/password sign-in, stores each learner's state under users/{uid}
   in Firestore, and bridges to app.js via window.EdenApp / window.EdenCloud.        */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence,
  GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBt4pfWRLWUdAjVL8xoEoR7o4wFCjUCUjs',
  authDomain: 'edenrise-academy.firebaseapp.com',
  projectId: 'edenrise-academy',
  storageBucket: 'edenrise-academy.firebasestorage.app',
  messagingSenderId: '295112713200',
  appId: '1:295112713200:web:4f3beb0324b9b995383335',
  measurementId: 'G-SWLQKTVJQS'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

const KEY = 'edenrise-state-v2';
const MODE = 'eden-auth-mode';          // 'firebase' | 'guest' | 'out'
const $ = s => document.querySelector(s);
const T = k => (typeof window.t === 'function' ? window.t(k) : k);
const isPT = () => (typeof S !== 'undefined' && S.lang === 'pt');

/* ---------- gate visibility (driven by html[data-gate]) ---------- */
const gate = () => $('#authGate');
function showGate() { document.documentElement.setAttribute('data-gate', 'on'); }
function hideGate() { document.documentElement.setAttribute('data-gate', 'off'); }
function setBusy(on) { const b = $('#authBusy'); if (b) b.classList.toggle('on', on); }
function showErr(msg) { const e = $('#authErr'); if (e) { e.textContent = msg || ''; e.classList.toggle('on', !!msg); } }

/* ---------- state <-> Firestore ---------- */
function localState() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
async function pullState(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists() && snap.data().state) { localStorage.setItem(KEY, JSON.stringify(snap.data().state)); return true; }
  return false;
}
let pushTimer = null;
async function ensureProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const profile = {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'Learner'),
    photo: user.photoURL || '',
    provider: (user.providerData[0] && user.providerData[0].providerId) || 'password'
  };
  const payload = { profile, updatedAt: serverTimestamp() };
  if (!snap.exists()) { payload.state = localState(); payload.createdAt = serverTimestamp(); }  // seed with their demo state
  await setDoc(ref, payload, { merge: true });
  return profile;
}
function stampProfileLocal(profile) {
  const s = localState(); s.profile = profile; localStorage.setItem(KEY, JSON.stringify(s));
}

/* ---------- bridge exposed to app.js ---------- */
window.EdenCloud = {
  push(state) {
    const u = auth.currentUser; if (!u) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      setDoc(doc(db, 'users', u.uid), { state, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    }, 800);
  },
  async signOut() {
    localStorage.setItem(MODE, 'out');
    try { await signOut(auth); } catch (e) {}
    localStorage.removeItem(KEY);   // clear this device; cloud copy is safe
    location.reload();
  },
  async updateName(name) {
    const u = auth.currentUser; if (!u || !name) return;
    try { await updateProfile(u, { displayName: name }); } catch (e) {}
  }
};

/* ---------- auth state ---------- */
onAuthStateChanged(auth, async user => {
  if (user) {
    localStorage.setItem(MODE, 'firebase');
    setBusy(true);
    try {
      const profile = await ensureProfile(user);
      await pullState(user.uid);
      stampProfileLocal(profile);
      if (window.EdenApp) { window.EdenApp.reloadState(); window.EdenApp.applyProfile(profile); }
    } catch (e) { console.error('[auth] sync failed', e); }
    setBusy(false);
    showErr('');
    hideGate();
  } else {
    if (localStorage.getItem(MODE) === 'guest') { hideGate(); if (window.EdenApp) window.EdenApp.maybeOnboard(); }
    else showGate();
  }
});

/* ---------- error copy ---------- */
function friendly(code) {
  const pt = isPT();
  const m = {
    'auth/invalid-email': pt ? 'Email inválido.' : 'Invalid email.',
    'auth/missing-password': pt ? 'Introduza a palavra-passe.' : 'Enter a password.',
    'auth/weak-password': pt ? 'A palavra-passe precisa de pelo menos 6 caracteres.' : 'Password needs at least 6 characters.',
    'auth/email-already-in-use': pt ? 'Este email já tem conta — inicie sessão.' : 'That email already has an account — sign in instead.',
    'auth/invalid-credential': pt ? 'Email ou palavra-passe incorretos.' : 'Wrong email or password.',
    'auth/user-not-found': pt ? 'Conta não encontrada.' : 'No account found for that email.',
    'auth/wrong-password': pt ? 'Palavra-passe incorreta.' : 'Wrong password.',
    'auth/popup-closed-by-user': pt ? 'Janela fechada antes de concluir.' : 'Sign-in window closed before finishing.',
    'auth/popup-blocked': pt ? 'O navegador bloqueou a janela — permita popups.' : 'Your browser blocked the popup — allow popups and retry.',
    'auth/operation-not-allowed': pt ? 'Ative Email/Password no Firebase (Authentication → Sign-in method).' : 'Enable Email/Password in Firebase (Authentication → Sign-in method).',
    'auth/unauthorized-domain': pt ? 'Domínio não autorizado (Firebase → Authentication → Settings → Authorized domains).' : 'Domain not authorized (Firebase → Authentication → Settings → Authorized domains).'
  };
  return m[code] || (pt ? 'Algo correu mal. Tente novamente.' : 'Something went wrong. Please try again.');
}

/* ---------- login form ---------- */
let signupMode = false;
function refreshMode() {
  const g = gate(); if (!g) return;
  g.classList.toggle('signup', signupMode);
  const submit = $('#authSubmit'); if (submit) submit.textContent = signupMode ? T('auth_signup') : T('auth_signin');
  const toggle = $('#authToggle'); if (toggle) toggle.textContent = signupMode ? T('auth_to_signin') : T('auth_to_signup');
  showErr('');
}
function translateGate() {
  const set = (sel, k) => { const el = $(sel); if (el) el.textContent = T(k); };
  set('#authTitle', 'auth_welcome'); set('#authSub', 'auth_sub');
  set('#authGoogleTxt', 'auth_google'); set('#authOr', 'auth_or');
  set('#authConsentTxt', 'auth_consent');
  const em = $('#authEmail'); if (em) em.placeholder = T('auth_email');
  const pw = $('#authPass'); if (pw) pw.placeholder = T('auth_password');
  const nm = $('#authName'); if (nm) nm.placeholder = T('auth_name');
  const guest = $('#authGuest'); if (guest) guest.textContent = T('auth_guest');
  refreshMode();
}

document.addEventListener('DOMContentLoaded', wire);
if (document.readyState !== 'loading') wire();
function wire() {
  const g = gate(); if (!g || g.dataset.wired) return; g.dataset.wired = '1';
  translateGate();

  $('#authGoogle').addEventListener('click', async () => {
    showErr(''); setBusy(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { setBusy(false); showErr(friendly(e.code)); }
  });

  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault(); showErr('');
    const email = $('#authEmail').value.trim();
    const pass = $('#authPass').value;
    const name = $('#authName').value.trim();
    if (signupMode) {
      if (!$('#authConsent').checked) { showErr(T('auth_consent_req')); return; }
      if (!name) { showErr(isPT() ? 'Introduza o seu nome.' : 'Please enter your name.'); return; }
    }
    setBusy(true);
    try {
      if (signupMode) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (name) await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, 'users', cred.user.uid), { consent: true, consentAt: serverTimestamp() }, { merge: true });
        // onAuthStateChanged already fired; refresh profile name
        if (window.EdenApp) window.EdenApp.applyProfile({ name: name || email.split('@')[0], email });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (err) { setBusy(false); showErr(friendly(err.code)); }
  });

  $('#authToggle').addEventListener('click', () => { signupMode = !signupMode; refreshMode(); });
  $('#authGuest').addEventListener('click', () => { localStorage.setItem(MODE, 'guest'); hideGate(); if (window.EdenApp) window.EdenApp.maybeOnboard(); });

  // language buttons anywhere (incl. the gate) re-translate the gate
  document.addEventListener('click', ev => { if (ev.target.closest('.lang-btn')) setTimeout(translateGate, 0); });
}
