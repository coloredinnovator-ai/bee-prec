import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const BeePrecApp());
}

class BeePrecApp extends StatelessWidget {
  const BeePrecApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bee-Prec',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple.shade700),
        useMaterial3: true,
      ),
      home: const BeePrecHome(),
    );
  }
}

class BeePrecHome extends StatefulWidget {
  const BeePrecHome({super.key});

  @override
  State<BeePrecHome> createState() => _BeePrecHomeState();
}

class _BeePrecHomeState extends State<BeePrecHome> {
  int _tab = 0;

  final _tabs = const [
    HomeView(),
    CommunityForumView(),
    ReportIncidentView(),
    ConsultationView(),
  ];

  void _onTap(int index) => setState(() => _tab = index);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bee-Prec'),
        centerTitle: true,
      ),
      body: IndexedStack(
        index: _tab,
        children: _tabs,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: _onTap,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard), label: 'Overview'),
          NavigationDestination(icon: Icon(Icons.forum), label: 'Community'),
          NavigationDestination(icon: Icon(Icons.report), label: 'Report'),
          NavigationDestination(icon: Icon(Icons.gavel), label: 'Consult'),
        ],
      ),
    );
  }
}

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        'Welcome to Bee-Prec. Consultations, community updates, and incident reporting start here.',
        textAlign: TextAlign.center,
      ),
    );
  }
}

class CommunityForumView extends StatelessWidget {
  const CommunityForumView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(24),
      child: Text('Community board: discussions about your neighborhood and businesses are coming soon.'),
    );
  }
}

class ReportIncidentView extends StatelessWidget {
  const ReportIncidentView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Incident reporting flow is ready for production forms and moderation controls.'),
    );
  }
}

class ConsultationView extends StatelessWidget {
  const ConsultationView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Lawyer consultation pipeline: booking, chat, and case intake placeholders.'),
    );
  }
}
