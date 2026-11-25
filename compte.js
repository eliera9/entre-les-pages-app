const compteLecture = (() => {
  const url = 'https://onbizlpuzybodnmdtacx.supabase.co';
  const key = 'sb_publishable_TsYbLk6rT_NxbGM4kXPGLw_UM1_oldZ';
  const storageKey = 'entre-les-pages-auth';
  const client = supabase.createClient(url, key, {auth: {storageKey, detectSessionInUrl: false}});
  let owner;
  const {auth} = client;

  async function token() {
    const {data, error} = await auth.getSession();
    if (error || !owner || data.session?.user.id !== owner) {
      throw Object.assign(new Error('Reconnecte-toi pour ouvrir ta bibliothèque.'), {status: 401});
    }
    return data.session.access_token;
  }

  // An in-flight operation always belongs to the account that opened this page.
  const db = supabase.createClient(url, key, {accessToken: token});
  const accountScreen = document.querySelector('#elp-connexion');
  const libraryScreen = document.querySelector('#app-lecture');
  const form = accountScreen.querySelector('form');
  const field = name => form.elements.namedItem(name);
  const alternate = form.querySelector('[data-switch]');
  const message = form.querySelector('[data-auth-error]');
  const title = accountScreen.querySelector('h1');
  let signup = true;
  function setMode(next) {
    signup = next;
    title.textContent = signup ? 'Créer ton compte' : 'Se connecter';
    field('confirmation').closest('[data-confirm-password]').hidden = !signup;
    field('confirmation').disabled = !signup;
    field('password').minLength = signup ? 8 : 1;
    field('password').autocomplete = signup ? 'new-password' : 'current-password';
    form.querySelector('[data-minimum]').hidden = !signup;
    form.querySelector('[data-submit-text]').textContent = signup ? 'Créer mon compte' : 'Se connecter';
    form.querySelector('[data-switch-lead]').textContent = signup ? 'Déjà un compte ?' : 'Première visite ?';
    alternate.textContent = signup ? 'Se connecter' : 'Créer un compte';
    message.hidden = true;
    field('password').value = field('confirmation').value = '';
  }
  const showMessage = text => {message.textContent = text; message.hidden = false;};
  alternate.addEventListener('click', () => setMode(!signup));
  form.querySelector('[data-visibility]').addEventListener('click', event => {
    const visible = field('password').type === 'password';
    field('password').type = visible ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.setAttribute('aria-label', visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const credentials = {email: field('email').value.trim(), password: field('password').value};
    if (signup && credentials.password !== field('confirmation').value) return showMessage('Les deux mots de passe doivent être identiques.');
    const button = form.querySelector('[data-submit]');
    button.disabled = alternate.disabled = true;
    message.hidden = true;
    try {
      const {data, error} = signup ? await auth.signUp(credentials) : await auth.signInWithPassword(credentials);
      if (error) {
        const feedback = {invalid_credentials:'Adresse e-mail ou mot de passe incorrect.', email_not_confirmed:'Confirme ton adresse depuis le lien reçu, puis connecte-toi.', over_email_send_rate_limit:'Trop de demandes. Réessaie un peu plus tard.', weak_password:'Choisis un mot de passe plus long et difficile à deviner.'};
        showMessage(feedback[error.code] || 'Connexion impossible. Vérifie ton adresse et réessaie.');
      } else if (!data.session) {
        setMode(false);
        showMessage('Si cette adresse vient d’être inscrite, ouvre le lien de confirmation reçu puis connecte-toi.');
      } else form.reset();
    } catch { showMessage('Impossible de joindre Supabase. Vérifie ta connexion.'); }
    finally {button.disabled = alternate.disabled = false;}
  });
  async function start(openLibrary) {
    const adapt = () => {
      accountScreen.dataset.format = matchMedia('(min-width: 650px)').matches ? 'tablet' : 'phone';
      accountScreen.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    adapt();
    addEventListener('resize', adapt);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', adapt);
    setMode(true);
    window.lucide?.createIcons();
    auth.onAuthStateChange((_event, session) => {
      if (!owner && !session?.user) accountScreen.hidden = false;
      if (owner && owner !== session?.user.id) {
        libraryScreen.hidden = true;
        location.reload();
      } else if (session?.user && !owner) {
        owner = session.user.id;
        accountScreen.hidden = true;
        libraryScreen.hidden = false;

        setTimeout(async () => {
          await openLibrary();
          libraryScreen.removeAttribute('data-starting');
        }, 0);
      }
    });
  }
  async function logout() {
    libraryScreen.hidden = true;
    try { await auth.signOut({scope:'local'}); }
    finally { localStorage.removeItem(storageKey); location.reload(); }
  }
  return {db, start, logout, get owner() {return owner;}};
})();
