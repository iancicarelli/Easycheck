import 'package:flutter/material.dart';

import 'api_client.dart';
import 'login_screen.dart';
import 'qr_screen.dart';

const Color _navy = Color(0xFF002B5B);
const Color _background = Color(0xFFF1F1F1);

// CU-04 — asignaturas inscritas del estudiante con su porcentaje de asistencia.
class SubjectsScreen extends StatefulWidget {
  final Session session;

  const SubjectsScreen({super.key, required this.session});

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  late final ApiClient api = ApiClient(widget.session);
  late Future<_SubjectsData> future = _load();

  Future<_SubjectsData> _load() async {
    final results = await Future.wait([
      api.getMyAttendance(), // CU-04
      api.getMyClasses(), // CU-06 (para generar QR por clase)
    ]);
    return _SubjectsData(
      attendance: results[0] as List<SubjectAttendance>,
      classes: results[1] as List<ClassSession>,
    );
  }

  void _reload() {
    setState(() {
      future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'EasyCheck',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        backgroundColor: _navy,
        centerTitle: true,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.white, size: 30),
            onPressed: () {
              Scaffold.of(context).openDrawer();
            },
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _reload,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: <Widget>[
            DrawerHeader(
              decoration: const BoxDecoration(color: _navy),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    widget.session.fullName,
                    style: const TextStyle(color: Colors.white, fontSize: 20),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.session.rut,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Cerrar sesión'),
              onTap: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              },
            ),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 25.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Asignaturas inscritas',
              style: textTheme.headlineMedium?.copyWith(
                color: Colors.black,
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 25),
            Expanded(
              child: FutureBuilder<_SubjectsData>(
                future: future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return _ErrorRetry(
                      message: snapshot.error is ApiException
                          ? (snapshot.error as ApiException).message
                          : 'No se pudo conectar con el servidor '
                              '($apiBaseUrl).',
                      onRetry: _reload,
                    );
                  }
                  final data = snapshot.data!;
                  if (data.attendance.isEmpty) {
                    return const Center(
                      child: Text('No tienes asignaturas inscritas.'),
                    );
                  }
                  return ListView.builder(
                    itemCount: data.attendance.length,
                    itemBuilder: (context, index) {
                      final subject = data.attendance[index];
                      final subjectClasses = data.classes
                          .where((c) => c.subjectCode == subject.subjectCode)
                          .toList();
                      return _SubjectCard(
                        subject: subject,
                        onTap: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => SubjectDetailScreen(
                                api: api,
                                subject: subject,
                                classes: subjectClasses,
                              ),
                            ),
                          );
                          // La asistencia puede cambiar tras marcar por QR.
                          _reload();
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
      backgroundColor: _background,
    );
  }
}

class _SubjectsData {
  final List<SubjectAttendance> attendance;
  final List<ClassSession> classes;

  _SubjectsData({required this.attendance, required this.classes});
}

class _SubjectCard extends StatelessWidget {
  final SubjectAttendance subject;
  final VoidCallback onTap;

  const _SubjectCard({required this.subject, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final percentage = subject.attendancePercentage;
    final percentageColor = percentage >= 75 ? Colors.green : Colors.orange;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: const Color.fromRGBO(0, 0, 0, 0.2)),
          borderRadius: BorderRadius.circular(7),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject.subjectCode,
                  style: textTheme.bodyLarge?.copyWith(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${subject.attendedClasses} de ${subject.totalClasses} clases asistidas',
                  style: textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            Row(
              children: [
                Text(
                  '$percentage%',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: percentageColor,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.arrow_forward_ios,
                  size: 22,
                  color: Color(0xFF737373),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorRetry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(
              backgroundColor: _navy,
              foregroundColor: Colors.white,
            ),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }
}

// Detalle de una asignatura: asistencia (CU-04) y clases con generación de
// QR (CU-06).
class SubjectDetailScreen extends StatefulWidget {
  final ApiClient api;
  final SubjectAttendance subject;
  final List<ClassSession> classes;

  const SubjectDetailScreen({
    super.key,
    required this.api,
    required this.subject,
    required this.classes,
  });

  @override
  State<SubjectDetailScreen> createState() => _SubjectDetailScreenState();
}

class _SubjectDetailScreenState extends State<SubjectDetailScreen> {
  int? generatingClassId;

  String _formatDate(DateTime? date) {
    if (date == null) return 'Sin fecha';
    final local = date.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    return '$day-$month-${local.year}';
  }

  // CU-06: solicita el QR firmado al backend y lo muestra en pantalla.
  Future<void> _generateQr(ClassSession classSession) async {
    setState(() {
      generatingClassId = classSession.classId;
    });
    try {
      final qr = await widget.api.generateQr(classSession.classId);
      if (!mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => QrScreen(
            qr: qr,
            subjectCode: widget.subject.subjectCode,
            classDate: _formatDate(classSession.date),
          ),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo conectar con el servidor.')),
      );
    } finally {
      if (mounted) {
        setState(() {
          generatingClassId = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final subject = widget.subject;
    final percentage = subject.attendancePercentage;
    final percentageColor = percentage >= 75 ? Colors.green : Colors.orange;

    return Scaffold(
      appBar: AppBar(
        iconTheme: const IconThemeData(color: Colors.white, size: 30),
        title: Text(
          subject.subjectCode,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: _navy,
      ),
      backgroundColor: _background,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // CU-04 — resumen de asistencia de la asignatura
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color.fromRGBO(0, 0, 0, 0.2)),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Column(
                children: [
                  const Text(
                    'Mi asistencia',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: _navy,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$percentage%',
                    style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      color: percentageColor,
                    ),
                  ),
                  Text(
                    '${subject.attendedClasses} de ${subject.totalClasses} clases',
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Clases',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: widget.classes.isEmpty
                  ? const Center(
                      child: Text('Esta asignatura aún no tiene clases.'),
                    )
                  : ListView.builder(
                      itemCount: widget.classes.length,
                      itemBuilder: (context, index) {
                        final classSession = widget.classes[index];
                        final enabled = classSession.registrationEnabled;
                        final generating =
                            generatingClassId == classSession.classId;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(
                              color: const Color.fromRGBO(0, 0, 0, 0.2),
                            ),
                            borderRadius: BorderRadius.circular(7),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Clase ${classSession.classId} · '
                                    '${_formatDate(classSession.date)}',
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.black,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    enabled
                                        ? 'Registro habilitado'
                                        : 'Registro cerrado',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: enabled
                                          ? Colors.green
                                          : Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                              ElevatedButton.icon(
                                onPressed: enabled && !generating
                                    ? () => _generateQr(classSession)
                                    : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _navy,
                                  foregroundColor: Colors.white,
                                ),
                                icon: generating
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Icon(Icons.qr_code, size: 20),
                                label: const Text('Generar QR'),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
