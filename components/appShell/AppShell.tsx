import { Routes } from '@/utils/routes';
import { useAuth } from '@/contexts/authContext';
import { useManagementAccess } from '@/contexts/managementAccessContext';
import { useSync } from '@/contexts/syncContext';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { ReactNode, useMemo, useState } from 'react';
import {
  Modal,
  PanResponderInstance,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightAction?: ReactNode;
  contentPanHandlers?: PanResponderInstance['panHandlers'];
};

type DrawerItem = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route?: string;
  action?: () => Promise<void> | void;
};

export default function AppShell({ title, subtitle, children, rightAction, contentPanHandlers }: AppShellProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { runSync } = useSync();
  const { logout } = useAuth();
  const { modules, loading } = useManagementAccess();
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const drawerItems = useMemo<DrawerItem[]>(() => {
    const moduleItems: DrawerItem[] = modules
      .filter((module) => module.enabled)
      .map((module) => ({
        label: module.title,
        icon: (module.icon as keyof typeof MaterialIcons.glyphMap) ?? 'dashboard',
        route: module.route,
      }));

    return [
      { label: 'Painel', icon: 'dashboard', route: Routes.HOME },
      ...moduleItems,
      { label: 'Sincronizar', icon: 'sync', action: () => runSync() },
      {
        label: 'Sair',
        icon: 'logout',
        action: async () => {
          await logout();
          router.replace(Routes.LOGIN);
        },
      },
    ];
  }, [logout, modules, runSync]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={[styles.header, { paddingTop: 12 + Math.max(insets.top, 0) * 0.2 }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconButton} onPress={() => setDrawerVisible(true)}>
            <MaterialIcons name="menu" size={24} color="#f8fafc" />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>

      <ScrollView
        {...contentPanHandlers}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 36 + Math.max(insets.bottom, 16) },
        ]}
      >
        {children}
      </ScrollView>

      <Modal transparent visible={drawerVisible} animationType="fade" onRequestClose={() => setDrawerVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setDrawerVisible(false)}>
          <Pressable style={[styles.drawer, { marginTop: 12 + insets.top }]} onPress={() => undefined}>
            <Text style={styles.drawerEyebrow}>AGRO SERVICE TRACK</Text>
            <Text style={styles.drawerTitle}>Menu operacional</Text>

            {!loading && !modules.some((module) => module.enabled) ? (
              <Text style={styles.drawerHint}>Nenhum modulo operacional liberado para este usuario no momento.</Text>
            ) : null}

            {drawerItems.map((item) => (
              <Pressable
                key={item.label}
                style={styles.drawerItem}
                onPress={async () => {
                  setDrawerVisible(false);

                  if (item.route) {
                    router.push(`/(stack)/${item.route}` as never);
                    return;
                  }

                  await item.action?.();
                }}
              >
                <MaterialIcons name={item.icon} size={22} color="#cbd5f5" />
                <Text style={styles.drawerItemText}>{item.label}</Text>
              </Pressable>
            ))}

            <Text style={styles.versionText}>Version {appVersion}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071422',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 2,
    fontSize: 13,
  },
  rightAction: {
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    justifyContent: 'flex-start',
  },
  drawer: {
    marginLeft: 12,
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: '#020617',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  drawerEyebrow: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  drawerTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 20,
  },
  drawerHint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.78)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  drawerItemText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  versionText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
