import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../services/authService';
import {
  ActionCard,
  ChartCard,
  Content,
  Header,
  ListRow,
  Screen,
  SearchBar,
  SectionHeader,
  StatCard,
  colors,
} from '../../ui/ClinicComponents';
import {
  Role,
  adminModules,
  appointments,
  invoices,
  labTests,
  medicines,
  notifications,
  patients,
  prescriptions,
  reports,
  roleProfiles,
} from '../../ui/clinicData';

function getRole(route: any): Role {
  return route?.params?.user?.role || 'Patient';
}

function getName(route: any): string {
  const role = getRole(route);
  return route?.params?.user?.name || roleProfiles[role].name;
}

function grid(children: React.ReactNode) {
  return <View style={local.grid}>{children}</View>;
}

export function RoleDashboardScreen({ navigation, route }: any) {
  const role = getRole(route);
  const name = getName(route);

  if (role === 'Admin') return <AdminDashboard navigation={navigation} name={name} />;
  if (role === 'Doctor') return <DoctorDashboard navigation={navigation} name={name} />;
  if (role === 'Receptionist') return <ReceptionDashboard navigation={navigation} />;
  if (role === 'Pharmacist') return <PharmacyDashboard navigation={navigation} />;
  if (role === 'Laboratory Staff') return <LabDashboard navigation={navigation} />;
  return <PatientDashboard navigation={navigation} name={name} />;
}

function AdminDashboard({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="Admin Portal" subtitle="System Overview" navigation={navigation} />
        {grid(
          <>
            <StatCard icon="people-outline" value="1,248" label="Total Patients" tone={colors.teal} />
            <StatCard icon="medical-outline" value="42" label="Total Doctors" tone={colors.blue} />
            <StatCard icon="calendar-outline" value="156" label="Today's Appts" tone={colors.orange} />
            <StatCard icon="receipt-outline" value="24" label="Pending Bills" tone={colors.red} />
          </>,
        )}
        <SectionHeader title="Today's Summary" />
        {[
          ['Active Staff', '78 clinicians and operators online', 'pulse-outline', colors.green],
          ['Waiting Patients', '14 patients currently checked in', 'time-outline', colors.orange],
          ['Completed Appointments', '92 visits completed today', 'checkmark-done-outline', colors.teal],
          ['System Status', 'All services operational', 'shield-checkmark-outline', colors.blue],
        ].map(([title, subtitle, icon, tone]) => (
          <ListRow key={title} title={title} subtitle={subtitle} icon={icon} tone={tone} onPress={() => navigation.navigate('ModuleDetail', { title, role: 'Admin' })} />
        ))}
      </Content>
    </Screen>
  );
}

function ReceptionDashboard({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="Front Desk" subtitle="Manage operations" navigation={navigation} />
        <SearchBar />
        <SectionHeader title="Quick Actions" />
        {grid(
          <>
            <ActionCard large icon="person-add-outline" title="Register" subtitle="New Patient" tone={colors.orange} onPress={() => navigation.navigate('ModuleDetail', { title: 'Register Patient' })} />
            <ActionCard large icon="calendar-outline" title="Schedule" subtitle="Appointment" tone={colors.blue} onPress={() => navigation.navigate('ModuleDetail', { title: 'Schedule Appointment' })} />
            <ActionCard icon="cash-outline" title="Billing" tone={colors.teal} onPress={() => navigation.navigate('ModuleDetail', { title: 'Billing' })} />
            <ActionCard icon="document-text-outline" title="Records" tone={colors.purple} onPress={() => navigation.navigate('ModuleDetail', { title: 'Records' })} />
          </>,
        )}
        <SectionHeader title="Waiting Room" action="4 Waiting" />
        {patients.slice(0, 4).map((item, index) => (
          <ListRow key={item.id} title={item.name} subtitle={item.meta} meta={item.detail} status={index === 0 ? '15m' : item.status} tone={index === 0 ? colors.orange : colors.teal} onPress={() => navigation.navigate('ModuleDetail', { title: item.name })} />
        ))}
      </Content>
    </Screen>
  );
}

