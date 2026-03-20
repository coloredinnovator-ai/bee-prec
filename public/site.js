import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB6xFIHo1dScHVia598sWrfJ90OVms0U8E',
  authDomain: 'nanny-tech.firebaseapp.com',
  projectId: 'nanny-tech',
  storageBucket: 'nanny-tech.firebasestorage.app',
  messagingSenderId: '269966152674',
  appId: '1:269966152674:web:310da6b6d60f4e4eb75fbb'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const state = {
  user: null,
  profile: null,
  lawyerMode: false,
  loading: false,
  lastNewsletterSubmit: 0,
  lastClinicSubmit: 0,
  profileDoc: null,
  identityDoc: null,
  profilesCache: []
};

const LAWYER_CODES = new Set(['BEEPREC-LAWYER', 'BEEPREC-LAWYER-2026']);
const ALLOWED_ROLES = ['member', 'pendingLawyer'];
const MAX_TEXT_LENGTH = 5000;
const MAX_SHORT_TEXT = 120;
const MAX_NAME_LENGTH = 80;
const MAX_REASON_LENGTH = 1200;
const MAX_PROFILE_BIO = 400;
const MAX_HANDLE_LENGTH = 40;
const MAX_LOCATION_LENGTH = 80;
const MAX_ORG_LENGTH = 120;
const MAX_URL_LENGTH = 160;
const MAX_FOCUS_RAW = 200;
const MAX_FOCUS_TAGS = 8;
const MAX_FOCUS_TAG_LEN = 24;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONSULTATION_AREAS = new Set(['contracts', 'workplace', 'smallBusiness', 'cyber', 'other']);
const ALLOWED_CONSULTATION_URGENCY = new Set(['low', 'normal', 'high', 'critical']);
const ALLOWED_REPORT_CATEGORIES = new Set(['fraud', 'harassment', 'discrimination', 'stolenBusinessData', 'other']);
const ALLOWED_REPORT_PRIORITIES = new Set(['low', 'medium', 'high']);
const ALLOWED_ATTACHMENT_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const ALLOWED_NEWSLETTER_TOPICS = new Set(['co-op-news', 'guides', 'coop-project-updates']);
const ALLOWED_CLINIC_STAGE = new Set(['idea', 'planning', 'pilot', 'ready-to-launch']);
const ALLOWED_CLINIC_HELP = new Set(['legal-coop-setup', 'governance', 'funding', 'member-structure', 'other']);
const ALLOWED_PROFILE_VISIBILITY = new Set(['members', 'public']);
const ALLOWED_ID_TYPES = new Set(['drivers-license', 'passport', 'state-id', 'other']);
const ALLOWED_PROFILE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_ID_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const MAX_PROFILE_BYTES = 2 * 1024 * 1024;
const MAX_ID_BYTES = 5 * 1024 * 1024;

const RATE_LIMIT_WINDOW_MS = 60_000;

const GUIDE_CONTENT = {
  identity: {
    title: 'Cooperative identity',
    items: [
      'Jointly-owned, democratically-controlled enterprise serving member needs.',
      'Member economic participation and limited return on capital.',
      'Education, training, and transparent information sharing.'
    ]
  },
  principles: {
    title: 'ICA values & principles',
    items: [
      'Voluntary and open membership',
      'Democratic member control (one member, one vote)',
      'Member economic participation',
      'Autonomy and independence',
      'Education, training, information',
      'Cooperation among co-ops',
      'Concern for community'
    ]
  },
  cases: {
    title: 'Case snapshots',
    items: [
      'Mondragon (worker co-op federation, Spain)',
      'Arizmendi Bakeries (worker co-op network, US)',
      'Suma Wholefoods (equal pay, UK)',
      'Co-op Home Care (care worker ownership, US)',
      'The Working World (non-extractive finance)'
    ]
  },
  resources: {
    title: 'Key resources',
    items: [
      'ICA Statement on the Cooperative Identity',
      'US Federation of Worker Cooperatives (USFWC) guides',
      'National Cooperative Business Association (NCBA) toolkit',
      'Platform Co-op Consortium playbooks',
      'Community-wealth.org knowledge base'
    ]
  },
  books: {
    title: 'Reading list',
    items: [
      'Humanizing the Economy — John Restakis',
      'Collective Courage — Jessica Gordon Nembhard',
      'Everything for Everyone — Nathan Schneider',
      'Ours to Hack and to Own — Trebor Scholz',
      'Think Like a Commoner — David Bollier'
    ]
  },
  history: {
    title: 'Co-op history',
    items: [
      '1844: Rochdale Pioneers articulate the modern principles.',
      '20th c: Global spread of credit unions, ag and worker co-ops.',
      'Present: Platform co-ops, community land trusts, energy co-ops.',
      'Future: Data trusts and AI-era democratic ownership experiments.'
    ]
  }
};

const LIBRARY_RESOURCES = [
  {
    title: 'ICA Cooperative Law Database',
    link: 'https://www.ica.coop/en/co-operatives/co-operative-law-database',
    detail: 'Global cooperative law references curated by the ICA.'
  },
  {
    title: 'UN Guidelines on Cooperatives',
    link: 'https://www.un.org/development/desa/cooperatives/',
    detail: 'UN resources on cooperative development and policy.'
  },
  {
    title: 'US Federation of Worker Co-ops Library',
    link: 'https://www.usworker.coop/resources/',
    detail: 'Templates, governance guides, and legal primers.'
  },
  {
    title: 'Platform Co-op Playbook',
    link: 'https://platform.coop/now/playbook',
    detail: 'Building platform cooperatives with shared ownership models.'
  },
  {
    title: 'Community Land Trust Legal Resources',
    link: 'https://groundedsolutions.org/resources',
    detail: 'CLT legal frameworks and model documents.'
  }
];

const NEWS_ITEMS = [
  {
    title: 'Via Campesina: Food sovereignty and cooperative land stewardship',
    date: '2026-02-27',
    link: 'https://viacampesina.org/en/'
  },
  {
    title: 'MST: Worker-owned agrarian reform cooperatives in Brazil',
    date: '2026-02-27',
    link: 'https://mst.org.br/english/'
  },
  {
    title: 'Global co-op policy round-up',
    date: '2026-02-15',
    link: 'https://www.thenews.coop/'
  },
  {
    title: 'Platform co-ops and AI data trusts',
    date: '2026-02-10',
    link: 'https://platform.coop'
  }
];

const el = (id) => document.getElementById(id);
const toast = el('toast');
const conn = el('connectionChip');
const userBadge = el('userBadge');
const envBanner = el('envBanner');

if (toast) {
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
}

function showToast(message, timeoutMs = 2800) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), timeoutMs);
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v.toDate) return v.toDate();
  return new Date(v);
}

function showSection(sectionId) {
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === sectionId);
  });
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === sectionId);
  });
}

function roleIsLawyer() {
  return state.profile && ['lawyer', 'admin', 'board'].includes(state.profile.role);
}

function roleIsConsultationTriage() {
  return state.profile && ['admin', 'board'].includes(state.profile.role);
}

function sanitizeText(value = '', max = MAX_TEXT_LENGTH) {
  return String(value).trim().slice(0, max);
}

function sanitizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function isValidEmail(email = '') {
  return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email);
}

function normalizeTimestampInput(input) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
}

function normalizeFilename(fileName = '') {
  const safe = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120) || 'attachment';
  return `${Date.now()}-${safe}`;
}

function parseFocusAreas(raw = '') {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, MAX_FOCUS_TAGS)
    .map((tag) => tag.slice(0, MAX_FOCUS_TAG_LEN));
}

function validateUpload(file) {
  if (!file) return { ok: false, reason: 'No file provided.' };
  if (!ALLOWED_ATTACHMENT_MIME.has(file.type)) return { ok: false, reason: 'Unsupported file type.' };
  if (file.size > MAX_ATTACHMENT_BYTES) return { ok: false, reason: 'File too large. Maximum is 5MB.' };
  return { ok: true };
}

function validateFile(file, allowedTypes, maxBytes, label) {
  if (!file) return { ok: false, reason: `No ${label} file provided.` };
  if (!allowedTypes.has(file.type)) return { ok: false, reason: `Unsupported ${label} file type.` };
  if (file.size > maxBytes) return { ok: false, reason: `${label} file too large.` };
  return { ok: true };
}

