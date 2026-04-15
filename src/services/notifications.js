import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  doc, updateDoc, getDoc, addDoc, getDocs, deleteDoc,
  collection, query, orderBy, limit, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// How foreground notifications appear
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Device registration ───────────────────────────────────────────────────────

export async function registerForPushNotifications(uid) {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = (
      await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    ).data;

    await updateDoc(doc(db, 'users', uid), { pushToken: token });
    return token;
  } catch (err) {
    console.log('Push registration skipped:', err.message);
    return null;
  }
}

// ── Push delivery ─────────────────────────────────────────────────────────────

export async function getUserPushToken(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data()?.pushToken ?? null) : null;
  } catch {
    return null;
  }
}

export async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body, data }),
    });
  } catch (err) {
    console.log('Push send failed:', err.message);
  }
}

// ── Firestore notification log ─────────────────────────────────────────────────
// Each notification: { type, fromUid, fromName, fromPhoto, message,
//                       outfitId, outfitImage, read, createdAt }

export async function saveNotification(targetUid, notification) {
  try {
    await addDoc(collection(db, 'users', targetUid, 'notifications'), {
      ...notification,
      read: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.log('Save notification failed:', err.message);
  }
}

export async function getNotifications(uid) {
  try {
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

export async function getUnreadCount(uid) {
  try {
    const all = await getNotifications(uid);
    return all.filter(n => !n.read).length;
  } catch {
    return 0;
  }
}

export async function markAllRead(uid) {
  try {
    const q = query(collection(db, 'users', uid, 'notifications'), limit(50));
    const snap = await getDocs(q);
    const unread = snap.docs.filter(d => !d.data().read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (err) {
    console.log('markAllRead failed:', err.message);
  }
}

export async function deleteNotification(uid, notificationId) {
  try {
    await deleteDoc(doc(db, 'users', uid, 'notifications', notificationId));
  } catch (err) {
    console.log('deleteNotification failed:', err.message);
    throw err;
  }
}

export async function clearNotifications(uid) {
  try {
    while (true) {
      const q = query(collection(db, 'users', uid, 'notifications'), limit(50));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const batch = writeBatch(db);
      snap.docs.forEach(notificationDoc => batch.delete(notificationDoc.ref));
      await batch.commit();
    }
  } catch (err) {
    console.log('clearNotifications failed:', err.message);
    throw err;
  }
}
