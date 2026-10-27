
import {
  Component,
  NgZone,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';

import { FirebaseService } from '../services/firebase';

interface UserRecord {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnDestroy {

  users: UserRecord[] = [];

  isLoading = false;
  isUpdating = false;
  message = '';

  editingUserId: string | null = null;

  editUser = {
    name: '',
    email: ''
  };

  private unsubscribeUsers?: () => void;

  constructor(
    private firebaseService: FirebaseService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ionViewWillEnter() {
    this.startRealtimeListener();
  }

  ionViewWillLeave() {
    this.stopRealtimeListener();
  }

  ngOnDestroy() {
    this.stopRealtimeListener();
  }

  startRealtimeListener() {
    this.stopRealtimeListener();

    this.isLoading = true;
    this.message = '';

    this.unsubscribeUsers = this.firebaseService.listenToUsers(
      data => {
        this.ngZone.run(() => {
          this.users = data.map((user: any) => ({
            id: user.id,
            name: user.name || '',
            email: user.email || ''
          }));

          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error => {
        console.error('Realtime Firestore error:', error);

        this.ngZone.run(() => {
          this.message = 'Failed to load users.';
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    );
  }

  stopRealtimeListener() {
    if (this.unsubscribeUsers) {
      this.unsubscribeUsers();
      this.unsubscribeUsers = undefined;
    }
  }

  async loadUsers() {
    this.isLoading = true;
    this.message = '';

    try {
      const data = await this.firebaseService.getUsers();

      this.ngZone.run(() => {
        this.users = data.map((user: any) => ({
          id: user.id,
          name: user.name || '',
          email: user.email || ''
        }));

        this.isLoading = false;
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error refreshing users:', error);

      this.ngZone.run(() => {
        this.message = 'Failed to refresh users.';
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  startEdit(user: UserRecord) {
    this.editingUserId = user.id;

    this.editUser = {
      name: user.name,
      email: user.email
    };

    this.message = '';
  }

  cancelEdit() {
    this.editingUserId = null;

    this.editUser = {
      name: '',
      email: ''
    };
  }

  async saveEdit() {
    if (!this.editingUserId || this.isUpdating) return;

    const name = this.editUser.name.trim();
    const email = this.editUser.email.trim();

    if (!name || !email) {
      this.message = 'Please fill in all fields.';
      return;
    }

    this.isUpdating = true;
    this.message = '';

    try {
      await this.firebaseService.updateUser(
        this.editingUserId,
        name,
        email
      );

      this.ngZone.run(() => {
        this.message = 'User updated successfully!';
        this.isUpdating = false;
        this.cancelEdit();
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error updating user:', error);

      this.ngZone.run(() => {
        this.message = 'Failed to update user.';
        this.isUpdating = false;
        this.cdr.detectChanges();
      });
    }
  }

  async deleteUser(user: UserRecord) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) return;

    try {
      await this.firebaseService.deleteUser(user.id);

      this.ngZone.run(() => {
        this.message = 'User deleted successfully!';
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error deleting user:', error);

      this.ngZone.run(() => {
        this.message = 'Failed to delete user.';
        this.cdr.detectChanges();
      });
    }
  }
}