function setIdentity(profile, user) {
  if (!user) {
    state.user = null;
    state.profile = null;
    conn.textContent = 'Public mode';
    userBadge.textContent = 'Not signed in';
    document.getElementById('logoutBtn').disabled = true;
    return;
  }
  state.user = user;
  state.profile = profile;
  state.lawyerMode = roleIsLawyer();
  conn.textContent = 'Firebase connected';
  userBadge.textContent = `${user.email} (${profile?.role || 'member'})`;
  document.getElementById('logoutBtn').disabled = false;
  document.getElementById('moderationTab').hidden = !state.lawyerMode;
}

function clearList(elm) {
  if (elm) elm.innerHTML = '';
}

async function tryUploadAttachment(file, reportId, reportedBy) {
  if (!file || !state.user) return null;
  const validation = validateUpload(file);
  if (!validation.ok) {
    showToast(validation.reason);
    return null;
  }
  try {
    const fileRef = ref(storage, `incidents/${reportedBy}/${reportId}/${normalizeFilename(file.name)}`);
    await uploadBytes(fileRef, file, { contentType: file.type });
    const attachmentUrl = await getDownloadURL(fileRef);
    return { attachmentUrl, attachmentPath: fileRef.fullPath, hasAttachment: true, fileName: file.name };
  } catch (error) {
    console.error('Attachment upload failed:', error);
    return null;
  }
}

async function uploadProfilePhoto(file) {
  if (!file || !state.user) return null;
  const validation = validateFile(file, ALLOWED_PROFILE_MIME, MAX_PROFILE_BYTES, 'profile');
  if (!validation.ok) {
    showToast(validation.reason);
    return null;
  }
  try {
    const fileRef = ref(storage, `profiles/${state.user.uid}/${normalizeFilename(file.name)}`);
    await uploadBytes(fileRef, file, { contentType: file.type });
    const avatarUrl = await getDownloadURL(fileRef);
    return { avatarUrl, avatarPath: fileRef.fullPath };
  } catch (error) {
    console.error('Profile upload failed:', error);
    showToast('Profile photo upload failed.');
    return null;
  }
}

async function uploadIdentityDoc(file) {
  if (!file || !state.user) return null;
  const validation = validateFile(file, ALLOWED_ID_MIME, MAX_ID_BYTES, 'identity');
  if (!validation.ok) {
    showToast(validation.reason);
    return null;
  }
  try {
    const fileRef = ref(storage, `identity/${state.user.uid}/${normalizeFilename(file.name)}`);
    await uploadBytes(fileRef, file, { contentType: file.type });
    const documentUrl = await getDownloadURL(fileRef);
    return { documentUrl, documentPath: fileRef.fullPath, documentName: file.name };
  } catch (error) {
    console.error('Identity upload failed:', error);
    showToast('Identity document upload failed.');
    return null;
  }
}

function renderItem({ title, meta, body, actions = [] }) {
  const item = document.createElement('article');
  item.className = 'item';
  item.innerHTML = `<h4>${title}</h4><p>${body}</p><p class="muted">${meta}</p>`;
  const metaRow = document.createElement('div');
  metaRow.className = 'post-meta';
  for (const action of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = action.label;
    btn.className = action.className || '';
    btn.addEventListener('click', action.onClick);
    metaRow.appendChild(btn);
  }
  item.appendChild(metaRow);
  return item;
}

