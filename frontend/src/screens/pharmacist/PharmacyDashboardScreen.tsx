import React from 'react';
import HomeScreen from '../common/HomeScreen';

export default function PharmacyDashboardScreen(props: any) {
  // Reuses the dynamically adapting HomeScreen component
  // Future Pharmacist-specific prescription/dispensation tools can be added here
  return <HomeScreen {...props} />;
}
