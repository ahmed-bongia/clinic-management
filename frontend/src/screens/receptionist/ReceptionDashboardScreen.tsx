import React from 'react';
import HomeScreen from '../common/HomeScreen';

export default function ReceptionDashboardScreen(props: any) {
  // Reuses the dynamically adapting HomeScreen component
  // Future Receptionist-specific scheduling tools can be added here
  return <HomeScreen {...props} />;
}