function escapeText(v) {
  return String(v).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function setFormLoading(formId, loading) {
  const form = el(formId);
  if (!form) return;
  form.querySelectorAll('button, input, textarea, select').forEach((node) => {
    node.disabled = loading;
  });
}

async function isRateLimited(bucket) {
  const now = Date.now();
  const key = `beecoop-rate-${bucket}`;
  const prev = Number(localStorage.getItem(key) || 0);
  if (now - prev < RATE_LIMIT_WINDOW_MS) {
    showToast('Please wait a moment before submitting again.');
    return true;
  }
  localStorage.setItem(key, String(now));
  return false;
}

function renderGuideCard(targetId, title, items = []) {
  const root = el(targetId);
  if (!root) return;
  root.innerHTML = `<h3>${title}</h3><ul class=\"guide-list\">${items
    .map((item) => `<li>${escapeText(item)}</li>`)
    .join('')}</ul>`;
}

function renderGuide() {
  renderGuideCard('guideIdentity', GUIDE_CONTENT.identity.title, GUIDE_CONTENT.identity.items);
  renderGuideCard('guidePrinciples', GUIDE_CONTENT.principles.title, GUIDE_CONTENT.principles.items);
  renderGuideCard('guideCases', GUIDE_CONTENT.cases.title, GUIDE_CONTENT.cases.items);
  renderGuideCard('guideResources', GUIDE_CONTENT.resources.title, GUIDE_CONTENT.resources.items);
  renderGuideCard('guideBooks', GUIDE_CONTENT.books.title, GUIDE_CONTENT.books.items);
  renderGuideCard('guideHistory', GUIDE_CONTENT.history.title, GUIDE_CONTENT.history.items);
}

function renderLibrary(filter = '') {
  const root = el('libraryList');
  if (!root) return;
  const term = filter.trim().toLowerCase();
  const items = LIBRARY_RESOURCES.filter((item) => {
    if (!term) return true;
    return (
      item.title.toLowerCase().includes(term) ||
      (item.detail && item.detail.toLowerCase().includes(term))
    );
  });
  if (!items.length) {
    root.innerHTML = '<p class=\"muted\">No matching resources yet. Try another search.</p>';
    return;
  }
  root.innerHTML = items
    .map(
      (item) => `<article class="card">
        <h3>${escapeText(item.title)}</h3>
        <p class="muted">${escapeText(item.detail || '')}</p>
        <a class="cta text" href="${escapeText(item.link)}" target="_blank" rel="noreferrer">Open resource</a>
      </article>`
    )
    .join('');
}

function renderNews() {
  const root = el('newsList');
  if (!root) return;
  root.innerHTML = NEWS_ITEMS.map(
    (item) => `<article class="card">
      <p class="eyebrow">${escapeText(item.date || '')}</p>
      <h3>${escapeText(item.title)}</h3>
      <a class="cta text" href="${escapeText(item.link)}" target="_blank" rel="noreferrer">Read</a>
    </article>`
  ).join('');
}

function setProfileStatus(message) {
  const node = el('profileStatus');
  if (node) node.textContent = message;
}

function setIdentityStatus(message) {
  const node = el('identityStatus');
  if (node) node.textContent = message;
}

function renderDirectory(filter = '') {
  const root = el('directoryList');
  if (!root) return;
  if (!state.user) {
    root.innerHTML = '<p class="muted">Sign in to browse the directory.</p>';
    return;
  }
  const term = filter.trim().toLowerCase();
  const items = (state.profilesCache || []).filter((profile) => {
    if (!term) return true;
    return [
      profile.displayName,
      profile.handle,
      profile.organization,
      profile.location,
      profile.bio,
      ...(profile.focusAreas || [])
    ]
      .filter(Boolean)
      .some((val) => String(val).toLowerCase().includes(term));
  });
  if (!items.length) {
    root.innerHTML = '<p class="muted">No matching members found.</p>';
    return;
  }
  root.innerHTML = '';
  for (const profile of items) {
    const article = document.createElement('article');
    article.className = 'item profile-card';
    const avatar = profile.avatarUrl
      ? `<img class="profile-avatar" src="${escapeText(profile.avatarUrl)}" alt="${escapeText(profile.displayName || 'Member')}" />`
      : `<div class="profile-avatar" aria-hidden="true"></div>`;
    const verifiedBadge = profile.verified ? `<span class="badge verified">Verified</span>` : '';
    const focus = (profile.focusAreas || []).length ? `<div class="profile-meta">Focus: ${(profile.focusAreas || []).map(escapeText).join(', ')}</div>` : '';
    const handle = profile.handle ? `@${escapeText(profile.handle)}` : '';
    const meta = [
      handle,
      profile.organization ? escapeText(profile.organization) : '',
      profile.location ? escapeText(profile.location) : ''
    ]
      .filter(Boolean)
      .join(' · ');
    article.innerHTML = `
      <div class="profile-card__head">
        ${avatar}
        <div>
          <strong>${escapeText(profile.displayName || 'Member')}</strong>
          <div class="profile-meta">${meta}</div>
        </div>
        ${verifiedBadge}
      </div>
      ${profile.bio ? `<p class="muted">${escapeText(profile.bio)}</p>` : ''}
      ${focus}
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ghost';
    btn.textContent = profile.uid === state.user.uid ? 'This is you' : 'Request intro';
    btn.disabled = profile.uid === state.user.uid;
    btn.addEventListener('click', async () => {
      const message = window.prompt('Add a short note for the introduction (optional):') || '';
      await createMatchRequest(profile, message);
    });
    article.appendChild(btn);
    root.appendChild(article);
  }
}

async function loadDirectory() {
  const root = el('directoryList');
  if (!root) return;
  if (!state.user) {
    renderDirectory('');
    return;
  }
  try {
    const snap = await getDocs(query(collection(db, 'profiles'), orderBy('displayName'), limit(200)));
    state.profilesCache = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    renderDirectory(el('directorySearch')?.value || '');
  } catch (e) {
    console.error('Directory load failed', e);
    root.innerHTML = '<p class="muted">Directory unavailable right now.</p>';
  }
}

async function createMatchRequest(targetProfile, message = '') {
  if (!state.user) return showToast('Sign in required');
  const note = sanitizeText(message || '', 400);
  try {
    await addDoc(collection(db, 'matchRequests'), {
      fromUid: state.user.uid,
      toUid: targetProfile.uid,
      fromName: sanitizeText(state.profile?.displayName || state.user.email, MAX_NAME_LENGTH),
      toName: sanitizeText(targetProfile.displayName || targetProfile.handle || 'Member', MAX_NAME_LENGTH),
      message: note,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    showToast('Connection request sent.');
    await loadConnections();
  } catch (e) {
    console.error('Match request failed', e);
    showToast('Could not send request.');
  }
}

async function resolveProfileTarget(raw) {
  const value = sanitizeText(raw, 120);
  if (!value) return null;
  const handle = value.startsWith('@') ? value.slice(1) : value;
  if (value.length >= 20 && !value.startsWith('@')) {
    const snap = await getDoc(doc(db, 'profiles', value));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  }
  const handleSnap = await getDocs(query(collection(db, 'profiles'), where('handle', '==', handle), limit(1)));
  if (!handleSnap.empty) {
    const docItem = handleSnap.docs[0];
    return { id: docItem.id, ...docItem.data() };
  }
  return null;
}

async function loadConnections() {
  const root = el('connectionList');
  if (!root) return;
  if (!state.user) {
    root.innerHTML = '<p class="muted">Sign in to view connection requests.</p>';
    return;
  }
  const fromSnap = await getDocs(query(collection(db, 'matchRequests'), where('fromUid', '==', state.user.uid)));
  const toSnap = await getDocs(query(collection(db, 'matchRequests'), where('toUid', '==', state.user.uid)));
  const items = [...fromSnap.docs, ...toSnap.docs]
    .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    .sort((a, b) => {
      const ta = toDate(a.createdAt)?.getTime() || 0;
      const tb = toDate(b.createdAt)?.getTime() || 0;
      return tb - ta;
    });
  if (!items.length) {
    root.innerHTML = '<p class="muted">No connection requests yet.</p>';
    return;
  }
  root.innerHTML = '';
  for (const item of items) {
    const created = toDate(item.createdAt)?.toLocaleString() || 'N/A';
    const role = item.fromUid === state.user.uid ? 'Sent' : 'Received';
    const body = item.message ? escapeText(item.message) : 'No message provided.';
    const row = renderItem({
      title: `${role} · ${escapeText(item.toName || item.fromName || 'Member')}`,
      body,
      meta: `${escapeText(item.status || 'pending')} · ${created}`,
      actions: item.status === 'pending' && item.toUid === state.user.uid
        ? [
            {
              label: 'Accept',
              onClick: async () => {
                await updateDoc(doc(db, 'matchRequests', item.id), {
                  status: 'accepted',
                  updatedAt: serverTimestamp()
                });
                await loadConnections();
              }
            },
            {
              label: 'Decline',
              className: 'danger',
              onClick: async () => {
                await updateDoc(doc(db, 'matchRequests', item.id), {
                  status: 'declined',
                  updatedAt: serverTimestamp()
                });
                await loadConnections();
              }
            }
          ]
        : []
    });
    root.appendChild(row);
  }
}
function setEnvironmentBanner() {
  if (!envBanner) return;
  const host = window.location.host || '';
  if (host.includes('staging')) {
    envBanner.textContent = 'STAGING — For testing only';
    envBanner.classList.add('show');
    document.body.classList.add('staging');
    const hero = document.getElementById('landing');
    if (hero) hero.classList.add('staging-woodcut');
    const vid = document.getElementById('stagingVideo');
    if (vid) {
      // Force autoplay muted on load for staging only
      const base = 'https://www.youtube.com/embed/QWveXdj6oZU';
      vid.src = `${base}?autoplay=1&mute=1&playsinline=1&rel=0`;
    }
  } else {
    envBanner.classList.remove('show');
    document.body.classList.remove('staging');
  }
}

async function ensureProfile(user) {
  const refProfile = doc(db, 'users', user.uid);
  const snap = await getDoc(refProfile);
  if (snap.exists()) {
    const current = snap.data();
    if (!ALLOWED_ROLES.includes(current.role) && current.role !== 'lawyer' && current.role !== 'admin') {
      await updateDoc(refProfile, {
        role: 'member',
        updatedAt: serverTimestamp()
      });
      current.role = 'member';
    }
    return current;
  }
  const userRole = 'member';
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Member',
    role: userRole,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false
  };
  await setDoc(refProfile, payload);
  return payload;
}

async function createNewsletterSubscriber(payload) {
  const safeId = `email-${payload.emailLower.replace(/[^a-z0-9]/gi, '-')}`.toLowerCase();
  const docRef = doc(db, 'newsletterSubscribers', safeId);
  await setDoc(docRef, payload, { merge: true });
  return { already: false };
}

async function submitNewsletter(event) {
  event.preventDefault();
  if (state.loading) return;
  const now = Date.now();
  if (now - state.lastNewsletterSubmit < 60_000) return showToast('Please wait a moment before submitting again.');

  const email = sanitizeEmail(el('newsletterEmail')?.value || '');
  const displayName = sanitizeText(el('newsletterName')?.value || '', MAX_NAME_LENGTH);
  const consent = !!el('newsletterConsent')?.checked;
  const topics = Array.from(document.querySelectorAll('input[name=\"newsletterTopic\"]:checked')).map((n) => n.value);

  if (!isValidEmail(email)) return showToast('Enter a valid email.');
  if (!consent) return showToast('Consent is required.');
  if (!topics.length) return showToast('Choose at least one topic.');
  const filteredTopics = topics.filter((t) => ALLOWED_NEWSLETTER_TOPICS.has(t));
  if (!filteredTopics.length) return showToast('Select valid topics.');

  if (await isRateLimited('newsletter')) return;

  state.loading = true;
  setFormLoading('newsletterForm', true);
  try {
    const payload = {
      email,
      emailLower: email,
      displayName,
      topics: filteredTopics,
      consent: true,
      source: 'site',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const res = await createNewsletterSubscriber(payload);
    state.lastNewsletterSubmit = Date.now();
    (document.getElementById('newsletterForm') || {}).reset?.();
    showToast(res.already ? 'You are already subscribed. Updated your preferences.' : 'Subscribed to BEE COOP.');
  } catch (e) {
    showToast('Could not save newsletter signup right now.');
  } finally {
    state.loading = false;
    setFormLoading('newsletterForm', false);
  }
}

async function submitClinic(event) {
  event.preventDefault();
  if (state.loading) return;
  const now = Date.now();
  if (now - state.lastClinicSubmit < 60_000) return showToast('Please wait a moment before submitting again.');

  const name = sanitizeText(el('clinicName')?.value || '', MAX_NAME_LENGTH);
  const email = sanitizeEmail(el('clinicEmail')?.value || '');
  const organization = sanitizeText(el('clinicOrg')?.value || '', 120);
  const location = sanitizeText(el('clinicLocation')?.value || '', 120);
  const stage = sanitizeText(el('clinicStage')?.value || '', 40);
  const helpType = sanitizeText(el('clinicHelpType')?.value || '', 40);
  const preferredContact = sanitizeText(el('clinicContact')?.value || '', MAX_NAME_LENGTH);
  const description = sanitizeText(el('clinicDescription')?.value || '', 1200);
  const consent = !!el('clinicConsent')?.checked;

  if (!name || !description || !isValidEmail(email)) return showToast('Name, email, and description are required.');
  if (!ALLOWED_CLINIC_STAGE.has(stage)) return showToast('Select a valid stage.');
  if (!ALLOWED_CLINIC_HELP.has(helpType)) return showToast('Select a valid help type.');
  if (!consent) return showToast('Consent is required to contact you.');

  if (await isRateLimited('clinic')) return;

  state.loading = true;
  setFormLoading('clinicForm', true);
  try {
    await addDoc(collection(db, 'clinicSignups'), {
      name,
      email,
      emailLower: email,
      organization,
      location,
      stage,
      helpType,
      preferredContact,
      description,
      consent: true,
      status: 'received',
      source: 'BEE COOP Clinic',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    state.lastClinicSubmit = Date.now();
    (document.getElementById('clinicForm') || {}).reset?.();
    showToast('Clinic request received. We will contact you soon.');
  } catch (e) {
    showToast('Could not submit clinic request right now.');
  } finally {
    state.loading = false;
    setFormLoading('clinicForm', false);
  }
}

async function submitProfile(event) {
  event.preventDefault();
  if (state.loading) return;
  if (!state.user) return showToast('Sign in required');

  const displayName = sanitizeText(el('profileName')?.value || state.profile?.displayName || '', MAX_NAME_LENGTH);
  const handle = sanitizeText(el('profileHandle')?.value || '', MAX_HANDLE_LENGTH).replace(/\s+/g, '');
  const organization = sanitizeText(el('profileOrg')?.value || '', MAX_ORG_LENGTH);
  const location = sanitizeText(el('profileLocation')?.value || '', MAX_LOCATION_LENGTH);
  const websiteRaw = sanitizeText(el('profileWebsite')?.value || '', MAX_URL_LENGTH);
  const website = websiteRaw && !/^https?:\/\//i.test(websiteRaw) ? `https://${websiteRaw}` : websiteRaw;
  const bio = sanitizeText(el('profileBio')?.value || '', MAX_PROFILE_BIO);
  const focusRaw = sanitizeText(el('profileFocus')?.value || '', MAX_FOCUS_RAW);
  const focusAreas = parseFocusAreas(focusRaw);
  const visibility = sanitizeText(el('profileVisibility')?.value || 'members', 20);
  const offlineAccessRequested = !!el('profileOffline')?.checked;
  const matchingOptIn = !!el('profileMatching')?.checked;
  const photoFile = el('profilePhoto')?.files?.[0];

  if (!displayName) return showToast('Display name is required.');
  if (!ALLOWED_PROFILE_VISIBILITY.has(visibility)) return showToast('Select a valid visibility.');

  if (await isRateLimited('profile')) return;

  state.loading = true;
  setFormLoading('profileForm', true);
  try {
    let avatar = {};
    if (photoFile) {
      const uploaded = await uploadProfilePhoto(photoFile);
      if (!uploaded) return;
      avatar = uploaded;
    }
    const createdAt = state.profileDoc?.createdAt || serverTimestamp();
    const payload = {
      uid: state.user.uid,
      displayName,
      handle,
      organization,
      location,
      website,
      bio,
      focusAreas,
      visibility,
      offlineAccessRequested,
      matchingOptIn,
      avatarUrl: avatar.avatarUrl || state.profileDoc?.avatarUrl || '',
      avatarPath: avatar.avatarPath || state.profileDoc?.avatarPath || '',
      verified: state.profileDoc?.verified ?? false,
      createdAt,
      updatedAt: serverTimestamp()
    };
    if (state.profileDoc?.verifiedAt) {
      payload.verifiedAt = state.profileDoc.verifiedAt;
    }
    await setDoc(doc(db, 'profiles', state.user.uid), payload, { merge: true });
    state.profileDoc = { ...(state.profileDoc || {}), ...payload };
    setProfileStatus('Profile saved.');
    showToast('Profile saved.');
  } catch (e) {
    console.error('Profile save failed', e);
    showToast('Could not save profile right now.');
  } finally {
    state.loading = false;
    setFormLoading('profileForm', false);
  }
}

async function submitIdentity(event) {
  event.preventDefault();
  if (state.loading) return;
  if (!state.user) return showToast('Sign in required');

  const legalName = sanitizeText(el('identityName')?.value || '', 120);
  const idType = sanitizeText(el('identityType')?.value || '', 30);
  const file = el('identityFile')?.files?.[0];
  const consent = !!el('identityConsent')?.checked;

  if (!legalName) return showToast('Legal name is required.');
  if (!ALLOWED_ID_TYPES.has(idType)) return showToast('Select a valid ID type.');
  if (!file) return showToast('Please upload an ID document.');
  if (!consent) return showToast('Consent is required.');

  if (await isRateLimited('identity')) return;

  state.loading = true;
  setFormLoading('identityForm', true);
  try {
    const upload = await uploadIdentityDoc(file);
    if (!upload) return;
    const submittedAt = state.identityDoc?.submittedAt || serverTimestamp();
    const payload = {
      uid: state.user.uid,
      legalName,
      idType,
      documentUrl: upload.documentUrl,
      documentPath: upload.documentPath,
      documentName: upload.documentName,
      status: 'pending',
      consent: true,
      submittedAt,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'identityVerifications', state.user.uid), payload, { merge: true });
    state.identityDoc = { ...(state.identityDoc || {}), ...payload };
    setIdentityStatus('Status: pending review.');
    showToast('Identity submission received.');
    if (el('identityForm')) el('identityForm').reset?.();
  } catch (e) {
    console.error('Identity submission failed', e);
    showToast('Could not submit identity verification.');
  } finally {
    state.loading = false;
    setFormLoading('identityForm', false);
  }
}

async function submitConnectionRequest(event) {
  event.preventDefault();
  if (state.loading) return;
  if (!state.user) return showToast('Sign in required');
  const targetRaw = sanitizeText(el('connectionTarget')?.value || '', 120);
  const message = sanitizeText(el('connectionMessage')?.value || '', 400);
  if (!targetRaw) return showToast('Enter a member UID or handle.');
  state.loading = true;
  setFormLoading('connectionRequestForm', true);
  try {
    const targetProfile = await resolveProfileTarget(targetRaw);
    if (!targetProfile) return showToast('Member not found.');
    if (targetProfile.uid === state.user.uid) return showToast('You cannot request yourself.');
    await createMatchRequest(targetProfile, message);
    el('connectionRequestForm')?.reset?.();
  } catch (e) {
    console.error('Connection request failed', e);
    showToast('Unable to send request.');
  } finally {
    state.loading = false;
    setFormLoading('connectionRequestForm', false);
  }
}
async function loadConsultations() {
  clearList(el('consultList'));
  let list = [];

  if (roleIsConsultationTriage()) {
    const snap = await getDocs(query(collection(db, 'consultations'), orderBy('createdAt', 'desc')));
    list = snap.docs
      .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      .filter((item) => !item.deleted);
  } else {
    const snapshots = await Promise.all([
      getDocs(query(collection(db, 'consultations'), where('createdBy', '==', state.user.uid))),
      state.profile?.role === 'lawyer'
        ? getDocs(query(collection(db, 'consultations'), where('assignedTo', '==', state.user.uid)))
        : Promise.resolve(null)
    ]);
    const byId = new Map();
    snapshots
      .filter(Boolean)
      .forEach((snap) => {
        snap.docs.forEach((docItem) => {
          const item = { id: docItem.id, ...docItem.data() };
          if (!item.deleted) byId.set(item.id, item);
        });
      });
    list = Array.from(byId.values());
  }

  list = list.sort((a, b) => {
    const ta = toDate(a.createdAt)?.getTime() || 0;
    const tb = toDate(b.createdAt)?.getTime() || 0;
    return tb - ta;
  });

  if (!list.length) {
    clearList(el('consultList'));
    el('consultList').innerHTML = '<p class="muted">No consultation entries yet.</p>';
    return;
  }
  clearList(el('consultList'));
  for (const item of list) {
    const created = toDate(item.createdAt)?.toLocaleString() || 'N/A';
    const body = `${escapeText(item.notes || '')}`;
    const listItem = renderItem({
      title: `${escapeText(item.topic || 'Consultation')} (${escapeText(item.area || 'uncategorized')})`,
      body,
      meta: `Requested by ${escapeText(item.clientName || item.createdBy)} · ${escapeText(item.status || 'open')} · ${created}`,
      actions: [
        state.lawyerMode
          ? {
              label: item.status === 'closed' ? 'Reopen' : 'Close',
              onClick: async () => {
                await updateDoc(doc(db, 'consultations', item.id), {
                  status: item.status === 'closed' ? 'open' : 'closed',
                  updatedAt: serverTimestamp()
                });
                await loadConsultations();
                if (state.lawyerMode) await loadModerationConsults();
              }
            }
          : {
              label: 'Delete',
              onClick: async () => {
                await updateDoc(doc(db, 'consultations', item.id), {
                  deleted: true,
                  updatedAt: serverTimestamp()
                });
                await loadConsultations();
              }
            }
      ]
    });
    el('consultList').appendChild(listItem);
  }
}

async function loadReports() {
  clearList(el('reportList'));
  const reportQuery = state.lawyerMode
    ? query(collection(db, 'incidentReports'), orderBy('createdAt', 'desc'))
    : query(collection(db, 'incidentReports'), where('reportedBy', '==', state.user.uid));
  const snap = await getDocs(reportQuery);
  const all = snap.docs
    .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    .filter((item) => !item.deleted)
    .sort((a, b) => {
      const ta = toDate(a.createdAt)?.getTime() || 0;
      const tb = toDate(b.createdAt)?.getTime() || 0;
      return tb - ta;
    });
  const list = state.lawyerMode ? all : all.filter((x) => x.reportedBy === state.user.uid);
  if (!list.length) {
    el('reportList').innerHTML = '<p class="muted">No reports to show yet.</p>';
    return;
  }
  clearList(el('reportList'));
  for (const item of list) {
    const alias = item.anonymous ? 'Anonymous' : item.reporterAlias || state.user.email;
    const business = item.businessName ? ` · ${escapeText(item.businessName)}` : '';
    const location = item.location ? ` · ${escapeText(item.location)}` : '';
    const created = toDate(item.occurredAt)?.toLocaleString() || 'N/A';
    const attachment = item.attachmentUrl
      ? `<a href="${escapeText(item.attachmentUrl)}" target="_blank" rel="noreferrer">attachment</a>`
      : 'no attachment';
    const listItem = renderItem({
      title: `${escapeText(item.title || 'Incident report')} · ${escapeText(item.category || 'uncategorized')}`,
      body: `${escapeText(item.body || '')}<br/>${escapeText(alias || '')} · Attachment: ${attachment}`,
      meta: `Priority: ${escapeText(item.priority || 'medium')}${business}${location} · status: ${escapeText(item.status || 'open')} · ${created}`,
      actions: state.lawyerMode
        ? [
            {
              label: 'Set reviewing',
              onClick: async () => {
                await updateDoc(doc(db, 'incidentReports', item.id), { status: 'reviewing', updatedAt: serverTimestamp() });
                await loadReports();
                await loadModerationReports();
              }
            },
            {
              label: 'Set resolved',
              onClick: async () => {
                await updateDoc(doc(db, 'incidentReports', item.id), { status: 'resolved', updatedAt: serverTimestamp() });
                await loadReports();
                await loadModerationReports();
              }
            }
          ]
        : [
            {
              label: 'Delete',
              onClick: async () => {
                await updateDoc(doc(db, 'incidentReports', item.id), {
                  deleted: true,
                  updatedAt: serverTimestamp()
                });
                await loadReports();
              }
            }
          ]
    });
    el('reportList').appendChild(listItem);
  }
}

async function loadPostComments(postId) {
  const snap = await getDocs(query(collection(db, 'communityComments'), where('postId', '==', postId)));
  const comments = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  const list = comments.filter((x) => !x.deleted);
  const postComments = el(`comments-${postId}`);
  if (!postComments) return;
  if (!list.length) {
    postComments.innerHTML = '<p class="muted">No comments yet.</p>';
    return;
  }
  postComments.innerHTML = '';
  for (const c of list) {
    const created = toDate(c.createdAt)?.toLocaleString() || 'N/A';
    const cEl = document.createElement('div');
    cEl.className = 'item';
    const canDelete = c.createdBy === state.user.uid || roleIsLawyer();
    cEl.innerHTML = `<h4>${escapeText(c.authorName || 'Community member')}</h4><p>${escapeText(c.body)}</p><p class="muted">${created}</p>`;
    if (canDelete) {
      const cRow = document.createElement('div');
      cRow.className = 'post-meta';
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Remove';
      del.className = 'danger';
      del.addEventListener('click', async () => {
        await updateDoc(doc(db, 'communityComments', c.id), {
          deleted: true,
          updatedAt: serverTimestamp()
        });
        await loadPosts();
      });
      cRow.appendChild(del);
      cEl.appendChild(cRow);
    }
    postComments.appendChild(cEl);
  }
}

async function loadPosts() {
  clearList(el('postFeed'));
  const postsQuery = roleIsLawyer()
    ? query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'))
    : query(
        collection(db, 'communityPosts'),
        where('moderationStatus', '==', 'approved'),
        where('removed', '==', false)
      );
  const snap = await getDocs(postsQuery);
  const posts = snap.docs
    .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    .filter((p) => !p.removed)
    .sort((a, b) => {
      const ta = toDate(a.createdAt)?.getTime() || 0;
      const tb = toDate(b.createdAt)?.getTime() || 0;
      return tb - ta;
    });
  if (!posts.length) {
    el('postFeed').innerHTML = '<p class="muted">No posts yet.</p>';
    return;
  }
  clearList(el('postFeed'));
  for (const p of posts) {
    const isFlagged = Number(p.flags || 0) > 0;
    const pItem = document.createElement('div');
    pItem.className = 'item';
    if (isFlagged) pItem.classList.add('flagged');
    const created = toDate(p.createdAt)?.toLocaleString() || 'N/A';
    const flags = p.flags || 0;
    pItem.innerHTML = `<h4>${escapeText(p.title)}</h4><p>${escapeText(p.body)}</p><p class="muted">by ${escapeText(p.authorName || '')} · ${created} · flags: ${flags}</p>`;
    const row = document.createElement('div');
    row.className = 'post-meta';
    const flagBtn = document.createElement('button');
    flagBtn.type = 'button';
    flagBtn.textContent = `Flag (${flags})`;
    flagBtn.addEventListener('click', async () => {
      await updateDoc(doc(db, 'communityPosts', p.id), { flags: increment(1), updatedAt: serverTimestamp() });
      await loadPosts();
    });
    row.appendChild(flagBtn);
    if (roleIsLawyer()) {
      const hideBtn = document.createElement('button');
      hideBtn.type = 'button';
      hideBtn.textContent = 'Hide';
      hideBtn.className = 'danger';
      hideBtn.addEventListener('click', async () => {
        await updateDoc(doc(db, 'communityPosts', p.id), {
          removed: true,
          updatedAt: serverTimestamp()
        });
        await loadPosts();
        await loadModerationPosts();
      });
      row.appendChild(hideBtn);
    }
    if (p.createdBy === state.user.uid || roleIsLawyer()) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.className = 'danger';
      delBtn.addEventListener('click', async () => {
        await updateDoc(doc(db, 'communityPosts', p.id), {
          removed: true,
          updatedAt: serverTimestamp()
        });
        await loadPosts();
      });
      row.appendChild(delBtn);
    }
    pItem.appendChild(row);

    const commentsRoot = document.createElement('div');
    commentsRoot.id = `comments-${p.id}`;
    const commentsListTitle = document.createElement('h4');
    commentsListTitle.textContent = 'Comments';
    commentsRoot.appendChild(commentsListTitle);
    pItem.appendChild(commentsRoot);

    const commentForm = document.createElement('form');
    commentForm.className = 'row';
    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.required = true;
    commentInput.placeholder = 'Write a comment';
    commentInput.style.flex = '1';
    const cBtn = document.createElement('button');
    cBtn.type = 'submit';
    cBtn.textContent = 'Post';
    commentForm.appendChild(commentInput);
    commentForm.appendChild(cBtn);
    commentForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (state.loading) return;
      const body = sanitizeText(commentInput.value, 800);
      if (!body) return;
      state.loading = true;
      try {
        await addDoc(collection(db, 'communityComments'), {
          postId: p.id,
          body,
          createdBy: state.user.uid,
          authorName: sanitizeText(state.profile?.displayName || state.user.email, MAX_NAME_LENGTH),
          createdAt: serverTimestamp(),
          deleted: false
        });
        commentInput.value = '';
        await loadPosts();
      } finally {
        state.loading = false;
      }
    });
    pItem.appendChild(commentForm);
    el('postFeed').appendChild(pItem);
    await loadPostComments(p.id);
  }
}

