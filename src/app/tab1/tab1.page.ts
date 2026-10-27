
import {
  Component,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false
})
export class Tab1Page {

  newUser = {
    name: '',
    email: '',
    course: '',
    yearLevel: ''
  };

  isSaving = false;
  message = '';

  constructor(
    private firebaseService: FirebaseService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  async addUser() {

    if (this.isSaving) {
      return;
    }

    const name = this.newUser.name.trim();
    const email = this.newUser.email.trim();
    const course = this.newUser.course.trim();
    const yearLevel = this.newUser.yearLevel;

    if (!name || !email || !course || !yearLevel) {
      this.message = 'Please fill in all fields.';
      return;
    }

    this.isSaving = true;
    this.message = '';

    console.log('Starting Firebase save...');

    try {

      await this.firebaseService.addUser(
        name,
        email,
        course,
        yearLevel
      );

      console.log('Firebase save completed!');

      this.ngZone.run(() => {

        this.message = 'Student added successfully!';

        this.newUser = {
          name: '',
          email: '',
          course: '',
          yearLevel: ''
        };

        this.isSaving = false;
        this.cdr.detectChanges();

      });

    } catch (error) {

      console.error('Firebase saving error:', error);

      this.ngZone.run(() => {

        this.message =
          'Failed to add student. Please check Firebase.';

        this.isSaving = false;
        this.cdr.detectChanges();

      });

    }
  }
}
