import { isAuthenticated } from './authService';

export async function protectRoute({ redirect }) {
  if (!isAuthenticated()) {
    return redirect('/login');
  }
}