import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { changePassword as changeOwnPassword, getCurrentUserProfile, logout } from '../../services/authService';
import {
  ActiveStaff,
  AdminDashboardSummary,
  AdminUser,
  createAdminUser,
  getActiveStaff,
  getAdminDashboardSummary,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
} from '../../services/adminService';
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

const adminRoles: Role[] = ['Admin', 'Doctor', 'Patient', 'Receptionist', 'Pharmacist', 'Laboratory Staff'];

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
  const [dashboard, setDashboard] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminDashboardSummary();
      setDashboard(data);
    } catch (loadError: any) {
      console.error('[Admin Dashboard] Unable to load dashboard metrics:', {
        message: loadError.message,
        status: loadError.response?.status,
        data: loadError.response?.data,
      });
      setDashboard(null);
      setError(loadError.response?.data?.message || 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = dashboard?.cards;
  const summary = dashboard?.summary;
  const formatCount = (value?: number) => (value === undefined ? '-' : value.toLocaleString());
  const summaryRows = [
    ['Active Staff', `${formatCount(summary?.activeStaff)} staff currently active`, 'pulse-outline', colors.green],
    ['Waiting Patients', `${formatCount(summary?.waitingPatients)} patients currently checked in`, 'time-outline', colors.orange],
    ['Completed Appointments', `${formatCount(summary?.completedAppointments)} visits completed today`, 'checkmark-done-outline', colors.teal],
    ['System Status', `All services ${summary?.systemStatus?.toLowerCase() || 'unavailable'}`, 'shield-checkmark-outline', colors.blue],
  ];

  return (
    <Screen>
      <Content>
        <Header title="Admin Portal" subtitle="System Overview" navigation={navigation} />
        {loading ? (
          <View style={local.stateCard}>
            <ActivityIndicator color={colors.teal} />
            <Text style={local.stateText}>Loading dashboard metrics...</Text>
          </View>
        ) : null}
        {error ? (
          <TouchableOpacity activeOpacity={0.82} style={local.stateCard} onPress={loadDashboard}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.red} />
            <Text style={local.stateText}>{error}</Text>
            <Text style={local.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        ) : null}
        {grid(
          <>
            <StatCard icon="people-outline" value={formatCount(cards?.totalPatients)} label="Total Patients" tone={colors.teal} />
            <StatCard icon="medical-outline" value={formatCount(cards?.totalDoctors)} label="Total Doctors" tone={colors.blue} />
            <StatCard icon="calendar-outline" value={formatCount(cards?.todaysAppointments)} label="Today's Appts" tone={colors.orange} />
            <StatCard icon="receipt-outline" value={formatCount(cards?.pendingBills)} label="Pending Bills" tone={colors.red} />
          </>,
        )}
        <SectionHeader title="Today's Summary" />
        {!loading && !error && !dashboard ? (
          <View style={local.stateCard}>
            <Text style={local.stateText}>No dashboard metrics available.</Text>
          </View>
        ) : null}
        {summaryRows.map(([title, subtitle, icon, tone]) => (
          <ListRow
            key={title}
            title={title}
            subtitle={subtitle}
            icon={icon}
            tone={tone}
            onPress={() => title === 'Active Staff' ? navigation.getParent()?.navigate('ActiveStaff') : navigation.navigate('ModuleDetail', { title, role: 'Admin' })}
          />
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
  const openModule = (title: string) => {
    if (title === 'User Management') {
      navigation.getParent()?.navigate('AdminUsers');
      return;
    }
    navigation.navigate('ModuleDetail', { title, role });
  };
  return (
    <Screen>
      <Content>
        <Header title="Management" subtitle="Clinic control center" navigation={navigation} />
        {adminModules.map((title, index) => (
          <ListRow key={title} title={title} subtitle="Open dashboard, review records, and coordinate workflows." icon={['person-add-outline', 'people-outline', 'medical-outline', 'calendar-outline', 'card-outline', 'medkit-outline', 'flask-outline', 'analytics-outline'][index]} tone={[colors.purple, colors.teal, colors.blue, colors.orange, colors.blue, colors.green, colors.red, colors.teal][index]} onPress={() => openModule(title)} />
        ))}
      </Content>
    </Screen>
  );
}

export function AdminUsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Patient');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setMessage('');
      const data = await getAdminUsers({ search, role: roleFilter === 'All' ? undefined : roleFilter });
      setUsers(data);
    } catch (error: any) {
      console.error('[Admin Users] Load error:', error.response?.data || error.message);
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const edit = (user: AdminUser) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setMessage('');
  };

  const clearForm = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setRole('Patient');
    setPassword('');
  };

  const saveUser = async () => {
    try {
      setSaving(true);
      setMessage('');
      if (selectedUser) {
        await updateAdminUser(selectedUser.id, { name, email, role });
      } else {
        await createAdminUser({ name, email, role, password });
      }
      setIsError(false);
      setMessage(selectedUser ? 'User updated.' : 'User created.');
      clearForm();
      await loadUsers();
    } catch (error: any) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    try {
      await updateAdminUserStatus(user.id, !user.is_active);
      await loadUsers();
    } catch (error: any) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to update user status.');
    }
  };

  const resetPassword = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      await resetAdminUserPassword(selectedUser.id, password);
      setIsError(false);
      setMessage('Password reset.');
      setPassword('');
    } catch (error: any) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to reset password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Content>
        <Header title="User Management" subtitle="Admin controls" navigation={navigation} />
        <View style={local.formCard}>
          <TextInput placeholder="Search users" placeholderTextColor="#8b97a8" value={search} onChangeText={setSearch} onSubmitEditing={loadUsers} style={local.input} />
          <View style={local.chipRow}>
            {['All', ...adminRoles].map((item) => (
              <TouchableOpacity key={item} style={[local.chip, roleFilter === item && local.chipActive]} onPress={() => setRoleFilter(item)}>
                <Text style={[local.chipText, roleFilter === item && local.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.82} style={local.secondaryButton} onPress={loadUsers}>
            <Text style={local.secondaryButtonText}>Search / Refresh</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title={selectedUser ? 'Edit User' : 'Add User'} action={selectedUser ? 'Clear' : undefined} onPress={clearForm} />
        <View style={local.formCard}>
          <TextInput placeholder="Name" placeholderTextColor="#8b97a8" value={name} onChangeText={setName} style={local.input} />
          <TextInput placeholder="Email" placeholderTextColor="#8b97a8" autoCapitalize="none" value={email} onChangeText={setEmail} style={local.input} />
          <View style={local.chipRow}>
            {adminRoles.map((item) => (
              <TouchableOpacity key={item} style={[local.chip, role === item && local.chipActive]} onPress={() => setRole(item)}>
                <Text style={[local.chipText, role === item && local.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput secureTextEntry placeholder={selectedUser ? 'New password for reset' : 'Password'} placeholderTextColor="#8b97a8" value={password} onChangeText={setPassword} style={local.input} />
          {message ? <Text style={isError ? local.errorText : local.successText}>{message}</Text> : null}
          <TouchableOpacity activeOpacity={0.82} style={local.secondaryButton} onPress={saveUser} disabled={saving}>
            <Text style={local.secondaryButtonText}>{saving ? 'Saving...' : selectedUser ? 'Save User' : 'Create User'}</Text>
          </TouchableOpacity>
          {selectedUser ? (
            <TouchableOpacity activeOpacity={0.82} style={local.outlineButton} onPress={resetPassword} disabled={saving}>
              <Text style={local.outlineButtonText}>Reset Password</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <SectionHeader title="Users" />
        {loading ? <ActivityIndicator color={colors.teal} /> : null}
        {!loading && users.length === 0 ? <Text style={local.stateText}>No users found.</Text> : null}
        {users.map((user) => (
          <ListRow
            key={user.id}
            title={user.name}
            subtitle={`${user.role} - ${user.email}`}
            status={user.is_active ? 'Active' : 'Inactive'}
            tone={user.is_active ? colors.green : colors.red}
            icon="person-outline"
            onPress={() => edit(user)}
          />
        ))}
        {selectedUser ? (
          <TouchableOpacity activeOpacity={0.82} style={local.outlineButton} onPress={() => toggleStatus(selectedUser)}>
            <Text style={local.outlineButtonText}>{selectedUser.is_active ? 'Deactivate Selected User' : 'Activate Selected User'}</Text>
          </TouchableOpacity>
        ) : null}
      </Content>
    </Screen>
  );
}

export function ActiveStaffScreen({ navigation }: any) {
  const [staff, setStaff] = useState<ActiveStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError('');
      setStaff(await getActiveStaff());
    } catch (loadError: any) {
      console.error('[Active Staff] Load error:', loadError.response?.data || loadError.message);
      setError(loadError.response?.data?.message || 'Unable to load active staff.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  return (
    <Screen>
      <Content>
        <Header title="Active Staff" subtitle="Real-time staff availability" navigation={navigation} />
        {loading ? <ActivityIndicator color={colors.teal} /> : null}
        {error ? (
          <TouchableOpacity activeOpacity={0.82} style={local.stateCard} onPress={loadStaff}>
            <Text style={local.errorText}>{error}</Text>
            <Text style={local.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        ) : null}
        {!loading && !error && staff.length === 0 ? <Text style={local.stateText}>No active staff found.</Text> : null}
        {staff.map((member) => (
          <ListRow
            key={member.id}
            title={member.name}
            subtitle={`${member.role} - ${member.email}`}
            meta={`Status: ${member.is_active ? 'Active' : 'Inactive'}`}
            status={member.availability}
            tone={member.availability === 'Busy' ? colors.orange : member.availability === 'Unavailable' ? colors.red : colors.green}
            icon="pulse-outline"
          />
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
  const [profile, setProfile] = useState<any>({ ...roleProfiles[role], ...(route?.params?.user || {}) });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileError('');
      const current = await getCurrentUserProfile();
      if (current) {
        setProfile({ ...roleProfiles[current.role], ...current });
      } else {
        setProfileError('Unable to load profile.');
      }
      setLoadingProfile(false);
    };
    loadProfile();
  }, []);

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
          {loadingProfile ? <ActivityIndicator color={colors.teal} /> : null}
          {profileError ? <Text style={local.errorText}>{profileError}</Text> : null}
          <Text style={local.profileName}>{profile.name}</Text>
          <Text style={local.profileMeta}>{profile.email}</Text>
          <Text style={local.profileMeta}>{profile.role} - {profile.is_active === false ? 'Inactive' : 'Active'}</Text>
        </View>
        <ListRow title="Profile Information" subtitle={`${profile.department} - ${profile.role || role}`} icon="person-outline" tone={colors.teal} onPress={() => navigation.getParent()?.navigate('ProfileInformation', { profile, role: profile.role || role })} />
        <ListRow title="Change Password" subtitle="Update your login credentials" icon="lock-closed-outline" tone={colors.blue} onPress={() => navigation.getParent()?.navigate('ChangePassword', { profile, role })} />
        <ListRow title="Notification Settings" subtitle="Push, SMS, and email preferences" icon="notifications-outline" tone={colors.orange} onPress={() => navigation.getParent()?.navigate('NotificationSettings', { profile, role })} />
        <ListRow title="App Settings" subtitle="Language, display, and privacy" icon="settings-outline" tone={colors.purple} onPress={() => navigation.getParent()?.navigate('AppSettings', { profile, role })} />
        <ListRow title="Help & Support" subtitle="Contact support or view help topics" icon="help-circle-outline" tone={colors.green} onPress={() => navigation.getParent()?.navigate('HelpSupport', { profile, role })} />
        <TouchableOpacity style={local.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          <Text style={local.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Content>
    </Screen>
  );
}

export function ProfileInformationScreen({ navigation, route }: any) {
  const profile = route.params?.profile || {};
  const role = route.params?.role || 'Admin';
  return (
    <Screen>
      <Content>
        <Header title="Profile Information" subtitle={`${profile.department || 'Operations'} - ${role}`} navigation={navigation} />
        <ListRow title="Name" subtitle={profile.name || 'Not available'} icon="person-outline" tone={colors.teal} />
        <ListRow title="Email" subtitle={profile.email || 'Not available'} icon="mail-outline" tone={colors.blue} />
        <ListRow title="Phone" subtitle={profile.phone || 'Not available'} icon="call-outline" tone={colors.green} />
        <ListRow title="Role" subtitle={role} icon="shield-checkmark-outline" tone={colors.purple} />
      </Content>
    </Screen>
  );
}

export function ChangePasswordScreen({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const submit = async () => {
    setSaving(true);
    setMessage('');
    const result = await changeOwnPassword({ currentPassword, newPassword, confirmPassword });
    setIsError(!result.success);
    setMessage(result.message);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  return (
    <Screen>
      <Content>
        <Header title="Change Password" subtitle="Update your login credentials" navigation={navigation} />
        <View style={local.formCard}>
          <TextInput secureTextEntry placeholder="Current password" placeholderTextColor="#8b97a8" value={currentPassword} onChangeText={setCurrentPassword} style={local.input} />
          <TextInput secureTextEntry placeholder="New password" placeholderTextColor="#8b97a8" value={newPassword} onChangeText={setNewPassword} style={local.input} />
          <TextInput secureTextEntry placeholder="Confirm new password" placeholderTextColor="#8b97a8" value={confirmPassword} onChangeText={setConfirmPassword} style={local.input} />
          {message ? <Text style={isError ? local.errorText : local.successText}>{message}</Text> : null}
          <TouchableOpacity activeOpacity={0.82} style={local.secondaryButton} onPress={submit} disabled={saving}>
            <Text style={local.secondaryButtonText}>{saving ? 'Saving...' : 'Save Password'}</Text>
          </TouchableOpacity>
        </View>
      </Content>
    </Screen>
  );
}

export function NotificationSettingsScreen({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="Notification Settings" subtitle="Push, SMS, and email preferences" navigation={navigation} />
        <ListRow title="Push Notifications" subtitle="Enabled for account alerts" icon="phone-portrait-outline" tone={colors.teal} />
        <ListRow title="Email Notifications" subtitle="Enabled for reports and billing updates" icon="mail-outline" tone={colors.blue} />
        <ListRow title="SMS Notifications" subtitle="Enabled for urgent operational alerts" icon="chatbubble-outline" tone={colors.orange} />
      </Content>
    </Screen>
  );
}

export function AppSettingsScreen({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="App Settings" subtitle="Language, display, and privacy" navigation={navigation} />
        <ListRow title="Language" subtitle="English" icon="language-outline" tone={colors.teal} />
        <ListRow title="Display" subtitle="System default" icon="contrast-outline" tone={colors.blue} />
        <ListRow title="Privacy" subtitle="Admin session security enabled" icon="lock-closed-outline" tone={colors.purple} />
      </Content>
    </Screen>
  );
}

export function HelpSupportScreen({ navigation }: any) {
  return (
    <Screen>
      <Content>
        <Header title="Help & Support" subtitle="Contact support or view help topics" navigation={navigation} />
        <ListRow title="Support Desk" subtitle="support@clinic.local" icon="help-circle-outline" tone={colors.green} />
        <ListRow title="System Guide" subtitle="Admin workflow documentation" icon="book-outline" tone={colors.blue} />
        <ListRow title="Report an Issue" subtitle="Send details to the operations team" icon="bug-outline" tone={colors.red} />
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
  stateCard: {
    minHeight: 64,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stateText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '900',
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  successText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.faint,
  },
  chipActive: {
    backgroundColor: colors.teal,
  },
  chipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  outlineButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: colors.surface,
  },
  outlineButtonText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 14,
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
