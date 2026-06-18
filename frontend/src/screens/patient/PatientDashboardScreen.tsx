import React from 'react';
import HomeScreen from '../common/HomeScreen';

export default function PatientDashboardScreen(props: any) {
  // Reuses the dynamically adapting HomeScreen component
  // Future Patient-specific portal features can be added here
  return <HomeScreen {...props} />;
}
