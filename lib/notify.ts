import toast from 'react-hot-toast';
import { sounds } from './sound';

export const notify = {
  success: (message: string) => {
    sounds.edit(); // default pop sound
    toast.success(message);
  },
  error: (message: string) => {
    toast.error(message);
  },
  income: (message: string) => {
    sounds.income();
    toast.success(message);
  },
  expense: (message: string) => {
    sounds.expense();
    toast.success(message);
  },
  delete: (message: string) => {
    sounds.delete();
    toast.success(message);
  },
  mailSend: (message: string) => {
    sounds.mailSend();
    toast.success(message);
  },
  edit: (message: string) => {
    sounds.edit();
    toast.success(message);
  },
  login: (message: string) => {
    sounds.login();
    toast.success(message);
  }
};
