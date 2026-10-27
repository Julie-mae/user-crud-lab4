
import { Injectable } from '@angular/core';

import {
  initializeApp,
  getApp,
  getApps
} from 'firebase/app';

import {
  initializeFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';

import { environment } from '../../environments/environment';
import { StudentActivity } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private app = getApps().length
    ? getApp()
    : initializeApp(environment.firebaseConfig);

  private db = initializeFirestore(this.app, {
    experimentalForceLongPolling: true
  });

  // Users Collection
  private usersCollection = collection(this.db, 'users');

  // Student Activities Collection
  private activitiesCollection = collection(this.db, 'activities');

  constructor() {}

  // =====================================
  // USER CRUD
  // =====================================

  // CREATE USER
  async addUser(
    name: string,
    email: string,
    course: string,
    yearLevel: string
  ) {
    return await addDoc(this.usersCollection, {
      name,
      email,
      course,
      yearLevel
    });
  }

  // READ USERS
  async getUsers() {
    const snapshot = await getDocs(this.usersCollection);

    return snapshot.docs.map(userDoc => ({
      id: userDoc.id,
      ...userDoc.data()
    }));
  }

  // REAL-TIME USERS
  listenToUsers(
    onData: (users: any[]) => void,
    onError: (error: Error) => void
  ) {
    return onSnapshot(
      this.usersCollection,
      snapshot => {
        const users = snapshot.docs.map(userDoc => ({
          id: userDoc.id,
          ...userDoc.data()
        }));

        onData(users);
      },
      error => {
        onError(error);
      }
    );
  }

  // UPDATE USER
  updateUser(
    id: string,
    name: string,
    email: string,
    course?: string,
    yearLevel?: string
  ) {
    const updates: {
      name: string;
      email: string;
      course?: string;
      yearLevel?: string;
    } = {
      name,
      email
    };

    if (course !== undefined) {
      updates.course = course;
    }

    if (yearLevel !== undefined) {
      updates.yearLevel = yearLevel;
    }

    return updateDoc(doc(this.db, 'users', id), updates);
  }

  // DELETE USER
  deleteUser(id: string) {
    return deleteDoc(doc(this.db, 'users', id));
  }

  // =====================================
  // STUDENT ACTIVITY CRUD
  // =====================================

  // CREATE ACTIVITY
  addActivity(activity: StudentActivity) {
    return addDoc(this.activitiesCollection, {
      studentName: activity.studentName,
      activityTitle: activity.activityTitle,
      status: activity.status,
      dueDate: activity.dueDate
    });
  }

  // READ ACTIVITIES
  async getActivities(): Promise<StudentActivity[]> {
    const snapshot = await getDocs(this.activitiesCollection);

    return snapshot.docs.map(activityDoc => ({
      id: activityDoc.id,
      ...activityDoc.data()
    } as StudentActivity));
  }

  // REAL-TIME ACTIVITIES
  listenToActivities(
    onData: (activities: StudentActivity[]) => void,
    onError: (error: Error) => void
  ) {
    return onSnapshot(
      this.activitiesCollection,
      snapshot => {
        const activities = snapshot.docs.map(activityDoc => ({
          id: activityDoc.id,
          ...activityDoc.data()
        } as StudentActivity));

        onData(activities);
      },
      error => {
        onError(error);
      }
    );
  }

  // UPDATE ACTIVITY
  updateActivity(id: string, activity: StudentActivity) {
    return updateDoc(doc(this.db, 'activities', id), {
      studentName: activity.studentName,
      activityTitle: activity.activityTitle,
      status: activity.status,
      dueDate: activity.dueDate
    });
  }

  // DELETE ACTIVITY
  deleteActivity(id: string) {
    return deleteDoc(doc(this.db, 'activities', id));
  }
}