function PharmacyDashboard({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="Pharmacy" subtitle="Inventory & Dispensing" navigation={navigation} />
        <View style={local.alert}>
          <View style={[local.alertIcon, { backgroundColor: '#ffe3e8' }]}>
            <Ionicons name="warning-outline" size={22} color={colors.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={local.alertTitle}>Low Stock Alerts</Text>
            <Text style={local.alertText}>3 medicines are running below the critical threshold limit.</Text>
            <View style={local.pillRow}>
              <Text style={local.pill}>Amoxicillin</Text>
              <Text style={local.pill}>Ibuprofen</Text>
            </View>
          </View>
        </View>
        {grid(
          <>
            <ActionCard large icon="bandage-outline" title="Dispense" subtitle="Process prescription" tone={colors.green} onPress={() => navigation.navigate('ModuleDetail', { title: 'Dispense Medicine' })} />
            <ActionCard large icon="add-outline" title="Add Stock" subtitle="Update inventory" tone={colors.blue} onPress={() => navigation.navigate('ModuleDetail', { title: 'Add Stock' })} />
          </>,
        )}
        <SectionHeader title="Recent Prescriptions" action="View All" onPress={() => navigation.navigate('ModuleDetail', { title: 'Recent Prescriptions' })} />
        {prescriptions.map((item) => (
          <ListRow key={item.id} title={item.patient} subtitle={item.items} meta={item.id} status={item.status} tone={item.status === 'Pending' ? colors.green : colors.blue} onPress={() => navigation.navigate('ModuleDetail', { title: item.id })} />
        ))}
      </Content>
    </Screen>
  );
}

function DoctorDashboard({ navigation, name }: any) {
  return (
    <Screen>
      <Content>
        <Header title={name || 'Dr. Sarah Smith'} subtitle="Tuesday, 15 Oct" navigation={navigation} avatar="SS" />
        {grid(
          <>
            <StatCard icon="ellipse" value="08" label="Today's Appts" tone={colors.blue} />
            <StatCard icon="ellipse" value="02" label="Pending" tone={colors.orange} />
          </>,
        )}
        <SectionHeader title="Today's Schedule" action="View All" />
        <View style={local.featureCard}>
          <Text style={local.featureBadge}>IN PROGRESS</Text>
          <Text style={local.featureTime}>10:00 AM</Text>
          <Text style={local.featureTitle}>Mark Henderson</Text>
          <Text style={local.featureText}>Follow-up - Cardiology</Text>
          <TouchableOpacity style={local.featureButton} onPress={() => navigation.navigate('ModuleDetail', { title: 'Mark Henderson Notes' })}>
            <Text style={local.featureButtonText}>View Notes</Text>
          </TouchableOpacity>
        </View>
        {patients.slice(1, 4).map((item) => (
          <ListRow key={item.id} title={item.name} subtitle={item.meta} meta={item.detail} icon="time-outline" tone={colors.blue} onPress={() => navigation.navigate('ModuleDetail', { title: item.name })} />
        ))}
      </Content>
    </Screen>
  );
}

function PatientDashboard({ navigation, name }: any) {
  return (
    <Screen>
      <Content>
        <Header title={name || 'Alex Johnson'} subtitle="Good Morning," navigation={navigation} />
        <SectionHeader title="Upcoming Appointment" />
        <View style={local.appointmentHero}>
          <View style={local.heroIcon}>
            <Ionicons name="medical-outline" size={26} color="#ffffff" />
          </View>
          <Text style={local.heroTitle}>Dr. Sarah Smith</Text>
          <Text style={local.heroSub}>Cardiologist</Text>
          <View style={local.heroTime}>
            <Ionicons name="calendar-outline" size={17} color="#ffffff" />
            <Text style={local.heroTimeText}>Tomorrow, 10:00 AM</Text>
          </View>
        </View>
        <SectionHeader title="Quick Actions" />
        {grid(
          <>
            <ActionCard icon="calendar-outline" title="Book Appt" tone={colors.blue} onPress={() => navigation.navigate('ModuleDetail', { title: 'Book Appointment' })} />
            <ActionCard icon="document-text-outline" title="Records" tone={colors.purple} onPress={() => navigation.navigate('ModuleDetail', { title: 'Medical Records' })} />
            <ActionCard icon="flask-outline" title="Lab Results" tone={colors.red} onPress={() => navigation.navigate('ModuleDetail', { title: 'Lab Results' })} />
            <ActionCard icon="medical-outline" title="My Doctors" tone={colors.teal} onPress={() => navigation.navigate('ModuleDetail', { title: 'My Doctors' })} />
          </>,
        )}
        <SectionHeader title="Health Summary" />
        <ListRow title="Blood Type" subtitle="O positive" icon="water-outline" tone={colors.red} />
        <ListRow title="Allergies" subtitle="Penicillin, shellfish" icon="alert-circle-outline" tone={colors.orange} />
        <ListRow title="Emergency Contact" subtitle="Maya Johnson - +973 3888 5012" icon="call-outline" tone={colors.green} />
        <SectionHeader title="Recent Activity" action="See All" />
        <ListRow title="Blood Test Results" subtitle="Ready to view" icon="flask-outline" tone={colors.red} onPress={() => navigation.navigate('ModuleDetail', { title: 'Blood Test Results' })} />
      </Content>
    </Screen>
  );
}

function LabDashboard({ navigation }: any) {
  const [filter, setFilter] = useState('Pending');
  const filtered = useMemo(() => labTests.filter((test) => (filter === 'Pending' ? test.status !== 'Completed' : test.status === filter)), [filter]);
  return (
    <Screen>
      <Content>
        <Header title="Laboratory" subtitle="Diagnostic Center" navigation={navigation} />
        {grid(
          <>
            <StatCard icon="clipboard-outline" value="12" label="PENDING" tone={colors.red} />
            <StatCard icon="flask-outline" value="05" label="PROCESSING" tone={colors.blue} />
            <StatCard icon="document-attach-outline" value="18" label="COMPLETED" tone={colors.green} />
          </>,
        )}
        <SectionHeader title="Test Queue" />
        <View style={local.segment}>
          {['Pending', 'Processing', 'Completed'].map((item) => (
            <TouchableOpacity key={item} style={[local.segmentItem, filter === item && local.segmentActive]} onPress={() => setFilter(item)}>
              <Text style={[local.segmentText, filter === item && local.segmentActiveText]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {filtered.map((item, index) => (
          <ListRow
            key={item.id}
            title={item.name}
            subtitle={`Patient: ${item.patient}`}
            meta={`Requested by ${item.requester}`}
            status={index === 0 && item.status === 'Processing' ? '45m left' : item.status}
            tone={item.status === 'Completed' ? colors.green : item.status === 'Processing' ? colors.red : colors.blue}
            icon="flask-outline"
            onPress={() => navigation.navigate('ModuleDetail', { title: item.name })}
          />
        ))}
      </Content>
    </Screen>
  );
}

export function RoleListScreen({ navigation, route }: any) {
  const role = getRole(route);
  const title = route.name;
  let rows = patients.map((item) => ({ title: item.name, subtitle: item.meta, meta: item.detail, status: item.status, tone: colors.teal, icon: 'person-outline' }));
  if (title === 'Appointments' || title === 'Schedule') rows = appointments.map((item) => ({ title: item.title, subtitle: item.subtitle, meta: item.time, status: item.status, tone: colors.blue, icon: 'calendar-outline' }));
  if (title === 'Records' || title === 'Results') rows = labTests.map((item) => ({ title: item.name, subtitle: item.patient, meta: item.requester, status: item.status, tone: colors.red, icon: 'document-text-outline' }));
  if (title === 'Billing') rows = invoices.map((item) => ({ title: item.name, subtitle: item.meta, meta: item.amount, status: item.status, tone: colors.orange, icon: 'card-outline' }));
  if (title === 'Inventory' || title === 'Medicines') rows = medicines.map((item) => ({ title: item.name, subtitle: item.meta, meta: item.stock, status: item.status, tone: item.status === 'Low' ? colors.red : colors.green, icon: 'medkit-outline' }));
  if (title === 'Alerts') rows = notifications.map((item) => ({ title: item.title, subtitle: item.body, meta: item.time, status: '', tone: item.tone === 'red' ? colors.red : item.tone === 'green' ? colors.green : item.tone === 'orange' ? colors.orange : colors.blue, icon: 'notifications-outline' }));
  if (title === 'Tests') rows = labTests.map((item) => ({ title: item.name, subtitle: item.patient, meta: item.time, status: item.status, tone: colors.blue, icon: 'flask-outline' }));

  return (
    <Screen>
      <Content>
        <Header title={title} subtitle={roleProfiles[role].department} navigation={navigation} />
        <SearchBar placeholder={`Search ${title.toLowerCase()}...`} />
        {rows.map((row) => (
          <ListRow key={`${row.title}-${row.meta}`} {...row} onPress={() => navigation.navigate('ModuleDetail', { title: row.title })} />
        ))}
      </Content>
    </Screen>
  );
}

export function ManagementScreen({ navigation, route }: any) {
  const role = getRole(route);
  return (
    <Screen>
      <Content>
        <Header title="Management" subtitle="Clinic control center" navigation={navigation} />
        {adminModules.map((title, index) => (
          <ListRow key={title} title={title} subtitle="Open dashboard, review records, and coordinate workflows." icon={['person-add-outline', 'people-outline', 'medical-outline', 'calendar-outline', 'card-outline', 'medkit-outline', 'flask-outline', 'analytics-outline'][index]} tone={[colors.purple, colors.teal, colors.blue, colors.orange, colors.blue, colors.green, colors.red, colors.teal][index]} onPress={() => navigation.navigate('ModuleDetail', { title, role })} />
        ))}
      </Content>
    </Screen>
  );
}

export function ReportsScreen({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="Reports" subtitle="Performance insights" navigation={navigation} />
        {reports.map((report) => (
          <ChartCard key={report.title} {...report} />
        ))}
      </Content>
    </Screen>
  );
}

export function NotificationsScreen({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="Notifications" subtitle="Clinic updates" navigation={navigation} />
        {notifications.map((item) => (
          <ListRow key={item.id} title={item.title} subtitle={item.body} meta={item.time} icon="notifications-outline" tone={item.tone === 'red' ? colors.red : item.tone === 'green' ? colors.green : item.tone === 'orange' ? colors.orange : colors.blue} />
        ))}
      </Content>
    </Screen>
  );
}

export function ProfileScreen({ navigation, route }: any) {
  const role = getRole(route);
  const user = route?.params?.user || roleProfiles[role];
  const profile = { ...roleProfiles[role], ...user };
  const handleLogout = async () => {
    await logout();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };
  return (
    <Screen>
      <Content>
        <Header title="Profile" subtitle={roleProfiles[role].title} navigation={navigation} />
        <View style={local.profileCard}>
          <View style={local.profileAvatar}>
            <Text style={local.profileInitials}>{profile.name?.split(' ').map((part: string) => part[0]).slice(0, 2).join('')}</Text>
          </View>
          <Text style={local.profileName}>{profile.name}</Text>
          <Text style={local.profileMeta}>{profile.email}</Text>
          <Text style={local.profileMeta}>{profile.phone}</Text>
        </View>
        <ListRow title="Profile Information" subtitle={`${profile.department} - ${role}`} icon="person-outline" tone={colors.teal} />
        <ListRow title="Change Password" subtitle="Update your login credentials" icon="lock-closed-outline" tone={colors.blue} />
        <ListRow title="Notification Settings" subtitle="Push, SMS, and email preferences" icon="notifications-outline" tone={colors.orange} />
        <ListRow title="App Settings" subtitle="Language, display, and privacy" icon="settings-outline" tone={colors.purple} />
        <ListRow title="Help & Support" subtitle="Contact support or view help topics" icon="help-circle-outline" tone={colors.green} />
        <TouchableOpacity style={local.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          <Text style={local.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Content>
    </Screen>
  );
}

export function ModuleDetailScreen({ navigation, route }: any) {
  const title = route.params?.title || 'Clinic Module';
  return (
    <Screen>
      <Content>
        <Header title={title} subtitle="Operational workspace" navigation={navigation} />
        <View style={local.detailPanel}>
          <Text style={local.detailTitle}>{title}</Text>
          <Text style={local.detailText}>Review current items, assigned staff, status history, notes, and related healthcare records in one focused workspace.</Text>
        </View>
        <SectionHeader title="Current Worklist" />
        {[...patients.slice(0, 2), ...labTests.slice(0, 1)].map((item: any) => (
          <ListRow key={`${title}-${item.id}`} title={item.name} subtitle={item.meta || item.patient} meta={item.detail || item.requester} status={item.status} icon="ellipse-outline" tone={colors.teal} />
        ))}
      </Content>
    </Screen>
  );
}

const local = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  alert: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontWeight: '900',
    color: colors.ink,
  },
  alertText: {
    color: colors.red,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    backgroundColor: '#ffffff',
    color: colors.red,
    fontSize: 11,
    fontWeight: '800',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureCard: {
    backgroundColor: colors.blue,
    borderRadius: 20,
    padding: 16,
    minHeight: 154,
    marginBottom: 14,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff33',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  featureTime: {
    position: 'absolute',
    top: 18,
    right: 16,
    color: '#ffffff',
    fontWeight: '900',
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 18,
  },
  featureText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 6,
  },
  featureButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  featureButtonText: {
    color: colors.blue,
    fontWeight: '900',
  },
  appointmentHero: {
    backgroundColor: colors.teal,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#ffffff25',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 18,
    top: 18,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 62,
  },
  heroSub: {
    color: '#ffffff',
    marginLeft: 62,
    marginTop: 4,
  },
  heroTime: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff18',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 22,
  },
  heroTimeText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e9edf4',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#ffffff',
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  segmentActiveText: {
    color: colors.teal,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 28,
    backgroundColor: '#e6fbf7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileInitials: {
    color: colors.teal,
    fontSize: 24,
    fontWeight: '900',
  },
  profileName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  profileMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 26,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  detailPanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  detailText: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: 8,
  },
});
