
export interface StudentActivity {
  id?: string;
  studentName: string;
  activityTitle: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
}
