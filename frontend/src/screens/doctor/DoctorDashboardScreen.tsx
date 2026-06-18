import React from 'react';
import HomeScreen from '../common/HomeScreen';

export default function DoctorDashboardScreen(props: any) {
  // Reuses the dynamically adapting HomeScreen component
  // Future Doctor-specific clinical features can be added here
  return <HomeScreen {...props} />;
}
