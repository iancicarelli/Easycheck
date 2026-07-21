import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'api_client.dart';

// CU-06 — muestra el QR firmado por el backend para que el lector de la sala
// lo escanee al ingresar a clases. El token expira (QR_TTL, 5 min por defecto).
class QrScreen extends StatelessWidget {
  final GeneratedQr qr;
  final String subjectCode;
  final String classDate;

  const QrScreen({
    super.key,
    required this.qr,
    required this.subjectCode,
    required this.classDate,
  });

  String _formatTime(DateTime? date) {
    if (date == null) return '';
    final local = date.toLocal();
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final expiry = _formatTime(qr.expiresAt);

    return Scaffold(
      appBar: AppBar(
        iconTheme: const IconThemeData(color: Colors.white, size: 30),
        title: const Text(
          'QR de asistencia',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: const Color(0xFF002B5B),
        centerTitle: true,
      ),
      backgroundColor: const Color(0xFFF1F1F1),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$subjectCode · Clase ${qr.classId} · $classDate',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF002B5B),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color.fromRGBO(0, 0, 0, 0.2)),
                ),
                child: QrImageView(
                  data: qr.qrToken,
                  version: QrVersions.auto,
                  size: 260,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Muestra este código al lector de la sala para registrar tu asistencia.',
                style: TextStyle(fontSize: 14, color: Colors.black87),
                textAlign: TextAlign.center,
              ),
              if (expiry.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Válido hasta las $expiry.',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
