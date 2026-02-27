import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

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
  loading: false
};

const LAWYER_CODES = new Set(['BEEPREC-LAWYER', 'BEEPREC-LAWYER-2026']);

const el = (id) => document.getElementById(id);
const toast = el('toast');
const conn = el('connectionChip');
const userBadge = el('userBadge');

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
  return state.profile && (state.profile.role === 'lawyer' || state.profile.role === 'admin');
}

function setIdentity(profile, user) {
  if (!user) {
    state.user = null;
    state.profile = null;
    conn.textContent = 'Firebase disconnected';
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
  try {
    const fileRef = ref(storage, `incidents/${reportedBy}/${reportId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const attachmentUrl = await getDownloadURL(fileRef);
    return { attachmentUrl, attachmentPath: fileRef.fullPath, hasAttachment: true, fileName: file.name };
  } catch (error) {
    console.error('Attachment upload failed:', error);
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

async function ensureProfile(user) {
  const refProfile = doc(db, 'users', user.uid);
  const snap = await getDoc(refProfile);
  if (snap.exists()) return snap.data();
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

async function loadConsultations() {
  clearList(el('consultList'));
  const snap = await getDocs(query(collection(db, 'consultations'), orderBy('createdAt', 'desc')));
  const all = snap.docs
    .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    .filter((item) => !item.deleted);
  const list = state.lawyerMode ? all : all.filter((x) => x.createdBy === state.user.uid);
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
                await updateDoc(doc(db, 'consultations', item.id), { deleted: true, deletedAt: serverTimestamp() });
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
  const snap = await getDocs(query(collection(db, 'incidentReports'), orderBy('createdAt', 'desc')));
  const all = snap.docs
    .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    .filter((item) => !item.deleted);
  const list = state.lawyerMode ? all : all.filter((x) => x.reportedBy === state.user.uid);
  if (!list.length) {
    el('reportList').innerHTML = '<p class="muted">No reports to show yet.</p>';
    return;
  }
  clearList(el('reportList'));
  for (const item of list) {
    const created = toDate(item.occurredAt)?.toLocaleString() || 'N/A';
    const attachment = item.attachmentUrl
      ? `<a href="${item.attachmentUrl}" target="_blank" rel="noreferrer">attachment</a>`
      : 'no attachment';
    const listItem = renderItem({
      title: `${escapeText(item.title || 'Incident report')} · ${escapeText(item.category || 'uncategorized')}`,
      body: `${escapeText(item.body || '')}<br/>${escapeText(item.reporterAlias || '')} · Attachment: ${attachment}`,
      meta: `${escapeText(item.reportedBy || '')} · status: ${escapeText(item.status || 'open')} · ${created}`,
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
                await updateDoc(doc(db, 'incidentReports', item.id), { deleted: true, deletedAt: serverTimestamp() });
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
          deletedAt: serverTimestamp()
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
  const snap = await getDocs(query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc')));
  const posts = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })).filter((p) => !p.removed);
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
        await updateDoc(doc(db, 'communityPosts', p.id), { removed: true, removedAt: serverTimestamp() });
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
        await updateDoc(doc(db, 'communityPosts', p.id), { removed: true, removedAt: serverTimestamp() });
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
      const body = commentInput.value.trim();
      if (!body) return;
      await addDoc(collection(db, 'communityComments'), {
        postId: p.id,
        body,
        createdBy: state.user.uid,
        authorName: state.profile.displayName || state.user.email,
        createdAt: serverTimestamp(),
        deleted: false
      });
      commentInput.value = '';
      await loadPosts();
    });
    pItem.appendChild(commentForm);
    el('postFeed').appendChild(pItem);
    await loadPostComments(p.id);
  }
}

async function loadModerationConsults() {
  clearList(el('moderationConsults'));
  if (!state.lawyerMode) return;
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
            await updateDoc(doc(db, 'communityPosts', item.id), { removed: true, removedAt: serverTimestamp() });
            await loadModerationPosts();
            await loadPosts();
          }
        }
      ]
    });
    el('moderationPosts').appendChild(row);
  }
}

async function loadDashboardData() {
  if (!state.user) return;
  await Promise.all([loadConsultations(), loadReports(), loadPosts()]);
  if (state.lawyerMode) {
    await Promise.all([loadModerationConsults(), loadModerationReports(), loadModerationPosts()]);
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
      await updateDoc(d.ref, { deleted: true, deletedAt: serverTimestamp() });
    }
  }
  await updateDoc(doc(db, 'users', uid), { deleted: true, deletedAt: serverTimestamp() });
}

async function setupEventHandlers() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showSection(btn.dataset.tab);
      if (btn.dataset.tab === 'moderation' && state.lawyerMode) {
        loadModerationConsults();
        loadModerationReports();
        loadModerationPosts();
      }
    });
  });

  el('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.loading) return;
    const displayName = el('regName').value.trim();
    const email = el('regEmail').value.trim();
    const password = el('regPassword').value;
    const role = el('regRole').value;
    const lawyerCode = el('regLawyerCode').value.trim();
    if (role === 'lawyer' && !LAWYER_CODES.has(lawyerCode)) {
      showToast('Invalid lawyer code.');
      return;
    }
    state.loading = true;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName });
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email,
        displayName,
        role,
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
    if (!state.user) return showToast('Sign in required');
    const topic = el('consultTopic').value.trim();
    const notes = el('consultNotes').value.trim();
    const area = el('consultArea').value;
    await addDoc(collection(db, 'consultations'), {
      topic,
      area,
      notes,
      createdBy: state.user.uid,
      clientName: state.profile.displayName || state.user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'open',
      deleted: false
    });
    e.target.reset();
    await loadConsultations();
    if (state.lawyerMode) await loadModerationConsults();
    showToast('Consultation submitted');
  });

  el('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.user) return showToast('Sign in required');
    const title = el('reportTitle').value.trim();
    const category = el('reportCategory').value;
    const body = el('reportBody').value.trim();
    const occurredAtValue = el('reportDate').value;
    const file = el('reportFile').files?.[0];
    const reportedBy = state.user.uid;
    const docRef = await addDoc(collection(db, 'incidentReports'), {
      title,
      category,
      body,
      reportedBy,
      reporterAlias: state.profile.displayName || state.user.email,
      createdAt: serverTimestamp(),
      occurredAt: Timestamp.fromDate(new Date(occurredAtValue)),
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
  });

  el('communityPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.user) return showToast('Sign in required');
    const title = el('postTitle').value.trim();
    const body = el('postBody').value.trim();
    await addDoc(collection(db, 'communityPosts'), {
      title,
      body,
      createdBy: state.user.uid,
      authorName: state.profile.displayName || state.user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      removed: false,
      flags: 0
    });
    e.target.reset();
    await loadPosts();
    showToast('Post published');
  });

  el('softDeleteMessagesBtn').addEventListener('click', async () => {
    if (!state.user) return;
    await deleteCurrentUserContent();
    await loadDashboardData();
    showToast('Your recent data was archived');
  });

  el('deleteAccountBtn').addEventListener('click', async () => {
    const password = el('deleteAccountPassword').value;
    if (!password) return showToast('Enter re-auth password');
    const credential = EmailAuthProvider.credential(state.user.email, password);
    await reauthenticateWithCredential(state.user, credential);
    await deleteCurrentUserContent();
    await deleteUser(state.user);
    showToast('Account deleted');
    await signOut(auth);
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setIdentity(null, null);
    clearList(el('consultList'));
    clearList(el('reportList'));
    clearList(el('postFeed'));
    showSection('dashboard');
    return;
  }
  const profile = await ensureProfile(user);
  setIdentity(profile, user);
  await loadDashboardData();
  if (state.lawyerMode) {
    await loadModerationConsults();
    await loadModerationReports();
    await loadModerationPosts();
  }
});

await setupEventHandlers();
showSection('dashboard');
