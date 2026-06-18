import React from 'react';
import HomeScreen from '../common/HomeScreen';

export default function LabDashboardScreen(props: any) {
  // Reuses the dynamically adapting HomeScreen component
  // Future Laboratory Staff-specific diagnostic reports can be added here
  return <HomeScreen {...props} />;
}
