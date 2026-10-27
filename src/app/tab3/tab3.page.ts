
import {
  Component,
  NgZone,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';

import {
  ToastController,
  AlertController
} from '@ionic/angular';

import { FirebaseService } from '../services/firebase';
import { StudentActivity } from '../models/activity.model';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnDestroy {

  activities: StudentActivity[] = [];

  newActivity: StudentActivity = this.emptyActivity();
  editActivity: StudentActivity = this.emptyActivity();

  // Searchbar and Segment
  searchText = '';
  selectedStatus = 'All';

  // Editing
  editingId: string | null = null;

  // Loading states
  isSaving = false;
  isUpdating = false;
  isLoading = true;
  deletingId: string | null = null;

  message = '';

  private unsubscribeActivities?: () => void;

  constructor(
    private firebaseService: FirebaseService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  // =========================================
  // DEFAULT EMPTY ACTIVITY
  // =========================================

  private emptyActivity(): StudentActivity {
    return {
      studentName: '',
      activityTitle: '',
      status: 'Pending',
      dueDate: ''
    };
  }

  // =========================================
  // COMPONENT 1: SEARCHBAR
  // COMPONENT 2: SEGMENT
  // =========================================

  get filteredActivities(): StudentActivity[] {
    const search = this.searchText.toLowerCase().trim();

    return this.activities.filter(activity => {
      const studentName =
        (activity.studentName || '').toLowerCase();

      const activityTitle =
        (activity.activityTitle || '').toLowerCase();

      const matchesSearch =
        studentName.includes(search) ||
        activityTitle.includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        activity.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // =========================================
  // PAGE LIFECYCLE
  // =========================================

  ionViewWillEnter() {
    this.startListener();
  }

  ionViewWillLeave() {
    this.stopListener();
  }

  ngOnDestroy() {
    this.stopListener();
  }

  // =========================================
  // REAL-TIME FIRESTORE LISTENER
  // =========================================

  startListener() {
    this.stopListener();
    this.isLoading = true;
    this.message = '';

    this.unsubscribeActivities =
      this.firebaseService.listenToActivities(
        data => {
          this.ngZone.run(() => {
            this.activities = data;
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        },
        error => {
          console.error('Activity listener error:', error);

          this.ngZone.run(() => {
            this.message = 'Failed to load activities.';
            this.isLoading = false;
            this.cdr.detectChanges();
          });

          void this.showToast(
            'Failed to load activities.',
            'danger'
          );
        }
      );
  }

  stopListener() {
    if (this.unsubscribeActivities) {
      this.unsubscribeActivities();
      this.unsubscribeActivities = undefined;
    }
  }

  // =========================================
  // COMPONENT 3: TOAST NOTIFICATIONS
  // =========================================

  async showToast(
    message: string,
    color: string = 'success'
  ) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });

    await toast.present();
  }

  // =========================================
  // COMPONENT 4: PULL TO REFRESH
  // =========================================

  async handleRefresh(event: any) {
    try {
      const data = await this.firebaseService.getActivities();

      this.ngZone.run(() => {
        this.activities = data;
        this.cdr.detectChanges();
      });

      await this.showToast(
        'Activities refreshed successfully!'
      );

    } catch (error) {
      console.error('Refresh error:', error);

      await this.showToast(
        'Failed to refresh activities.',
        'danger'
      );

    } finally {
      event.target.complete();
    }
  }

  // =========================================
  // CREATE ACTIVITY
  // =========================================

  async addActivity() {
    if (this.isSaving) return;

    const activity: StudentActivity = {
      studentName: this.newActivity.studentName.trim(),
      activityTitle: this.newActivity.activityTitle.trim(),
      status: this.newActivity.status,
      dueDate: this.newActivity.dueDate
    };

    if (
      !activity.studentName ||
      !activity.activityTitle ||
      !activity.dueDate
    ) {
      this.message = 'Please complete all fields.';

      await this.showToast(
        'Please complete all fields.',
        'warning'
      );

      return;
    }

    this.isSaving = true;
    this.message = '';

    try {
      await this.firebaseService.addActivity(activity);

      this.ngZone.run(() => {
        this.newActivity = this.emptyActivity();
        this.message = 'Activity added successfully!';
        this.isSaving = false;
        this.cdr.detectChanges();
      });

      await this.showToast(
        'Activity added successfully!'
      );

    } catch (error) {
      console.error('Add activity error:', error);

      this.ngZone.run(() => {
        this.message = 'Failed to add activity.';
        this.isSaving = false;
        this.cdr.detectChanges();
      });

      await this.showToast(
        'Failed to add activity.',
        'danger'
      );
    }
  }

  // =========================================
  // START EDITING
  // =========================================

  startEdit(activity: StudentActivity) {
    if (!activity.id) return;

    this.editingId = activity.id;
    this.editActivity = { ...activity };
    this.message = '';
  }

  // =========================================
  // CANCEL EDITING
  // =========================================

  cancelEdit() {
    this.editingId = null;
    this.editActivity = this.emptyActivity();
  }

  // =========================================
  // UPDATE ACTIVITY
  // =========================================

  async saveEdit() {
    if (!this.editingId || this.isUpdating) return;

    const updated: StudentActivity = {
      studentName: this.editActivity.studentName.trim(),
      activityTitle: this.editActivity.activityTitle.trim(),
      status: this.editActivity.status,
      dueDate: this.editActivity.dueDate
    };

    if (
      !updated.studentName ||
      !updated.activityTitle ||
      !updated.dueDate
    ) {
      this.message = 'Please complete all fields.';

      await this.showToast(
        'Please complete all fields.',
        'warning'
      );

      return;
    }

    this.isUpdating = true;
    this.message = '';

    try {
      await this.firebaseService.updateActivity(
        this.editingId,
        updated
      );

      this.ngZone.run(() => {
        this.cancelEdit();
        this.message = 'Activity updated successfully!';
        this.isUpdating = false;
        this.cdr.detectChanges();
      });

      await this.showToast(
        'Activity updated successfully!'
      );

    } catch (error) {
      console.error('Update activity error:', error);

      this.ngZone.run(() => {
        this.message = 'Failed to update activity.';
        this.isUpdating = false;
        this.cdr.detectChanges();
      });

      await this.showToast(
        'Failed to update activity.',
        'danger'
      );
    }
  }

  // =========================================
  // COMPONENT 5: IONIC ALERT
  // DELETE ACTIVITY
  // =========================================

  async deleteActivity(activity: StudentActivity) {
    if (!activity.id || this.deletingId) return;

    const alert = await this.alertController.create({
      header: 'Delete Activity',
      message:
        `Are you sure you want to delete "${activity.activityTitle}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'confirm'
        }
      ]
    });

    await alert.present();

    const result = await alert.onDidDismiss();

    if (result.role !== 'confirm') {
      return;
    }

    this.deletingId = activity.id;
    this.message = '';

    try {
      await this.firebaseService.deleteActivity(activity.id);

      this.ngZone.run(() => {
        this.message = 'Activity deleted successfully!';
        this.deletingId = null;
        this.cdr.detectChanges();
      });

      await this.showToast(
        'Activity deleted successfully!'
      );

    } catch (error) {
      console.error('Delete activity error:', error);

      this.ngZone.run(() => {
        this.message = 'Failed to delete activity.';
        this.deletingId = null;
        this.cdr.detectChanges();
      });

      await this.showToast(
        'Failed to delete activity.',
        'danger'
      );
    }
  }
}
