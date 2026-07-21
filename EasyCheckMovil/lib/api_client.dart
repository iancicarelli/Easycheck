import 'dart:convert';

import 'package:http/http.dart' as http;

/// URL base del backend EasyCheck. Sobreescribible al compilar/correr:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000   (emulador Android)
///   flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3000 (dispositivo físico)
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000',
);

/// Error de la API con el mensaje en español que entrega el backend.
class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

/// Sesión emitida por CU-01: token de EasyCheck + perfil del usuario.
class Session {
  final String token;
  final String rut;
  final String fullName;
  final String email;
  final String role;

  Session({
    required this.token,
    required this.rut,
    required this.fullName,
    required this.email,
    required this.role,
  });

  factory Session.fromLoginResponse(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    return Session(
      token: json['token'] as String? ?? '',
      rut: user['rut'] as String? ?? '',
      fullName: user['fullName'] as String? ?? '',
      email: user['email'] as String? ?? '',
      role: json['role'] as String? ?? '',
    );
  }
}

/// CU-04 — asistencia del alumno en una asignatura inscrita.
class SubjectAttendance {
  final String subjectCode;
  final int attendedClasses;
  final int totalClasses;
  final int attendancePercentage;

  SubjectAttendance({
    required this.subjectCode,
    required this.attendedClasses,
    required this.totalClasses,
    required this.attendancePercentage,
  });

  factory SubjectAttendance.fromJson(Map<String, dynamic> json) {
    return SubjectAttendance(
      subjectCode: json['subjectName'] as String? ?? '',
      attendedClasses: (json['attendedClasses'] as num?)?.toInt() ?? 0,
      totalClasses: (json['totalClasses'] as num?)?.toInt() ?? 0,
      attendancePercentage:
          (json['attendancePercentage'] as num?)?.toInt() ?? 0,
    );
  }
}

/// CU-06 — clase de una asignatura inscrita (para elegir a cuál generar QR).
class ClassSession {
  final int classId;
  final String subjectCode;
  final DateTime? date;
  final String registrationStatus;

  ClassSession({
    required this.classId,
    required this.subjectCode,
    required this.date,
    required this.registrationStatus,
  });

  bool get registrationEnabled => registrationStatus == 'ENABLED';

  factory ClassSession.fromJson(Map<String, dynamic> json) {
    return ClassSession(
      classId: (json['classId'] as num?)?.toInt() ?? 0,
      subjectCode: json['subjectId'] as String? ?? '',
      date: DateTime.tryParse(json['date'] as String? ?? ''),
      registrationStatus: json['registrationStatus'] as String? ?? '',
    );
  }
}

/// CU-06 — QR firmado por el backend, con expiración.
class GeneratedQr {
  final String qrToken;
  final DateTime? expiresAt;
  final int classId;
  final String subjectCode;

  GeneratedQr({
    required this.qrToken,
    required this.expiresAt,
    required this.classId,
    required this.subjectCode,
  });

  factory GeneratedQr.fromJson(Map<String, dynamic> json) {
    return GeneratedQr(
      qrToken: json['qrToken'] as String? ?? '',
      expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? ''),
      classId: (json['classId'] as num?)?.toInt() ?? 0,
      subjectCode: json['subjectId'] as String? ?? '',
    );
  }
}

/// Cliente HTTP de la API EasyCheck (rutas /me: la identidad va en el token).
class ApiClient {
  final Session session;

  ApiClient(this.session);

  // CU-01 — inicio de sesión con RUT y contraseña institucional.
  static Future<Session> login(String rut, String password) async {
    final response = await http.post(
      Uri.parse('$apiBaseUrl/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'rut': rut, 'password': password}),
    );
    return Session.fromLoginResponse(_decode(response, expected: 200));
  }

  // CU-04 — resumen de asistencia de todas las asignaturas inscritas.
  Future<List<SubjectAttendance>> getMyAttendance() async {
    final response = await http.get(
      Uri.parse('$apiBaseUrl/api/v1/students/me/attendance'),
      headers: _authHeaders,
    );
    final list = _decodeList(response, expected: 200);
    return list
        .map((item) =>
            SubjectAttendance.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  // CU-06 — clases de las asignaturas inscritas.
  Future<List<ClassSession>> getMyClasses() async {
    final response = await http.get(
      Uri.parse('$apiBaseUrl/api/v1/students/me/classes'),
      headers: _authHeaders,
    );
    final list = _decodeList(response, expected: 200);
    return list
        .map((item) => ClassSession.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  // CU-06 — solicitar el QR firmado para una clase.
  Future<GeneratedQr> generateQr(int classId) async {
    final response = await http.post(
      Uri.parse('$apiBaseUrl/api/v1/students/me/classes/$classId/qr'),
      headers: _authHeaders,
    );
    return GeneratedQr.fromJson(_decode(response, expected: 201));
  }

  Map<String, String> get _authHeaders => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${session.token}',
      };

  static Map<String, dynamic> _decode(http.Response response,
      {required int expected}) {
    _assertStatus(response, expected);
    return json.decode(utf8.decode(response.bodyBytes))
        as Map<String, dynamic>;
  }

  static List<dynamic> _decodeList(http.Response response,
      {required int expected}) {
    _assertStatus(response, expected);
    return json.decode(utf8.decode(response.bodyBytes)) as List<dynamic>;
  }

  static void _assertStatus(http.Response response, int expected) {
    if (response.statusCode == expected) return;
    String message = 'Error ${response.statusCode}';
    try {
      final body = json.decode(utf8.decode(response.bodyBytes));
      if (body is Map<String, dynamic>) {
        // El backend usa `message` (auth/guards) o `error` (assistance).
        final raw = body['message'] ?? body['error'];
        if (raw is List) {
          message = raw.join(', ');
        } else if (raw is String && raw.isNotEmpty) {
          message = raw;
        }
      }
    } catch (_) {
      // respuesta sin body JSON: se mantiene el mensaje genérico
    }
    throw ApiException(response.statusCode, message);
  }
}