async function loadModerationConsults() {
  clearList(el('moderationConsults'));
  if (!roleIsConsultationTriage()) return;
  const snap = await getDocs(query(collection(db, 'consultations'), orderBy('createdAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })).filter((x) => !x.deleted);
  if (!items.length) {
    el('moderationConsults').innerHTML = '<p class="muted">No pending consultations.</p>';
    return;
  }
  for (const item of items) {
    const created = toDate(item.createdAt)?.toLocaleString() || 'N/A';
    const row = renderItem({
      title: `Consult: ${escapeText(item.topic || 'Unnamed')}`,
      body: escapeText(item.notes || ''),
      meta: `status: ${escapeText(item.status || 'open')} · ${created} · by ${escapeText(item.createdBy || '')}`,
      actions: [
        {
          label: 'Close',
          onClick: async () => {
            await updateDoc(doc(db, 'consultations', item.id), { status: 'closed', updatedAt: serverTimestamp() });
            await loadModerationConsults();
            await loadConsultations();
          }
        }
      ]
    });
    el('moderationConsults').appendChild(row);
  }
}

async function loadModerationReports() {
  clearList(el('moderationReports'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'incidentReports'), orderBy('createdAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })).filter((x) => !x.deleted);
  if (!items.length) {
    el('moderationReports').innerHTML = '<p class="muted">No open reports.</p>';
    return;
  }
  for (const item of items) {
    const row = renderItem({
      title: `Report: ${escapeText(item.title || 'Unknown')}`,
      body: escapeText(item.body || ''),
      meta: `${escapeText(item.category || 'uncategorized')} · ${escapeText(item.status || 'open')} · by ${escapeText(item.reportedBy || '')}`,
      actions: [
        {
          label: 'Review',
          onClick: async () => {
            await updateDoc(doc(db, 'incidentReports', item.id), { status: 'reviewing', reviewedBy: state.user.uid, reviewedAt: serverTimestamp() });
            await loadModerationReports();
            await loadReports();
          }
        },
        {
          label: 'Resolve',
          onClick: async () => {
            await updateDoc(doc(db, 'incidentReports', item.id), { status: 'resolved', reviewedBy: state.user.uid, reviewedAt: serverTimestamp() });
            await loadModerationReports();
            await loadReports();
          }
        }
      ]
    });
    el('moderationReports').appendChild(row);
  }
}

async function loadModerationPosts() {
  clearList(el('moderationPosts'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })).filter((x) => x.flags > 0);
  if (!items.length) {
    el('moderationPosts').innerHTML = '<p class="muted">No flagged posts.</p>';
    return;
  }
  for (const item of items) {
    const row = renderItem({
      title: `Flagged: ${escapeText(item.title || 'Post')}`,
      body: escapeText(item.body || ''),
      meta: `flags: ${Number(item.flags || 0)} · by ${escapeText(item.authorName || '')}`,
      actions: [
        {
          label: 'Unflag',
          onClick: async () => {
            await updateDoc(doc(db, 'communityPosts', item.id), { flags: 0, updatedAt: serverTimestamp() });
            await loadModerationPosts();
            await loadPosts();
          }
        },
        {
          label: 'Hide',
          className: 'danger',
          onClick: async () => {
            await updateDoc(doc(db, 'communityPosts', item.id), {
              removed: true,
              updatedAt: serverTimestamp()
            });
            await loadModerationPosts();
            await loadPosts();
          }
        }
      ]
    });
    el('moderationPosts').appendChild(row);
  }
}

async function loadModerationLawyers() {
  clearList(el('moderationLawyers'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'pendingLawyer'), orderBy('createdAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  if (!items.length) {
    el('moderationLawyers').innerHTML = '<p class="muted">No lawyer requests pending.</p>';
    return;
  }
  for (const item of items) {
    const row = renderItem({
      title: `Lawyer request: ${escapeText(item.displayName || item.email || item.uid || 'Unknown')}`,
      body: `${escapeText(item.email || '')} · code: ${escapeText(item.lawyerCodeUsed || 'none')}`,
      meta: `uid: ${escapeText(item.uid || '')}`,
      actions: [
        {
          label: 'Approve',
          onClick: async () => {
            await updateDoc(doc(db, 'users', item.id), {
              role: 'lawyer',
              requiresApproval: false,
              approvedBy: state.user.uid,
              approvedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            await loadModerationLawyers();
            await loadDashboardData();
          }
        },
        {
          label: 'Reject',
          onClick: async () => {
            await updateDoc(doc(db, 'users', item.id), {
              role: 'member',
              requestedRole: 'member',
              requiresApproval: false,
              rejectedBy: state.user.uid,
              rejectedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            await loadModerationLawyers();
          }
        }
      ]
    });
    el('moderationLawyers').appendChild(row);
  }
}

async function loadModerationDeletionRequests() {
  clearList(el('moderationDeletionRequests'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'deletionRequests'), orderBy('requestedAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  if (!items.length) {
    el('moderationDeletionRequests').innerHTML = '<p class="muted">No account deletion requests.</p>';
    return;
  }
  for (const item of items) {
    const isPending = item.status !== 'approved' && item.status !== 'rejected';
    const row = renderItem({
      title: `Account deletion: ${escapeText(item.requesterAlias || item.requesterId || 'unknown')}`,
      body: escapeText(item.reason || ''),
      meta: `status: ${escapeText(item.status || 'pending')} · ${escapeText(item.requesterEmail || '')}`,
      actions: isPending
        ? [
            {
              label: 'Approve',
              className: 'danger',
              onClick: async () => {
                await updateDoc(doc(db, 'deletionRequests', item.id), {
                  status: 'approved',
                  reviewedAt: serverTimestamp(),
                  reviewedBy: state.user.uid,
                  updatedBy: state.user.uid,
                  updatedAt: serverTimestamp()
                });
                await updateDoc(doc(db, 'users', item.requesterId), {
                  deleted: true,
                  updatedAt: serverTimestamp()
                });
                await loadModerationDeletionRequests();
                await loadDashboardData();
              }
            },
            {
              label: 'Reject',
              onClick: async () => {
                await updateDoc(doc(db, 'deletionRequests', item.id), {
                  status: 'rejected',
                  reviewedAt: serverTimestamp(),
                  reviewedBy: state.user.uid,
                  reviewedByName: sanitizeText(state.profile?.displayName || state.user.email, MAX_NAME_LENGTH),
                  updatedAt: serverTimestamp()
                });
                await loadModerationDeletionRequests();
              }
            }
          ]
        : []
    });
    el('moderationDeletionRequests').appendChild(row);
  }
}

async function loadModerationNewsletter() {
  clearList(el('moderationNewsletter'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'newsletterSubscribers'), orderBy('createdAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  if (!items.length) {
    el('moderationNewsletter').innerHTML = '<p class=\"muted\">No newsletter submissions yet.</p>';
    return;
  }
  for (const item of items) {
    const created = toDate(item.createdAt)?.toLocaleString() || 'N/A';
    const row = renderItem({
      title: `${escapeText(item.email || 'email')}`,
      body: escapeText((item.topics || []).join(', ') || 'topics not set'),
      meta: `${escapeText(item.status || 'active')} · ${created}`
    });
    el('moderationNewsletter').appendChild(row);
  }
}

async function loadModerationClinic() {
  clearList(el('moderationClinic'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'clinicSignups'), orderBy('createdAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  if (!items.length) {
    el('moderationClinic').innerHTML = '<p class=\"muted\">No clinic submissions yet.</p>';
    return;
  }
  for (const item of items) {
    const created = toDate(item.createdAt)?.toLocaleString() || 'N/A';
    const row = renderItem({
      title: `${escapeText(item.name || 'Clinic lead')} · ${escapeText(item.stage || '')}`,
      body: escapeText(item.description || ''),
      meta: `${escapeText(item.email || '')} · ${escapeText(item.helpType || '')} · ${created}`
    });
    el('moderationClinic').appendChild(row);
  }
}

async function loadModerationIdentity() {
  clearList(el('moderationIdentity'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'identityVerifications'), orderBy('submittedAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  if (!items.length) {
    el('moderationIdentity').innerHTML = '<p class="muted">No identity submissions.</p>';
    return;
  }
  for (const item of items) {
    const submitted = toDate(item.submittedAt)?.toLocaleString() || 'N/A';
    const row = renderItem({
      title: `${escapeText(item.legalName || 'Identity submission')}`,
      body: `${escapeText(item.idType || 'id')} · ${escapeText(item.uid || '')}`,
      meta: `${escapeText(item.status || 'pending')} · ${submitted}`,
      actions: [
        {
          label: 'Verify',
          onClick: async () => {
            await updateDoc(doc(db, 'identityVerifications', item.id), {
              status: 'verified',
              reviewedBy: state.user.uid,
              reviewedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'profiles', item.uid), {
              verified: true,
              verifiedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            await loadModerationIdentity();
            await loadIdentityStatus();
            await loadDirectory();
          }
        },
        {
          label: 'Reject',
          className: 'danger',
          onClick: async () => {
            await updateDoc(doc(db, 'identityVerifications', item.id), {
              status: 'rejected',
              reviewedBy: state.user.uid,
              reviewedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'profiles', item.uid), {
              verified: false,
              verifiedAt: deleteField(),
              updatedAt: serverTimestamp()
            });
            await loadModerationIdentity();
            await loadIdentityStatus();
            await loadDirectory();
          }
        }
      ]
    });
    el('moderationIdentity').appendChild(row);
  }
}

async function loadModerationMatches() {
  clearList(el('moderationMatches'));
  if (!state.lawyerMode) return;
  const snap = await getDocs(query(collection(db, 'matchRequests'), orderBy('createdAt', 'desc')));
  const items = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
  if (!items.length) {
    el('moderationMatches').innerHTML = '<p class="muted">No connection requests.</p>';
    return;
  }
  for (const item of items) {
    const created = toDate(item.createdAt)?.toLocaleString() || 'N/A';
    const row = renderItem({
      title: `${escapeText(item.fromName || 'Member')} → ${escapeText(item.toName || 'Member')}`,
      body: escapeText(item.message || 'No message provided.'),
      meta: `${escapeText(item.status || 'pending')} · ${created}`,
      actions: item.status === 'pending'
        ? [
            {
              label: 'Accept',
              onClick: async () => {
                await updateDoc(doc(db, 'matchRequests', item.id), {
                  status: 'accepted',
                  updatedAt: serverTimestamp()
                });
                await loadModerationMatches();
              }
            },
            {
              label: 'Decline',
              className: 'danger',
              onClick: async () => {
                await updateDoc(doc(db, 'matchRequests', item.id), {
                  status: 'declined',
                  updatedAt: serverTimestamp()
                });
                await loadModerationMatches();
              }
            }
          ]
        : []
    });
    el('moderationMatches').appendChild(row);
  }
}

async function loadProfile() {
  if (!state.user) return;
  const profileRef = doc(db, 'profiles', state.user.uid);
  const snap = await getDoc(profileRef);
  if (!snap.exists()) {
    state.profileDoc = null;
    setProfileStatus('Profile not saved yet.');
    return;
  }
  const data = snap.data();
  state.profileDoc = data;
  if (el('profileName')) el('profileName').value = data.displayName || state.profile?.displayName || '';
  if (el('profileHandle')) el('profileHandle').value = data.handle || '';
  if (el('profileOrg')) el('profileOrg').value = data.organization || '';
  if (el('profileLocation')) el('profileLocation').value = data.location || '';
  if (el('profileWebsite')) el('profileWebsite').value = data.website || '';
  if (el('profileBio')) el('profileBio').value = data.bio || '';
  if (el('profileFocus')) el('profileFocus').value = (data.focusAreas || []).join(', ');
  if (el('profileVisibility')) el('profileVisibility').value = data.visibility || 'members';
  if (el('profileOffline')) el('profileOffline').checked = !!data.offlineAccessRequested;
  if (el('profileMatching')) el('profileMatching').checked = !!data.matchingOptIn;
  const updated = toDate(data.updatedAt)?.toLocaleString() || 'saved';
  const verified = data.verified ? ' · Verified' : '';
  setProfileStatus(`Profile saved · ${updated}${verified}`);
}

async function loadIdentityStatus() {
  if (!state.user) return;
  const identityRef = doc(db, 'identityVerifications', state.user.uid);
  const snap = await getDoc(identityRef);
  if (!snap.exists()) {
    state.identityDoc = null;
    setIdentityStatus('Status: not submitted.');
    return;
  }
  const data = snap.data();
  state.identityDoc = data;
  if (el('identityName')) el('identityName').value = data.legalName || '';
  if (el('identityType')) el('identityType').value = data.idType || 'drivers-license';
  const updated = toDate(data.updatedAt)?.toLocaleString() || 'pending';
  setIdentityStatus(`Status: ${escapeText(data.status || 'pending')} · ${updated}`);
}

async function loadDashboardData() {
  if (!state.user) return;
  await Promise.all([loadConsultations(), loadReports(), loadPosts()]);
  if (state.lawyerMode) {
    await Promise.all([
      loadModerationConsults(),
      loadModerationReports(),
      loadModerationPosts(),
      loadModerationLawyers(),
      loadModerationDeletionRequests(),
      loadModerationNewsletter(),
      loadModerationClinic(),
      loadModerationIdentity(),
      loadModerationMatches()
    ]);
  }
}

async function deleteCurrentUserContent() {
  const uid = state.user.uid;
  const toArchive = [
    [collection(db, 'consultations'), 'createdBy'],
    [collection(db, 'incidentReports'), 'reportedBy'],
    [collection(db, 'communityPosts'), 'createdBy'],
    [collection(db, 'communityComments'), 'createdBy']
  ];
  for (const [colRef, key] of toArchive) {
    const snap = await getDocs(query(colRef, where(key, '==', uid)));
    for (const d of snap.docs) {
      const archivePayload = d.ref.parent.id === 'communityPosts'
        ? { removed: true, updatedAt: serverTimestamp() }
        : { deleted: true, updatedAt: serverTimestamp() };
      await updateDoc(d.ref, archivePayload);
    }
  }
  await updateDoc(doc(db, 'users', uid), { deleted: true, updatedAt: serverTimestamp() });
}

async function setupEventHandlers() {
  renderGuide();
  setEnvironmentBanner();
  renderLibrary('');
  renderNews();

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showSection(btn.dataset.tab);
      if (btn.dataset.tab === 'directory') {
        loadDirectory();
      }
      if (btn.dataset.tab === 'connections') {
        loadConnections();
      }
      if (btn.dataset.tab === 'moderation' && state.lawyerMode) {
        loadModerationConsults();
        loadModerationReports();
        loadModerationPosts();
        loadModerationLawyers();
        loadModerationDeletionRequests();
        loadModerationIdentity();
        loadModerationMatches();
        loadModerationNewsletter();
        loadModerationClinic();
      }
    });
  });

  el('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.loading) return;
    const displayName = sanitizeText(el('regName').value, MAX_NAME_LENGTH);
    const email = el('regEmail').value.trim();
    const password = el('regPassword').value;
    const role = el('regRole').value;
    const lawyerCode = el('regLawyerCode').value.trim();
    if (!displayName || !email || !password) return showToast('Please complete all required fields.');
    if (password.length < 8) return showToast('Password must be at least 8 characters.');
    if (role === 'lawyer' && !LAWYER_CODES.has(lawyerCode)) {
      showToast('Invalid lawyer code.');
      return;
    }
    state.loading = true;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName });
      const isLawyer = role === 'lawyer';
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email,
        displayName,
        role: isLawyer ? 'pendingLawyer' : 'member',
        requestedRole: isLawyer ? 'lawyer' : 'member',
        requiresApproval: isLawyer,
        lawyerCodeUsed: isLawyer ? lawyerCode : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false
      });
      showToast('Account created. You are signed in.');
    } catch (e) {
      showToast(e.message);
    } finally {
      state.loading = false;
    }
  });

  el('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = el('loginEmail').value.trim();
    const password = el('loginPassword').value;
    state.loading = true;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Signed in');
    } catch (e) {
      showToast(e.message);
    } finally {
      state.loading = false;
    }
  });

  el('logoutBtn').addEventListener('click', async () => {
    try {
      await signOut(auth);
      showToast('Signed out');
      showSection('dashboard');
    } catch (e) {
      showToast(e.message);
    }
  });

  el('resetPasswordBtn').addEventListener('click', async () => {
    const email = el('loginEmail').value.trim();
    if (!email) {
      showToast('Enter your email first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset sent.');
    } catch (e) {
      showToast(e.message);
    }
  });

  el('consultationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.loading) return;
    if (!state.user) return showToast('Sign in required');
    const topic = sanitizeText(el('consultTopic').value, MAX_SHORT_TEXT);
    const notes = sanitizeText(el('consultNotes').value, MAX_TEXT_LENGTH);
    const area = sanitizeText(el('consultArea').value, 40);
    const urgency = sanitizeText(el('consultUrgency').value, 20);
    const preferredContact = sanitizeText(el('consultContact').value, MAX_NAME_LENGTH);
    if (!topic || !notes || !area) return showToast('Please complete all consultation fields.');
    if (!ALLOWED_CONSULTATION_AREAS.has(area)) return showToast('Invalid consultation area.');
    if (!ALLOWED_CONSULTATION_URGENCY.has(urgency)) return showToast('Invalid consultation urgency.');
    if (!preferredContact) return showToast('Preferred contact is required.');
    state.loading = true;
    try {
      await addDoc(collection(db, 'consultations'), {
        topic,
        area,
        notes,
        urgency,
        preferredContact,
        createdBy: state.user.uid,
        clientName: sanitizeText(state.profile?.displayName || state.user.email, MAX_NAME_LENGTH),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'open',
        deleted: false
      });
      e.target.reset();
      await loadConsultations();
      if (state.lawyerMode) await loadModerationConsults();
      showToast('Consultation submitted');
    } finally {
      state.loading = false;
    }
  });

  el('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.loading) return;
    if (!state.user) return showToast('Sign in required');
    const title = sanitizeText(el('reportTitle').value, MAX_SHORT_TEXT);
    const category = sanitizeText(el('reportCategory').value, 40);
    const priority = sanitizeText(el('reportPriority').value, 20);
    const businessName = sanitizeText(el('reportBusiness').value, MAX_NAME_LENGTH);
    const location = sanitizeText(el('reportLocation').value, MAX_NAME_LENGTH);
    const anonymous = !!el('reportAnonymous').checked;
    const body = sanitizeText(el('reportBody').value, MAX_TEXT_LENGTH);
    const occurredAtValue = el('reportDate').value;
    const occurredAt = normalizeTimestampInput(occurredAtValue);
    const file = el('reportFile').files?.[0];
    const reportedBy = state.user.uid;
    if (!title || !category || !body || !occurredAtValue) return showToast('Please complete all report fields.');
    if (!ALLOWED_REPORT_CATEGORIES.has(category)) return showToast('Invalid report category.');
    if (!ALLOWED_REPORT_PRIORITIES.has(priority)) return showToast('Invalid report priority.');
    if (!occurredAt) return showToast('Invalid report date/time.');
    state.loading = true;
    try {
      const docRef = await addDoc(collection(db, 'incidentReports'), {
        title,
        category,
        body,
        priority,
        businessName,
        location,
        anonymous,
        reportedBy,
        reporterAlias: sanitizeText(state.profile?.displayName || state.user.email, MAX_NAME_LENGTH),
        createdAt: serverTimestamp(),
        occurredAt,
        status: 'open',
        deleted: false
      });
      if (file) {
        const attachment = await tryUploadAttachment(file, docRef.id, reportedBy);
        if (attachment) {
          await updateDoc(docRef, attachment);
          showToast('Attachment uploaded successfully');
        } else {
          showToast('Report saved. Attachment upload is currently unavailable.');
        }
      }
      e.target.reset();
      await loadReports();
      if (state.lawyerMode) await loadModerationReports();
      showToast('Report filed');
    } finally {
      state.loading = false;
    }
  });

  el('communityPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.loading) return;
    if (!state.user) return showToast('Sign in required');
    const title = sanitizeText(el('postTitle').value, MAX_SHORT_TEXT);
    const body = sanitizeText(el('postBody').value, MAX_TEXT_LENGTH);
    if (!title || !body) return showToast('Please complete all post fields.');
    state.loading = true;
    try {
      await addDoc(collection(db, 'communityPosts'), {
        title,
        body,
        createdBy: state.user.uid,
        authorName: sanitizeText(state.profile?.displayName || state.user.email, MAX_NAME_LENGTH),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        removed: false,
        flags: 0
      });
      e.target.reset();
      await loadPosts();
      showToast('Post published');
    } finally {
      state.loading = false;
    }
  });

  el('softDeleteMessagesBtn').addEventListener('click', async () => {
    if (!state.user) return;
    await deleteCurrentUserContent();
    await loadDashboardData();
    showToast('Your recent data was archived');
  });

  el('deletionRequestBtn').addEventListener('click', async () => {
    if (!state.user) return showToast('Sign in required');
    const reason = sanitizeText(el('deletionReason').value, MAX_REASON_LENGTH);
    if (!reason) return showToast('Please provide a reason.');
    const pending = await getDocs(
      query(
        collection(db, 'deletionRequests'),
        where('requesterId', '==', state.user.uid),
        where('status', '==', 'pending')
      )
    );
    if (!pending.empty) return showToast('You already have a pending deletion request.');
    state.loading = true;
    try {
      await addDoc(collection(db, 'deletionRequests'), {
        requesterId: state.user.uid,
        requesterAlias: sanitizeText(state.profile?.displayName || state.user.email, MAX_NAME_LENGTH),
        requesterEmail: sanitizeText(state.user.email || '', 160),
        reason,
        status: 'pending',
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      });
      el('deletionReason').value = '';
      showToast('Deletion request submitted');
    } catch (e) {
      showToast(e.message);
    } finally {
      state.loading = false;
    }
  });

  const newsletterForm = el('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', submitNewsletter);
  }

  const clinicForm = el('clinicForm');
  if (clinicForm) {
    clinicForm.addEventListener('submit', submitClinic);
  }

  const profileForm = el('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', submitProfile);
  }

  const identityForm = el('identityForm');
  if (identityForm) {
    identityForm.addEventListener('submit', submitIdentity);
  }

  const connectionForm = el('connectionRequestForm');
  if (connectionForm) {
    connectionForm.addEventListener('submit', submitConnectionRequest);
  }

  const librarySearch = el('librarySearch');
  if (librarySearch) {
    librarySearch.addEventListener('input', (e) => renderLibrary(e.target.value || ''));
  }

  const directorySearch = el('directorySearch');
  if (directorySearch) {
    directorySearch.addEventListener('input', (e) => renderDirectory(e.target.value || ''));
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setIdentity(null, null);
    clearList(el('consultList'));
    clearList(el('reportList'));
    clearList(el('postFeed'));
    state.profileDoc = null;
    state.identityDoc = null;
    setProfileStatus('Profile not saved yet.');
    setIdentityStatus('Status: not submitted.');
    renderDirectory('');
    loadConnections();
    showSection('dashboard');
    return;
  }
  const profile = await ensureProfile(user);
  if (profile && profile.deleted) {
    showToast('This account is deactivated.');
    await signOut(auth);
    return;
  }
  setIdentity(profile, user);
  await loadDashboardData();
  await loadProfile();
  await loadIdentityStatus();
  await loadDirectory();
  await loadConnections();
  if (state.lawyerMode) {
    await loadModerationConsults();
    await loadModerationReports();
    await loadModerationPosts();
    await loadModerationLawyers();
    await loadModerationDeletionRequests();
    await loadModerationIdentity();
    await loadModerationMatches();
  }
});

await setupEventHandlers();
showSection('dashboard');
